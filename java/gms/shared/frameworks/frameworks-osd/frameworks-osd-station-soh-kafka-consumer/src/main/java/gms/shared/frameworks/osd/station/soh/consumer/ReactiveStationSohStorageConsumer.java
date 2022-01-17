package gms.shared.frameworks.osd.station.soh.consumer;

import gms.shared.frameworks.common.annotations.Component;
import gms.shared.frameworks.messaging.SimpleKafkaStorageConsumer;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiDeserializer;
import gms.shared.frameworks.osd.coi.soh.StationSoh;
import gms.shared.frameworks.systemconfig.SystemConfig;

import java.util.Collection;

@Component("osd-station-soh-kafka-consumer")
public class ReactiveStationSohStorageConsumer extends SimpleKafkaStorageConsumer<StationSoh> {

  public static void main(String[] args) {
    SystemConfig systemConfig = SystemConfig.create("osd-station-soh-kafka-consumer");
    var consumer = new ReactiveStationSohStorageConsumer();
    consumer.initialize(systemConfig, new CoiDeserializer<>(StationSoh.class));
    consumer.run();
  }

  @Override
  protected void store(Collection<StationSoh> stationSohs) {
    logger.debug("Storing {} StationSohs", stationSohs.size());
    osdRepository.storeStationSoh(stationSohs);
  }
}