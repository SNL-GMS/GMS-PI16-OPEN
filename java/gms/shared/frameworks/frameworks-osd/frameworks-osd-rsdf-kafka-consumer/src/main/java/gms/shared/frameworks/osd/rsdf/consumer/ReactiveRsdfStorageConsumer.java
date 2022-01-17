package gms.shared.frameworks.osd.rsdf.consumer;

import gms.shared.frameworks.common.annotations.Component;
import gms.shared.frameworks.messaging.SimpleKafkaStorageConsumer;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiDeserializer;
import gms.shared.frameworks.osd.coi.waveforms.RawStationDataFrame;
import gms.shared.frameworks.systemconfig.SystemConfig;

import java.util.Collection;

@Component("osd-rsdf-kafka-consumer")
public class ReactiveRsdfStorageConsumer extends SimpleKafkaStorageConsumer<RawStationDataFrame> {

  public static void main(String[] args) {
    SystemConfig systemConfig = SystemConfig.create("osd-rsdf-kafka-consumer");
    var consumer = new ReactiveRsdfStorageConsumer();
    consumer.initialize(systemConfig, new CoiDeserializer<>(RawStationDataFrame.class));
    consumer.run();
  }

  @Override
  protected void store(Collection<RawStationDataFrame> rsdfs) {
    logger.debug("Storing {} RSDFs", rsdfs.size());
    osdRepository.storeRawStationDataFrames(rsdfs);
  }
}
