package gms.shared.frameworks.osd.soh.statuschange.consumer;

import gms.shared.frameworks.common.annotations.Component;
import gms.shared.frameworks.messaging.SimpleKafkaStorageConsumer;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiDeserializer;
import gms.shared.frameworks.osd.coi.soh.quieting.UnacknowledgedSohStatusChange;
import gms.shared.frameworks.systemconfig.SystemConfig;

import java.util.Collection;

@Component("soh-status-change-kafka-consumer")
public class ReactiveUnacknowledgedSohStatusChangeStorageConsumer extends SimpleKafkaStorageConsumer<UnacknowledgedSohStatusChange> {

  public static void main(String[] args) {
    SystemConfig systemConfig = SystemConfig.create("soh-status-change-kafka-consumer");
    var consumer = new ReactiveUnacknowledgedSohStatusChangeStorageConsumer();
    consumer.initialize(systemConfig, new CoiDeserializer<>(UnacknowledgedSohStatusChange.class));
    consumer.run();
  }

  @Override
  protected void store(Collection<UnacknowledgedSohStatusChange> unacknowledgedSohStatusChanges) {
    logger.debug("Storing {} UnacknowledgedSohStatusChanges", unacknowledgedSohStatusChanges.size());
    osdRepository.storeUnacknowledgedSohStatusChange(unacknowledgedSohStatusChanges);
  }
}
