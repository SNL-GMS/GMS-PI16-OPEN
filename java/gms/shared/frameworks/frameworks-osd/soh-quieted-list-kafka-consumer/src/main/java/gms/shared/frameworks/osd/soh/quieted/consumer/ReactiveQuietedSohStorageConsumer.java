package gms.shared.frameworks.osd.soh.quieted.consumer;

import gms.shared.frameworks.common.annotations.Component;
import gms.shared.frameworks.messaging.SimpleKafkaStorageConsumer;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiDeserializer;
import gms.shared.frameworks.osd.coi.soh.quieting.QuietedSohStatusChange;
import gms.shared.frameworks.systemconfig.SystemConfig;

import java.util.Collection;

@Component("soh-quieted-list-kafka-consumer")
public class ReactiveQuietedSohStorageConsumer extends SimpleKafkaStorageConsumer<QuietedSohStatusChange> {

  public static void main(String[] args) {
    SystemConfig systemConfig = SystemConfig.create("soh-quieted-list-kafka-consumer");
    var consumer = new ReactiveQuietedSohStorageConsumer();
    consumer.initialize(systemConfig, new CoiDeserializer<>(QuietedSohStatusChange.class));
    consumer.run();
  }

  @Override
  protected void store(Collection<QuietedSohStatusChange> quietedSohStatusChanges) {
    logger.debug("Storing {} QuietedSohStatusChanges", quietedSohStatusChanges.size());
    osdRepository.storeQuietedSohStatusChangeList(quietedSohStatusChanges);
  }
}
