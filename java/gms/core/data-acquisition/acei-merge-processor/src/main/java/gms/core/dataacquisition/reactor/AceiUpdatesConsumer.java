package gms.core.dataacquisition.reactor;

import gms.shared.frameworks.messaging.KafkaOffsetWrapper;
import gms.shared.frameworks.osd.api.OsdRepositoryInterface;
import gms.shared.frameworks.osd.api.rawstationdataframe.AceiUpdates;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.function.Consumer;

import static com.google.common.base.Preconditions.checkNotNull;

/**
 * Consumer used to store/delete {@link gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue}s
 * to the OSD and trigger a kafka commit upon a successful OSD transaction.
 */
public class AceiUpdatesConsumer implements Consumer<KafkaOffsetWrapper<AceiUpdates>> {

  private final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(AceiUpdatesConsumer.class));

  private final OsdRepositoryInterface sohRepository;

  private AceiUpdatesConsumer(OsdRepositoryInterface sohRepository) {
    this.sohRepository = sohRepository;
  }

  public static AceiUpdatesConsumer create(OsdRepositoryInterface sohRepository) {
    return new AceiUpdatesConsumer(checkNotNull(sohRepository));
  }

  @Override
  public void accept(KafkaOffsetWrapper<AceiUpdates> aceiUpdatesWrapper) {
    AceiUpdates aceiUpdates = aceiUpdatesWrapper.getValue();
    logger.info("Received ACEI UPDATES: "
            + "\n Analog - Inserts: {}, Deletes: {}"
            + "\n Boolean - Inserts: {}, Deletes: {}",
        aceiUpdates.getAnalogInserts().size(), aceiUpdates.getAnalogDeletes().size(),
        aceiUpdates.getBooleanInserts().size(), aceiUpdates.getBooleanDeletes().size());

    Instant startTime = Instant.now();

    sohRepository.syncAceiUpdates(aceiUpdates);
    aceiUpdatesWrapper.getOffset().commit();

    Instant endTime = Instant.now();
    logger.info("ACEI inserts completed, taking {} on thread {}",
        Duration.between(startTime, endTime), Thread.currentThread().getName());
  }
}
