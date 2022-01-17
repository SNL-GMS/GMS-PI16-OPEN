package gms.shared.signaldetection.coi.detection;

import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.FirstMotionMeasurementValue;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.signaldetection.coi.values.AmplitudeMeasurementValue;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.utilities.test.TestUtilities;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;


import java.io.IOException;
import java.io.Serializable;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.stream.Stream;

/**
 * Tests {@link FeatureMeasurement} factory creation
 */
class FeatureMeasurementTests {

  /**
   * Tests that all combinations of malformed arguments passed to {@link
   * FeatureMeasurement#from(Channel, ChannelSegment, String, Object, Optional<DoubleValue>)} result
   * in the correct exceptions being thrown.
   */
  @ParameterizedTest
  @MethodSource("testMalformedArgumentsJsonCreatorProvider")
  <V extends Serializable> void testMalformedArgumentsJsonCreator(
      Channel channel,
      ChannelSegment<Waveform> channelSegment,
      String stringType,
      V measurementValue,
      Optional<DoubleValue> snr,
      Class<Throwable> expectedExceptionClass) {

    Throwable exception = Assertions.assertThrows(expectedExceptionClass, () -> {
      FeatureMeasurement.from(
          channel,
          channelSegment,
          stringType,
          measurementValue,
          snr
      );
    });
  }

  @Test
  void testSerializationPhaseMeasurement() throws IOException {
    TestUtilities.testSerialization(SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT,
        FeatureMeasurement.class);
  }

  @Test
  void testSerializationFirstMotionMeasurement() throws IOException {
    TestUtilities.testSerialization(SignalDetectionTestFixtures.LONG_PERIOD_FIRST_MOTION_FEATURE_MEASUREMENT,
        FeatureMeasurement.class);
  }

  @Test
  void testSerializationNumericalMeasurement() throws IOException {
    TestUtilities.testSerialization(SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT,
        FeatureMeasurement.class);
  }

  @Test
  void testSerializationAmplitudeMeasurement() throws IOException {
    TestUtilities.testSerialization(SignalDetectionTestFixtures.AMPLITUDE_FEATURE_MEASUREMENT,
        FeatureMeasurement.class);
  }

  @Test
  void testSerializationInstantMeasurement() throws IOException {
    TestUtilities.testSerialization(SignalDetectionTestFixtures.INSTANT_FEATURE_MEASUREMENT,
        FeatureMeasurement.class);
  }

  @Test
  void testSerializationBaseMeasurementValue() throws IOException {
    TestUtilities
        .testSerialization(SignalDetectionTestFixtures.standardDoubleValue, DoubleValue.class);
    TestUtilities
        .testSerialization(SignalDetectionTestFixtures.ARRIVAL_TIME_MEASUREMENT, ArrivalTimeMeasurementValue.class);
    TestUtilities.testSerialization(SignalDetectionTestFixtures.PHASE_MEASUREMENT,
        PhaseTypeMeasurementValue.class);
    TestUtilities.testSerialization(SignalDetectionTestFixtures.firstMotionMeasurement,
        FirstMotionMeasurementValue.class);
    TestUtilities.testSerialization(SignalDetectionTestFixtures.amplitudeMeasurement,
        AmplitudeMeasurementValue.class);
    TestUtilities
        .testSerialization(SignalDetectionTestFixtures.instantMeasurement, InstantValue.class);
  }

  private static Stream<Arguments> testMalformedArgumentsJsonCreatorProvider() {

    String stringType = FeatureMeasurementTypes.ARRIVAL_TIME.getFeatureMeasurementTypeName();
    InstantValue instantValue = InstantValue.from(
        Instant.EPOCH,
        Duration.ofMillis(2)
    );

    Optional<DoubleValue> snr = Optional.of(DoubleValue.from(1.0, Optional.of(0.1), Units.DEGREES));

    return Stream.of(
        Arguments.arguments(
            null,
            WaveformTestFixtures.singleStationEpochStart100RandomSamples(),
            stringType,
            instantValue,
            snr,
            NullPointerException.class),
        Arguments.arguments(
            UtilsTestFixtures.CHANNEL,
            null,
            stringType,
            instantValue,
            snr,
            NullPointerException.class),
        Arguments.arguments(
            UtilsTestFixtures.CHANNEL,
            WaveformTestFixtures.singleStationEpochStart100RandomSamples(),
            null,
            instantValue,
            snr,
            NullPointerException.class),
        Arguments.arguments(
            UtilsTestFixtures.CHANNEL,
            WaveformTestFixtures.singleStationEpochStart100RandomSamples(),
            stringType,
            null,
            snr,
            NullPointerException.class)
    );
  }
}
