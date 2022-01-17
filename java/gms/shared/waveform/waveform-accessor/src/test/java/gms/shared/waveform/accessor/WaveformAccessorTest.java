package gms.shared.waveform.accessor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.mock;

import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.frameworks.test.utils.containers.ZooTestContainer;
import gms.shared.stationdefinition.api.StationDefinitionAccessorInterface;
import gms.shared.stationdefinition.factory.StationDefinitionAccessorFactory;
import gms.shared.waveform.api.WaveformRepositoryInterface;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.testfixture.WaveformRequestTestFixtures;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import java.util.Collection;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@Disabled
//zookeeper has been removed 8/5/2021
class WaveformAccessorTest extends ZooTestContainer {
  public static final String CHANNELS = "channels";

  @Mock
  private StationDefinitionAccessorInterface stationDefinitionAccessorImpl;

  @Mock
  private StationDefinitionAccessorFactory stationDefinitionAccessorFactory;

  @Mock
  private WaveformRepositoryInterface waveformRepositoryInterface;

  @BeforeAll
  protected static void fixtureSetUp() {
    setUpContainer();
  }

  @AfterEach
  protected void testTeardown() {
    IgniteConnectionManager.close();
  }

  @AfterAll
  protected static void fixtureTeardown() {
    IgniteConnectionManager.close();
  }

  @Test
  void create() {
      assertNotNull(WaveformAccessor.create(systemConfig, waveformRepositoryInterface, stationDefinitionAccessorFactory));
  }

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(Class<? extends Exception> expectedException,
      SystemConfig systemConfig,
      WaveformRepositoryInterface waveformRepositoryInterface,
      StationDefinitionAccessorFactory stationDefinitionAccessorFactory) {
    assertThrows(NullPointerException.class,
        () -> WaveformAccessor.create(systemConfig, waveformRepositoryInterface, stationDefinitionAccessorFactory));
  }

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(
        arguments(NullPointerException.class, null, mock(WaveformRepositoryInterface.class), mock(StationDefinitionAccessorFactory.class)),
        arguments(NullPointerException.class, mock(SystemConfig.class), null, mock(StationDefinitionAccessorFactory.class)),
        arguments(NullPointerException.class, mock(SystemConfig.class), mock(WaveformRepositoryInterface.class), null));
  }

  @Test
  void findByChannelsAndTimeRange() {
    var request = WaveformRequestTestFixtures.channelTimeRangeRequest;

    Mockito.when(waveformRepositoryInterface.findByChannelsAndTimeRange(request.getChannels(), request.getStartTime(), request.getEndTime()))
        .thenReturn(List.of(WaveformTestFixtures.singleStationEpochStart100RandomSamples()));

    var waveformAccessor = WaveformAccessor.create(systemConfig, waveformRepositoryInterface, stationDefinitionAccessorFactory);
    Collection<ChannelSegment<Waveform>> returnChannelSegments =
        waveformAccessor.findByChannelsAndTimeRange(request.getChannels(), request.getStartTime(), request.getEndTime());

    assertEquals(1, returnChannelSegments.size(), "Incorrect number of channelSegments returned");
    assertTrue(returnChannelSegments.contains(WaveformTestFixtures.singleStationEpochStart100RandomSamples()),
        "Return list did not contain expected ChannelSegment");
  }

  @ParameterizedTest
  @MethodSource("getFindByChannelsTimeRangeAndFacetingDefinitionArguments")
  void findByChannelsTimeRangeAndFacetingDefinition(ChannelTimeRangeRequest request){

    Mockito.when(waveformRepositoryInterface.findByChannelsAndTimeRange(
        request.getChannels(), request.getStartTime(), request.getEndTime()))
        .thenReturn(List.of(WaveformTestFixtures.singleStationEpochStart100RandomSamples()));

    Mockito.when(stationDefinitionAccessorFactory.getBridgedStationDefinitionAccessorInstance())
        .thenReturn(stationDefinitionAccessorImpl);

    var waveformAccessor = WaveformAccessor.create(
        systemConfig, waveformRepositoryInterface, stationDefinitionAccessorFactory);
    Collection<ChannelSegment<Waveform>> returnChannelSegments =
        waveformAccessor.findByChannelsAndTimeRange(
            request.getChannels(), request.getStartTime(), request.getEndTime(), request.getFacetingDefinition().get());

    assertEquals(1, returnChannelSegments.size(), "Incorrect number of channelSegments returned");
    assertTrue(returnChannelSegments.contains(WaveformTestFixtures.singleStationEpochStart100RandomSamples()),
        "Return list did not contain expected ChannelSegment");
  }

  static Stream<Arguments> getFindByChannelsTimeRangeAndFacetingDefinitionArguments() {
    return Stream.of(
        arguments(WaveformRequestTestFixtures.facetedChannelTimeRangeRequest),
        arguments(WaveformRequestTestFixtures.facetedChannelTimeRangeRequest2));
  }

  @Test
  void findByChannelNamesAndSegmentDescriptor() {
    var request = WaveformRequestTestFixtures.channelSegmentDescriptorRequest;

    Mockito.when(waveformRepositoryInterface.findByChannelNamesAndSegmentDescriptor(
        request.getChannelSegmentDescriptors()))
        .thenReturn(List.of(WaveformTestFixtures.singleStationEpochStart100RandomSamples()));

    var waveformAccessor = WaveformAccessor.create(systemConfig, waveformRepositoryInterface, stationDefinitionAccessorFactory);
    Collection<ChannelSegment<Waveform>> returnChannelSegments =
        waveformAccessor.findByChannelNamesAndSegmentDescriptor(
            request.getChannelSegmentDescriptors());

    assertEquals(1, returnChannelSegments.size(), "Incorrect number of channelSegments returned");
    assertTrue(returnChannelSegments.contains(WaveformTestFixtures.singleStationEpochStart100RandomSamples()),
        "Return list did not contain expected ChannelSegment");
  }

  @Test
  void findByChannelNamesAndSegmentDescriptorAndFacetingDefinition() {
    var request= WaveformRequestTestFixtures.facetedChannelSegmentDescriptorRequest;

    Mockito.when(waveformRepositoryInterface.findByChannelNamesAndSegmentDescriptor(
        request.getChannelSegmentDescriptors()))
        .thenReturn(List.of(WaveformTestFixtures.singleStationEpochStart100RandomSamples()));

    Mockito.when(stationDefinitionAccessorFactory.getBridgedStationDefinitionAccessorInstance())
        .thenReturn(stationDefinitionAccessorImpl);

    var waveformAccessor = WaveformAccessor.create(systemConfig, waveformRepositoryInterface, stationDefinitionAccessorFactory);
    Collection<ChannelSegment<Waveform>> returnChannelSegments =
        waveformAccessor.findByChannelNamesAndSegmentDescriptor(
            request.getChannelSegmentDescriptors(),
            request.getFacetingDefinition().get());

    assertEquals(1, returnChannelSegments.size(), "Incorrect number of channelSegments returned");
    assertTrue(returnChannelSegments.contains(WaveformTestFixtures.singleStationEpochStart100RandomSamples()),
        "Return list did not contain expected ChannelSegment");
  }
}