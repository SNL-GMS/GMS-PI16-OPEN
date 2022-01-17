package gms.shared.stationdefinition.converter.util.assemblers;

import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.converter.DaoChannelConverter;
import gms.shared.stationdefinition.converter.DaoChannelGroupConverter;
import gms.shared.stationdefinition.converter.DaoStationConverter;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.stream.Collectors;

import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_CHAN_DAO_REF_11;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_REF_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_REF_11;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.ONDATE;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

@ExtendWith(MockitoExtension.class)
class StationAssemblerTest {

  @Mock
  private DaoStationConverter stationConverter;

  @Mock
  private DaoChannelGroupConverter channelGroupConverter;

  @Mock
  private DaoChannelConverter channelConverter;

  @Test
  void testCreateValidation() {
    assertThrows(NullPointerException.class, () -> StationAssembler.create(null,
            null, null));
  }

  @Test
  void testCreate() {
    StationAssembler stationAssembler = assertDoesNotThrow(() -> StationAssembler.create(stationConverter,
            channelGroupConverter, channelConverter));
    assertNotNull(stationAssembler);
  }

  @Test
  void testBuildAll() {
    List<SiteDao> siteList = List.of(SITE_DAO_REF_1, SITE_DAO_REF_11);
    List<SiteChanDao> siteChanList = List.of(SITE_CHAN_DAO_REF_11);

    doReturn(STATION).when(stationConverter).convert(Mockito.eq(siteList),
            Mockito.eq(siteChanList), Mockito.any(), Mockito.any());

    StationAssembler assembler = StationAssembler.create(stationConverter, channelGroupConverter, channelConverter);

    List<Station> stations = assembler.buildAllForTime(siteList, siteChanList, ONDATE);
    assertNotNull(stations);
    assertEquals(1, stations.size());
    assertTrue(stations.contains(STATION));

    verify(stationConverter, times(1)).convert(Mockito.eq(siteList),
            Mockito.eq(siteChanList), Mockito.any(), Mockito.any());
    verifyNoMoreInteractions(stationConverter);
  }

  @Test
  void testBuildAllTimeRange() {
    List<SiteDao> siteList = List.of(SITE_DAO_REF_1, SITE_DAO_REF_11);
    List<SiteChanDao> siteChanList = List.of(SITE_CHAN_DAO_REF_11);
    List<String> stationNames = siteList.stream()
            .map(SiteDao::getReferenceStation)
            .distinct()
            .collect(Collectors.toList());

    doReturn(STATION).when(stationConverter).convert(Mockito.eq(siteList),
            Mockito.eq(siteChanList), Mockito.any(), Mockito.any());

    StationAssembler assembler = StationAssembler.create(stationConverter, channelGroupConverter, channelConverter);

    List<Station> stations = assembler.buildAllForTimeRange(stationNames, siteList, siteChanList, ONDATE);
    assertNotNull(stations);
    assertEquals(1, stations.size());
    assertTrue(stations.contains(STATION));

    verify(stationConverter, times(1)).convert(Mockito.eq(siteList),
            Mockito.eq(siteChanList), Mockito.any(), Mockito.any());
    verifyNoMoreInteractions(stationConverter);
  }
}
