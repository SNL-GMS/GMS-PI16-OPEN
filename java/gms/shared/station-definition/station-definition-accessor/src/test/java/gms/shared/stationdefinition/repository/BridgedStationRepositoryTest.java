package gms.shared.stationdefinition.repository;

import gms.shared.stationdefinition.api.station.util.StationsTimeFacetRequest;
import gms.shared.stationdefinition.api.station.util.StationsTimeRangeRequest;
import gms.shared.stationdefinition.api.station.util.StationsTimeRequest;
import gms.shared.stationdefinition.api.util.TimeRangeRequest;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.converter.util.assemblers.StationAssembler;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.database.connector.SiteChanDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;
import gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures;
import gms.shared.stationdefinition.testfixtures.FacetingDefintionsTestFixtures;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.ONDATE;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BridgedStationRepositoryTest {
  private static final Object NULL_OBJECT = null;
  private final List<SiteChanDao> siteChanDaos = CSSDaoTestFixtures.getTestSiteChanDaos();
  private final List<SiteDao> siteDaos = CSSDaoTestFixtures.getTestSiteDaos();

  private List<String> stationNames;

  @Mock
  private SiteDatabaseConnector siteDatabaseConnector;

  @Mock
  private SiteChanDatabaseConnector siteChanDatabaseConnector;

  @Mock
  private StationAssembler stationAssembler;

  private BridgedStationRepository repository;

  @BeforeEach
  void setUp() {
    repository = BridgedStationRepository.create(siteDatabaseConnector,
      siteChanDatabaseConnector,
      stationAssembler);

    stationNames = siteDaos.stream()
      .map(SiteDao::getReferenceStation)
      .distinct()
      .collect(Collectors.toList());
  }

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(SiteDatabaseConnector siteDatabaseConnector,
    SiteChanDatabaseConnector siteChanDatabaseConnector,
    StationAssembler stationAssembler) {

    assertThrows(NullPointerException.class,
      () -> BridgedStationRepository.create(siteDatabaseConnector,
        siteChanDatabaseConnector,
        stationAssembler));
  }

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(
      arguments(null,
        mock(SiteChanDatabaseConnector.class),
        mock(StationAssembler.class)),
      arguments(mock(SiteDatabaseConnector.class),
        null,
        mock(StationAssembler.class)),
      arguments(mock(SiteDatabaseConnector.class),
        mock(SiteChanDatabaseConnector.class),
        null));
  }

  @Test
  void testFindStationsByName() {
    when(siteDatabaseConnector.findSitesByRefStationAndStartTime(any(), any()))
      .thenReturn(siteDaos);
    when(siteChanDatabaseConnector.findSiteChansByStationCodeAndTime(any(), any()))
      .thenReturn(siteChanDaos);
    when(stationAssembler.buildAllForTime(eq(siteDaos), eq(siteChanDaos), any()))
      .thenReturn(
        stationNames.stream()
          .map(name -> STATION.toBuilder().setName(name).build())
          .collect(Collectors.toList())
      );

    final List<Station> result = repository.findStationsByNameAndTime(stationNames, Instant.now());

    assertNotNull(result);
    assertEquals(stationNames.size(), result.size());

    verify(siteDatabaseConnector, times(1)).findSitesByRefStationAndStartTime(any(), any());
    verify(siteChanDatabaseConnector, times(1)).findSiteChansByStationCodeAndTime(any(), any());
    verify(stationAssembler, times(1)).buildAllForTime(eq(siteDaos), eq(siteChanDaos), any());
    verifyNoMoreMockInteractions();
  }

  @Test
  void testFindStationsByNameAndTime() {
    final StationsTimeRequest request = StationsTimeRequest.builder()
      .setStationNames(stationNames)
      .setEffectiveTime(ONDATE)
      .build();

    mockJpaRepositoryInteraction(stationNames, request.getEffectiveTime());

    final List<Station> result = repository.findStationsByNameAndTime(request.getStationNames(),
      request.getEffectiveTime());

    assertNotNull(result);
    assertEquals(stationNames.size(), result.size());
    verifyJpaRepositoryInteraction(request.getEffectiveTime());
  }

  @Test
  void testFindStationsByNameAndTimeRange() {
    final StationsTimeRangeRequest request = StationsTimeRangeRequest.builder()
      .setStationNames(stationNames)
      .setTimeRange(
        TimeRangeRequest.builder().setStartTime(ONDATE.minusSeconds(10)).setEndTime(ONDATE).build())
      .build();

    Instant startTime = request.getTimeRange().getStartTime();
    Instant endTime = request.getTimeRange().getEndTime();
    mockJpaRepositoryTimeRangeInteraction(stationNames, startTime, endTime);

    final List<Station> result = repository.findStationsByNameAndTimeRange(request.getStationNames(),
      request.getTimeRange().getStartTime(), request.getTimeRange().getEndTime());

    assertNotNull(result);
    assertEquals(stationNames.size(), result.size());
    verifyJpaRepositoryTimeRangeInteraction(startTime, endTime);
  }

  @Test
  void testFindStationsByNameAndTime_FacetRequest_populated() {
    final StationsTimeFacetRequest request = StationsTimeFacetRequest.builder()
      .setStationNames(stationNames)
      .setEffectiveTime(Instant.now())
      .setFacetingDefinition(FacetingDefintionsTestFixtures.STATION_POPULATED_FULL)
      .build();

    mockJpaRepositoryInteraction(stationNames, request.getEffectiveTime().orElseThrow());

    final List<Station> result = repository.findStationsByNameAndTime(request.getStationNames(),
      request.getEffectiveTime().orElseThrow());

    assertNotNull(result);
    assertEquals(stationNames.size(), result.size());
    assertTrue(result.stream().allMatch(Station::isPresent));
    verifyJpaRepositoryInteraction(request.getEffectiveTime().orElseThrow());
  }

  @Test
  void testFindStationsByNameAndTime_FacetRequest_populated_partial() {
    final StationsTimeFacetRequest request = StationsTimeFacetRequest.builder()
      .setStationNames(stationNames)
      .setEffectiveTime(Instant.now())
      .setFacetingDefinition(FacetingDefintionsTestFixtures.STATION_POPULATED_PARTIAL)
      .build();

    mockJpaRepositoryInteraction(stationNames, request.getEffectiveTime().orElseThrow());
    mockBridgedChannelRepositoryInteraction();

    final List<Station> result = repository.findStationsByNameAndTime(request.getStationNames(),
      request.getEffectiveTime().orElseThrow());

    assertNotNull(result);
    assertEquals(stationNames.size(), result.size());
    assertTrue(result.stream().allMatch(Station::isPresent));
    verifyJpaRepositoryInteraction(request.getEffectiveTime().orElseThrow());
  }

  @Test
  void testFindStationsByNameAndTime_FacetRequest_populated_emptyFacets() {
    final StationsTimeFacetRequest request = StationsTimeFacetRequest.builder()
      .setStationNames(stationNames)
      .setEffectiveTime(Instant.now())
      .setFacetingDefinition(FacetingDefintionsTestFixtures.STATION_POPULATED_EMPTYFACETS)
      .build();

    mockJpaRepositoryInteraction(stationNames, request.getEffectiveTime().orElseThrow());

    // with empty facets we query both channel groups and channels so need to mock interaction
    mockBridgedChannelGroupRepositoryInteraction();
    mockBridgedChannelRepositoryInteraction();

    final List<Station> result = repository.findStationsByNameAndTime(request.getStationNames(),
      request.getEffectiveTime().orElseThrow());

    assertNotNull(result);
    assertEquals(stationNames.size(), result.size());
    assertTrue(result.stream().allMatch(Station::isPresent));
    verifyJpaRepositoryInteraction(request.getEffectiveTime().orElseThrow());
  }

  @Test
  @Disabled("pending rewrite/redesign")
  void testFindStationsByNameAndTime_FacetRequest_notPopulated() {
    final StationsTimeFacetRequest request = StationsTimeFacetRequest.builder()
      .setStationNames(stationNames)
      .setEffectiveTime(Instant.now())
      .setFacetingDefinition(FacetingDefintionsTestFixtures.STATION_NOTPOPULATED_EMPTYFACETS)
      .build();

    mockJpaRepositoryInteraction(stationNames, request.getEffectiveTime().orElseThrow());

    final List<Station> result = repository.findStationsByNameAndTime(request.getStationNames(),
      request.getEffectiveTime().orElseThrow());

    assertNotNull(result);
    assertEquals(stationNames.size(), result.size());
    assertFalse(result.stream().allMatch(Station::isPresent));
    verifyJpaRepositoryInteraction(request.getEffectiveTime().orElseThrow());
  }

  void mockBridgedChannelRepositoryInteraction() {
  }

  void mockBridgedChannelGroupRepositoryInteraction() {
  }

  public void mockJpaRepositoryInteraction(List<String> stationNames, Instant effectiveTime) {
    when(siteDatabaseConnector.findSitesByRefStationAndStartTime(any(), eq(effectiveTime)))
      .thenReturn(siteDaos);
    when(siteChanDatabaseConnector.findSiteChansByStationCodeAndTime(any(), eq(effectiveTime)))
      .thenReturn(siteChanDaos);
    when(stationAssembler.buildAllForTime(siteDaos, siteChanDaos, effectiveTime))
      .thenReturn(
        stationNames.stream().map(name -> STATION.toBuilder().setName(name).build()).collect(Collectors.toList())
      );
  }

  public void mockJpaRepositoryTimeRangeInteraction(List<String> stationNames, Instant startTime, Instant endTime) {
    when(siteDatabaseConnector.findSitesByReferenceStationAndTimeRange(any(), eq(startTime), eq(endTime))).thenReturn(siteDaos);
    when(siteChanDatabaseConnector.findSiteChansByStationCodeAndTimeRange(any(), eq(startTime), eq(endTime))).thenReturn(siteChanDaos);
    when(stationAssembler.buildAllForTimeRange(stationNames, siteDaos, siteChanDaos, startTime))
      .thenReturn(
        stationNames.stream()
          .map(name -> STATION.toBuilder().setName(name).build())
          .collect(Collectors.toList())
      );
  }

  void verifyJpaRepositoryInteraction(Instant effectiveTime) {
    verify(siteDatabaseConnector, times(1)).findSitesByRefStationAndStartTime(any(), eq(effectiveTime));
    verify(siteChanDatabaseConnector, times(1)).findSiteChansByStationCodeAndTime(any(), eq(effectiveTime));
    verifyNoMoreMockInteractions();
  }

  void verifyJpaRepositoryTimeRangeInteraction(Instant startTime, Instant endTime) {
    verify(siteDatabaseConnector, times(1)).findSitesByReferenceStationAndTimeRange(any(), eq(startTime), eq(endTime));
    verify(siteChanDatabaseConnector, times(1)).findSiteChansByStationCodeAndTimeRange(any(), eq(startTime), eq(endTime));
    verifyNoMoreInteractions(siteChanDatabaseConnector, siteDatabaseConnector, stationAssembler);
  }

  private void verifyNoMoreMockInteractions() {
    verifyNoMoreInteractions(siteChanDatabaseConnector, siteDatabaseConnector, stationAssembler);
  }
}