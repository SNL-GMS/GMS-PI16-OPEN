package gms.shared.workflow.manager;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.stationdefinition.coi.utils.CoiObjectMapperFactory;
import gms.shared.system.events.SystemEvent;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SystemEventPublisherTest {

  @Mock
  KafkaProducer<String, String> mockKafkaProducer;

  SystemEventPublisher systemEventPublisher;

  @BeforeEach
  void setUp() {
    systemEventPublisher = new SystemEventPublisher(mockKafkaProducer);
  }

  @Test
  void testCreateAndSendSystemEvents() throws JsonProcessingException {

    var interactiveAnalysisStageIntervalsSet = Set.of(IntervalFixtures.inProgressInteractiveAnalysisStageInterval);

    systemEventPublisher.createAndSendSystemEvents(interactiveAnalysisStageIntervalsSet);

    var systemEvent = SystemEvent.from(
      "intervals",
      List.of(IntervalFixtures.inProgressInteractiveAnalysisStageInterval),
      0
    );
    var message = CoiObjectMapperFactory.getJsonObjectMapper().writeValueAsString(systemEvent);
    var producerRecord = new ProducerRecord<String, String>(SystemEventPublisher.SYSTEM_EVENT_TOPIC, message);

    verify(mockKafkaProducer).send(producerRecord);


  }
}
