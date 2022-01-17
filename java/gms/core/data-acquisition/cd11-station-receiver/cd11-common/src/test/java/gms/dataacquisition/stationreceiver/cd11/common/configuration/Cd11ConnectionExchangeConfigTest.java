package gms.dataacquisition.stationreceiver.cd11.common.configuration;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class Cd11ConnectionExchangeConfigTest {


  @Test
  void buildTest() {
    Cd11ConnectionConfig config = Cd11ConnectionConfig.builder()
        .setProtocolMajorVersion((short) 1).setProtocolMinorVersion((short) 2)
        .setServiceType("test").setStationOrResponderName("name").setStationOrResponderType("type")
        .build();

    assertEquals(1, config.getProtocolMajorVersion());
    assertEquals(2, config.getProtocolMinorVersion());
    assertEquals("test", config.getServiceType());
    assertEquals("name", config.getStationOrResponderName());
    assertEquals("type", config.getStationOrResponderType());
  }
}
