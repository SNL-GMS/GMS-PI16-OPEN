package gms.core.dataacquisition;

import gms.core.dataacquisition.reactor.AceiDeserializer;
import gms.core.dataacquisition.reactor.AceiMergerFactory;
import gms.core.dataacquisition.reactor.AceiNeighborMerger;
import gms.core.dataacquisition.reactor.AceiUpdatesMerger;
import gms.core.dataacquisition.reactor.util.AceiMergeChecker;
import gms.shared.frameworks.coi.exceptions.StorageUnavailableException;
import gms.shared.frameworks.common.annotations.Component;
import gms.shared.frameworks.control.ControlContext;
import gms.shared.frameworks.control.ControlFactory;
import gms.shared.frameworks.messaging.AbstractKafkaStorageConsumer;
import gms.shared.frameworks.osd.api.rawstationdataframe.AceiUpdates;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.Deserializer;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import javax.ws.rs.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import static com.google.common.base.Preconditions.checkNotNull;
import static java.util.stream.Collectors.toList;

/**
 * Service class responsible for mapping component information to allow configuration and control
 * frameworks to setup appropriately
 */
@Component("acei-merge-processor")
@Path("/acei-merge-processor")
public class AceiMergeService extends AbstractKafkaStorageConsumer<AcquiredChannelEnvironmentIssue<?>> {

  private static final StructuredLoggingWrapper serviceLogger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(AceiMergeService.class));

  private final AceiMergeChecker mergeChecker;

  private AceiMergerFactory mergerFactory;
  private AceiUpdatesMerger updatesMerger;
  private Map<TopicPartition, AceiNeighborMerger> neighborMergersByPartition;

  private AceiMergeService(AceiMergeChecker aceiMergeChecker) {
    this.mergeChecker = aceiMergeChecker;
  }

  @Override
  protected void initialize(SystemConfig systemConfig, Deserializer<AcquiredChannelEnvironmentIssue<?>> deserializer) {
    super.initialize(systemConfig, deserializer);
    this.mergerFactory = AceiMergerFactory.create(osdRepository, mergeChecker);
    this.updatesMerger = mergerFactory.buildUpdatesMerger();
    this.neighborMergersByPartition = new ConcurrentHashMap<>();
  }

  public static AceiMergeService create(ControlContext context) {
    checkNotNull(context, "Cannot create AceiMergeService from null context");
    AceiMergeChecker aceiMergeChecker = AceiMergeChecker.create(context.getProcessingConfigurationConsumerUtility());

    AceiMergeService aceiMergeService = new AceiMergeService(aceiMergeChecker);
    aceiMergeService.initialize(context.getSystemConfig(), new AceiDeserializer());

    return aceiMergeService;
  }

  public static void main(String[] args) {
    serviceLogger.info("Initializing AceiMergeService...");
    try {
      var aceiMergeService = ControlFactory.runService(AceiMergeService.class);
      aceiMergeService.run();
    } catch (Exception e) {
      serviceLogger.error("AceiMergeService encountered an unrecoverable exception: ", e);
      System.exit(1);
    }
  }

  @Override
  protected Mono<Void> store(TopicPartition topicPartition, Collection<AcquiredChannelEnvironmentIssue<?>> data) {
    return mergeUpdates(data)
      .map(newUpdates -> neighborMergersByPartition
        .computeIfAbsent(topicPartition, partition -> {
          logger.info("Generating Neighbor Merger for Topic/Partition {}", topicPartition);
          return mergerFactory.buildNeighborMerger();
        })
        .tryMergeWithNeighbors(newUpdates))
      .doOnNext(neighborUpdates -> logger.info("Received ACEI UPDATES: "
          + "\n Analog - Inserts: {}, Deletes: {}"
          + "\n Boolean - Inserts: {}, Deletes: {}",
        neighborUpdates.getAnalogInserts().size(), neighborUpdates.getAnalogDeletes().size(),
        neighborUpdates.getBooleanInserts().size(), neighborUpdates.getBooleanDeletes().size()))
      .flatMap(this::storeInternal);
  }

  private Mono<Void> storeInternal(AceiUpdates neighborUpdates) {
    return Mono.<Void>fromRunnable(() -> {
      var startTime = Instant.now();
      osdRepository.syncAceiUpdates(neighborUpdates);
      var endTime = Instant.now();
      logger.info("ACEI inserts completed, taking {} on thread {}",
        Duration.between(startTime, endTime), Thread.currentThread().getName());
    }).doOnError(e -> logger.error("ACEI Storage Failed, retrying", e))
      .retryWhen(Retry.backoff(Long.MAX_VALUE, Duration.ofMillis(500))
        .filter(StorageUnavailableException.class::isInstance));
  }

  private Mono<AceiUpdates> mergeUpdates(Collection<AcquiredChannelEnvironmentIssue<?>> data) {
    return Flux.fromIterable(data)
      .map(AceiUpdates::from)
      .collect(Collectors.collectingAndThen(toList(), updatesMerger::mergeAll));
  }

  @Override
  protected void reset() {
    neighborMergersByPartition.values().forEach(AceiNeighborMerger::shutDown);
    neighborMergersByPartition.clear();
  }
}
