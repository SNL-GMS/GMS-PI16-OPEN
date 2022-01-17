package gms.shared.frameworks.messaging;

import gms.shared.frameworks.coi.exceptions.StorageUnavailableException;
import org.apache.kafka.common.TopicPartition;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.Collection;

public abstract class SimpleKafkaStorageConsumer<T> extends AbstractKafkaStorageConsumer<T>{

  @Override
  protected Mono<Void> store(TopicPartition topicPartition, Collection<T> value) {
    return Mono.<Void>fromRunnable(() -> store(value))
      .doOnError(e -> logger.warn("Store operation failed! retrying...", e))
      .retryWhen(Retry.backoff(Long.MAX_VALUE, Duration.ofMillis(500))
        .filter(StorageUnavailableException.class::isInstance));
  }

  protected abstract void store(Collection<T> value);
}
