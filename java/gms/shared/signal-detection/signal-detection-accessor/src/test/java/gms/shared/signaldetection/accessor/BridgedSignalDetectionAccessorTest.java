package gms.shared.signaldetection.accessor;

import gms.shared.signaldetection.api.SignalDetectionRepositoryInterface;
import gms.shared.signaldetection.api.facet.SignalDetectionFacetingUtility;
import gms.shared.signaldetection.api.response.SignalDetectionsWithChannelSegments;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signaldetection.coi.detection.SignalDetectionId;
import gms.shared.signaldetection.repository.BridgedSignalDetectionRepository;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.waveform.api.WaveformAccessorInterface;
import gms.shared.waveform.coi.ChannelSegmentDescriptor;
import gms.shared.workflow.coi.WorkflowDefinitionId;
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
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Stream;
import static gms.shared.signaldetection.accessor.BridgedSignalDetectionAccessor.withSegmentsDefinition;
import static gms.shared.signaldetection.accessor.BridgedSignalDetectionAccessor.EMPTY_IDS_MESSAGE;
import static gms.shared.signaldetection.accessor.BridgedSignalDetectionAccessor.MISSING_FACETING_UTILITY_MESSAGE;
import static gms.shared.signaldetection.accessor.BridgedSignalDetectionAccessor.NULL_FACETING_DEFINITION_MESSAGE;
import static gms.shared.signaldetection.accessor.BridgedSignalDetectionAccessor.NULL_IDS_MESSAGE;
import static gms.shared.signaldetection.accessor.BridgedSignalDetectionAccessor.NULL_STAGE_ID_MESSAGE;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_CHANNEL_SEGMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.DETECTION_FROM_ARRIVAL;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTIONS_WITH_CHANNEL_SEGMENTS1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_2;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;


@ExtendWith(MockitoExtension.class)
class BridgedSignalDetectionAccessorTest {

  private static final Duration duration = Duration.ofHours(1);
  private static final Instant startTime = Instant.now().minus(duration);
  private static final Instant endTime = Instant.now();
  private static final WorkflowDefinitionId stageId = WorkflowDefinitionId.from("Stage1");

  private static final List<Station> stations = List.of(STATION);
  private static final List<SignalDetection> excludedDetections = List.of(SIGNAL_DETECTION_2);
  private static final FacetingDefinition facetingDefinition = FacetingDefinition.builder()
    .setClassType("test")
    .setPopulated(false)
    .build();

  private static final List<SignalDetection> detections = List.of(DETECTION_FROM_ARRIVAL);
  private static final List<SignalDetectionHypothesis> hypotheses = List.of(HYPOTHESIS_FROM_ARRIVAL_1,
    HYPOTHESIS_FROM_ARRIVAL_2);
  private static final List<SignalDetectionHypothesisId> hypothesisIds =
    List.of(HYPOTHESIS_FROM_ARRIVAL_1.getId(), HYPOTHESIS_FROM_ARRIVAL_2.getId());
  private static final List<SignalDetectionId> signalDetectionIds =
    List.of(DETECTION_FROM_ARRIVAL.getId());

  @Mock
  private BridgedSignalDetectionRepository signalDetectionRepository;

  @Mock
  private WaveformAccessorInterface waveformAccessor;

  @Mock
  private SignalDetectionFacetingUtility signalDetectionFacetingUtility;

  private BridgedSignalDetectionAccessor signalDetectionAccessor;

  @BeforeEach
  public void testSetup() {
    signalDetectionAccessor = BridgedSignalDetectionAccessor.create(signalDetectionRepository,
      waveformAccessor);
  }

  @ParameterizedTest
  @MethodSource("getCreateWithInvalidArguments")
  void testCreateInvalid(
    SignalDetectionRepositoryInterface signalDetectionRepository,
    WaveformAccessorInterface waveformAccessor) {
    assertThrows(NullPointerException.class, () -> BridgedSignalDetectionAccessor.create(
      signalDetectionRepository, waveformAccessor));
  }

  static Stream<Arguments> getCreateWithInvalidArguments() {
    return Stream.of(
      arguments(null, mock(WaveformAccessorInterface.class)),
      arguments(mock(SignalDetectionRepositoryInterface.class), null));
  }

  @Test
  void testFindWithSegmentsByStationsAndTime() {
    signalDetectionAccessor.setSignalDetectionFacetingUtility(signalDetectionFacetingUtility);

    Collection<ChannelSegmentDescriptor> CHANNEL_SEGMENT_DESCRIPTOR = Collections.singleton(ARRIVAL_CHANNEL_SEGMENT.getId());
    when(waveformAccessor.findByChannelNamesAndSegmentDescriptor(CHANNEL_SEGMENT_DESCRIPTOR))
      .thenReturn(List.of(ARRIVAL_CHANNEL_SEGMENT));

    List<SignalDetection> detections = SIGNAL_DETECTIONS_WITH_CHANNEL_SEGMENTS1.getSignalDetections().asList();
    when(signalDetectionRepository.findByStationsAndTime(
      stations, startTime, endTime, stageId, excludedDetections))
      .thenReturn(detections);

    detections.forEach(detection ->
      doReturn(detection).when(signalDetectionFacetingUtility).populateFacets(detection, withSegmentsDefinition, stageId));

    SignalDetectionsWithChannelSegments actual = signalDetectionAccessor.findWithSegmentsByStationsAndTime(
      stations, startTime, endTime, stageId, excludedDetections);
    assertNotNull(actual);
    assertEquals(SIGNAL_DETECTIONS_WITH_CHANNEL_SEGMENTS1, actual);

    verify(waveformAccessor).findByChannelNamesAndSegmentDescriptor(CHANNEL_SEGMENT_DESCRIPTOR);
    verify(signalDetectionRepository).findByStationsAndTime(stations, startTime, endTime, stageId, excludedDetections);
    detections.forEach(detection ->
      verify(signalDetectionFacetingUtility).populateFacets(detection, withSegmentsDefinition, stageId));
    verifyNoMoreInteractions(signalDetectionRepository, waveformAccessor, signalDetectionFacetingUtility);

  }

  @ParameterizedTest
  @MethodSource("getFindWithSegmentsByStationsAndTimeInvalidArguments")
  void testFindWithSegmentsByStationsAndTimeInvalid(Class<? extends Exception> expectedException, String message,
    List<Station> stats, Instant startT, Instant endT, List<SignalDetection> excludedDets,
    WorkflowDefinitionId id) {
    Exception exception = assertThrows(expectedException, () -> signalDetectionAccessor.findWithSegmentsByStationsAndTime(
      stats, startT, endT, id, excludedDets));
    assertEquals(message, exception.getMessage());
    verifyNoMoreInteractions(signalDetectionRepository, waveformAccessor, signalDetectionFacetingUtility);
  }

  static Stream<Arguments> getFindWithSegmentsByStationsAndTimeInvalidArguments() {
    return Stream.of(
      arguments(NullPointerException.class, "Station List cannot be null", null, startTime, endTime,
        excludedDetections, stageId),
      arguments(IllegalStateException.class, "Start Time cannot be after end time",
        stations, endTime, startTime, excludedDetections, stageId),
      arguments(IllegalStateException.class, "Start Time cannot be in the future",
        stations, endTime.plusSeconds(600), endTime.plusSeconds(1000), excludedDetections, stageId),
      arguments(IllegalStateException.class, "End Time cannot be in the future",
        stations, startTime, endTime.plusSeconds(600), excludedDetections, stageId),
      arguments(NullPointerException.class, "Stage ID cannot be null",
        stations, startTime, endTime, excludedDetections, null),
      arguments(NullPointerException.class, "Excluded signal detections list can be empty, but not null",
        stations, startTime, endTime, null, stageId));
  }

  @Test
  void testFindByIds() {
    when(signalDetectionRepository.findByIds(signalDetectionIds, stageId)).thenReturn(detections);
    assertEquals(detections, signalDetectionAccessor.findByIds(
      signalDetectionIds, stageId));
    verify(signalDetectionRepository).findByIds(signalDetectionIds, stageId);
    verifyNoMoreInteractions(signalDetectionRepository, waveformAccessor, signalDetectionFacetingUtility);
  }

  @ParameterizedTest
  @MethodSource("getFindByIdsFacetArguments")
  void testFindByIdsFacetValidation(Class<? extends Exception> expectedException,
    String expectedMessage,
    List<SignalDetectionId> ids,
    WorkflowDefinitionId stageId,
    FacetingDefinition facetingDefinition) {

    Exception exception = assertThrows(expectedException,
      () -> signalDetectionAccessor.findByIds(ids, stageId, facetingDefinition));
    assertEquals(expectedMessage, exception.getMessage());
    verifyNoMoreInteractions(signalDetectionRepository, waveformAccessor, signalDetectionFacetingUtility);
  }

  static Stream<Arguments> getFindByIdsFacetArguments() {
    return Stream.of(
      arguments(NullPointerException.class,
        NULL_IDS_MESSAGE,
        null,
        stageId,
        facetingDefinition),
      arguments(NullPointerException.class,
        NULL_STAGE_ID_MESSAGE,
        signalDetectionIds,
        null,
        facetingDefinition),
      arguments(NullPointerException.class,
        NULL_FACETING_DEFINITION_MESSAGE,
        signalDetectionIds,
        stageId,
        null),
      arguments(IllegalStateException.class,
        EMPTY_IDS_MESSAGE,
        List.of(),
        stageId,
        facetingDefinition),
      arguments(IllegalStateException.class,
        MISSING_FACETING_UTILITY_MESSAGE,
        signalDetectionIds,
        stageId,
        facetingDefinition));
  }

  @Test
  void testFindByIdsFacet() {
    signalDetectionAccessor.setSignalDetectionFacetingUtility(signalDetectionFacetingUtility);

    when(signalDetectionRepository.findByIds(signalDetectionIds, stageId))
      .thenReturn(detections);
    when(signalDetectionFacetingUtility.populateFacets(DETECTION_FROM_ARRIVAL, facetingDefinition, stageId))
      .thenReturn(DETECTION_FROM_ARRIVAL);
    List<SignalDetection> actual = signalDetectionAccessor.findByIds(signalDetectionIds, stageId, facetingDefinition);
    assertEquals(detections, actual);

    verify(signalDetectionRepository).findByIds(signalDetectionIds, stageId);
    verify(signalDetectionFacetingUtility).populateFacets(DETECTION_FROM_ARRIVAL, facetingDefinition, stageId);
    verifyNoMoreInteractions(signalDetectionRepository, waveformAccessor, signalDetectionFacetingUtility);
  }

  @Test
  void testFindHypothesesByIds() {
    when(signalDetectionRepository.findHypothesesByIds(hypothesisIds))
      .thenReturn(hypotheses);
    assertEquals(hypotheses,
      signalDetectionAccessor.findHypothesesByIds(hypothesisIds));
    verify(signalDetectionRepository).findHypothesesByIds(hypothesisIds);
    verifyNoMoreInteractions(signalDetectionRepository, waveformAccessor, signalDetectionFacetingUtility);
  }

  @ParameterizedTest
  @MethodSource("getFindHypothesesByIdsFacetArguments")
  void testFindHypothesesByIdsFacetValidation(Class<? extends Exception> expectedException,
    String expectedMessage,
    List<SignalDetectionHypothesisId> hypothesisIds,
    FacetingDefinition facetingDefinition) {

    Exception exception = assertThrows(expectedException,
      () -> signalDetectionAccessor.findHypothesesByIds(hypothesisIds, facetingDefinition));
    assertEquals(expectedMessage, exception.getMessage());
    verifyNoMoreInteractions(signalDetectionRepository, waveformAccessor, signalDetectionFacetingUtility);
  }

  static Stream<Arguments> getFindHypothesesByIdsFacetArguments() {
    return Stream.of(
      arguments(NullPointerException.class,
        NULL_IDS_MESSAGE,
        null,
        facetingDefinition),
      arguments(NullPointerException.class,
        NULL_FACETING_DEFINITION_MESSAGE,
        hypothesisIds,
        null),
      arguments(IllegalStateException.class,
        EMPTY_IDS_MESSAGE,
        List.of(),
        facetingDefinition),
      arguments(IllegalStateException.class,
        MISSING_FACETING_UTILITY_MESSAGE,
        hypothesisIds,
        facetingDefinition));
  }

  @Test
  void testFindHypothesesByIdsFacet() {
    signalDetectionAccessor.setSignalDetectionFacetingUtility(signalDetectionFacetingUtility);

    when(signalDetectionRepository.findHypothesesByIds(hypothesisIds))
      .thenReturn(hypotheses);

    hypotheses.forEach(hypothesis ->
      doReturn(hypothesis).when(signalDetectionFacetingUtility).populateFacets(hypothesis, facetingDefinition));

    List<SignalDetectionHypothesis> actual = signalDetectionAccessor.findHypothesesByIds(hypothesisIds,
      facetingDefinition);
    assertEquals(hypotheses, actual);

    verify(signalDetectionRepository).findHypothesesByIds(hypothesisIds);

    hypotheses.forEach(hypothesis ->
      verify(signalDetectionFacetingUtility).populateFacets(hypothesis, facetingDefinition));
    verifyNoMoreInteractions(signalDetectionRepository, waveformAccessor, signalDetectionFacetingUtility);
  }

  @Test
  void testFindByStationsAndTime() {
    when(signalDetectionRepository.findByStationsAndTime(
      stations, startTime, endTime, stageId, excludedDetections))
      .thenReturn(SIGNAL_DETECTIONS_WITH_CHANNEL_SEGMENTS1.getSignalDetections().asList());

    assertEquals(detections,
      signalDetectionAccessor.findByStationsAndTime(stations, startTime, endTime, stageId, excludedDetections));
  }
}
