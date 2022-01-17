package gms.shared.stationdefinition.accessor;

import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.control.ControlContext;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.api.StationDefinitionAccessorInterface;
import gms.shared.stationdefinition.api.channel.util.ChannelGroupsTimeFacetRequest;
import gms.shared.stationdefinition.api.channel.util.ChannelGroupsTimeRangeRequest;
import gms.shared.stationdefinition.api.channel.util.ChannelsTimeFacetRequest;
import gms.shared.stationdefinition.api.channel.util.ChannelsTimeRangeRequest;
import gms.shared.stationdefinition.api.channel.util.ResponseTimeFacetRequest;
import gms.shared.stationdefinition.api.channel.util.ResponseTimeRangeRequest;
import gms.shared.stationdefinition.api.station.util.StationGroupsTimeFacetRequest;
import gms.shared.stationdefinition.api.station.util.StationGroupsTimeRangeRequest;
import gms.shared.stationdefinition.api.station.util.StationsTimeFacetRequest;
import gms.shared.stationdefinition.api.station.util.StationsTimeRangeRequest;
import gms.shared.stationdefinition.api.util.TimeRangeRequest;
import gms.shared.stationdefinition.cache.CachePopulator;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.database.connector.factory.StationDefinitionDatabaseConnectorFactory;
import gms.shared.stationdefinition.factory.StationDefinitionAccessorFactory;
import gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.runner.RunWith;
import org.mockito.MockedStatic;
import org.mockito.junit.MockitoJUnitRunner;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.persistence.EntityManagerFactory;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static gms.shared.stationdefinition.accessor.StationDefinitionManager.OPERATIONAL_TIME_PERIOD_CONFIG;
import static gms.shared.stationdefinition.accessor.StationDefinitionManager.STATION_GROUP_NAMES_CONFIG;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_GROUP;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.RESPONSE;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION_GROUP;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@RunWith(MockitoJUnitRunner.class)
@ExtendWith(MockitoExtension.class)
@Disabled("interactions with java 11 memory model, gradle threading, and mockito static mocking need to be resolved")
class StationDefinitionManagerTest {

  private static final Map<String, Duration> OPERATIONAL_TIME_RANGE =
    Map.of("operationalPeriodStart", Duration.ofMinutes(5),
      "operationalPeriodEnd", Duration.ofMinutes(0));

  static final String SCHEMA = "schema";
  static final String DEFAULT_SCHEMA = "GNEM_GMS";

  private static final TimeRangeRequest TIME_RANGE_REQUEST = TimeRangeRequest.builder()
    .setStartTime(Instant.EPOCH)
    .setEndTime(Instant.EPOCH.plus(5, ChronoUnit.MINUTES))
    .build();

  private static final List<String> STATION_GROUP_NAMES = List.of(STATION_GROUP.getName());

  private static final List<StationGroup> EXPECTED_STATION_GROUPS = List.of(STATION_GROUP);
  private static final List<Station> EXPECTED_STATIONS = List.of(STATION);
  private static final List<ChannelGroup> EXPECTED_CHANNEL_GROUPS = List.of(CHANNEL_GROUP);
  private static final List<Channel> EXPECTED_CHANNELS = List.of(CHANNEL);
  private static final List<Response> EXPECTED_RESPONSES = List.of(RESPONSE);

  private static StationDefinitionManager stationDefinitionManager;

  private static StationDefinitionAccessorInterface requestCacheAccessor;
  private static StationDefinitionAccessorInterface entityCacheAccessor;
  private static StationDefinitionAccessorInterface stationDefinitionAccessor;
  private final UUID RESPONSE_ID = UUID.nameUUIDFromBytes("TEST RESPONSE".getBytes());

  private static final ControlContext controlContext = mock(ControlContext.class);

  @BeforeAll
  static void setUpStatics() {
    SystemConfig systemConfig = mock(SystemConfig.class);
    ConfigurationConsumerUtility configurationConsumerUtility = mock(ConfigurationConsumerUtility.class);
    BridgedEntityManagerFactoryProvider bridgedEMFProvider = mock(BridgedEntityManagerFactoryProvider.class);
    EntityManagerFactory entityManagerFactory = mock(EntityManagerFactory.class);

    when(controlContext.getSystemConfig()).thenReturn(systemConfig);
    when(systemConfig.getValue(eq(SCHEMA))).thenReturn(DEFAULT_SCHEMA);
    when(controlContext.getProcessingConfigurationConsumerUtility()).thenReturn(configurationConsumerUtility);

    MockedStatic<BridgedEntityManagerFactoryProvider> createEmfMock = mockStatic(BridgedEntityManagerFactoryProvider.class);
    createEmfMock.when(() -> BridgedEntityManagerFactoryProvider.create(DEFAULT_SCHEMA)).thenReturn(bridgedEMFProvider);
    when(bridgedEMFProvider.getEntityManagerFactory("gms_station_definition", systemConfig))
        .thenReturn(entityManagerFactory);
    when(bridgedEMFProvider.getEntityManagerFactory(any(), systemConfig)).thenReturn(entityManagerFactory);

    StationDefinitionDatabaseConnectorFactory databaseConnectorFactory =
      mock(StationDefinitionDatabaseConnectorFactory.class);
    MockedStatic<StationDefinitionDatabaseConnectorFactory> createDatabaseConnectorFactoryMock =
      mockStatic(StationDefinitionDatabaseConnectorFactory.class);
    createDatabaseConnectorFactoryMock.when(() -> StationDefinitionDatabaseConnectorFactory.create(entityManagerFactory))
      .thenReturn(databaseConnectorFactory);

    StationDefinitionAccessorFactory accessorFactory = mock(StationDefinitionAccessorFactory.class);
    MockedStatic<StationDefinitionAccessorFactory> createAccessorFactoryMock =
      mockStatic(StationDefinitionAccessorFactory.class);
    createAccessorFactoryMock
      .when(() -> StationDefinitionAccessorFactory.create(databaseConnectorFactory))
      .thenReturn(accessorFactory);

    requestCacheAccessor = mock(StationDefinitionAccessorInterface.class);
    entityCacheAccessor = mock(StationDefinitionAccessorInterface.class);
    stationDefinitionAccessor = mock(StationDefinitionAccessorInterface.class);
    when(accessorFactory.getRequestCacheInstance(any(), any())).thenReturn(requestCacheAccessor);
    when(accessorFactory.getEntityCacheInstance(any(), any())).thenReturn(entityCacheAccessor);
    when(accessorFactory.getBridgedStationDefinitionAccessorInstance()).thenReturn(stationDefinitionAccessor);

    when(configurationConsumerUtility.resolve(eq(STATION_GROUP_NAMES_CONFIG), any(), any()))
      .thenReturn(STATION_GROUP_NAMES);
    when(configurationConsumerUtility.resolve(eq(OPERATIONAL_TIME_PERIOD_CONFIG), any(), any()))
      .thenReturn(OPERATIONAL_TIME_RANGE);

    CachePopulator cachePopulator = mock(CachePopulator.class);
    MockedStatic<CachePopulator> createCachePopulatorMock = mockStatic(CachePopulator.class);
    createCachePopulatorMock.when(() -> CachePopulator.create(stationDefinitionAccessor))
      .thenReturn(cachePopulator);

    stationDefinitionManager = StationDefinitionManager.create(controlContext);

    createEmfMock.close();
    createDatabaseConnectorFactoryMock.close();
    createAccessorFactoryMock.close();
  }

  @AfterEach
  void resetMocks() {
    reset(stationDefinitionAccessor);
  }

  @Test
  void testCreateValidation() {
    assertThrows(NullPointerException.class,
      () -> StationDefinitionManager.create(null));
  }

  @Test
  void testCreateNonNull(){
    StationDefinitionManager stationDefinitionManager = StationDefinitionManager.create(controlContext);
    assertNotNull(stationDefinitionManager);
  }

  @Test void testCreateTwice(){
    StationDefinitionManager stationDefinitionManager = StationDefinitionManager.create(controlContext);
    stationDefinitionManager = StationDefinitionManager.create(controlContext);
    assertNotNull(stationDefinitionManager);
  }

  @Test
  void testFindStationGroupsByNameValidation() {
    assertThrows(NullPointerException.class,
      () -> stationDefinitionManager.findStationGroupsByName(null));
  }

  @ParameterizedTest
  @MethodSource("getFindStationGroupsByNameArguments")
  void testFindStationGroupsByName(Consumer<StationGroupsTimeFacetRequest> accessorMockSetup,
    Consumer<StationGroupsTimeFacetRequest> accessorMockVerification,
    StationGroupsTimeFacetRequest request,
    List<StationGroup> expected) {

    accessorMockSetup.accept(request);
    List<StationGroup> actual = stationDefinitionManager.findStationGroupsByName(request);
    assertEquals(expected, actual);
    accessorMockVerification.accept(request);
  }

  static Stream<Arguments> getFindStationGroupsByNameArguments() {
    StationGroupsTimeFacetRequest nameRequest = StationGroupsTimeFacetRequest.builder()
      .addStationGroupName("TEST")
      .build();
    Consumer<StationGroupsTimeFacetRequest> nameSetup =
      request -> when(stationDefinitionAccessor.findStationGroupsByNameAndTime(eq(request.getStationGroupNames()), any()))
        .thenReturn(EXPECTED_STATION_GROUPS);
    Consumer<StationGroupsTimeFacetRequest> nameVerification = request -> {
      verify(stationDefinitionAccessor, times(1))
        .findStationGroupsByNameAndTime(eq(request.getStationGroupNames()), any());
      verifyNoMoreInteractions(stationDefinitionAccessor);
    };

    StationGroupsTimeFacetRequest nameTimeRequest = nameRequest.toBuilder()
      .setEffectiveTime(Instant.EPOCH)
      .build();
    Consumer<StationGroupsTimeFacetRequest> nameTimeSetup =
      request -> when(stationDefinitionAccessor.findStationGroupsByNameAndTime(request.getStationGroupNames(),
        request.getEffectiveTime().orElseThrow()))
        .thenReturn(EXPECTED_STATION_GROUPS);
    Consumer<StationGroupsTimeFacetRequest> nameTimeVerification = request -> {
      verify(stationDefinitionAccessor, times(1))
        .findStationGroupsByNameAndTime(request.getStationGroupNames(),
          request.getEffectiveTime().orElseThrow());
      verifyNoMoreInteractions(stationDefinitionAccessor);
    };

    StationGroupsTimeFacetRequest nameTimeFacetRequest = nameTimeRequest.toBuilder()
      .setFacetingDefinition(FacetingDefinition.builder()
        .setClassType("StationGroup")
        .setPopulated(true)
        .build())
      .build();
    Consumer<StationGroupsTimeFacetRequest> nameTimeFacetSetup =
      request -> when(stationDefinitionAccessor.findStationGroupsByNameAndTime(request.getStationGroupNames(),
        request.getEffectiveTime().orElseThrow(),
        request.getFacetingDefinition().orElseThrow()))
        .thenReturn(EXPECTED_STATION_GROUPS);
    Consumer<StationGroupsTimeFacetRequest> nameTimeFacetVerification = request -> {
      verify(stationDefinitionAccessor).findStationGroupsByNameAndTime(request.getStationGroupNames(),
        request.getEffectiveTime().orElseThrow(),
        request.getFacetingDefinition().orElseThrow());
      verifyNoMoreInteractions(stationDefinitionAccessor);
    };

    StationGroupsTimeFacetRequest nameFacetRequest = nameTimeFacetRequest.toBuilder()
      .setEffectiveTime(Optional.empty())
      .build();
    Consumer<StationGroupsTimeFacetRequest> nameFacetSetup =
      request -> when(stationDefinitionAccessor.findStationGroupsByNameAndTime(eq(request.getStationGroupNames()),
        any(),
        eq(request.getFacetingDefinition().orElseThrow())))
        .thenReturn(EXPECTED_STATION_GROUPS);
    Consumer<StationGroupsTimeFacetRequest> nameFacetVerification = request -> {
      verify(stationDefinitionAccessor, times(1)).findStationGroupsByNameAndTime(eq(request.getStationGroupNames()),
        any(),
        eq(request.getFacetingDefinition().orElseThrow()));
    };
    return Stream.of(
      arguments(nameSetup, nameVerification, nameRequest, EXPECTED_STATION_GROUPS),
      arguments(nameTimeSetup, nameTimeVerification, nameTimeRequest, EXPECTED_STATION_GROUPS),
      arguments(nameTimeFacetSetup, nameTimeFacetVerification, nameTimeFacetRequest, EXPECTED_STATION_GROUPS),
      arguments(nameFacetSetup, nameFacetVerification, nameFacetRequest, EXPECTED_STATION_GROUPS)
    );
  }

  @Test
  void testFindStationGroupsByNameAndTimeRangeValidation() {
    assertThrows(NullPointerException.class,
      () -> stationDefinitionManager.findStationGroupsByNameAndTimeRange(null));
  }

  @Test
  void testFindStationGroupsByNameAndTimeRange() {
    StationGroupsTimeRangeRequest request = StationGroupsTimeRangeRequest.builder()
      .addStationGroupName("TEST")
      .setTimeRange(TIME_RANGE_REQUEST)
      .build();
    when(stationDefinitionAccessor.findStationGroupsByNameAndTimeRange(request.getStationGroupNames(),
      request.getTimeRange().getStartTime(),
      request.getTimeRange().getEndTime()))
      .thenReturn(EXPECTED_STATION_GROUPS);
    List<StationGroup> actual = stationDefinitionManager.findStationGroupsByNameAndTimeRange(request);
    assertEquals(EXPECTED_STATION_GROUPS, actual);
    verify(stationDefinitionAccessor).findStationGroupsByNameAndTimeRange(request.getStationGroupNames(),
      request.getTimeRange().getStartTime(),
      request.getTimeRange().getEndTime());
  }

  @Test
  void testFindStationsByNameValidation() {
    assertThrows(NullPointerException.class, () -> stationDefinitionManager.findStationsByName(null));
  }

  @ParameterizedTest
  @MethodSource("getFindStationByNameArguments")
  void testFindStationsByName(Consumer<StationsTimeFacetRequest> accessorMockSetup,
    Consumer<StationsTimeFacetRequest> accessorMockVerification,
    StationsTimeFacetRequest request,
    List<Station> expected) {
    accessorMockSetup.accept(request);
    List<Station> actual = stationDefinitionManager.findStationsByName(request);
    assertEquals(expected, actual);
    accessorMockVerification.accept(request);
  }

  static Stream<Arguments> getFindStationByNameArguments() {
    StationsTimeFacetRequest nameRequest = StationsTimeFacetRequest.builder()
      .addStationName("TEST")
      .build();
    Consumer<StationsTimeFacetRequest> nameSetup =
      request -> when(stationDefinitionAccessor.findStationsByNameAndTime(eq(request.getStationNames()), any()))
        .thenReturn(EXPECTED_STATIONS);
    Consumer<StationsTimeFacetRequest> nameVerification = request -> {
      verify(stationDefinitionAccessor, times(1))
        .findStationsByNameAndTime(eq(request.getStationNames()), any());
      verifyNoMoreInteractions(stationDefinitionAccessor);
    };

    StationsTimeFacetRequest nameTimeRequest = nameRequest.toBuilder()
      .setEffectiveTime(Instant.EPOCH)
      .build();
    Consumer<StationsTimeFacetRequest> nameTimeSetup =
      request -> when(stationDefinitionAccessor.findStationsByNameAndTime(request.getStationNames(),
        request.getEffectiveTime().orElseThrow()))
        .thenReturn(EXPECTED_STATIONS);
    Consumer<StationsTimeFacetRequest> nameTimeVerification = request -> {
      verify(stationDefinitionAccessor, times(1))
        .findStationsByNameAndTime(request.getStationNames(), request.getEffectiveTime().orElseThrow());
      verifyNoMoreInteractions(stationDefinitionAccessor);
    };

    StationsTimeFacetRequest nameTimeFacetRequest = nameTimeRequest.toBuilder()
      .setFacetingDefinition(FacetingDefinition.builder()
        .setClassType("Station")
        .setPopulated(true)
        .build())
      .build();
    Consumer<StationsTimeFacetRequest> nameTimeFacetSetup =
      request -> when(stationDefinitionAccessor.findStationsByNameAndTime(request.getStationNames(),
        request.getEffectiveTime().orElseThrow(),
        request.getFacetingDefinition().orElseThrow()))
        .thenReturn(EXPECTED_STATIONS);
    Consumer<StationsTimeFacetRequest> nameTimeFacetVerification = request -> {
      verify(stationDefinitionAccessor, times(1)).findStationsByNameAndTime(request.getStationNames(),
        request.getEffectiveTime().orElseThrow(),
        request.getFacetingDefinition().orElseThrow());
      verifyNoMoreInteractions(stationDefinitionAccessor);
    };

    StationsTimeFacetRequest nameFacetRequest = nameTimeFacetRequest.toBuilder()
      .setEffectiveTime(Optional.empty())
      .build();
    Consumer<StationsTimeFacetRequest> nameFacetSetup =
      request -> when(stationDefinitionAccessor.findStationsByNameAndTime(eq(request.getStationNames()),
        any(),
        eq(request.getFacetingDefinition().orElseThrow())))
        .thenReturn(EXPECTED_STATIONS);
    Consumer<StationsTimeFacetRequest> nameFacetVerification = request -> {
      verify(stationDefinitionAccessor, times(1))
        .findStationsByNameAndTime(eq(request.getStationNames()),
          any(),
          eq(request.getFacetingDefinition().orElseThrow()));
      verifyNoMoreInteractions(stationDefinitionAccessor);
    };
    return Stream.of(arguments(nameSetup, nameVerification, nameRequest, EXPECTED_STATIONS),
      arguments(nameTimeSetup, nameTimeVerification, nameTimeRequest, EXPECTED_STATIONS),
      arguments(nameTimeFacetSetup, nameTimeFacetVerification, nameTimeFacetRequest, EXPECTED_STATIONS),
      arguments(nameFacetSetup, nameFacetVerification, nameFacetRequest, EXPECTED_STATIONS));
  }

  @Test
  void testFindStationsByNameAndTimeRangeValidation() {
    assertThrows(NullPointerException.class, () -> stationDefinitionManager.findStationsByNameAndTimeRange(null));
  }

  @Test
  void testFindStationsByNameAndTimeRange() {
    StationsTimeRangeRequest request = StationsTimeRangeRequest.builder()
      .addStationName("TEST")
      .setTimeRange(TIME_RANGE_REQUEST)
      .build();

    when(stationDefinitionAccessor.findStationsByNameAndTimeRange(request.getStationNames(),
      request.getTimeRange().getStartTime(),
      request.getTimeRange().getEndTime()))
      .thenReturn(EXPECTED_STATIONS);
    List<Station> actual = stationDefinitionManager.findStationsByNameAndTimeRange(request);
    assertEquals(EXPECTED_STATIONS, actual);
    verify(stationDefinitionAccessor, times(1)).findStationsByNameAndTimeRange(request.getStationNames(),
      request.getTimeRange().getStartTime(),
      request.getTimeRange().getEndTime());
    verifyNoMoreInteractions(stationDefinitionAccessor);
  }

  @Test
  void testFindChannelGroupsByNameValidation() {
    assertThrows(NullPointerException.class, () -> stationDefinitionManager.findChannelGroupsByName(null));
  }

  @ParameterizedTest
  @MethodSource("getFindChannelGroupsByNameArguments")
  void testFindChannelGroupsByName(Consumer<ChannelGroupsTimeFacetRequest> accessorMockSetup,
    Consumer<ChannelGroupsTimeFacetRequest> accessorMockVerification,
    ChannelGroupsTimeFacetRequest request,
    List<ChannelGroup> expected) {
    accessorMockSetup.accept(request);
    List<ChannelGroup> actual = stationDefinitionManager.findChannelGroupsByName(request);
    assertEquals(expected, actual);
    accessorMockVerification.accept(request);
  }

  static Stream<Arguments> getFindChannelGroupsByNameArguments() {
    ChannelGroupsTimeFacetRequest nameRequest = ChannelGroupsTimeFacetRequest.builder()
      .addChannelGroupName("TEST")
      .build();
    Consumer<ChannelGroupsTimeFacetRequest> nameSetup =
      request -> when(stationDefinitionAccessor
        .findChannelGroupsByNameAndTime(eq(request.getChannelGroupNames()), any()))
        .thenReturn(EXPECTED_CHANNEL_GROUPS);
    Consumer<ChannelGroupsTimeFacetRequest> nameVerification = request -> {
      verify(stationDefinitionAccessor, times(1))
        .findChannelGroupsByNameAndTime(eq(request.getChannelGroupNames()), any());
      verifyNoMoreInteractions(stationDefinitionAccessor);
    };

    ChannelGroupsTimeFacetRequest nameTimeRequest = nameRequest.toBuilder()
      .setEffectiveTime(Instant.EPOCH)
      .build();
    Consumer<ChannelGroupsTimeFacetRequest> nameTimeSetup =
      request -> when(stationDefinitionAccessor.findChannelGroupsByNameAndTime(request.getChannelGroupNames(),
        request.getEffectiveTime().orElseThrow()))
        .thenReturn(EXPECTED_CHANNEL_GROUPS);
    Consumer<ChannelGroupsTimeFacetRequest> nameTimeVerification = request -> {
      verify(stationDefinitionAccessor, times(1))
        .findChannelGroupsByNameAndTime(request.getChannelGroupNames(), request.getEffectiveTime().orElseThrow());
      verifyNoMoreInteractions(stationDefinitionAccessor);
    };

    ChannelGroupsTimeFacetRequest nameTimeFacetRequest = nameTimeRequest.toBuilder()
      .setFacetingDefinition(FacetingDefinition.builder()
        .setClassType("ChannelGroup")
        .setPopulated(true)
        .build())
      .build();
    Consumer<ChannelGroupsTimeFacetRequest> nameTimeFacetSetup =
      request -> when(stationDefinitionAccessor.findChannelGroupsByNameAndTime(request.getChannelGroupNames(),
        request.getEffectiveTime().orElseThrow(),
        request.getFacetingDefinition().orElseThrow()))
        .thenReturn(EXPECTED_CHANNEL_GROUPS);
    Consumer<ChannelGroupsTimeFacetRequest> nameTimeFacetVerification = request -> {
      verify(stationDefinitionAccessor, times(1)).findChannelGroupsByNameAndTime(request.getChannelGroupNames(),
        request.getEffectiveTime().orElseThrow(),
        request.getFacetingDefinition().orElseThrow());
      verifyNoMoreInteractions(stationDefinitionAccessor);
    };

    ChannelGroupsTimeFacetRequest nameFacetRequest = nameTimeFacetRequest.toBuilder()
      .setEffectiveTime(Optional.empty())
      .build();
    Consumer<ChannelGroupsTimeFacetRequest> nameFacetSetup =
      request -> when(stationDefinitionAccessor.findChannelGroupsByNameAndTime(eq(request.getChannelGroupNames()),
        any(),
        eq(request.getFacetingDefinition().orElseThrow())))
        .thenReturn(EXPECTED_CHANNEL_GROUPS);
    Consumer<ChannelGroupsTimeFacetRequest> nameFacetVerification = request -> {
      verify(stationDefinitionAccessor, times(1)).findChannelGroupsByNameAndTime(eq(request.getChannelGroupNames()),
        any(),
        eq(request.getFacetingDefinition().orElseThrow()));
      verifyNoMoreInteractions(stationDefinitionAccessor);
    };

    return Stream.of(arguments(nameSetup, nameVerification, nameRequest, EXPECTED_CHANNEL_GROUPS),
      arguments(nameTimeSetup, nameTimeVerification, nameTimeRequest, EXPECTED_CHANNEL_GROUPS),
      arguments(nameTimeFacetSetup, nameTimeFacetVerification, nameTimeFacetRequest, EXPECTED_CHANNEL_GROUPS),
      arguments(nameFacetSetup, nameFacetVerification, nameFacetRequest, EXPECTED_CHANNEL_GROUPS));
  }

  @Test
  void testFindChannelGroupsByNameAndTimeRangeValidation() {
    assertThrows(NullPointerException.class, () -> stationDefinitionManager.findChannelGroupsByNameAndTimeRange(null));
  }

  @Test
  void testFindChannelGroupsByNameAndTimeRange() {
    ChannelGroupsTimeRangeRequest request = ChannelGroupsTimeRangeRequest.builder()
      .addChannelGroupName("TEST")
      .setTimeRange(TIME_RANGE_REQUEST)
      .build();
    when(stationDefinitionAccessor.findChannelGroupsByNameAndTimeRange(request.getChannelGroupNames(),
      request.getTimeRange().getStartTime(),
      request.getTimeRange().getEndTime()))
      .thenReturn(EXPECTED_CHANNEL_GROUPS);
    List<ChannelGroup> actual = stationDefinitionManager.findChannelGroupsByNameAndTimeRange(request);
    verify(stationDefinitionAccessor, times(1)).findChannelGroupsByNameAndTimeRange(request.getChannelGroupNames(),
      request.getTimeRange().getStartTime(),
      request.getTimeRange().getEndTime());
    verifyNoMoreInteractions(stationDefinitionAccessor);
  }

  @Test
  void testFindChannelsValidation() {
    assertThrows(NullPointerException.class, () -> stationDefinitionManager.findChannels(null));
  }

  @ParameterizedTest
  @MethodSource("getFindChannelsArguments")
  void testFindChannels(Consumer<ChannelsTimeFacetRequest> accessorMockSetup,
    Consumer<ChannelsTimeFacetRequest> accessorMockVerification,
    ChannelsTimeFacetRequest request,
    List<Channel> expected) {
    accessorMockSetup.accept(request);
    List<Channel> actual = stationDefinitionManager.findChannels(request);
    assertEquals(expected, actual);
    accessorMockVerification.accept(request);
  }

  static Stream<Arguments> getFindChannelsArguments() {
    ChannelsTimeFacetRequest nameRequest = ChannelsTimeFacetRequest.builder()
      .addChannelGroupName("TEST")
      .build();
    Consumer<ChannelsTimeFacetRequest> nameSetup =
      request -> when(stationDefinitionAccessor.findChannelsByNameAndTime(eq(request.getChannelNames()), any()))
        .thenReturn(EXPECTED_CHANNELS);
    Consumer<ChannelsTimeFacetRequest> nameVerification = request -> {
      verify(stationDefinitionAccessor, times(1)).findChannelsByNameAndTime(eq(request.getChannelNames()), any());
      verifyNoMoreInteractions(stationDefinitionAccessor);
    };

    ChannelsTimeFacetRequest nameTimeRequest = nameRequest.toBuilder()
      .setEffectiveTime(Instant.EPOCH)
      .build();
    Consumer<ChannelsTimeFacetRequest> nameTimeSetup =
      request -> when(stationDefinitionAccessor.findChannelsByNameAndTime(request.getChannelNames(),
        request.getEffectiveTime().orElseThrow()))
        .thenReturn(EXPECTED_CHANNELS);
    Consumer<ChannelsTimeFacetRequest> nameTimeVerification = request -> {
      verify(stationDefinitionAccessor, times(1)).findChannelsByNameAndTime(request.getChannelNames(),
        request.getEffectiveTime().orElseThrow());
      verifyNoMoreInteractions(stationDefinitionAccessor);
    };

    ChannelsTimeFacetRequest nameTimeFacetRequest = nameTimeRequest.toBuilder()
      .setFacetingDefinition(FacetingDefinition.builder()
        .setClassType("Channel")
        .setPopulated(true)
        .build())
      .build();
    Consumer<ChannelsTimeFacetRequest> nameTimeFacetSetup =
      request -> when(stationDefinitionAccessor.findChannelsByNameAndTime(request.getChannelNames(),
        request.getEffectiveTime().orElseThrow(),
        request.getFacetingDefinition().orElseThrow()))
        .thenReturn(EXPECTED_CHANNELS);
    Consumer<ChannelsTimeFacetRequest> nameTimeFacetVerification = request -> {
      verify(stationDefinitionAccessor, times(1)).findChannelsByNameAndTime(request.getChannelNames(),
        request.getEffectiveTime().orElseThrow(),
        request.getFacetingDefinition().orElseThrow());
    };
    ChannelsTimeFacetRequest nameFacetRequest = nameTimeFacetRequest.toBuilder()
      .setEffectiveTime(Optional.empty())
      .build();
    Consumer<ChannelsTimeFacetRequest> nameFacetSetup =
      request -> when(stationDefinitionAccessor.findChannelsByNameAndTime(eq(request.getChannelNames()),
        any(),
        eq(request.getFacetingDefinition().orElseThrow())))
        .thenReturn(EXPECTED_CHANNELS);
    Consumer<ChannelsTimeFacetRequest> nameFacetVerification = request -> {
      verify(stationDefinitionAccessor, times(1)).findChannelsByNameAndTime(eq(request.getChannelNames()),
        any(),
        eq(request.getFacetingDefinition().orElseThrow()));
      verifyNoMoreInteractions(stationDefinitionAccessor);
    };

    return Stream.of(arguments(nameSetup, nameVerification, nameRequest, EXPECTED_CHANNELS),
      arguments(nameTimeSetup, nameTimeVerification, nameTimeRequest, EXPECTED_CHANNELS),
      arguments(nameTimeFacetSetup, nameTimeFacetVerification, nameTimeFacetRequest, EXPECTED_CHANNELS),
      arguments(nameFacetSetup, nameFacetVerification, nameFacetRequest, EXPECTED_CHANNELS));
  }

  @Test
  void testFindChannelsByNameAndTimeRangeValidation() {
    assertThrows(NullPointerException.class, () -> stationDefinitionManager.findChannelsByNameAndTimeRange(null));
  }

  @Test
  void testFindChannelsByNameAndTimeRange() {
    ChannelsTimeRangeRequest request = ChannelsTimeRangeRequest.builder()
      .addChannelName("TEST")
      .setTimeRange(TIME_RANGE_REQUEST)
      .build();

    when(stationDefinitionAccessor.findChannelsByNameAndTimeRange(request.getChannelNames(),
      request.getTimeRange().getStartTime(),
      request.getTimeRange().getEndTime()))
      .thenReturn(EXPECTED_CHANNELS);
    List<Channel> actual = stationDefinitionManager.findChannelsByNameAndTimeRange(request);
    assertEquals(EXPECTED_CHANNELS, actual);
    verify(stationDefinitionAccessor, times(1)).findChannelsByNameAndTimeRange(request.getChannelNames(),
      request.getTimeRange().getStartTime(),
      request.getTimeRange().getEndTime());
    verifyNoMoreInteractions(stationDefinitionAccessor);
  }

  @Test
  void testFindResponsesByIdValidation() {
    assertThrows(NullPointerException.class, () -> stationDefinitionManager.findResponsesById(null));
  }

  @Test
  void testFindResponsesById() {
    List<UUID> responseIds = List.of(RESPONSE_ID);
    ResponseTimeFacetRequest request = ResponseTimeFacetRequest.builder()
      .setResponseIds(responseIds)
      .build();
    List<Response> actual = stationDefinitionManager.findResponsesById(request);
    assertEquals(EXPECTED_RESPONSES, actual);
    verifyNoMoreInteractions(stationDefinitionAccessor);
  }

  @Test
  void testFindResponsesByIdAndTimeRange() {
    ResponseTimeRangeRequest request = ResponseTimeRangeRequest.builder()
      .setResponseIds(List.of(RESPONSE_ID))
      .setTimeRange(TIME_RANGE_REQUEST)
      .build();

    when(stationDefinitionAccessor.findResponsesByIdAndTimeRange(request.getResponseIds(),
      request.getTimeRange().getStartTime(),
      request.getTimeRange().getEndTime()))
      .thenReturn(EXPECTED_RESPONSES);
    List<Response> actual = stationDefinitionManager.findResponsesByIdAndTimeRange(request);
    assertEquals(EXPECTED_RESPONSES, actual);
    verify(stationDefinitionAccessor, times(1)).findResponsesByIdAndTimeRange(request.getResponseIds(),
      request.getTimeRange().getStartTime(),
      request.getTimeRange().getEndTime());
    verifyNoMoreInteractions(stationDefinitionAccessor);
  }

}
