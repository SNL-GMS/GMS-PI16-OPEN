package gms.dataacquisition.stationreceiver.cd11.connman;


import static org.junit.jupiter.api.Assertions.assertEquals;

import java.net.InetAddress;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class Cd11StationTest {

  @Mock
  InetAddress mockAddress1;

  @Mock
  InetAddress mockAddress2;

  @Test
  void testCd11Constructor(){
    Cd11Station testStation = new Cd11Station(mockAddress1, mockAddress2, 1);

    assertEquals(mockAddress1, testStation.expectedDataProviderIpAddress);
    assertEquals(mockAddress2, testStation.dataConsumerIpAddress);
    assertEquals(1, testStation.dataConsumerPort);
  }

}
