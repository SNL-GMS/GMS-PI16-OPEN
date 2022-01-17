package gms.core.performancemonitoring.ssam.control.datapublisher;

import reactor.core.publisher.Flux;
import reactor.kafka.sender.KafkaSender;

/**
 * Specifies the methods for a builder that builds an instance of ReactiveProducer
 *
 * @param <T> The type of object that will be produced by the producer
 */
public interface ReactiveProducerBuilder {

  /**
   * Build the reactive producdr
   *
   * @return a new ReactiveProducer instance
   */
  ReactiveProducer build();

  /**
   * Reset the state of the builder
   *
   * @return a ReactiveProducerBuilder with a clean state
   */
  ReactiveProducerBuilder reset();

  /**
   * Specify which flux to use for the producer
   *
   * @param flux the flux to use for the producer
   * @return a ReactiveProducerBuilder where the flux has been set
   */
  <T> ReactiveProducerBuilder withFlux(Flux<T> flux);

  /**
   * Specify which KafkaSender to use for the producer. Restricting the parameter types to String
   *
   * @param kafkaSender the kafkaSender to use for the producer
   * @return a ReactiveProducerBuilder where the kafkaSender has been set
   */
  ReactiveProducerBuilder withSender(KafkaSender<String, String> kafkaSender);

  /**
   * Specify which topic to use for the producer
   *
   * @param topic the topic to use for the producer
   * @return a ReactiveProducerBuilder where the topic has been set
   */
  ReactiveProducerBuilder withTopic(String topic);
}
