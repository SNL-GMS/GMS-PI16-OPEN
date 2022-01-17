package gms.dataacquisition.stationreceiver.cd11.connman;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willReturn;
import static org.mockito.Mockito.times;

import gms.dataacquisition.stationreceiver.cd11.common.configuration.Cd11DataConsumerParameters;
import gms.dataacquisition.stationreceiver.cd11.connman.configuration.Cd11ConnManConfig;
import gms.shared.frameworks.systemconfig.SystemConfig;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReactorCd11ConnManTest {

  @Mock
  SystemConfig systemConfig;
  @Mock
  Cd11ConnManConfig connManConfig;
  @Mock
  Cd11DataConsumerParameters acquiredConsumer;
  @Mock
  Cd11DataConsumerParameters unacquiredConsumer;

  @Test
  void testReactorCd11ConnMan() {

    given(systemConfig.getValueAsInt("connection-manager-well-known-port")).willReturn(8100);
    given(connManConfig.getCd11StationParameters())
        .willReturn(List.of(acquiredConsumer, unacquiredConsumer));
    given(acquiredConsumer.isAcquired()).willReturn(true);
    given(unacquiredConsumer.isAcquired()).willReturn(false);
    given(acquiredConsumer.getStationName()).willReturn("acqStat");
    given(unacquiredConsumer.getStationName()).willReturn("unacqStat");
    given(acquiredConsumer.getPort()).willReturn(8100);

    willReturn("192.168.0.1")
        .given(systemConfig).getValue("data-manager-ip-address");
    willReturn("127.0.0.1")
        .given(systemConfig).getValue("data-provider-ip-address");

    ReactorCd11ConnMan connMan = ReactorCd11ConnMan.create(systemConfig, connManConfig);
    connMan.start();

    Mockito.verify(acquiredConsumer).getPort();
    Mockito.verify(unacquiredConsumer, times(0)).getPort();

    assertEquals(2, connMan.getInetAddressMap().size());
    assertEquals("192.168.0.1", connMan.getInetAddressMap().get("data-manager-ip-address").getHostAddress());
    assertEquals("127.0.0.1", connMan.getInetAddressMap().get("data-provider-ip-address").getHostAddress());
    assertNotNull(connMan.getIgnoredStationsMap().get("unacqStat"));
    assertNotNull(connMan.getCd11StationsLookup().get("acqStat"));
  }

}
