package gms.shared.frameworks.osd.systemmessage.consumer;

import gms.shared.frameworks.common.annotations.Component;
import gms.shared.frameworks.messaging.SimpleKafkaStorageConsumer;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiDeserializer;
import gms.shared.frameworks.osd.coi.systemmessages.SystemMessage;
import gms.shared.frameworks.systemconfig.SystemConfig;

import java.util.Collection;

@Component("osd-systemmessage-kafka-consumer")
public class ReactiveSystemMessageStorageConsumer extends SimpleKafkaStorageConsumer<SystemMessage> {

  public static void main(String[] args) {
    SystemConfig systemConfig = SystemConfig.create("osd-systemmessage-kafka-consumer");
    var consumer = new ReactiveSystemMessageStorageConsumer();
    consumer.initialize(systemConfig, new CoiDeserializer<>(SystemMessage.class));
    consumer.run();
  }

  @Override
  protected void store(Collection<SystemMessage> systemMessages) {
    logger.debug("Storing {} system messages ...", systemMessages.size());
    osdRepository.storeSystemMessages(systemMessages);
  }
}
