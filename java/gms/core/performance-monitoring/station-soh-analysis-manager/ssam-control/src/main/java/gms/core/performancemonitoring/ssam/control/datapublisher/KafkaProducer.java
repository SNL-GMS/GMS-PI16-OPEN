package gms.core.performancemonitoring.ssam.control.datapublisher;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiObjectMapperFactory;
import java.util.Optional;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import reactor.core.publisher.Flux;
import reactor.kafka.sender.KafkaSender;
import reactor.kafka.sender.SenderRecord;

/**
 * Create a kafka publisher that publishes items from an arbitrary Flux
 *
 * @param <T> Type of items in the Flux
 */
public class KafkaProducer<T> implements ReactiveProducer {

  private static final Logger logger = LogManager.getLogger(KafkaProducer.class);

  private final ObjectMapper objectMapper;

  private final Flux<T> flux;
  private final KafkaSender<String, String> kafkaSender;
  private final String topic;

  /**
   * Create the publisher.
   *
   * @param flux Flux that will publish the items
   * @param kafkaSender KafkaSender that publish the items to Kafka
   * @param topic Kafka topic to publish to
   */
  private KafkaProducer(
      Flux<T> flux,
      KafkaSender<String, String> kafkaSender,
      String topic
  ) {
    this.objectMapper = CoiObjectMapperFactory.getJsonObjectMapper();

    this.flux = flux;
    this.kafkaSender = kafkaSender;
    this.topic = topic;
  }

  /**
   * Start publishing the items to the Kafka topic.
   */
  public void start() {

    sendMessages(
        flux,
        kafkaSender,
        topic,
        objectMapper
    );
  }

  /**
   * Get a builder that will build an instance of KafkaProducer
   *
   * @return A builder for an instance of KafkaProducer
   */
  public static ReactiveProducerBuilder getBuilder() {

    //
    // Not using an anonymous class here, because we want withFlux to build a new instance
    // of the builder, so that the type parameter can be set to that of the Flux.
    //
    class Builder<T> implements ReactiveProducerBuilder {

      private Flux<T> flux;
      private KafkaSender<String, String> kafkaSender;
      private String topic;

      @Override
      public KafkaProducer<T> build() {
        return new KafkaProducer<>(flux, kafkaSender, topic);
      }

      @Override
      public Builder<?> reset() {
        this.flux = null;
        this.kafkaSender = null;
        this.topic = null;
        return this;
      }

      @Override
      public <U> Builder<U> withFlux(Flux<U> flux) {
        return new Builder<U>()
            .setFlux(flux)
            .withSender(this.kafkaSender)
            .withTopic(this.topic);
      }

      @Override
      public Builder<T> withSender(KafkaSender<String, String> kafkaSender) {
        this.kafkaSender = kafkaSender;
        return this;
      }

      @Override
      public Builder<T> withTopic(String topic) {
        this.topic = topic;
        return this;
      }

      private Builder<T> setFlux(Flux<T> flux) {
        this.flux = flux;
        return this;
      }
    }

    return new Builder<>();
  }

  /**
   * Send dataFlux to a Kafka topic
   * @param dataFlux Flux with data to send
   * @param sender KafkaSender to use
   * @param topic topic to post to
   * @param objectMapper ObjectMapper used to serialize data
   * @param <T> type of dataFlux to send
   */
  private static <T> void sendMessages(
      Flux<T> dataFlux,
      KafkaSender<String, String> sender,
      String topic,
      ObjectMapper objectMapper) {

    Flux<SenderRecord<String, String, String>> senderRecordFlux = dataFlux
        .map(item -> {
          try {
            return Optional.of(objectMapper.writeValueAsString(item));
          } catch (JsonProcessingException e) {
            logger.error(
                "Error serializing object for publishing ", e
            );
            return Optional.<String>empty();
          }
        }).filter(Optional::isPresent)
        .map(Optional::get)
        .map(json -> new ProducerRecord<String, String>(topic, json))
        .map(producerRecord -> SenderRecord.create(producerRecord, topic));

    sender.send(senderRecordFlux)
        .subscribe(
            senderResult -> {
              // noop intended
            },
            throwable -> {
              if (logger.isErrorEnabled()) {
                logger.error("Sending messages to topic {} messages failed",
                    topic, throwable);
              }
            },
            () -> {
              if (logger.isDebugEnabled()) {
                logger.debug("Sending of messages to topic {} complete",
                    topic);
              }
            }
        );
  }
}
