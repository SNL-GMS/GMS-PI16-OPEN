package gms.shared.stationdefinition.repository;

import gms.shared.stationdefinition.api.channel.util.ChannelGroupsTimeFacetRequest;
import gms.shared.stationdefinition.api.channel.util.ChannelGroupsTimeRangeRequest;
import gms.shared.stationdefinition.api.channel.util.ChannelGroupsTimeRequest;
import gms.shared.stationdefinition.api.util.TimeRangeRequest;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.converter.util.assemblers.ChannelGroupAssembler;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.database.connector.SiteChanDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;
import gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures;
import gms.shared.stationdefinition.testfixtures.FacetingDefintionsTestFixtures;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import org.junit.jupiter.api.BeforeEach;
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

import static org.junit.Assert.assertEquals;
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
class BridgedChannelGroupRepositoryTest {
  private static final Object NULL_OBJECT = null;
  private final List<SiteChanDao> siteChanDaos = CSSDaoTestFixtures.getTestSiteChanDaos();
  private final List<SiteDao> siteDaos = CSSDaoTestFixtures.getTestSiteDaos();
  private List<String> channelGroupNames;

  @Mock
  private SiteDatabaseConnector siteDatabaseConnector;

  @Mock
  private SiteChanDatabaseConnector siteChanDatabaseConnector;

  @Mock
  private ChannelGroupAssembler channelGroupAssembler;


  private BridgedChannelGroupRepository repository;

  @BeforeEach
  void setUp() {
    repository = BridgedChannelGroupRepository.create(siteDatabaseConnector,
      siteChanDatabaseConnector,
      channelGroupAssembler);

    channelGroupNames = siteChanDaos.stream()
      .map(siteChanDao -> siteChanDao.getId().getStationCode())
      .distinct()
      .collect(Collectors.toList());
  }

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(SiteDatabaseConnector siteDatabaseConnector,
    SiteChanDatabaseConnector siteChanDatabaseConnector,
    ChannelGroupAssembler channelGroupAssembler) {
    assertThrows(NullPointerException.class,
      () -> BridgedChannelGroupRepository.create(siteDatabaseConnector,
        siteChanDatabaseConnector,
        channelGroupAssembler));
  }

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(
      arguments(null,
        mock(SiteChanDatabaseConnector.class),
        mock(ChannelGroupAssembler.class)),
      arguments(mock(SiteDatabaseConnector.class),
        null,
        mock(ChannelGroupAssembler.class)),
      arguments(mock(SiteDatabaseConnector.class),
        mock(SiteChanDatabaseConnector.class),
        null)
    );
  }

  @Test
  void testFindChannelGroupsByNameAndTime() {
    final ChannelGroupsTimeRequest request = ChannelGroupsTimeRequest.builder()
      .setChannelGroupNames(channelGroupNames)
      .setEffectiveTime(Instant.now())
      .build();

    mockJpaRepositoryInteraction(request.getEffectiveTime());
    final List<ChannelGroup> result = repository.findChannelGroupsByNameAndTime(request.getChannelGroupNames(),
      request.getEffectiveTime());

    assertNotNull(result);
    assertEquals(channelGroupNames.size(), result.size());
    verifyJpaRepositoryInteraction(request.getEffectiveTime());
  }

  @Test
  void testFindChannelGroupsByNameAndTimeFacet() {
    final ChannelGroupsTimeFacetRequest request = ChannelGroupsTimeFacetRequest.builder()
      .setChannelGroupNames(channelGroupNames)
      .setEffectiveTime(Instant.now())
      .setFacetingDefinition(FacetingDefinition.builder()
        .setClassType("ChannelGroup")
        .setPopulated(true)
        .build())
      .build();

    mockJpaRepositoryInteraction(request.getEffectiveTime().orElseThrow());
    final List<ChannelGroup> result = repository.findChannelGroupsByNameAndTime(channelGroupNames,
      request.getEffectiveTime().orElseThrow());

    assertNotNull(result);
    assertEquals(channelGroupNames.size(), result.size());
    verifyJpaRepositoryInteraction(request.getEffectiveTime().orElseThrow());
  }

  @Test
  void testFindChannelGroupsByNameAndTimeRange() {
    Instant startTime = Instant.EPOCH;
    Instant endTime = Instant.now();

    final ChannelGroupsTimeRangeRequest request = ChannelGroupsTimeRangeRequest.builder()
      .setChannelGroupNames(channelGroupNames)
      .setTimeRange(TimeRangeRequest.builder()
        .setStartTime(startTime)
        .setEndTime(endTime)
        .build())
      .build();

    when(siteDatabaseConnector
      .findSitesByNamesAndTimeRange(request.getChannelGroupNames(),
        startTime,
        endTime))
      .thenReturn(siteDaos);
    when(siteChanDatabaseConnector.findSiteChansByStationCodeAndTimeRange(any(), eq(startTime), eq(endTime)))
      .thenReturn(siteChanDaos);
    when(channelGroupAssembler
      .buildAllForTimeRange(siteDaos, siteChanDaos, startTime, endTime))
      .thenReturn(
        UtilsTestFixtures.getListOfChannelGroupsForDaos()
      );

    final List<ChannelGroup> result = repository.findChannelGroupsByNameAndTimeRange(request.getChannelGroupNames(),
      request.getTimeRange().getStartTime(), request.getTimeRange().getEndTime());

    assertNotNull(result);
    assertEquals(channelGroupNames.size(), result.size());
    verify(siteDatabaseConnector, times(1))
      .findSitesByNamesAndTimeRange(any(), eq(request.getTimeRange().getStartTime()),
        eq(request.getTimeRange().getEndTime()));
    verify(siteChanDatabaseConnector, times(1)).findSiteChansByStationCodeAndTimeRange(any(), any(), any());
    verify(channelGroupAssembler, times(1))
      .buildAllForTimeRange(siteDaos, siteChanDaos, startTime, endTime);
    verifyNoMoreMockInteractions();
  }

  private void verifyNoMoreMockInteractions() {
    verifyNoMoreInteractions(siteChanDatabaseConnector,
      siteDatabaseConnector,
      channelGroupAssembler);
  }

  @Test
  void testFindChannelGroupsByNameAndTime_FacetRequest_populated() {
    final ChannelGroupsTimeFacetRequest request = ChannelGroupsTimeFacetRequest.builder()
      .setChannelGroupNames(channelGroupNames)
      .setEffectiveTime(Instant.now())
      .setFacetingDefinition(FacetingDefintionsTestFixtures.CHANNELGROUP_POPULATED_FULL)
      .build();

    mockJpaRepositoryInteraction(request.getEffectiveTime().orElseThrow());

    final List<ChannelGroup> result = repository.findChannelGroupsByNameAndTime(request.getChannelGroupNames(),
      request.getEffectiveTime().orElseThrow());

    assertNotNull(result);
    assertEquals(channelGroupNames.size(), result.size());
    assertTrue(result.stream().allMatch(ChannelGroup::isPresent));
    verifyJpaRepositoryInteraction(request.getEffectiveTime().orElseThrow());
  }

  void mockJpaRepositoryInteraction(Instant effectiveTime) {
    when(siteDatabaseConnector.findSitesByStationCodesAndStartTime(any(), eq(effectiveTime)))
      .thenReturn(siteDaos);
    when(siteChanDatabaseConnector.findSiteChansByStationCodeAndTime(any(), eq(effectiveTime)))
      .thenReturn(siteChanDaos);
    when(channelGroupAssembler
      .buildAll(eq(siteDaos), eq(siteChanDaos), any()))
      .thenReturn(
        UtilsTestFixtures.getListOfChannelGroupsForDaos()
      );
  }

  void verifyJpaRepositoryInteraction(Instant effectiveTime) {
    verify(siteDatabaseConnector, times(1))
      .findSitesByStationCodesAndStartTime(any(), eq(effectiveTime));
    verify(siteChanDatabaseConnector, times(1)).findSiteChansByStationCodeAndTime(any(), eq(effectiveTime));
    verify(channelGroupAssembler, times(1))
      .buildAll(eq(siteDaos), eq(siteChanDaos), any());
    verifyNoMoreMockInteractions();
  }
}
