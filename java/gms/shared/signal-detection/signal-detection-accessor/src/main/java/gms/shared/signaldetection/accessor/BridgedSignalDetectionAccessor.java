package gms.shared.signaldetection.accessor;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableSet;
import gms.shared.signaldetection.api.SignalDetectionAccessorInterface;
import gms.shared.signaldetection.api.SignalDetectionRepositoryInterface;
import gms.shared.signaldetection.api.facet.SignalDetectionFacetingUtility;
import gms.shared.signaldetection.api.response.SignalDetectionsWithChannelSegments;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signaldetection.coi.detection.SignalDetectionId;
import gms.shared.signaldetection.repository.BridgedSignalDetectionRepository;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.facet.FacetingTypes;
import gms.shared.waveform.accessor.WaveformAccessor;
import gms.shared.waveform.api.WaveformAccessorInterface;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.ChannelSegmentDescriptor;
import gms.shared.waveform.coi.Waveform;
import gms.shared.workflow.coi.WorkflowDefinitionId;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * The Accessor to retrieve SignalDetection Objects, based on information contained in BridgedSignalDetectionRepository
 * and the Waveform Accessor provided.
 * Implements {@link SignalDetectionAccessorInterface}
 */
public class BridgedSignalDetectionAccessor implements SignalDetectionAccessorInterface {

  public static final String NULL_IDS_MESSAGE = "IDs cannot be null";
  public static final String NULL_STATIONS_MESSAGE = "Stations cannot be null";
  public static final String NULL_EXCLUDED_SIGNAL_DETECTIONS_LIST = "Excluded signal detections list can be empty, but not null";
  public static final String EMPTY_STATIONS_MESSAGE = "Stations cannot be empty";
  public static final String NULL_FACETING_DEFINITION_MESSAGE = "Faceting definition cannot be null";
  public static final String EMPTY_IDS_MESSAGE = "IDs cannot be empty";
  public static final String NULL_STAGE_ID_MESSAGE = "Stage ID cannot be null";
  public static final String MISSING_FACETING_UTILITY_MESSAGE = "StationDefinitionFacetingUtility must be set before attempting faceting";
  public static final String START_END_TIME_ERR = "Start Time cannot be after end time";
  public static final String START_FUTURE_ERR = "Start Time cannot be in the future";
  public static final String END_FUTURE_ERR = "End Time cannot be in the future";
  public static final String NULL_START_TIME_MESSAGE = "Start time cannot be null";
  public static final String NULL_END_TIME_MESSAGE = "End time cannot be null";

  private static final FacetingDefinition stationFacetingDefinition = FacetingDefinition.builder()
    .setClassType(FacetingTypes.STATION_TYPE.getValue())
    .setPopulated(false)
    .setFacetingDefinitions(Map.of())
    .build();
  private static final FacetingDefinition channelFacetingDefinition = FacetingDefinition.builder()
    .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
    .setPopulated(false)
    .setFacetingDefinitions(Map.of())
    .build();
  private static final FacetingDefinition featureMeasurementFacetingDefinition = FacetingDefinition.builder()
    .setClassType(FeatureMeasurement.class.getSimpleName())
    .setPopulated(true)
    .addFacetingDefinitions("channel", channelFacetingDefinition)
    .build();

  static final FacetingDefinition withSegmentsDefinition = FacetingDefinition.builder()
    .setClassType(SignalDetection.class.getSimpleName())
    .setPopulated(true)
    .addFacetingDefinitions("station", stationFacetingDefinition)
    .addFacetingDefinitions("signalDetectionHypotheses", FacetingDefinition.builder()
      .setClassType(SignalDetectionHypothesis.class.getSimpleName())
      .setPopulated(true)
      .addFacetingDefinitions("station", stationFacetingDefinition)
      .addFacetingDefinitions("featureMeasurements", featureMeasurementFacetingDefinition)
      .build())
    .build();

  private final SignalDetectionRepositoryInterface signalDetectionRepository;
  private final WaveformAccessorInterface waveformAccessor;
  private SignalDetectionFacetingUtility signalDetectionFacetingUtility;
  private boolean initialized = false;

  private BridgedSignalDetectionAccessor(SignalDetectionRepositoryInterface signalDetectionRepository,
    WaveformAccessorInterface waveformAccessor) {
    this.signalDetectionRepository = signalDetectionRepository;
    this.waveformAccessor = waveformAccessor;
  }

  /**
   * Creates the BridgeSignalDetectionAccessor instance and returns it to the caller.
   *
   * @param signalDetectionRepository {@link BridgedSignalDetectionRepository}
   * @param waveformAccessor {@link WaveformAccessor}
   * @return the validated BridgeSignalDetectionAccessor
   */
  public static BridgedSignalDetectionAccessor create(SignalDetectionRepositoryInterface signalDetectionRepository,
    WaveformAccessorInterface waveformAccessor) {
    Preconditions.checkNotNull(signalDetectionRepository, "The repository cannot be null");
    Preconditions.checkNotNull(waveformAccessor, "The Waveform Accessor cannot be null");

    return new BridgedSignalDetectionAccessor(signalDetectionRepository,
      waveformAccessor);
  }

  public void setSignalDetectionFacetingUtility(SignalDetectionFacetingUtility signalDetectionFacetingUtility) {
    Objects.requireNonNull(signalDetectionFacetingUtility);

    this.signalDetectionFacetingUtility = signalDetectionFacetingUtility;
    initialized = true;
  }

  /**
   * Retrieves {@link SignalDetectionsWithChannelSegments} for the provided stations, time range, stage id, and
   * excluding any of the provided {@link SignalDetection}s
   *
   * @param stations the {@link Station}s to find {@link SignalDetection}s for
   * @param startTime the start time of the time range
   * @param endTime the end time of the time range
   * @param stageId the {@link WorkflowDefinitionId} for the stage
   * @param excludedSignalDetections the list of {@link SignalDetection}s to exclude from the results
   * @return the {@link SignalDetectionsWithChannelSegments} satisfying the requirements
   */
  @Override
  public SignalDetectionsWithChannelSegments findWithSegmentsByStationsAndTime(List<Station> stations,
    Instant startTime, Instant endTime, WorkflowDefinitionId stageId, List<SignalDetection> excludedSignalDetections) {

    Preconditions.checkNotNull(stations, "Station List cannot be null");
    Preconditions.checkState(!stations.isEmpty(), EMPTY_STATIONS_MESSAGE);
    Preconditions.checkState(startTime.isBefore(endTime), START_END_TIME_ERR);
    Preconditions.checkState(startTime.isBefore(Instant.now()), START_FUTURE_ERR);
    Preconditions.checkState(endTime.isBefore(Instant.now()), END_FUTURE_ERR);
    Preconditions.checkNotNull(stageId, NULL_STAGE_ID_MESSAGE);
    Preconditions.checkNotNull(excludedSignalDetections, NULL_EXCLUDED_SIGNAL_DETECTIONS_LIST);

    List<SignalDetection> signalDetections =
      findByStationsAndTime(stations, startTime, endTime, stageId, excludedSignalDetections, withSegmentsDefinition);

    List<SignalDetectionHypothesis> sdh = new ArrayList<>();
    for (SignalDetection signalDetection : signalDetections) {
      sdh.addAll(signalDetection.getSignalDetectionHypotheses());
    }

    List<FeatureMeasurement<?>> featureMeasurements = signalDetections.stream()
      .map(SignalDetection::getSignalDetectionHypotheses)
      .flatMap(Collection::stream)
      .filter(SignalDetectionHypothesis::isPopulated)
      .map(SignalDetectionHypothesis::getFeatureMeasurements)
      .flatMap(Collection::stream)
      .collect(Collectors.toList());

    Set<ChannelSegmentDescriptor> channelSegmentDescriptors = featureMeasurements.stream()
      .map(fm -> fm.getMeasuredChannelSegment().getId())
      .collect(Collectors.toSet());

    Collection<ChannelSegment<Waveform>> channelSegments =
      channelSegmentDescriptors.isEmpty() ? new ArrayList<>() :
        waveformAccessor.findByChannelNamesAndSegmentDescriptor(
          channelSegmentDescriptors);

    return SignalDetectionsWithChannelSegments.builder()
      .setChannelSegments(ImmutableSet.copyOf(channelSegments))
      .setSignalDetections(ImmutableSet.copyOf(signalDetections))
      .build();
  }

  /**
   * Finds {@link SignalDetection}s for the provided {@link SignalDetectionId}s and
   * {@link WorkflowDefinitionId}s
   *
   * @param ids list of {@link SignalDetectionId}s
   * @param stageId stage {@link WorkflowDefinitionId}
   * @return a list of {@link SignalDetection}
   */
  @Override
  public List<SignalDetection> findByIds(List<SignalDetectionId> ids, WorkflowDefinitionId stageId) {
    return signalDetectionRepository.findByIds(ids, stageId);
  }

  @Override
  public List<SignalDetection> findByIds(List<SignalDetectionId> ids,
    WorkflowDefinitionId stageId,
    FacetingDefinition facetingDefinition) {

    Objects.requireNonNull(ids, NULL_IDS_MESSAGE);
    Objects.requireNonNull(stageId, NULL_STAGE_ID_MESSAGE);
    Objects.requireNonNull(facetingDefinition, NULL_FACETING_DEFINITION_MESSAGE);
    Preconditions.checkState(!ids.isEmpty(), EMPTY_IDS_MESSAGE);
    Preconditions.checkState(initialized, MISSING_FACETING_UTILITY_MESSAGE);

    List<SignalDetection> signalDetections = signalDetectionRepository.findByIds(ids, stageId);
    return signalDetections.stream()
      .map(sd -> signalDetectionFacetingUtility.populateFacets(sd, facetingDefinition, stageId))
      .collect(Collectors.toList());
  }

  /**
   * Finds {@link SignalDetectionHypothesis} for the provided ids
   *
   * @param ids the {@link SignalDetectionHypothesisId}s to find the associated detections for
   * @return a list of {@link SignalDetectionHypothesisId}
   */
  @Override
  public List<SignalDetectionHypothesis> findHypothesesByIds(List<SignalDetectionHypothesisId> ids) {
    return signalDetectionRepository.findHypothesesByIds(ids);
  }

  @Override
  public List<SignalDetectionHypothesis> findHypothesesByIds(List<SignalDetectionHypothesisId> ids,
    FacetingDefinition facetingDefinition) {

    Objects.requireNonNull(ids, NULL_IDS_MESSAGE);
    Objects.requireNonNull(facetingDefinition, NULL_FACETING_DEFINITION_MESSAGE);
    Preconditions.checkState(!ids.isEmpty(), EMPTY_IDS_MESSAGE);
    Preconditions.checkState(initialized, MISSING_FACETING_UTILITY_MESSAGE);

    return signalDetectionRepository.findHypothesesByIds(ids).stream()
      .map(sdh -> signalDetectionFacetingUtility.populateFacets(sdh, facetingDefinition))
      .collect(Collectors.toList());
  }

  /**
   * Retrieves {@link SignalDetection}s for the provided stations and stage, between the provided time range, and excluding any
   * of the excluded {@link SignalDetection}s
   *
   * @param stations The list of {@link Station}s to find {@link SignalDetection}s for
   * @param startTime The start time of the time range to find {@link SignalDetection}s in
   * @param endTime The end time of the time range to find {@link SignalDetection}s in
   * @param stageId The stage id for the {@link SignalDetection}s
   * @param excludedSignalDetections The {@link SignalDetection}s to exclude from the results
   * @return
   */
  @Override
  public List<SignalDetection> findByStationsAndTime(List<Station> stations, Instant startTime, Instant endTime,
    WorkflowDefinitionId stageId, List<SignalDetection> excludedSignalDetections) {

    Objects.requireNonNull(stations, NULL_STATIONS_MESSAGE);
    Preconditions.checkState(!stations.isEmpty(), EMPTY_STATIONS_MESSAGE);
    Preconditions.checkState(startTime.isBefore(endTime), START_END_TIME_ERR);
    Preconditions.checkState(startTime.isBefore(Instant.now()), START_FUTURE_ERR);
    Preconditions.checkState(endTime.isBefore(Instant.now()), END_FUTURE_ERR);
    Preconditions.checkNotNull(stageId, NULL_STAGE_ID_MESSAGE);
    Preconditions.checkNotNull(excludedSignalDetections, NULL_EXCLUDED_SIGNAL_DETECTIONS_LIST);

    return signalDetectionRepository.findByStationsAndTime(
      stations, startTime, endTime, stageId, excludedSignalDetections);
  }

  @Override
  public List<SignalDetection> findByStationsAndTime(List<Station> stations,
    Instant startTime,
    Instant endTime,
    WorkflowDefinitionId stageId,
    List<SignalDetection> excludedSignalDetections,
    FacetingDefinition facetingDefinition) {

    Objects.requireNonNull(stations, NULL_STATIONS_MESSAGE);
    Objects.requireNonNull(startTime, NULL_START_TIME_MESSAGE);
    Objects.requireNonNull(endTime, NULL_END_TIME_MESSAGE);
    Objects.requireNonNull(stageId, NULL_STAGE_ID_MESSAGE);
    Objects.requireNonNull(excludedSignalDetections, NULL_EXCLUDED_SIGNAL_DETECTIONS_LIST);
    Objects.requireNonNull(facetingDefinition, NULL_FACETING_DEFINITION_MESSAGE);
    Preconditions.checkState(!stations.isEmpty(), EMPTY_STATIONS_MESSAGE);
    Preconditions.checkState(startTime.isBefore(endTime), START_END_TIME_ERR);
    Preconditions.checkState(initialized, MISSING_FACETING_UTILITY_MESSAGE);

    return signalDetectionRepository.findByStationsAndTime(stations,
      startTime,
      endTime,
      stageId,
      excludedSignalDetections).stream()
      .map(detection -> signalDetectionFacetingUtility.populateFacets(detection, facetingDefinition, stageId))
      .collect(Collectors.toList());
  }
}
