package gms.shared.signaldetection.api.facet;

import com.google.common.base.Preconditions;
import gms.shared.signaldetection.api.SignalDetectionAccessorInterface;
import gms.shared.signaldetection.api.SignalDetectionRepositoryInterface;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.facet.StationDefinitionFacetingUtility;
import gms.shared.waveform.api.facet.WaveformFacetingUtility;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import gms.shared.workflow.coi.WorkflowDefinitionId;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

public class SignalDetectionFacetingUtility {

  private static final String SIGNAL_DETECTION_HYPOTHESES = "signalDetectionHypotheses";
  private static final String STATION = "station";
  private static final String FEATURE_MEASUREMENTS = "featureMeasurements";
  private static final String CHANNEL = "channel";
  private static final String MEASURED_CHANNEL_SEGMENT = "measuredChannelSegment";
  public static final String NULL_FACETING_DEFINITION_MESSAGE = "FacetingDefinition cannot be null";
  private final SignalDetectionAccessorInterface signalDetectionAccessor;
  private final WaveformFacetingUtility waveformFacetingUtility;
  private final StationDefinitionFacetingUtility stationDefinitionFacetingUtility;

  private SignalDetectionFacetingUtility(SignalDetectionAccessorInterface signalDetectionAccessor,
    WaveformFacetingUtility waveformFacetingUtility,
    StationDefinitionFacetingUtility stationDefinitionFacetingUtility) {
    this.signalDetectionAccessor = signalDetectionAccessor;
    this.waveformFacetingUtility = waveformFacetingUtility;
    this.stationDefinitionFacetingUtility = stationDefinitionFacetingUtility;
  }

  /**
   * Creates a new {@link SignalDetectionFacetingUtility}
   *
   * @param signalDetectionAccessor the {@link SignalDetectionRepositoryInterface} that will be used to retrieve extra
   * data
   * @return
   */
  public static SignalDetectionFacetingUtility create(SignalDetectionAccessorInterface signalDetectionAccessor,
    WaveformFacetingUtility waveformFacetingUtility,
    StationDefinitionFacetingUtility stationDefinitionFacetingUtility) {
    Objects.requireNonNull(signalDetectionAccessor, "SignalDetectionAccessor cannot be null");
    Objects.requireNonNull(waveformFacetingUtility, "WaveformFacetingUtility cannot be null");
    Objects.requireNonNull(stationDefinitionFacetingUtility, "StationDefinitionFacetingUtility cannot be null");

    return new SignalDetectionFacetingUtility(signalDetectionAccessor,
      waveformFacetingUtility,
      stationDefinitionFacetingUtility);
  }

  /**
   * populates the provided {@link SignalDetection} based on the faceting definition and stage
   * @param initial the initial {@link SignalDetection} to populate
   * @param facetingDefinition the {@link FacetingDefinition} defining how to populate the {@link SignalDetection}
   * @param stageId the {@link WorkflowDefinitionId} from where the {@link SignalDetection} was found
   * @return the faceted {@link SignalDetection}
   */
  public SignalDetection populateFacets(SignalDetection initial,
    FacetingDefinition facetingDefinition,
    WorkflowDefinitionId stageId) {

    Objects.requireNonNull(initial, "Initial SignalDetection cannot be null");
    Objects.requireNonNull(facetingDefinition, NULL_FACETING_DEFINITION_MESSAGE);
    Objects.requireNonNull(stageId, "StageId cannot be null");
    Preconditions.checkState(facetingDefinition.getClassType().equals(SignalDetection.class.getSimpleName()),
      "FacetingDefinition must be for SignalDetection");

    if (!facetingDefinition.isPopulated()) {
      return initial.isPresent() ? initial.toEntityReference() : initial;
    } else {
      var sdhDefinition = facetingDefinition.getFacetingDefinitionByName(SIGNAL_DETECTION_HYPOTHESES);
      var stationDefinition = facetingDefinition.getFacetingDefinitionByName(STATION);

      Preconditions.checkState(!(stationDefinition != null &&
          sdhDefinition != null &&
          !sdhDefinition.isPopulated()),
        "Cannot populate station without an arrival measurement to provide effective time");

      SignalDetection faceted = initial;
      if (!initial.isPresent()) {
        List<SignalDetection> signalDetections = signalDetectionAccessor.findByIds(List.of(initial.getId()), stageId);

        Preconditions.checkState(!signalDetections.isEmpty(),
          "No signal detection found with provided ID");
        Preconditions.checkState(signalDetections.size() == 1,
          "Multiple signal detection found for provided ID");

        faceted = signalDetections.get(0);
      }

      var data = faceted.getData().orElseThrow(
        () -> new NoSuchElementException("Retrieved data is not populated"));
      var dataBuilder = data.toBuilder();
      List<SignalDetectionHypothesis> facetedHypotheses = new ArrayList<>();
      if (sdhDefinition != null) {
        facetedHypotheses = data.getSignalDetectionHypotheses().stream()
          .map(hypothesis -> populateFacets(hypothesis,
            facetingDefinition.getFacetingDefinitionByName(SIGNAL_DETECTION_HYPOTHESES)))
          .collect(Collectors.toList());
        dataBuilder.setSignalDetectionHypotheses(facetedHypotheses);
      }

      if (stationDefinition != null) {
        // Because of the check above, we know that the hypothesis is populated
        Instant effectiveTime;
        if (!stationDefinition.isPopulated()) {
          effectiveTime = Instant.EPOCH;
        } else {
          ArrivalTimeMeasurementValue arrivalTime = getEffectiveTimeForHypothesis(facetedHypotheses);
          effectiveTime = arrivalTime.getArrivalTime().getValue();
        }

        dataBuilder.setStation(stationDefinitionFacetingUtility.populateFacets(data.getStation(),
          facetingDefinition.getFacetingDefinitionByName(STATION),
          effectiveTime));
      }


      return faceted.toBuilder()
        .setData(dataBuilder.build())
        .build();
    }
  }

  private ArrivalTimeMeasurementValue getEffectiveTimeForHypothesis(List<SignalDetectionHypothesis> facetedHypotheses) {
    SignalDetectionHypothesis hypothesis =  facetedHypotheses.get(0);
    return (ArrivalTimeMeasurementValue) hypothesis.getData()
      .map(SignalDetectionHypothesis.Data::getFeatureMeasurementsByType)
      .map(featureMeasurmentsByType -> featureMeasurmentsByType.get(FeatureMeasurementTypes.ARRIVAL_TIME))
      .map(FeatureMeasurement::getMeasurementValue)
      .orElseThrow(() -> new NoSuchElementException("No ArrivalTimeMeasurement is present to provide EffectiveTime"));
  }

  /**
   * populates the provided {@link SignalDetectionHypothesis} based on the faceting definition and stage
   * @param initial the initial {@link SignalDetectionHypothesis} to populate
   * @param facetingDefinition the {@link FacetingDefinition} defining how to populate the
   * {@link SignalDetectionHypothesis}
   * @return the faceted {@link SignalDetectionHypothesis}
   */
  public SignalDetectionHypothesis populateFacets(SignalDetectionHypothesis initial,
    FacetingDefinition facetingDefinition) {

    Objects.requireNonNull(initial, "Initial SignalDetectionHypothesis cannot be null");
    Objects.requireNonNull(facetingDefinition, NULL_FACETING_DEFINITION_MESSAGE);
    Preconditions.checkState(facetingDefinition.getClassType().equals(SignalDetectionHypothesis.class.getSimpleName()),
      "FacetingDefinition must be for SignalDetectionHypothesis");

    if (!facetingDefinition.isPopulated()) {
      if (initial.isPopulated()) {
        return initial.toEntityReference();
      } else {
        return initial;
      }
    } else {
      SignalDetectionHypothesis faceted = initial;
      if (!initial.isPopulated()) {
        List<SignalDetectionHypothesis> signalDetectionHypotheses = signalDetectionAccessor
          .findHypothesesByIds(List.of(initial.getId()));

        Preconditions.checkState(!signalDetectionHypotheses.isEmpty(),
          "No signal detection hypotheses found with provided ID");
        Preconditions.checkState(signalDetectionHypotheses.size() == 1,
          "Multiple signal detection hypotheses found for provided ID");

        faceted = signalDetectionHypotheses.get(0);
      }

      var initialData = faceted.getData()
        .orElseThrow(() -> new NoSuchElementException("Retrieved data is not populated"));
      var dataBuilder = initialData.toBuilder();
      FeatureMeasurement<ArrivalTimeMeasurementValue> arrivalMeasurement =
      (FeatureMeasurement<ArrivalTimeMeasurementValue>) initialData.getFeatureMeasurementsByType()
        .get(FeatureMeasurementTypes.ARRIVAL_TIME);
      Instant effectiveTime = arrivalMeasurement.getMeasurementValue().getArrivalTime().getValue();
      if (facetingDefinition.getFacetingDefinitionByName(STATION) != null) {
        dataBuilder.setStation(stationDefinitionFacetingUtility.populateFacets(initialData.getStation(),
          facetingDefinition.getFacetingDefinitionByName(STATION),
          effectiveTime));
      }

      if (facetingDefinition.getFacetingDefinitionByName(FEATURE_MEASUREMENTS) != null) {
        Set<FeatureMeasurement<?>> facetedFeatureMeasurements = faceted.getFeatureMeasurements().stream()
          .map(featureMeasurement -> populateFacets(featureMeasurement,
            facetingDefinition.getFacetingDefinitionByName(FEATURE_MEASUREMENTS),
            effectiveTime))
          .collect(Collectors.toSet());
        dataBuilder.setFeatureMeasurements(facetedFeatureMeasurements);
      }

      return faceted.toBuilder()
        .setData(dataBuilder.build())
        .build();
    }
  }

  /**
   * populates the provided {@link FeatureMeasurement} based on the faceting definition and stage
   * @param initial the initial {@link FeatureMeasurement} to populate
   * @param facetingDefinition the {@link FacetingDefinition} defining how to populate the {@link FeatureMeasurement}
   * @param effectiveTime the time of the {@link SignalDetection} the {@link FeatureMeasurement} measures
   * @return the faceted {@link FeatureMeasurement}
   */
  public FeatureMeasurement<?> populateFacets(FeatureMeasurement<?> initial,
    FacetingDefinition facetingDefinition,
    Instant effectiveTime) {

    Objects.requireNonNull(initial, "Initial FeatureMeasurement cannot be null");
    Objects.requireNonNull(facetingDefinition, NULL_FACETING_DEFINITION_MESSAGE);
    Objects.requireNonNull(effectiveTime, "EffectiveTime cannot be null");
    Preconditions.checkState(facetingDefinition.getClassType().equals(FeatureMeasurement.class.getSimpleName()),
      "FacetingDefinition must be for FeatureMeasurement");
    Preconditions.checkState(facetingDefinition.isPopulated(),"FeatureMeasurement parent must be populated");

    var facetedChannel = initial.getChannel();
    if (facetingDefinition.getFacetingDefinitionByName(CHANNEL) != null) {
      facetedChannel = stationDefinitionFacetingUtility.populateFacets(initial.getChannel(),
        facetingDefinition.getFacetingDefinitionByName(CHANNEL),
        effectiveTime);
    }

    ChannelSegment<? extends Timeseries> facetedChannelSegment = initial.getMeasuredChannelSegment();
    if (facetingDefinition.getFacetingDefinitionByName(MEASURED_CHANNEL_SEGMENT) != null) {
      facetedChannelSegment = waveformFacetingUtility.populateFacets(initial.getMeasuredChannelSegment(),
        facetingDefinition.getFacetingDefinitionByName(MEASURED_CHANNEL_SEGMENT));
    }

    return FeatureMeasurement.from(facetedChannel,
      facetedChannelSegment,
      initial.getFeatureMeasurementTypeName(),
      initial.getMeasurementValue(),
      initial.getSnr());
  }


}
