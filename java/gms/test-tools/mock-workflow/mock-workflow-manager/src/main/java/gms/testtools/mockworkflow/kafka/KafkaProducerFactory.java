package gms.testtools.mockworkflow.kafka;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;

import java.util.Properties;

public class KafkaProducerFactory {

  private KafkaProducerFactory() {

  }

  public static KafkaProducer<String, String> getProducer(String clientId,
      String bootstrapServer,
      int retries,
      long retryBackoff) {
    KafkaConnectionConfiguration kafkaConfig = KafkaConnectionConfiguration.create();
    var props = new Properties();
    props.put(ProducerConfig.CLIENT_ID_CONFIG, clientId);
    props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServer);
    props.put(ProducerConfig.RETRIES_CONFIG, retries);
    props.put(ProducerConfig.RETRY_BACKOFF_MS_CONFIG, retryBackoff);
    props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, kafkaConfig.getKeySerializer());
    props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, kafkaConfig.getValueSerializer());

    return new KafkaProducer<>(props);
  }

}
