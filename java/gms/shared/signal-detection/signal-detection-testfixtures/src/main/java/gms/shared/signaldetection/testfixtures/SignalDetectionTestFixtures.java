package gms.shared.signaldetection.testfixtures;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSet;
import gms.shared.signaldetection.api.request.DetectionsWithSegmentsByStationsAndTimeRequest;
import gms.shared.signaldetection.api.response.SignalDetectionsWithChannelSegments;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisConverterId;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signaldetection.coi.detection.SignalDetectionId;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.types.FirstMotionType;
import gms.shared.signaldetection.coi.types.PhaseType;
import gms.shared.signaldetection.coi.values.AmplitudeMeasurementValue;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.FirstMotionMeasurementValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.database.connector.util.SignalDetectionHypothesisArrivalIdComponents;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.ChannelSegmentDescriptor;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.testfixture.ChannelSegmentTestFixtures;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import gms.shared.workflow.coi.WorkflowDefinitionId;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_1_ACCT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_2_ACCT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_3_ACCT;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.channelSegmentDescriptor;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.channelSegmentDescriptor2;

/**
 * Defines objects used in testing
 */
public class SignalDetectionTestFixtures {

  public static final DetectionsWithSegmentsByStationsAndTimeRequest REQUEST = DetectionsWithSegmentsByStationsAndTimeRequest.create(
    ImmutableList.of(STATION),
    Instant.EPOCH,
    Instant.EPOCH.plusSeconds(300),
    WorkflowDefinitionId.from("test"),
    ImmutableList.of());

  private SignalDetectionTestFixtures() {
  }

  public static final WorkflowDefinitionId WORKFLOW_DEFINITION_ID1 = WorkflowDefinitionId.from(STAGE_1);
  public static final WorkflowDefinitionId WORKFLOW_DEFINITION_ID2 = WorkflowDefinitionId.from(STAGE_2);
  public static final WorkflowDefinitionId WORKFLOW_DEFINITION_ID3 = WorkflowDefinitionId.from(STAGE_3);
  public static final ImmutableList<WorkflowDefinitionId> ORDERED_STAGES = ImmutableList.copyOf(
    List.of(WORKFLOW_DEFINITION_ID1,
      WORKFLOW_DEFINITION_ID2,
      WORKFLOW_DEFINITION_ID3));
  public static final String PROPER_CHANNEL_NAME = "STA.CHAN.BHZ";
  public static final UUID ARRIVAL_UUID = UUID.nameUUIDFromBytes(STAGE_1.concat(
    String.valueOf(ARRIVAL_1.getId())).getBytes(StandardCharsets.UTF_8));
  public static final UUID ARRIVAL_2_UUID = UUID.nameUUIDFromBytes(STAGE_1.concat(
    String.valueOf(ARRIVAL_2.getId())).getBytes(StandardCharsets.UTF_8));
  public static final UUID ARRIVAL_3_UUID = UUID.nameUUIDFromBytes(STAGE_1.concat(
    String.valueOf(ARRIVAL_3.getId())).getBytes(StandardCharsets.UTF_8));
  public static final UUID ARRIVAL_HYPOTHESIS_UUID = UUID.nameUUIDFromBytes(
    String.valueOf(ARRIVAL_1.getId()).getBytes(StandardCharsets.UTF_8));

  public static final PhaseTypeMeasurementValue PHASE_MEASUREMENT = PhaseTypeMeasurementValue.fromFeaturePrediction(
    PhaseType.P, Optional.of(0.5));

  public static final Duration MEASURED_WAVEFORM_LEAD_DURATION = Duration.ofMillis(500);
  public static final Duration MEASURED_WAVEFORM_LAG_DURATION = Duration.ofMillis(300);

  // ------- MeasurementValueSpecs --------

  public static final MeasurementValueSpec<ArrivalTimeMeasurementValue> ARRIVAL_MEASUREMENT_SPEC =
    MeasurementValueSpec.<ArrivalTimeMeasurementValue>builder()
      .setArrivalDao(ARRIVAL_1)
      .setFeatureMeasurementType(FeatureMeasurementTypes.ARRIVAL_TIME)
      .build();
  public static final MeasurementValueSpec<PhaseTypeMeasurementValue> PHASE_MEASUREMENT_SPEC =
    MeasurementValueSpec.<PhaseTypeMeasurementValue>builder()
      .setArrivalDao(ARRIVAL_1)
      .setFeatureMeasurementType(FeatureMeasurementTypes.PHASE)
      .build();
  public static final MeasurementValueSpec<NumericMeasurementValue> RECEIVER_AZIMUTH_MEASUREMENT_SPEC =
    MeasurementValueSpec.<NumericMeasurementValue>builder()
      .setArrivalDao(ARRIVAL_2)
      .setFeatureMeasurementType(FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH)
      .setMeasuredValueExtractor(ArrivalDao::getAzimuth)
      .setUncertaintyValueExtractor(ArrivalDao::getAzimuthUncertainty)
      .setUnits(Units.DEGREES)
      .build();
  public static final MeasurementValueSpec<NumericMeasurementValue> SLOWNESS_MEASUREMENT_SPEC =
    MeasurementValueSpec.<NumericMeasurementValue>builder()
      .setArrivalDao(ARRIVAL_1)
      .setFeatureMeasurementType(FeatureMeasurementTypes.SLOWNESS)
      .setMeasuredValueExtractor(ArrivalDao::getSlowness)
      .setUnits(Units.SECONDS_PER_DEGREE)
      .build();
  public static final MeasurementValueSpec<NumericMeasurementValue> EMERGENCE_ANGLE_MEASUREMENT_SPEC =
    MeasurementValueSpec.<NumericMeasurementValue>builder()
      .setArrivalDao(ARRIVAL_1)
      .setFeatureMeasurementType(FeatureMeasurementTypes.EMERGENCE_ANGLE)
      .setMeasuredValueExtractor(ArrivalDao::getEmergenceAngle)
      .setUnits(Units.DEGREES)
      .build();
  public static final MeasurementValueSpec<NumericMeasurementValue> RECTILINEARITY_MEASUREMENT_SPEC =
    MeasurementValueSpec.<NumericMeasurementValue>builder()
      .setArrivalDao(ARRIVAL_1)
      .setFeatureMeasurementType(FeatureMeasurementTypes.RECTILINEARITY)
      .setMeasuredValueExtractor(ArrivalDao::getRectilinearity)
      .setUnits(Units.UNITLESS)
      .build();
  public static final MeasurementValueSpec<FirstMotionMeasurementValue> SHORT_PERIOD_MEASUREMENT_SPEC =
    MeasurementValueSpec.<FirstMotionMeasurementValue>builder()
      .setArrivalDao(ARRIVAL_1)
      .setFeatureMeasurementType(FeatureMeasurementTypes.SHORT_PERIOD_FIRST_MOTION)
      .setFeatureMeasurementTypeCode("c")
      .build();
  public static final MeasurementValueSpec<FirstMotionMeasurementValue> LONG_PERIOD_MEASUREMENT_SPEC =
    MeasurementValueSpec.<FirstMotionMeasurementValue>builder()
      .setArrivalDao(ARRIVAL_3)
      .setFeatureMeasurementType(FeatureMeasurementTypes.LONG_PERIOD_FIRST_MOTION)
      .setFeatureMeasurementTypeCode("r")
      .build();

  // ------- SignalDetectionEventAssociation -------

  public static final DoubleValue standardDoubleValue = DoubleValue.from(5, Optional.of(1.0), Units.SECONDS);
  public static final ArrivalTimeMeasurementValue ARRIVAL_TIME_MEASUREMENT = ArrivalTimeMeasurementValue.from(
    InstantValue.from(Instant.EPOCH, Duration.ofMillis(1)), Optional.empty());
  private static final NumericMeasurementValue RECEIVER_AZIMUTH_MEASUREMENT = NumericMeasurementValue.from(Optional.empty(),
    DoubleValue.from(180, Optional.of(0.5), Units.DEGREES));
  public static final FirstMotionMeasurementValue firstMotionMeasurement =
    FirstMotionMeasurementValue
      .fromFeaturePrediction(
        FirstMotionType.DILATION, Optional.of(0.5));
  public static final FirstMotionMeasurementValue longPeriodFirstMotionMeasurement =
    FirstMotionMeasurementValue
      .fromFeatureMeasurement(
        FirstMotionType.DILATION, Optional.empty(), Instant.EPOCH);
  public static final AmplitudeMeasurementValue amplitudeMeasurement = AmplitudeMeasurementValue
    .fromFeaturePrediction(
      standardDoubleValue, Duration.ofMillis(1));
  public static final InstantValue instantMeasurement = InstantValue.from(
    Instant.EPOCH, Duration.ofMillis(1));

  // ------- Feature Measurements -------

  public static final FeatureMeasurement<ArrivalTimeMeasurementValue> ARRIVAL_TIME_FEATURE_MEASUREMENT
    = FeatureMeasurement.from(CHANNEL, WaveformTestFixtures.singleStationEpochStart100RandomSamples(),
    FeatureMeasurementTypes.ARRIVAL_TIME, ARRIVAL_TIME_MEASUREMENT);
  public static final FeatureMeasurement<PhaseTypeMeasurementValue> PHASE_FEATURE_MEASUREMENT
    = FeatureMeasurement.from(CHANNEL, WaveformTestFixtures.singleStationEpochStart100RandomSamples(),
    FeatureMeasurementTypes.PHASE, PHASE_MEASUREMENT);
  public static final FeatureMeasurement<FirstMotionMeasurementValue> LONG_PERIOD_FIRST_MOTION_FEATURE_MEASUREMENT
    = FeatureMeasurement.from(CHANNEL, WaveformTestFixtures.singleStationEpochStart100RandomSamples(),
    FeatureMeasurementTypes.LONG_PERIOD_FIRST_MOTION, longPeriodFirstMotionMeasurement);
  public static final FeatureMeasurement<NumericMeasurementValue> RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT
    = FeatureMeasurement.from(CHANNEL, WaveformTestFixtures.singleStationEpochStart100RandomSamples(),
    FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH, RECEIVER_AZIMUTH_MEASUREMENT);
  public static final FeatureMeasurement<AmplitudeMeasurementValue> AMPLITUDE_FEATURE_MEASUREMENT
    = FeatureMeasurement.from(CHANNEL, WaveformTestFixtures.singleStationEpochStart100RandomSamples(),
    FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2, amplitudeMeasurement);
  public static final FeatureMeasurement<ArrivalTimeMeasurementValue> INSTANT_FEATURE_MEASUREMENT
    = FeatureMeasurement.from(CHANNEL, WaveformTestFixtures.singleStationEpochStart100RandomSamples(),
    FeatureMeasurementTypes.ARRIVAL_TIME, ArrivalTimeMeasurementValue.from(instantMeasurement, Optional.empty()));

  // ------- Signal Detection IDs -------

  public static final UUID SIGNAL_DETECTION_ID = UUID.nameUUIDFromBytes(String.valueOf(ARRIVAL_1.getId())
    .getBytes(StandardCharsets.UTF_8));
  public static final UUID SIGNAL_DETECTION_ID_2 = UUID.nameUUIDFromBytes(String.valueOf(ARRIVAL_2.getId())
    .getBytes(StandardCharsets.UTF_8));
  public static final UUID SIGNAL_DETECTION_ID_3 = UUID.nameUUIDFromBytes(String.valueOf(ARRIVAL_3.getId())
    .getBytes(StandardCharsets.UTF_8));
  public static final String MONITORING_ORG = "Test Monitoring Org";
  public static final UUID HYPOTHESIS_ID = ARRIVAL_UUID;
  public static final UUID HYPOTHESIS_ID_3 = ARRIVAL_3_UUID;

  // ------- Signal Detection Hypothesis IDs -------

  public static final SignalDetectionHypothesisId SIGNAL_DETECTION_HYPOTHESIS_ID =
    SignalDetectionHypothesisId.from(SIGNAL_DETECTION_ID, HYPOTHESIS_ID);
  public static final SignalDetectionHypothesisId SIGNAL_DETECTION_HYPOTHESIS_ID_2 =
    SignalDetectionHypothesisId.from(SIGNAL_DETECTION_ID, ARRIVAL_HYPOTHESIS_UUID);
  public static final SignalDetectionHypothesisId SIGNAL_DETECTION_HYPOTHESIS_ID_3 =
    SignalDetectionHypothesisId.from(SIGNAL_DETECTION_ID_3, HYPOTHESIS_ID_3);
  public static final SignalDetectionHypothesisArrivalIdComponents SIGNAL_DETECTION_HYPOTHESIS_ARRIVAL_ID_COMPONENTS_1 =
    SignalDetectionHypothesisArrivalIdComponents.create(WORKFLOW_DEFINITION_ID1, ARRIVAL_1.getId());
  public static final SignalDetectionHypothesisArrivalIdComponents SIGNAL_DETECTION_HYPOTHESIS_ARRIVAL_ID_COMPONENTS_3 =
    SignalDetectionHypothesisArrivalIdComponents.create(WORKFLOW_DEFINITION_ID1, ARRIVAL_3.getId());

  // ------- Signal Detection Hypotheses -------

  public static final List<FeatureMeasurement<?>> MEASUREMENT_LIST =
    List.of(ARRIVAL_TIME_FEATURE_MEASUREMENT, PHASE_FEATURE_MEASUREMENT);
  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS_ENTITY_REFERENCE =
    SignalDetectionHypothesis.builder()
      .setId(SIGNAL_DETECTION_HYPOTHESIS_ID_2)
      .build();
  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS =
    SignalDetectionHypothesis.builder()
      .setId(SIGNAL_DETECTION_HYPOTHESIS_ID)
      .setData(SignalDetectionHypothesis.Data.builder()
        .setMonitoringOrganization(MONITORING_ORG)
        .setStation(STATION)
        .setRejected(false)
        .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST))
        .build())
      .build();
  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS_3 =
    SignalDetectionHypothesis.builder()
      .setId(SIGNAL_DETECTION_HYPOTHESIS_ID_3)
      .setData(SignalDetectionHypothesis.Data.builder()
        .setMonitoringOrganization(MONITORING_ORG)
        .setStation(STATION)
        .setRejected(false)
        .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST))
        .build())
      .build();

  // ------- Signal Detections -------

  public static final SignalDetection SIGNAL_DETECTION = SignalDetection.from(SignalDetectionId.from(SIGNAL_DETECTION_ID),
    Optional.of(SignalDetection.Data.builder()
      .setMonitoringOrganization(MONITORING_ORG)
      .setStation(STATION)
      .setSignalDetectionHypotheses(List.of(SIGNAL_DETECTION_HYPOTHESIS)).build()));

  public static final SignalDetection SIGNAL_DETECTION_2 = SignalDetection.from(SignalDetectionId.from(SIGNAL_DETECTION_ID_2),
    Optional.of(SignalDetection.Data.builder()
      .setMonitoringOrganization(MONITORING_ORG)
      .setStation(STATION)
      .setSignalDetectionHypotheses(List.of(SIGNAL_DETECTION_HYPOTHESIS)).build()));

  public static final SignalDetection SIGNAL_DETECTION_3 = SignalDetection.from(SignalDetectionId.from(SIGNAL_DETECTION_ID_3),
    Optional.of(SignalDetection.Data.builder()
      .setMonitoringOrganization(MONITORING_ORG)
      .setStation(STATION)
      .setSignalDetectionHypotheses(List.of(SIGNAL_DETECTION_HYPOTHESIS_3)).build()));

  public static final Channel ARRIVAL_CHANNEL = UtilsTestFixtures.CHANNEL.toBuilder()
    .setName(PROPER_CHANNEL_NAME)
    .build();
  public static final ChannelSegment<Waveform> ARRIVAL_CHANNEL_SEGMENT = ChannelSegmentTestFixtures
    .createChannelSegment(ARRIVAL_CHANNEL, List.copyOf(WaveformTestFixtures.waveforms));

  public static final FeatureMeasurement<ArrivalTimeMeasurementValue> ARRIVAL_TIME_FEATURE_MEASUREMENT_2
    = FeatureMeasurement.from(ARRIVAL_CHANNEL, WaveformTestFixtures.singleStationEpochStart100RandomSamples(),
    FeatureMeasurementTypes.ARRIVAL_TIME, ARRIVAL_TIME_MEASUREMENT);

  public static final UUID detectionId = UUID.nameUUIDFromBytes(String.valueOf(ARRIVAL_1.getId())
    .getBytes(StandardCharsets.UTF_8));
  public static final UUID hypothesis1Id = UUID.nameUUIDFromBytes(PROPER_CHANNEL_NAME
    .concat(ARRIVAL_1.getArrivalKey().getTime().toString())
    .getBytes(StandardCharsets.UTF_8));
  public static final SignalDetectionHypothesisConverterId converterId = SignalDetectionHypothesisConverterId.from(
    STAGE_1, detectionId, Optional.empty());
  public static final UUID hypothesis2Id = UUID.nameUUIDFromBytes(PROPER_CHANNEL_NAME.
    concat(ARRIVAL_2.getArrivalKey().getTime().toString())
    .getBytes(StandardCharsets.UTF_8));
  public static final SignalDetectionHypothesis HYPOTHESIS_FROM_ARRIVAL_1 = SignalDetectionHypothesis.builder()
    .setId(SignalDetectionHypothesisId.from(detectionId, hypothesis1Id))
    .setData(SignalDetectionHypothesis.Data.builder()
      .setRejected(false)
      .setMonitoringOrganization(MONITORING_ORG)
      .setStation(STATION)
      .addMeasurement(FeatureMeasurement.from(ARRIVAL_CHANNEL,
        ARRIVAL_CHANNEL_SEGMENT,
        FeatureMeasurementTypes.ARRIVAL_TIME,
        ArrivalTimeMeasurementValue.from(InstantValue.from(ARRIVAL_1.getArrivalKey().getTime(), Duration.ofSeconds(1)),
          Optional.empty())))
      .addMeasurement(FeatureMeasurement.from(ARRIVAL_CHANNEL,
        ARRIVAL_CHANNEL_SEGMENT,
        FeatureMeasurementTypes.PHASE,
        PHASE_MEASUREMENT))
      .build())
    .build();

  public static final SignalDetectionHypothesis HYPOTHESIS_FROM_ARRIVAL_2 = SignalDetectionHypothesis.builder()
    .setId(SignalDetectionHypothesisId.from(detectionId, hypothesis2Id))
    .setData(SignalDetectionHypothesis.Data.builder()
      .setRejected(false)
      .setMonitoringOrganization(MONITORING_ORG)
      .setStation(STATION)
      .setParentSignalDetectionHypothesisId(Optional.of(hypothesis1Id))
      .addMeasurement(FeatureMeasurement.from(ARRIVAL_CHANNEL,
        ARRIVAL_CHANNEL_SEGMENT,
        FeatureMeasurementTypes.ARRIVAL_TIME,
        ArrivalTimeMeasurementValue.from(InstantValue.from(ARRIVAL_2.getArrivalKey().getTime(),
          Duration.ofSeconds(1)),
          Optional.empty())))
      .addMeasurement(FeatureMeasurement.from(ARRIVAL_CHANNEL,
        ARRIVAL_CHANNEL_SEGMENT,
        FeatureMeasurementTypes.PHASE,
        PHASE_MEASUREMENT))
      .build())
    .build();

  public static final SignalDetection DETECTION_FROM_ARRIVAL = SignalDetection.from(SignalDetectionId.from(detectionId),
    Optional.of(SignalDetection.Data.builder()
      .setMonitoringOrganization(MONITORING_ORG)
      .setStation(STATION)
      .setSignalDetectionHypotheses(List.of(HYPOTHESIS_FROM_ARRIVAL_1))
      .build()));

  public static final SignalDetection DETECTION_FROM_BOTH_ARRIVALS = SignalDetection.from(SignalDetectionId.from(detectionId),
    Optional.of(SignalDetection.Data.builder()
      .setMonitoringOrganization(MONITORING_ORG)
      .setStation(STATION)
      .setSignalDetectionHypotheses(List.of(HYPOTHESIS_FROM_ARRIVAL_1, HYPOTHESIS_FROM_ARRIVAL_2))
      .build()));

  //--------------------------SignalDetections with ChannelSegment--------------------

  public static final SignalDetectionsWithChannelSegments SIGNAL_DETECTIONS_WITH_CHANNEL_SEGMENTS1 =
    SignalDetectionsWithChannelSegments.builder()
      .addSignalDetection(DETECTION_FROM_ARRIVAL)
      .addChannelSegment(ARRIVAL_CHANNEL_SEGMENT)
      .build();

  public static final SignalDetectionsWithChannelSegments SIGNAL_DETECTIONS_WITH_CHANNEL_SEGMENTS2 =
    SignalDetectionsWithChannelSegments.builder()
      .addSignalDetection(DETECTION_FROM_ARRIVAL)
      .addSignalDetection(DETECTION_FROM_BOTH_ARRIVALS)
      .addChannelSegment(ARRIVAL_CHANNEL_SEGMENT)
      .build();


  public static final SignalDetectionsWithChannelSegments DETECTIONS_WITH_CHANNEL_SEGMENTS = SignalDetectionsWithChannelSegments.builder()
    .addSignalDetection(SIGNAL_DETECTION)
    .addChannelSegment(ARRIVAL_TIME_FEATURE_MEASUREMENT.getMeasuredChannelSegment())
    .addChannelSegment(PHASE_FEATURE_MEASUREMENT.getMeasuredChannelSegment())
    .build();

  public static final Collection<ChannelSegmentDescriptor> CHANNEL_SEGMENT_DESCRIPTORS = List.of(channelSegmentDescriptor, channelSegmentDescriptor2);

}
















