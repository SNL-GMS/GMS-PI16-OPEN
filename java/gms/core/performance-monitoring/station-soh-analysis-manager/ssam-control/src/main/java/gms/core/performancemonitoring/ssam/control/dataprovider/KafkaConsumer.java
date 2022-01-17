package gms.core.performancemonitoring.ssam.control.dataprovider;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkNotNull;
import static java.util.Collections.singleton;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiObjectMapperFactory;
import gms.shared.frameworks.systemconfig.SystemConfig;
import java.util.Map;
import java.util.Optional;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import reactor.core.publisher.Flux;
import reactor.kafka.receiver.KafkaReceiver;
import reactor.kafka.receiver.ReceiverOptions;

/**
 * FluxSupplier that is able to create a Flux of the desired type from a Kafka topic
 *
 * @param <T> The type of object that will be emitted from the flux
 */
public class KafkaConsumer<T> implements ReactiveConsumer<T> {

  private static final String APPLICATION_ID = "application-id";
  private static final String KAFKA_BOOTSTRAP_SERVERS = "kafka-bootstrap-servers";
  private static final ObjectMapper MAPPER = CoiObjectMapperFactory.getJsonObjectMapper();

  private final Class<T> clazz;
  private final KafkaReceiver<String, String> receiver;

  private KafkaConsumer(
      Class<T> clazz,
      String topicName,
      SystemConfig systemConfig) {
    checkArgument(!topicName.isBlank());

    this.clazz = clazz;
    this.receiver = KafkaReceiver
        .create(createReceiverOptions(checkNotNull(systemConfig), checkNotNull(topicName)));
  }

  // Package private constructor for testing

  KafkaConsumer(
      Class<T> clazz,
      KafkaReceiver<String, String> receiver
  ) {
    this.clazz = clazz;
    this.receiver = receiver;
  }

  /**
   * Get the flux that emits items consumed from the topic
   *
   * @return Flux
   */
  @Override
  public Flux<T> getFlux() {
    return receiver.receive()
        .doOnNext(record -> record.receiverOffset().commit())
        .map(record -> {
          try {
            return Optional.of(MAPPER.readValue(
                record.value(),
                clazz)
            );
          } catch (JsonProcessingException ex) {
            return Optional.<T>empty();
          }
        })
        .filter(Optional::isPresent)
        .map(Optional::get);
  }

  /**
   * Get a builder that builds a KafkaConsumer
   *
   * @param systemConfig system configuration
   * @return A builder that builds a Kafka consumer
   */
  public static ReactiveConsumerBuilder getBuilder(
      SystemConfig systemConfig
  ) {

    return new ReactiveConsumerBuilder() {
      String topic;

      @Override
      public <T> ReactiveConsumer<T> build(Class<T>clazz) {
        return new KafkaConsumer<>(
            clazz,
            topic,
            systemConfig
        );
      }

      @Override
      public ReactiveConsumerBuilder withTopic(String topic) {
        this.topic = topic;
        return this;
      }
    };
  }

  private static ReceiverOptions<String, String> createReceiverOptions(SystemConfig systemConfig,
      String topic) {
    return createReceiverOptions(systemConfig.getValue(KAFKA_BOOTSTRAP_SERVERS),
        systemConfig.getValue(APPLICATION_ID) + "-" + topic)
        .subscription(singleton(topic));
  }

  private static ReceiverOptions<String, String> createReceiverOptions(String bootstrapServers,
      String applicationId) {
    Map<String, Object> props = Map.of(
        ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers,
        ConsumerConfig.GROUP_ID_CONFIG, applicationId,
        ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class,
        ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class,
        ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest",
        ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");

    return ReceiverOptions.create(props);
  }

}
