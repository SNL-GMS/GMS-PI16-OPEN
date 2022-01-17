package gms.shared.stationdefinition.cache;

import gms.shared.stationdefinition.api.StationDefinitionAccessorInterface;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.station.Station;
import org.hibernate.JDBCException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mockito;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_GROUP;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION_GROUP;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.reset;

class CachePopulatorTest {

  private static final List<String> STATION_GROUP_NAMES = List.of(STATION_GROUP.getName());
  private static final Duration PERIOD_START = Duration.ofMinutes(5);
  private static final Duration PERIOD_END = Duration.ofMinutes(0);

  private static StationDefinitionAccessorInterface stationDefinitionAccessor;

  private static CachePopulator cachePopulator;

  @BeforeAll
  static void setup() {
    stationDefinitionAccessor = mock(StationDefinitionAccessorInterface.class);
    cachePopulator = CachePopulator.create(stationDefinitionAccessor);
  }

  @AfterEach
  void resetMocks() {
    reset(stationDefinitionAccessor);
  }

  @Test
  void testCreateValidation() {
    assertThrows(NullPointerException.class, () -> CachePopulator.create(null));
  }

  @Test
  void testCreate() {
    CachePopulator cachePopulator = assertDoesNotThrow(() -> CachePopulator.create(stationDefinitionAccessor));
    assertNotNull(cachePopulator);
  }

  @ParameterizedTest
  @MethodSource("getPopulateValidationArguments")
  void testPopulateValidation(Class<? extends Exception> expectedException,
    List<String> stationGroupNames,
    Duration periodStart,
    Duration periodEnd) {
    assertThrows(expectedException, () -> cachePopulator.populate(stationGroupNames, periodStart, periodEnd));
  }

  static Stream<Arguments> getPopulateValidationArguments() {
    return Stream.of(
      arguments(NullPointerException.class,
        null,
        PERIOD_START,
        PERIOD_END),
      arguments(NullPointerException.class,
        null,
        PERIOD_START,
        PERIOD_END),
      arguments(NullPointerException.class,
        STATION_GROUP_NAMES,
        null,
        PERIOD_END),
      arguments(NullPointerException.class,
        STATION_GROUP_NAMES,
        PERIOD_START,
        null),
      arguments(IllegalStateException.class,
        STATION_GROUP_NAMES,
        Duration.ofMinutes(-5),
        PERIOD_END),
      arguments(IllegalStateException.class,
        STATION_GROUP_NAMES,
        PERIOD_START,
        Duration.ofMinutes(-5)),
      arguments(IllegalStateException.class,
        STATION_GROUP_NAMES,
        PERIOD_START,
        PERIOD_START),
      arguments(IllegalStateException.class,
        STATION_GROUP_NAMES,
        PERIOD_END,
        PERIOD_START));
  }

  @Test
  void testPopulate() {
    when(stationDefinitionAccessor.findStationGroupsByNameAndTimeRange(eq(STATION_GROUP_NAMES), any(), any()))
      .thenReturn(List.of(STATION_GROUP));
    List<String> stationNames = STATION_GROUP.getStations().stream()
      .map(Station::getName)
      .collect(Collectors.toList());
    when(stationDefinitionAccessor.findStationsByNameAndTimeRange(eq(stationNames), any(), any()))
      .thenReturn(List.of(STATION));
    List<String> channelGroupNames = STATION.getChannelGroups().stream()
      .map(ChannelGroup::getName)
      .collect(Collectors.toList());
    when(stationDefinitionAccessor.findChannelGroupsByNameAndTimeRange(eq(channelGroupNames), any(), any()))
      .thenReturn(List.of(CHANNEL_GROUP));
    List<String> channelNames = CHANNEL_GROUP.getChannels().stream()
      .map(Channel::getName)
      .collect(Collectors.toList());
    when(stationDefinitionAccessor.findChannelsByNameAndTimeRange(eq(channelNames), any(), any()))
      .thenReturn(List.of(CHANNEL));

    cachePopulator.populate(STATION_GROUP_NAMES, PERIOD_START, PERIOD_END);
    verify(stationDefinitionAccessor, times(1)).cache(eq(STATION_GROUP_NAMES), any(), any());
    verifyNoMoreInteractions(stationDefinitionAccessor);
  }

  @Test
  @Disabled("this test takes several minutes to complete.  Re-enable when retry policy is configurable")
  void testPopulateRetry() {
    when(stationDefinitionAccessor.findStationGroupsByNameAndTimeRange(eq(STATION_GROUP_NAMES), any(), any()))
      .thenThrow(JDBCException.class);

    cachePopulator.populate(STATION_GROUP_NAMES, PERIOD_START, PERIOD_END);

    verify(stationDefinitionAccessor, times(10)).findStationGroupsByNameAndTimeRange(eq(STATION_GROUP_NAMES), any(), any());
    verifyNoMoreInteractions(stationDefinitionAccessor);
  }
}