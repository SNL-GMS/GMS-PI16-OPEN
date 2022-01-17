package gms.shared.waveform.accessor.utils.facet;

import static gms.shared.waveform.testfixture.WaveformTestFixtures.CHANNEL_SEGMENT_NO_CHANNEL_DATA;
import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.mock;

import gms.shared.stationdefinition.api.StationDefinitionAccessorInterface;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.waveform.api.WaveformRepositoryInterface;
import gms.shared.waveform.api.facet.WaveformFacetingUtility;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.testfixture.WaveformRequestTestFixtures;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WaveformFacetingUtilityTest {

  @Mock
  private WaveformRepositoryInterface waveformAccessor;

  @Mock
  private StationDefinitionAccessorInterface stationDefinitionAccessorImpl;

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(Class<? extends Exception> expectedException,
      WaveformRepositoryInterface waveformAccessor,
    StationDefinitionAccessorInterface stationDefinitionAccessorImpl) {
    assertThrows(NullPointerException.class,
        () -> WaveformFacetingUtility
            .create(waveformAccessor, stationDefinitionAccessorImpl));
  }

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(
        arguments(NullPointerException.class, null, mock(StationDefinitionAccessorInterface.class)),
        arguments(NullPointerException.class, mock(WaveformRepositoryInterface.class), null));
  }
  
  @ParameterizedTest
  @MethodSource("getPopulateFacetsValidationArguments")
  void testPopulateFacetsValidation(Class<? extends Exception> expectedException,
      ChannelSegment<Waveform> initialChannelSegment,
      FacetingDefinition facetingDefinition) {
    WaveformFacetingUtility facetingUtil = WaveformFacetingUtility.create(waveformAccessor, stationDefinitionAccessorImpl);

    assertThrows(expectedException,
        () -> facetingUtil.populateFacets(initialChannelSegment, facetingDefinition));
  }

  static Stream<Arguments> getPopulateFacetsValidationArguments() {
    FacetingDefinition invalidBase = FacetingDefinition.builder()
        .setClassType("Channel")
        .setPopulated(true)
        .build();
    FacetingDefinition invalidPopulatedState = FacetingDefinition.builder()
        .setClassType("ChannelSegment")
        .setPopulated(false)
        .build();
    FacetingDefinition invalidInnerState = FacetingDefinition
        .builder()
        .setClassType("ChannelSegment")
        .setPopulated(true)
        .setFacetingDefinitions(Map.of("id.Channel", FacetingDefinition.builder()
            .setClassType("ChannelBlah")
            .setPopulated(true)
            .build())
        ).build();
    FacetingDefinition invalidFacetingKey = FacetingDefinition
        .builder()
        .setClassType("ChannelSegment")
        .setPopulated(true)
        .setFacetingDefinitions(Map.of("Blah", FacetingDefinition.builder()
            .setClassType("Channel")
            .setPopulated(true)
            .build())
        ).build();
    FacetingDefinition invalidNumberFacetingDef = FacetingDefinition
        .builder()
        .setClassType("ChannelSegment")
        .setPopulated(true)
        .setFacetingDefinitions(Map.of("id.Channel", FacetingDefinition.builder()
            .setClassType("Channel").setPopulated(true)
            .build(), "id.Channel2", FacetingDefinition.builder()
                .setClassType("Channel")
                .setPopulated(true)
                .build())
        ).build();

    return Stream.of(
        arguments(NullPointerException.class, null, mock(FacetingDefinition.class)),
        arguments(NullPointerException.class, mock(ChannelSegment.class), null),
        arguments(IllegalStateException.class, mock(ChannelSegment.class), invalidBase),
        arguments(IllegalStateException.class, mock(ChannelSegment.class), invalidPopulatedState),
        arguments(IllegalStateException.class, mock(ChannelSegment.class), invalidInnerState),
        arguments(IllegalStateException.class, mock(ChannelSegment.class), invalidFacetingKey),
        arguments(IllegalStateException.class, mock(ChannelSegment.class), invalidNumberFacetingDef));
  }

  @ParameterizedTest
  @MethodSource("getPopulateFacetsArguments")
  void populateFacets(ChannelSegment<Waveform> initialChannelSegment,
      FacetingDefinition facetingDefinition, boolean expectedResult) {
    WaveformFacetingUtility facetingUtil = WaveformFacetingUtility.create(waveformAccessor, stationDefinitionAccessorImpl);

    ChannelSegment<Waveform> resultChannelSegment = (ChannelSegment<Waveform>) facetingUtil.populateFacets(
        initialChannelSegment,
        facetingDefinition);

    assertEquals(expectedResult, resultChannelSegment.getId().getChannel().isPresent());
  }

  static Stream<Arguments> getPopulateFacetsArguments() {
    return Stream.of(
        arguments(WaveformTestFixtures.singleStationEpochStart100RandomSamples(),
            WaveformRequestTestFixtures.channelSegmentFacetingDefinition, true),
        arguments(CHANNEL_SEGMENT_NO_CHANNEL_DATA,
            WaveformRequestTestFixtures.channelSegmentFacetingDefinition2, false));
  }
}