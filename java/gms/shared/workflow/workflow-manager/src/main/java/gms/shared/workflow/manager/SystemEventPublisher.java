package gms.shared.workflow.manager;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.common.annotations.VisibleForTesting;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.coi.utils.CoiObjectMapperFactory;
import gms.shared.system.events.SystemEvent;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.shared.workflow.coi.StageInterval;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;
import org.slf4j.LoggerFactory;

import java.util.Collection;
import java.util.List;
import java.util.Properties;

import static java.util.stream.Collectors.toList;

public class SystemEventPublisher {

  static final String KAFKA_BOOTSTRAP_SERVERS = "kafka-bootstrap-servers";
  public static final String SYSTEM_EVENT_TOPIC = "system-event";


  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(SystemEventPublisher.class));

  private final KafkaProducer<String, String> kafkaSender;

  private SystemEventPublisher(SystemConfig systemConfig) {
    this.kafkaSender = new KafkaProducer<>(senderProperties(systemConfig));
  }

  @VisibleForTesting
  SystemEventPublisher(KafkaProducer<String, String> kafkaSender) {
    this.kafkaSender = kafkaSender;
  }

  public static SystemEventPublisher create(SystemConfig systemConfig) {
    return new SystemEventPublisher(systemConfig);
  }


  private SystemEvent createSystemEvent(StageInterval stageInterval) {
    return SystemEvent.from(
      "intervals",
      List.of(stageInterval),
      0
    );
  }

  public void createAndSendSystemEvents(Collection<? extends StageInterval> stageIntervals) {
    sendSystemEvents(stageIntervals.stream().map(this::createSystemEvent).collect(toList()));
  }

  private void sendSystemEvent(SystemEvent systemEvent) {
    try {
      var message = CoiObjectMapperFactory.getJsonObjectMapper().writeValueAsString(systemEvent);
      var producerRecord = new ProducerRecord<String, String>(SYSTEM_EVENT_TOPIC, message);
      kafkaSender.send(producerRecord);
    } catch (JsonProcessingException e) {
      logger.error("Could not send SystemEvents", e);
    }

  }

  private void sendSystemEvents(List<SystemEvent> systemEvents) {
    systemEvents.forEach(this::sendSystemEvent);
  }

  private static Properties senderProperties(SystemConfig systemConfig) {
    var properties = new Properties();
    properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,
      systemConfig.getValue(KAFKA_BOOTSTRAP_SERVERS));
    properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
    properties
      .put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
    // By default, a producer doesn't wait for an acknowledgement from kafka when it sends
    // a message to a topic. Setting it to "1" means that it will wait for at least one kafka
    // node to acknowledge. The safest is "all", but that makes sending a little slower.
    properties.put(ProducerConfig.ACKS_CONFIG, "1");
    return properties;
  }

}
