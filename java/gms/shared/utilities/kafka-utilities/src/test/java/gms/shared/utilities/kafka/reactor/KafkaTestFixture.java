package gms.shared.utilities.kafka.reactor;

import static org.mockito.BDDMockito.willReturn;

import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.kafka.KafkaConfiguration;

public class KafkaTestFixture {

  public static void  assignSystemConfig(SystemConfig systemConfig){

    willReturn("rsdf-test-consumer")
        .given(systemConfig).getValue("application-id");
    willReturn("localhost:1234")
        .given(systemConfig).getValue("kafka-bootstrap-servers");
    willReturn("soh.rsdf")
        .given(systemConfig).getValue("kafka-rsdf-topic");
    willReturn("malformed.frame")
        .given(systemConfig).getValue("kafka-malformed-topic");
    willReturn("soh.acei")
        .given(systemConfig).getValue("kafka-acquiredchannelsoh-topic");
    willReturn("soh.extract")
        .given(systemConfig).getValue("kafka-stationsohinput-topic");
    willReturn("org.apache.kafka.common.serialization.Serdes$StringSerde")
        .given(systemConfig).getValue("reactor-kafka-key-serializer");
    willReturn("org.apache.kafka.common.serialization.Serdes$StringSerde")
        .given(systemConfig).getValue("reactor-kafka-value-serializer");
    willReturn("all")
        .given(systemConfig).getValue("reactor-kafka-sender-acks");


  }

  public static void assignKafkaConfig(KafkaConfiguration kafkaConfig){

    willReturn("test-server").given(kafkaConfig).getBootstrapServers();
    willReturn(60).given(kafkaConfig).getTransactionTimeout();
    willReturn(60).given(kafkaConfig).getDeliveryTimeout();
    willReturn("acks").given(kafkaConfig).getAcks();


  }

  /**
   * This function was meant to create a config that is common for all the tests but as the tests
   * use different configs to init the factory it was just left here commented out to have
   * pieces put into the respective tests

   private void initializesystemConfig() {

   mock configuration for KafkaConfiguration
   willReturn("rsdf-test-consumer")
   .given(systemConfig).getValue("application-id");
   willReturn("localhost:1234")
   .given(systemConfig).getValue("kafka-bootstrap-servers");
   willReturn("soh.rsdf")
   .given(systemConfig).getValue("input-topic");
   willReturn("soh.rsdf")
   .given(systemConfig).getValue("kafka-rsdf-topic");
   willReturn("malformed.frame")
   .given(systemConfig).getValue("kafka-malformed-topic");
   willReturn("soh.acei")
   .given(systemConfig).getValue("kafka-acquiredchannelsoh-topic");
   willReturn("soh.extract")
   .given(systemConfig).getValue("kafka-stationsohinput-topic");
   willReturn("org.apache.kafka.common.serialization.Serdes$StringSerde")
   .given(systemConfig).getValue("reactor-kafka-key-serializer");
   willReturn("org.apache.kafka.common.serialization.Serdes$StringSerde")
   .given(systemConfig).getValue("reactor-kafka-value-serializer");
   willReturn("1")
   .given(systemConfig).getValue("verification-attempts");
   willReturn("120000")
   .given(systemConfig).getValue("streams-close-timeout-ms");
   willReturn("10")
   .given(systemConfig).getValue("connection-retry-count");
   willReturn("1000")
   .given(systemConfig).getValue("retry-backoff-ms");
   willReturn("30000")
   .given(systemConfig).getValue("reactor-kafka-sender-transaction-timeout");
   willReturn("all")
   .given(systemConfig).getValue("reactor-kafka-sender-acks");
   willReturn("120000")
   .given(systemConfig).getValue("reactor-kafka-sender-delivery-timeout");
   willReturn("60000")
   .given(systemConfig).getValue("reactor-kafka-consumer-session-timeout");
   willReturn("2500")
   .given(systemConfig).getValue("reactor-kafka-consumer-max-poll-interval");
   willReturn("false")
   .given(systemConfig).getValue("reactor-kafka-auto-commit");
   willReturn("3000")
   .given(systemConfig).getValue("reactor-kafka-consumer-heartbeat-interval");
   willReturn("org.apache.kafka.common.serialization.StringDeserializer")
   .given(systemConfig).getValue("kafka-key-deserializer");
   willReturn("org.apache.kafka.common.serialization.StringDeserializer")
   .given(systemConfig).getValue("kafka-value-deserializer");
   willReturn("10000")
   .given(systemConfig).getValue("kafka-consumer-session-timeout");
   willReturn("3000")
   .given(systemConfig).getValue("kafka-consumer-heartbeat-interval");

   end mock configuration for KafkaConfiguration


   mock configuration for KafkaConnectionConfiguration
   willReturn("org.apache.kafka.common.serialization.StringSerializer")
   .given(systemConfig).getValue("kafka-key-serializer");
   willReturn("org.apache.kafka.common.serialization.StringSerializer")
   .given(systemConfig).getValue("kafka-value-serializer");
   willReturn("gzip")
   .given(systemConfig).getValue("kafka-compression-type");
   }
   */


}
