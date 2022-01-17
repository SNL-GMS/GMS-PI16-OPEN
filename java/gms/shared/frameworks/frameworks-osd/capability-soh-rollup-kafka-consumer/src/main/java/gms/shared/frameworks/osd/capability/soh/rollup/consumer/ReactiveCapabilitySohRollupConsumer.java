package gms.shared.frameworks.osd.capability.soh.rollup.consumer;

import gms.shared.frameworks.common.annotations.Component;
import gms.shared.frameworks.messaging.SimpleKafkaStorageConsumer;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiDeserializer;
import gms.shared.frameworks.osd.coi.soh.CapabilitySohRollup;
import gms.shared.frameworks.systemconfig.SystemConfig;

import java.util.Collection;

@Component("capability-soh-rollup-kafka-consumer")
public class ReactiveCapabilitySohRollupConsumer extends SimpleKafkaStorageConsumer<CapabilitySohRollup> {

  public static void main(String[] args) {
    SystemConfig systemConfig = SystemConfig.create("capability-soh-rollup-kafka-consumer");
    var consumer = new ReactiveCapabilitySohRollupConsumer();
    consumer.initialize(systemConfig, new CoiDeserializer<>(CapabilitySohRollup.class));
    consumer.run();
  }

  @Override
  protected void store(Collection<CapabilitySohRollup> capabilitySohRollups) {
    logger.debug("Storing {} CapabilitySohRollups", capabilitySohRollups.size());
    osdRepository.storeCapabilitySohRollup(capabilitySohRollups);
  }
}
