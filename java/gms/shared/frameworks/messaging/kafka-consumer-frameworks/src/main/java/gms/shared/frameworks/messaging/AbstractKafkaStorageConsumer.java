package gms.shared.frameworks.messaging;

import gms.shared.frameworks.osd.repository.OsdRepository;
import gms.shared.frameworks.osd.repository.OsdRepositoryFactory;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.kafka.reactor.ReactorKafkaFactory;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.Deserializer;
import org.slf4j.LoggerFactory;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.kafka.receiver.KafkaReceiver;
import reactor.kafka.receiver.ReceiverOffset;
import reactor.kafka.receiver.ReceiverPartition;
import reactor.kafka.receiver.ReceiverRecord;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public abstract class AbstractKafkaStorageConsumer<T> {

  protected final StructuredLoggingWrapper logger = StructuredLoggingWrapper.create(LoggerFactory.getLogger(AbstractKafkaStorageConsumer.class));

  protected OsdRepository osdRepository;

  private Mono<Void> storeMono;
  private Disposable storeDisposable;

  protected AbstractKafkaStorageConsumer() {
  }

  protected void initialize(SystemConfig systemConfig, Deserializer<T> deserializer) {
    logger.info("Establishing OSD Connection");
    this.osdRepository = OsdRepositoryFactory.createOsdRepository(systemConfig);

    logger.info("Retrieving buffering configuration");
    int bufferSize = systemConfig.getValueAsInt("buffer-size");
    Duration bufferTimeout = systemConfig.getValueAsDuration("buffer-timeout");

    logger.info("Instantiating Consumer Flux");
    var kafkaFactory = new ReactorKafkaFactory(systemConfig);
    Flux<ReceiverRecord<String, T>> recordFlux = Mono.defer(() -> Mono.just(kafkaFactory
      .createReceiver(systemConfig, deserializer, List.of(), List.of(this::rebalanceListener))))
      .flatMapMany(KafkaReceiver::receive);

    initialize(recordFlux, bufferSize, bufferTimeout);
    logger.info("Finished initialization");
  }

  void initialize(Flux<ReceiverRecord<String, T>> recordFlux, int bufferSize,
    Duration bufferTimeout) {
    this.storeMono = recordFlux
      .windowTimeout(bufferSize, bufferTimeout)
      .flatMap(this::storeWindow)
      .then();
  }

  private Mono<Void> storeWindow(Flux<ReceiverRecord<String, T>> recordWindow) {
    return recordWindow
      .groupBy(record -> record.receiverOffset().topicPartition())
      .flatMap(group -> group
        .transform(this::toOffsetWrapper)
        .flatMap(this::storeAndCommit)
        .subscribeOn(Schedulers.boundedElastic()))
      .then();
  }

  private Mono<KafkaOffsetWrapper<Collection<T>>> toOffsetWrapper(Flux<ReceiverRecord<String, T>> flux) {
    return flux.collectList()
      .map(receiverRecords -> KafkaOffsetWrapper.create(
        receiverRecords.stream()
          .map(ReceiverRecord::receiverOffset)
          .max(Comparator.comparingLong(ReceiverOffset::offset))
          .orElseThrow(),
        receiverRecords.stream()
          .map(ReceiverRecord::value)
          .collect(Collectors.toList())));
  }

  private Mono<Void> storeAndCommit(KafkaOffsetWrapper<Collection<T>> records) {
    return store(records.getOffset().topicPartition(), records.getValue())
      .thenEmpty(records.getOffset().commit());
  }

  protected abstract Mono<Void> store(TopicPartition topicPartition, Collection<T> value);


  public final void run() {
    logger.info("Starting KafkaStorageConsumer");
    storeDisposable = storeMono
      .retryWhen(Retry.backoff(Long.MAX_VALUE, Duration.ofMillis(500)))
      .subscribe();
  }

  public final void shutdown() {
    storeDisposable.dispose();
    storeDisposable = null;
  }

  protected void reset() {
    // Nothing to do by default
  }

  private void rebalanceListener(Collection<ReceiverPartition> partitions) {
    logger.info("Kafka rebalance occurred.  Resetting state.");
    reset();
  }

  //Testing Purposes Only
  protected Mono<Void> getStoreMono() {
    return storeMono;
  }
}
