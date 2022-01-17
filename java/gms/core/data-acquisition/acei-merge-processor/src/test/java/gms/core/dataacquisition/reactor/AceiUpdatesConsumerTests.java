package gms.core.dataacquisition.reactor;

import gms.shared.frameworks.messaging.KafkaOffsetWrapper;
import gms.shared.frameworks.osd.api.OsdRepositoryInterface;
import gms.shared.frameworks.osd.api.rawstationdataframe.AceiUpdates;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.kafka.receiver.ReceiverOffset;
import reactor.kafka.receiver.ReceiverRecord;

import static gms.shared.frameworks.osd.coi.test.utils.UtilsTestFixtures.latestAnalogs;
import static gms.shared.frameworks.osd.coi.test.utils.UtilsTestFixtures.latestBooleans;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AceiUpdatesConsumerTests {

  @Mock
  private OsdRepositoryInterface sohRepository;

  @InjectMocks
  AceiUpdatesConsumer aceiConsumer;

  @Mock
  ReceiverRecord<String, AcquiredChannelEnvironmentIssue<?>> record;

  @Mock
  ReceiverOffset offset;

  @Test
  void testCreate() {
    assertThrows(NullPointerException.class, () -> AceiUpdatesConsumer.create(null));
    var actualConsumer = assertDoesNotThrow(() -> AceiUpdatesConsumer.create(sohRepository));
    assertNotNull(actualConsumer);
  }

  @Test
  void testAccept() {
    AceiUpdates updates = AceiUpdates.builder()
        .setAnalogInserts(latestAnalogs)
        .setBooleanInserts(latestBooleans)
        .build();

    KafkaOffsetWrapper<AceiUpdates> offsetWrapper = KafkaOffsetWrapper.create(offset, updates);

    aceiConsumer.accept(offsetWrapper);

    verify(offset).commit();

    verify(sohRepository, times(1))
        .syncAceiUpdates(updates);
  }

}