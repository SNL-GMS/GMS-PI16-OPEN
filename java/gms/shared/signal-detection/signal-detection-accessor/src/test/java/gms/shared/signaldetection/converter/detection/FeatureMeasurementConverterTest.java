package gms.shared.signaldetection.converter.detection;

import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.stream.Stream;

import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_CHANNEL;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_CHANNEL_SEGMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.LONG_PERIOD_FIRST_MOTION_FEATURE_MEASUREMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.LONG_PERIOD_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.PHASE_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.RECEIVER_AZIMUTH_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.waveform.testfixture.WaveformTestFixtures.CHANNEL_SEGMENT;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;

@ExtendWith(MockitoExtension.class)
class FeatureMeasurementConverterTest {

  private FeatureMeasurementConverter converter;

  @BeforeEach
  void setup() {
    converter = FeatureMeasurementConverter.create();
  }

  @ParameterizedTest
  @MethodSource("getCreateMeasurementValueSpecValidationArguments")
  <V> void testCreateMeasurementValueSpecValidation(Class<? extends Exception> expectedException,
    FeatureMeasurementType<V> featureMeasurementType,
    ArrivalDao arrivalDao) {

    assertThrows(expectedException,
      () -> converter.createMeasurementValueSpec(featureMeasurementType, arrivalDao));
  }

  @ParameterizedTest
  @MethodSource("getConvertValidationArguments")
  <V> void testConvertValidation(Class<? extends Exception> expectedException,
    MeasurementValueSpec<V> spec,
    Channel channel,
    ChannelSegment<Waveform> channelSegment) {

    assertThrows(expectedException,
      () -> converter.convert(spec, channel, channelSegment));
  }

  static Stream<Arguments> getCreateMeasurementValueSpecValidationArguments() {
    return Stream.of(
      arguments(NullPointerException.class,
        null,
        ARRIVAL_1),
      arguments(NullPointerException.class,
        FeatureMeasurementTypes.ARRIVAL_TIME,
        null)
    );
  }

  static Stream<Arguments> getConvertValidationArguments() {

    return Stream.of(
      arguments(NullPointerException.class,
        null,
        ARRIVAL_CHANNEL,
        ARRIVAL_CHANNEL_SEGMENT
      ),
      arguments(NullPointerException.class,
        ARRIVAL_MEASUREMENT_SPEC,
        null,
        ARRIVAL_CHANNEL_SEGMENT
      ),
      arguments(NullPointerException.class,
        ARRIVAL_MEASUREMENT_SPEC,
        ARRIVAL_CHANNEL,
        null
      )
    );
  }

  @ParameterizedTest
  @MethodSource("getCreateMeasurementValueSpecArguments")
  <V> void testCreateMeasurementValueSpec(Stream<MeasurementValueSpec<V>> expected,
    FeatureMeasurementType<V> featureMeasurementType,
    ArrivalDao arrivalDao) {

    Stream<MeasurementValueSpec<V>> actual = converter.createMeasurementValueSpec(featureMeasurementType,
      arrivalDao);

    assertEquals(expected.findFirst().orElseThrow(), actual.findFirst().orElseThrow());

  }

  @ParameterizedTest
  @MethodSource("getConvertArguments")
  <V> void testConvert(FeatureMeasurement<V> expected,
    MeasurementValueSpec<V> spec,
    Channel channel,
    ChannelSegment<Waveform> channelSegment) {

    Optional<FeatureMeasurement<V>> actual = converter.convert(spec,
      channel,
      channelSegment);

    assertTrue(actual.isPresent());
    assertEquals(expected, actual.get());
  }

  static Stream<Arguments> getCreateMeasurementValueSpecArguments() {
    return Stream.of(
      arguments(Stream.of(ARRIVAL_MEASUREMENT_SPEC),
        FeatureMeasurementTypes.ARRIVAL_TIME,
        ARRIVAL_1),
      arguments(Stream.of(PHASE_MEASUREMENT_SPEC),
        FeatureMeasurementTypes.PHASE,
        ARRIVAL_1));
  }

  static Stream<Arguments> getConvertArguments() {
    return Stream.of(
      arguments(ARRIVAL_TIME_FEATURE_MEASUREMENT,
        ARRIVAL_MEASUREMENT_SPEC,
        CHANNEL,
        CHANNEL_SEGMENT
      ),
      arguments(LONG_PERIOD_FIRST_MOTION_FEATURE_MEASUREMENT,
        LONG_PERIOD_MEASUREMENT_SPEC,
        CHANNEL,
        CHANNEL_SEGMENT
      ),
      arguments(RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT,
        RECEIVER_AZIMUTH_MEASUREMENT_SPEC,
        CHANNEL,
        CHANNEL_SEGMENT
      )

    );
  }
}
