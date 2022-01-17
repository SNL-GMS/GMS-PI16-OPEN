package gms.core.dataacquisition.reactor;

import gms.core.dataacquisition.AceiMergeProcessor;
import gms.core.dataacquisition.reactor.util.AceiMergeChecker;
import gms.shared.frameworks.control.ControlContext;
import gms.shared.frameworks.messaging.KafkaOffsetWrapper;
import gms.shared.frameworks.osd.api.rawstationdataframe.AceiUpdates;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue;
import gms.shared.frameworks.osd.repository.OsdRepository;
import gms.shared.frameworks.osd.repository.OsdRepositoryFactory;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.reactor.DefaultReactorKafkaFluxSupplier;
import gms.shared.reactor.ReactorKafkaFluxSupplier;
import gms.shared.utilities.kafka.reactor.ReactorKafkaFactory;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.apache.kafka.common.TopicPartition;
import org.slf4j.LoggerFactory;
import reactor.core.Disposable;
import reactor.core.Disposables;
import reactor.core.publisher.Flux;
import reactor.core.publisher.GroupedFlux;
import reactor.core.publisher.Hooks;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.kafka.receiver.KafkaReceiver;
import reactor.kafka.receiver.ReceiverOffset;
import reactor.kafka.receiver.ReceiverPartition;
import reactor.kafka.receiver.ReceiverRecord;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toList;

/**
 * High level reactive processor for merging incoming aceis from a kafka flux supplier. Manages a
 * collection of internal mergers to ensure all incoming aceis are merged with previously available
 * data, and the appropriate inserts and deletes are sent to the OSD.
 */
public class ReactorAceiMergeProcessor implements AceiMergeProcessor {

  private final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(ReactorAceiMergeProcessor.class));

  private final Disposable.Composite disposables = Disposables.composite();

  private final ControlContext controlContext;

  private ReactorKafkaFluxSupplier<AcquiredChannelEnvironmentIssue<?>> fluxProvider;
  private AceiMergerFactory mergerFactory;
  private AceiUpdatesConsumer aceiUpdatesConsumer;

  private int bufferSize;
  private Duration bufferTimeout;

  Disposable topLevelSubscription;

  private Map<TopicPartition, Disposable> subscriptionRecords;
  private Map<TopicPartition, AceiNeighborMerger> mergerRecords;

  private ReactorAceiMergeProcessor(ControlContext controlContext) {
    this.controlContext = controlContext;
    subscriptionRecords = new HashMap<>();
    mergerRecords = new HashMap<>();
  }

  public static ReactorAceiMergeProcessor create(ControlContext controlContext) {
    return new ReactorAceiMergeProcessor(controlContext);
  }

  @Override
  public void initialize() {

    Hooks.onOperatorDebug();

    logger.info("starting ReactiveAceiMergeProcessor");

    logger.info("Adding Shutdown Hooks");
    Runtime.getRuntime().addShutdownHook(new Thread(disposables::dispose));

    logger.info("Establishing OSD Connection");
    OsdRepository osdRepository = OsdRepositoryFactory
        .createOsdRepository(controlContext.getSystemConfig());


    logger.info("Instantiating Kafka Listeners");

    List<Consumer<Collection<ReceiverPartition>>> assignListeners = new ArrayList<>();
    List<Consumer<Collection<ReceiverPartition>>> revokeListeners = new ArrayList<>();

    revokeListeners.add(this::disposalListener);

    logger.info("Instantiating Flux Provider");

    SystemConfig config = controlContext.getSystemConfig();

    ReactorKafkaFactory kafkaFactory = new ReactorKafkaFactory(controlContext.getSystemConfig());
    KafkaReceiver<String, AcquiredChannelEnvironmentIssue<?>> receiver = kafkaFactory
        .createReceiver(config, new AceiDeserializer(), assignListeners, revokeListeners);

    fluxProvider = DefaultReactorKafkaFluxSupplier.create(receiver);

    logger.info("Instantiating Merger Factory");
    mergerFactory = AceiMergerFactory
        .create(osdRepository,
            AceiMergeChecker.create(controlContext.getProcessingConfigurationConsumerUtility()));

    logger.info("Instantiating Acei Consumer");
    aceiUpdatesConsumer = AceiUpdatesConsumer.create(osdRepository);

    logger.info("Retrieving buffer size");
    bufferSize = controlContext.getSystemConfig().getValueAsInt("buffer-size");

    logger.info("Retrieving buffer timeout");
    bufferTimeout = controlContext.getSystemConfig().getValueAsDuration("buffer-timeout");

    logger.info("Beginning Acei Subscription and Processing");
  }

  void initialize(ReactorKafkaFluxSupplier<AcquiredChannelEnvironmentIssue<?>> fluxProvider,
      AceiMergerFactory mergerFactory, AceiUpdatesConsumer aceiUpdatesConsumer,
      int bufferSize,
      Duration bufferTimeout,
      Map<TopicPartition, Disposable> subscriptionRecords) {
    this.fluxProvider = fluxProvider;
    this.mergerFactory = mergerFactory;
    this.aceiUpdatesConsumer = aceiUpdatesConsumer;

    this.bufferSize = bufferSize;
    this.bufferTimeout = bufferTimeout;
    this.subscriptionRecords = subscriptionRecords;
  }


  @Override
  public void start() {
    topLevelSubscription = fluxProvider.getPartitionFlux()
        .map(this::subscribeAndRecord)
        .retry()
        .subscribe();
  }

  private Flux<KafkaOffsetWrapper<AceiUpdates>> subscribeAndRecord( GroupedFlux<TopicPartition, ReceiverRecord<String, AcquiredChannelEnvironmentIssue<?>>> recordFlux){
    Scheduler boundedElastic = Schedulers.boundedElastic();
    Flux<KafkaOffsetWrapper<AceiUpdates>> partitionFlux = recordFlux.publishOn(boundedElastic).transform(flux -> this.buildMergeTransform(flux, recordFlux.key()));
    subscriptionRecords.put(recordFlux.key(), partitionFlux.retry().subscribe(aceiUpdatesConsumer));

    return partitionFlux;

  }

  /**
   * Convenience method to extract out all transforms to partitioned group fluxes. New updates
   * mergers with new caches are generated, such that independence is maintained and state is not
   * manipulated across threads. Incoming records are buffered, sent through a series of mergers,
   * and returned.
   * Transform only works if we guarantee the incoming records are in order.
   *
   * @param recordFlux Incoming flux of kafka receiver records
   * @return outgoing flux of merged AceiUpdates
   */
  private Flux<KafkaOffsetWrapper<AceiUpdates>> buildMergeTransform(
      Flux<ReceiverRecord<String, AcquiredChannelEnvironmentIssue<?>>> recordFlux, TopicPartition key) {

    AceiUpdatesMerger updatesMerger = mergerFactory.buildUpdatesMerger();
    AceiNeighborMerger neighborMerger = mergerFactory.buildNeighborMerger();
    mergerRecords.put(key, neighborMerger);

    return recordFlux
        .bufferTimeout(bufferSize, bufferTimeout)
        .filter(aceis -> !aceis.isEmpty())
        .map(receiverRecords -> mergeOffsets(receiverRecords, updatesMerger))
        .map(offsetWrapper -> offsetWrapper.map(neighborMerger::tryMergeWithNeighbors));
  }

  KafkaOffsetWrapper<AceiUpdates> mergeOffsets(
      List<ReceiverRecord<String, AcquiredChannelEnvironmentIssue<?>>> receiverRecords,
      AceiUpdatesMerger updatesMerger) {
    // Return a single wrapper that has been merged.
    // merge can be done with updatesMerger list merge?
    // With the highest offset

    AceiUpdates mergedUpdates = receiverRecords.stream()
        .map(ReceiverRecord::value)
        .map(AceiUpdates::from)
        .collect(Collectors.collectingAndThen(toList(), updatesMerger::mergeAll));

    return receiverRecords.stream()
        .map(ReceiverRecord::receiverOffset)
        .max(Comparator.comparingLong(ReceiverOffset::offset))
        .map(offset -> KafkaOffsetWrapper.create(offset, mergedUpdates))
        .orElseThrow(() -> new IllegalArgumentException(
            "Could not create KafkaOffsetRecord from empty ReceiverRecords"));
  }

  void disposalListener(Collection<ReceiverPartition> partitions) {
    logger.info("Kafka rebalance occurred.  Disposing partitions");
    partitions.forEach(partition -> {
      if (subscriptionRecords.containsKey(partition.topicPartition())) {
        logger.info("Disposing partition {}", partition.topicPartition().partition());
        subscriptionRecords.get(partition.topicPartition()).dispose();
        subscriptionRecords.remove(partition.topicPartition());
      }

      if (mergerRecords.containsKey(partition.topicPartition())) {
        logger.info("Disposing Neighbor Merger {}", partition.topicPartition().partition());
        mergerRecords.get(partition.topicPartition()).shutDown();
        mergerRecords.remove(partition.topicPartition());
      }
    });

  }
}
