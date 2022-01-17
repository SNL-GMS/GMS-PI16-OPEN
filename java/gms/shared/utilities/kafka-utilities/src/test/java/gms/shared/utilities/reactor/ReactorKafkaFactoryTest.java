package gms.shared.utilities.reactor;


import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.willReturn;

import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.kafka.KafkaConfiguration;
import gms.shared.utilities.kafka.reactor.KafkaTestFixture;
import gms.shared.utilities.kafka.reactor.ReactorKafkaFactory;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.Deserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.kafka.receiver.ReceiverPartition;

@ExtendWith(MockitoExtension.class)
class ReactorKafkaFactoryTest {

  @Mock
  SystemConfig systemConfig;

  @Mock
  KafkaConfiguration kafkaConfig;

  @Test
  void createStringSender() {

   KafkaTestFixture.assignKafkaConfig(kafkaConfig);

    ReactorKafkaFactory kafkaFactory = new ReactorKafkaFactory(kafkaConfig);
    assertDoesNotThrow(
        () -> kafkaFactory.createSender("test-id"));

  }

  @Test
  void testCreateStringSerializerSender() {

    KafkaTestFixture.assignKafkaConfig(kafkaConfig);

    ReactorKafkaFactory kafkaFactory = new ReactorKafkaFactory(kafkaConfig);
    assertDoesNotThrow(
        () -> kafkaFactory.createSender("test-id", new StringSerializer()));
  }

  @Test
  void createReceiver() {

    willReturn("test-topic").given(kafkaConfig).getInputRsdfTopic();

    ReactorKafkaFactory kafkaFactory = new ReactorKafkaFactory(kafkaConfig);
    assertDoesNotThrow(
        () -> kafkaFactory.createReceiver());
  }

  @Test
  void createBaseConfig() {

    KafkaTestFixture.assignSystemConfig(systemConfig);

    ReactorKafkaFactory kafkaFactory = new ReactorKafkaFactory(systemConfig);
    assertDoesNotThrow(
        () -> kafkaFactory.createBaseConfig());

  }

  @Test
  void testCreateReceiver() {

    KafkaTestFixture.assignSystemConfig(systemConfig);
    willReturn("soh.rsdf")
        .given(systemConfig).getValue("input-topic");

    Deserializer<String> testDeserializer = (topic, data) -> null;
    List<Consumer<Collection<ReceiverPartition>>> assignListeners = List.of();
    List<Consumer<Collection<ReceiverPartition>>> revokeListeners = List.of();

    ReactorKafkaFactory kafkaFactory = new ReactorKafkaFactory(systemConfig);
    assertDoesNotThrow(
        () -> kafkaFactory.createReceiver(
            systemConfig, testDeserializer, assignListeners, revokeListeners));
  }


  @Test
  void testCreateReceiver2() {

    KafkaTestFixture.assignSystemConfig(systemConfig);

    Deserializer<String> testDeserializer = (topic, data) -> null;
    List<Consumer<Collection<ReceiverPartition>>> assignListeners = List.of();
    List<Consumer<Collection<ReceiverPartition>>> revokeListeners = List.of();

    ReactorKafkaFactory kafkaFactory = new ReactorKafkaFactory(systemConfig);
    assertDoesNotThrow(
        () -> kafkaFactory.createReceiver("rsdf-test-consumer",
            "localhost:1234", "soh.rsdf"
            , testDeserializer, assignListeners, revokeListeners));
  }

  @Test
  void testCreateReceiver3() {

    KafkaTestFixture.assignSystemConfig(systemConfig);
    willReturn("soh.rsdf")
        .given(systemConfig).getValue("input-topic");

    Deserializer<String> testDeserializer = (topic, data) -> null;
    List<Consumer<Collection<ReceiverPartition>>> assignListeners = List.of();
    List<Consumer<Collection<ReceiverPartition>>> revokeListeners = List.of();

    ReactorKafkaFactory kafkaFactory = new ReactorKafkaFactory(systemConfig);
    assertDoesNotThrow(
        () -> kafkaFactory.createReceiver(systemConfig,
            testDeserializer, assignListeners, revokeListeners));
  }
}