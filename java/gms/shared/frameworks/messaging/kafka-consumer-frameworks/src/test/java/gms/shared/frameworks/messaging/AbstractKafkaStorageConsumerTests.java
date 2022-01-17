package gms.shared.frameworks.messaging;

import gms.shared.frameworks.coi.exceptions.StorageUnavailableException;
import org.apache.kafka.common.TopicPartition;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.kafka.receiver.ReceiverOffset;
import reactor.kafka.receiver.ReceiverRecord;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.Collection;
import java.util.List;

import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AbstractKafkaStorageConsumerTests {

  @Mock
  ReceiverOffset receiverOffset;

  @Mock
  ReceiverRecord<String, String> receiverRecord;

  private static class TestKafkaStorageConsumer extends SimpleKafkaStorageConsumer<String> {

    @Override
    protected void store(Collection<String> data) {
    }
  }

  private static class FailKafkaStorageConsumer extends SimpleKafkaStorageConsumer<String> {

    private int storeCalls;
    private final int timesToFail;

    FailKafkaStorageConsumer(int timesToFail) {
      this.storeCalls = 0;
      this.timesToFail = timesToFail;
    }

    @Override
    protected void store(Collection<String> data) {

      if (storeCalls < timesToFail) {
        storeCalls++;
        throw new StorageUnavailableException("Nope");
      }
    }
  }

  @Test
  void testConsumeAndStore() {
    String testValue = "testing";

    TopicPartition topicPartition = new TopicPartition("test", 0);
    when(receiverRecord.receiverOffset()).thenReturn(receiverOffset);
    when(receiverRecord.value()).thenReturn(testValue);
    when(receiverOffset.topicPartition()).thenReturn(topicPartition);
    when(receiverOffset.commit()).thenReturn(Mono.empty());

    TestKafkaStorageConsumer consumer = spy(new TestKafkaStorageConsumer());
    consumer.initialize(Flux.just(receiverRecord), 1, Duration.ofSeconds(1));

    StepVerifier.create(consumer.getStoreMono())
      .verifyComplete();

    verify(consumer).store(List.of(testValue));
  }

  @Test
  void testRetryConsumeAndStore() {
    String testValue = "testing";

    TopicPartition topicPartition = new TopicPartition("test", 0);
    when(receiverRecord.receiverOffset()).thenReturn(receiverOffset);
    when(receiverRecord.value()).thenReturn(testValue);
    when(receiverOffset.topicPartition()).thenReturn(topicPartition);
    when(receiverOffset.commit()).thenReturn(Mono.empty());

    int timesToFail = 3;
    FailKafkaStorageConsumer consumer = spy(new FailKafkaStorageConsumer(timesToFail));
    consumer.initialize(Flux.just(receiverRecord), 1, Duration.ofSeconds(1));

    StepVerifier.create(consumer.getStoreMono())
      .verifyComplete();

    verify(consumer, times(timesToFail + 1)).store(List.of(testValue));
  }
}