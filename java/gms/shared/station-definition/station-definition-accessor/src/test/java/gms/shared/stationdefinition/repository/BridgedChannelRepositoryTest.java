package gms.shared.stationdefinition.repository;

import gms.shared.stationdefinition.cache.VersionCache;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.converter.util.assemblers.ChannelAssembler;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import gms.shared.stationdefinition.database.connector.BeamDatabaseConnector;
import gms.shared.stationdefinition.database.connector.InstrumentDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SensorDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteChanDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.repository.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_CHAN_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_1;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BridgedChannelRepositoryTest {

  private final List<SiteChanDao> siteChanDaos = CSSDaoTestFixtures.getTestSiteChanDaos();
  private final List<SiteDao> siteDaos = CSSDaoTestFixtures.getTestSiteDaos();
  private final List<SensorDao> sensorDaos = CSSDaoTestFixtures.getTestSensorDaos();
  private final List<WfdiscDao> wfdiscDaos = CSSDaoTestFixtures.getTestWfdiscDaos();

  @Mock
  private BeamDatabaseConnector beamDatabaseConnector;

  @Mock
  private SiteDatabaseConnector siteDatabaseConnector;

  @Mock
  private SiteChanDatabaseConnector siteChanDatabaseConnector;

  @Mock
  private SensorDatabaseConnector sensorDatabaseConnector;

  @Mock
  private InstrumentDatabaseConnector instrumentDatabaseConnector;

  @Mock
  private WfdiscDatabaseConnector wfdiscDatabaseConnector;

  @Mock
  private ChannelAssembler channelAssembler;

  @Mock
  private StationDefinitionIdUtility stationDefinitionIdUtility;

  @Mock
  private VersionCache versionCache;

  private BridgedChannelRepository repository;
  private List<String> channelNames;

  @BeforeEach
  void setUp() {
    repository = BridgedChannelRepository.create(beamDatabaseConnector,
      siteDatabaseConnector,
      siteChanDatabaseConnector,
      sensorDatabaseConnector,
      wfdiscDatabaseConnector,
      channelAssembler,
      stationDefinitionIdUtility,
      versionCache);

    channelNames = List
      .of("REF.STA.NO1", "REF.STA.NO2", "REF.STA.NO3", "REF.STA.NO4", "REF.STA.NO5",
        "REF.STA.NO6");
  }

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(BeamDatabaseConnector beamDatabaseConnector,
    SiteDatabaseConnector siteDatabaseConnector,
    SiteChanDatabaseConnector siteChanDatabaseConnector,
    SensorDatabaseConnector sensorDatabaseConnector,
    WfdiscDatabaseConnector wfdiscDatabaseConnector,
    ChannelAssembler channelAssembler,
    StationDefinitionIdUtility stationDefinitionIdUtility,
    VersionCache versionCache) {

    assertThrows(NullPointerException.class,
      () -> BridgedChannelRepository.create(beamDatabaseConnector,
        siteDatabaseConnector,
        siteChanDatabaseConnector,
        sensorDatabaseConnector,
        wfdiscDatabaseConnector,
        channelAssembler,
        stationDefinitionIdUtility,
        versionCache));
  }

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(
      arguments(
        null,
        mock(SiteDatabaseConnector.class),
        mock(SiteChanDatabaseConnector.class),
        mock(SensorDatabaseConnector.class),
        mock(WfdiscDatabaseConnector.class),
        mock(ChannelAssembler.class),
        mock(StationDefinitionIdUtility.class),
        mock(VersionCache.class)),
      arguments(mock(BeamDatabaseConnector.class),
        null,
        mock(SiteChanDatabaseConnector.class),
        mock(SensorDatabaseConnector.class),
        mock(WfdiscDatabaseConnector.class),
        mock(ChannelAssembler.class),
        mock(StationDefinitionIdUtility.class),
        mock(VersionCache.class)),
      arguments(
        mock(BeamDatabaseConnector.class),
        mock(SiteDatabaseConnector.class),
        null,
        mock(SensorDatabaseConnector.class),
        mock(WfdiscDatabaseConnector.class),
        mock(ChannelAssembler.class),
        mock(StationDefinitionIdUtility.class),
        mock(VersionCache.class)),
      arguments(
        mock(BeamDatabaseConnector.class),
        mock(SiteDatabaseConnector.class),
        mock(SiteChanDatabaseConnector.class),
        null,
        mock(WfdiscDatabaseConnector.class),
        mock(ChannelAssembler.class),
        mock(StationDefinitionIdUtility.class),
        mock(VersionCache.class)),
      arguments(
        mock(BeamDatabaseConnector.class),
        mock(SiteDatabaseConnector.class),
        mock(SiteChanDatabaseConnector.class),
        mock(SensorDatabaseConnector.class),
        null,
        mock(ChannelAssembler.class),
        mock(StationDefinitionIdUtility.class),
        mock(VersionCache.class)),
      arguments(
        mock(BeamDatabaseConnector.class),
        mock(SiteDatabaseConnector.class),
        mock(SiteChanDatabaseConnector.class),
        mock(SensorDatabaseConnector.class),
        mock(WfdiscDatabaseConnector.class),
        null,
        mock(StationDefinitionIdUtility.class),
        mock(VersionCache.class)),
      arguments(
        mock(BeamDatabaseConnector.class),
        mock(SiteDatabaseConnector.class),
        mock(SiteChanDatabaseConnector.class),
        mock(SensorDatabaseConnector.class),
        mock(WfdiscDatabaseConnector.class),
        mock(ChannelAssembler.class),
        null,
        mock(VersionCache.class)),
      arguments(
        mock(BeamDatabaseConnector.class),
        mock(SiteDatabaseConnector.class),
        mock(SiteChanDatabaseConnector.class),
        mock(SensorDatabaseConnector.class),
        mock(WfdiscDatabaseConnector.class),
        mock(ChannelAssembler.class),
        mock(StationDefinitionIdUtility.class),
        null));
  }

  @Test
  void testCreate() {
    assertNotNull(repository);
  }

  private void verifyNoMoreMockInteractions() {
    verifyNoMoreInteractions(siteChanDatabaseConnector, siteDatabaseConnector, sensorDatabaseConnector,
      instrumentDatabaseConnector, wfdiscDatabaseConnector, channelAssembler);
  }

  @Test
  void testFindChannelsByNameAndTime() {
    Instant effectiveTime = Instant.now();
    when(siteChanDatabaseConnector.findSiteChansByKeyAndTime(any(), eq(effectiveTime)))
      .thenReturn(siteChanDaos);
    when(siteDatabaseConnector.findSitesByStationCodesAndStartTime(any(), any())).thenReturn(siteDaos);
    when(sensorDatabaseConnector.findSensorVersionsByNameAndTime(any(), any())).thenReturn(sensorDaos);
    when(wfdiscDatabaseConnector.findWfdiscVersionsByNameAndTime(any(), any()))
      .thenReturn(wfdiscDaos);
    when(channelAssembler
      .buildAllForTime(effectiveTime, siteDaos, siteChanDaos, sensorDaos, wfdiscDaos))
      .thenReturn(
        List.of(
          CHANNEL.toBuilder().setName(channelNames.get(0)).build(),
          CHANNEL.toBuilder().setName(channelNames.get(1)).build(),
          CHANNEL.toBuilder().setName(channelNames.get(2)).build(),
          CHANNEL.toBuilder().setName(channelNames.get(3)).build(),
          CHANNEL.toBuilder().setName(channelNames.get(4)).build(),
          CHANNEL.toBuilder().setName(channelNames.get(5)).build())
      );
    final List<Channel> result = repository.findChannelsByNameAndTime(channelNames, effectiveTime);

    assertNotNull(result);
    assertEquals(channelNames.size(), result.size());
    verify(siteChanDatabaseConnector, times(1))
      .findSiteChansByKeyAndTime(any(), eq(effectiveTime));
    verify(siteDatabaseConnector, times(1)).findSitesByStationCodesAndStartTime(any(), eq(effectiveTime));
    verify(sensorDatabaseConnector, times(1)).findSensorVersionsByNameAndTime(any(), any());
    verify(wfdiscDatabaseConnector, times(1)).findWfdiscVersionsByNameAndTime(any(), any());
    verify(channelAssembler, times(1))
      .buildAllForTime(effectiveTime, siteDaos, siteChanDaos, sensorDaos, wfdiscDaos);
    verifyNoMoreMockInteractions();
  }

  @Test
  void testFindChannelsByNameAndTimeRange() {
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plus(Duration.ofSeconds(5));
    when(siteChanDatabaseConnector.findSiteChansByNameAndTimeRange(any(), eq(startTime), eq(endTime)))
      .thenReturn(siteChanDaos);
    when(siteDatabaseConnector.findSitesByNamesAndTimeRange(any(), eq(startTime), eq(endTime))).thenReturn(siteDaos);
    when(wfdiscDatabaseConnector.findWfdiscsByNameAndTimeRange(any(), eq(startTime), eq(endTime)))
      .thenReturn(wfdiscDaos);
    when(sensorDatabaseConnector.findSensorsByKeyAndTimeRange(any(), eq(startTime), eq(endTime))).thenReturn(sensorDaos);

    when(channelAssembler
      .buildAllForTimeRange(startTime, siteDaos, siteChanDaos, sensorDaos, wfdiscDaos))
      .thenReturn(
        List.of(
          CHANNEL.toBuilder().setName(channelNames.get(0)).build(),
          CHANNEL.toBuilder().setName(channelNames.get(1)).build(),
          CHANNEL.toBuilder().setName(channelNames.get(2)).build(),
          CHANNEL.toBuilder().setName(channelNames.get(3)).build(),
          CHANNEL.toBuilder().setName(channelNames.get(4)).build(),
          CHANNEL.toBuilder().setName(channelNames.get(5)).build())
      );
    final List<Channel> result = repository.findChannelsByNameAndTimeRange(channelNames, startTime, endTime);

    assertNotNull(result);
    assertEquals(channelNames.size(), result.size());
    verify(siteChanDatabaseConnector, times(1))
      .findSiteChansByNameAndTimeRange(any(), eq(startTime), eq(endTime));
    verify(siteDatabaseConnector, times(1)).findSitesByNamesAndTimeRange(any(), eq(startTime), eq(endTime));
    verify(wfdiscDatabaseConnector, times(1)).findWfdiscsByNameAndTimeRange(any(), eq(startTime), eq(endTime));
    verify(sensorDatabaseConnector, times(1)).findSensorsByKeyAndTimeRange(any(), eq(startTime), eq(endTime));
    verify(channelAssembler, times(1))
      .buildAllForTimeRange(startTime, siteDaos, siteChanDaos, sensorDaos, wfdiscDaos);
    verifyNoMoreMockInteractions();
  }

  @Test
  void testChannelEffectiveTimeBeforeChannelEndTime() {
    long associatedRecordId = 1L;
    long wfid = 1L;
    Instant channelEffectiveTime = Instant.EPOCH;
    Instant channelEndTime = channelEffectiveTime.plus(Duration.ofSeconds(5));
    TagName associatedRecordType = TagName.ARID;
    assertThrows(IllegalStateException.class, () -> repository.loadChannelFromWfdisc(wfid, associatedRecordType, associatedRecordId, channelEndTime, channelEffectiveTime));
  }

  @Test
  void testLoadChannelFromWfdisc() {
    when(wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(WFDISC_TEST_DAO_1.getId())))
      .thenReturn(List.of(WFDISC_TEST_DAO_1));
    when(siteDatabaseConnector.findSitesByStationCodesAndStartTime(anyList(), eq(Instant.EPOCH)))
      .thenReturn(List.of(SITE_DAO_1));
    when(siteChanDatabaseConnector.findSiteChansByKeyAndTime(anyList(), eq(Instant.EPOCH)))
      .thenReturn(List.of(SITE_CHAN_DAO_1));
    when(beamDatabaseConnector.findBeamForWfid(WFDISC_TEST_DAO_1.getId())).thenReturn(Optional.empty());
    when(sensorDatabaseConnector.findSensorByKeyInRange(any(),
      any(),
      eq(Instant.EPOCH),
      eq(Instant.EPOCH.plusSeconds(60))))
      .thenReturn(Optional.empty());

    when(channelAssembler.buildFromAssociatedRecord(anyMap(),
      any(),
      eq(SITE_DAO_1),
      eq(WFDISC_TEST_DAO_1),
      eq(SITE_CHAN_DAO_1),
      any(),
      eq(Instant.EPOCH),
      eq(Instant.EPOCH.plusSeconds(60))))
      .thenReturn(CHANNEL);

    Channel channel = repository.loadChannelFromWfdisc(WFDISC_TEST_DAO_1.getId(),
      TagName.ARID,
      3,
      Instant.EPOCH,
      Instant.EPOCH.plusSeconds(60));

    assertEquals(CHANNEL, channel);
  }

}