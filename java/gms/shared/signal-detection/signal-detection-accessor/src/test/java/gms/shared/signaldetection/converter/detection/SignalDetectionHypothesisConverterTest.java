package gms.shared.signaldetection.converter.detection;

import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisConverterId;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import gms.shared.waveform.coi.Waveform;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_CHANNEL;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_CHANNEL_SEGMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.MONITORING_ORG;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.PHASE_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ENTITY_REFERENCE;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ID;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_ID;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.converterId;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.detectionId;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static org.junit.Assert.fail;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SignalDetectionHypothesisConverterTest {

  @Mock
  private FeatureMeasurementConverterInterface featureMeasurementConverter;

  private SignalDetectionHypothesisConverter converter;

  @BeforeEach
  void setup() {
    converter = SignalDetectionHypothesisConverter.create(featureMeasurementConverter);
  }

  @Test
  void testCreateValidation() {
    assertThrows(NullPointerException.class, () -> SignalDetectionHypothesisConverter.create(null));
  }

  @Test
  void testCreate() {
    SignalDetectionHypothesisConverter converter =
      Assertions.assertDoesNotThrow(() -> SignalDetectionHypothesisConverter.create(featureMeasurementConverter));
    assertNotNull(converter);
  }

  @ParameterizedTest
  @MethodSource("getConvertToEntityReferenceValidationArguments")
  void testConvertToEntityReferenceValidation(Class<? extends Exception> expectedException,
    String stageId,
    UUID detectionId,
    ArrivalDao arrivalDao) {

    assertThrows(expectedException,
      () -> converter.convertToEntityReference(stageId, detectionId, arrivalDao));
  }


  @ParameterizedTest
  @MethodSource("getConvertValidationArguments")
  void testConvertValidation(Class<? extends Exception> expectedException,
    SignalDetectionHypothesisConverterId converterId,
    ArrivalDao arrivalDao,
    String monitoringOrganization,
    Station station,
    Channel channel,
    ChannelSegment<? extends Timeseries> channelSegment) {

    assertThrows(expectedException,
      () -> converter.convert(converterId, arrivalDao,
        monitoringOrganization, station, channel, channelSegment));
  }

  static Stream<Arguments> getConvertToEntityReferenceValidationArguments() {
    return Stream.of(
      arguments(NullPointerException.class,
        null,
        UUID.randomUUID(),
        ARRIVAL_1),
      arguments(NullPointerException.class,
        STAGE_1,
        null,
        ARRIVAL_1),
      arguments(NullPointerException.class,
        STAGE_1,
        UUID.randomUUID(),
        null)
    );
  }

  static Stream<Arguments> getConvertValidationArguments() {
    return Stream.of(
      arguments(NullPointerException.class,
        null,
        ARRIVAL_1,
        MONITORING_ORG,
        STATION,
        ARRIVAL_CHANNEL,
        ARRIVAL_CHANNEL_SEGMENT),
      arguments(NullPointerException.class,
        converterId,
        null,
        MONITORING_ORG,
        STATION,
        ARRIVAL_CHANNEL,
        ARRIVAL_CHANNEL_SEGMENT),
      arguments(NullPointerException.class,
        converterId,
        ARRIVAL_1,
        null,
        STATION,
        ARRIVAL_CHANNEL,
        ARRIVAL_CHANNEL_SEGMENT),
      arguments(NullPointerException.class,
        converterId,
        ARRIVAL_1,
        MONITORING_ORG,
        null,
        ARRIVAL_CHANNEL,
        ARRIVAL_CHANNEL_SEGMENT),
      arguments(NullPointerException.class,
        converterId,
        ARRIVAL_1,
        MONITORING_ORG,
        STATION,
        null,
        ARRIVAL_CHANNEL_SEGMENT),
      arguments(NullPointerException.class,
        converterId,
        ARRIVAL_1,
        MONITORING_ORG,
        STATION,
        ARRIVAL_CHANNEL,
        null));
  }

  @Test
  void testConvertToEntityReferenceArguments() {
    Optional<SignalDetectionHypothesis> actual = converter.convertToEntityReference(STAGE_1,
      SIGNAL_DETECTION_ID, ARRIVAL_1);

    assertTrue(actual.isPresent());
    assertEquals(SIGNAL_DETECTION_HYPOTHESIS_ENTITY_REFERENCE, actual.get());
  }

  @ParameterizedTest
  @MethodSource("getConvertArguments")
  void testConvert(SignalDetectionHypothesis expected,
    List<Consumer<FeatureMeasurementConverterInterface>> setupMocks,
    SignalDetectionHypothesisConverterId converterId,
    ArrivalDao arrivalDao,
    String monitoringOrganization,
    Station station,
    Channel channel,
    ChannelSegment<? extends Timeseries> channelSegment) {

    setupMocks.forEach(mock -> mock.accept(featureMeasurementConverter));

    Optional<SignalDetectionHypothesis> actual = converter.convert(converterId,
      arrivalDao,
      monitoringOrganization,
      station,
      channel,
      channelSegment);

    assertTrue(actual.isPresent());
    assertEquals(expected, actual.get());
  }

  static Stream<Arguments> getConvertArguments() {

    // ArrivalTime FeatureMeasurement createMeasurementValueSpec setup
    Consumer<FeatureMeasurementConverterInterface> arrivalSpecSetup = fmConverter ->
      when(fmConverter.createMeasurementValueSpec(FeatureMeasurementTypes.ARRIVAL_TIME,
        ARRIVAL_1))
        .thenReturn(Stream.of(ARRIVAL_MEASUREMENT_SPEC));

    // Phase FeatureMeasurement createMeasurementValueSpec setup
    Consumer<FeatureMeasurementConverterInterface> phaseSpecSetup = fmConverter ->
      when(fmConverter.createMeasurementValueSpec(FeatureMeasurementTypes.PHASE,
        ARRIVAL_1))
        .thenReturn(Stream.of(PHASE_MEASUREMENT_SPEC));

    // ArrivalTime FeatureMeasurement converter setup
    Consumer<FeatureMeasurementConverterInterface> singleArrivalSetup = fmConverter ->
      when(fmConverter.convert(ARRIVAL_MEASUREMENT_SPEC,
        ARRIVAL_CHANNEL, ARRIVAL_CHANNEL_SEGMENT))
        .thenReturn(Optional.of(ARRIVAL_TIME_FEATURE_MEASUREMENT));

    // Phase FeatureMeasurement converter setup
    Consumer<FeatureMeasurementConverterInterface> singlePhaseSetup = fmConverter ->
      when(fmConverter.convert(PHASE_MEASUREMENT_SPEC,
        ARRIVAL_CHANNEL, ARRIVAL_CHANNEL_SEGMENT))
        .thenReturn(Optional.of(PHASE_FEATURE_MEASUREMENT));

    List<Consumer<FeatureMeasurementConverterInterface>> fmSetupList = List.of(
      arrivalSpecSetup,
      phaseSpecSetup,
      singleArrivalSetup,
      singlePhaseSetup);

    return Stream.of(
      arguments(SIGNAL_DETECTION_HYPOTHESIS,
        fmSetupList,
        converterId,
        ARRIVAL_1,
        MONITORING_ORG,
        STATION,
        ARRIVAL_CHANNEL,
        ARRIVAL_CHANNEL_SEGMENT));
  }
}
