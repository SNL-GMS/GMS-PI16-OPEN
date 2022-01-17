package gms.shared.signaldetection.converter.measurementvalues;

import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.types.PhaseType;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.Instant;
import java.util.Optional;
import java.util.stream.Stream;

import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_4;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;

class PhaseTypeMeasurementValueConverterTest
  extends SignalDetectionMeasurementValueConverterTest<PhaseTypeMeasurementValueConverter> {

  private PhaseTypeMeasurementValueConverter converter;

  @BeforeEach
  void setup() {
    converter = PhaseTypeMeasurementValueConverter.create();
  }

  @Test
  void testCreate() {
    PhaseTypeMeasurementValueConverter converter =
      assertDoesNotThrow(PhaseTypeMeasurementValueConverter::create);
    assertNotNull(converter);
  }

  @ParameterizedTest
  @MethodSource("getTestConvertArguments")
  void testConvert(PhaseTypeMeasurementValue expectedValue,
    MeasurementValueSpec<PhaseTypeMeasurementValue> measurementValueSpec) {

    final Optional<PhaseTypeMeasurementValue> actualValue;
    actualValue = converter.convert(measurementValueSpec);

    assertTrue(actualValue.isPresent());
    assertEquals(expectedValue, actualValue.get());
  }

  static Stream<Arguments> getTestConvertArguments() {
    final PhaseTypeMeasurementValue ptmValue1 = PhaseTypeMeasurementValue.fromFeatureMeasurement(PhaseType.P,
      Optional.empty(), Instant.EPOCH);
    final PhaseTypeMeasurementValue ptmValue2 = PhaseTypeMeasurementValue.fromFeatureMeasurement(PhaseType.I,
      Optional.empty(), Instant.EPOCH.plusSeconds(100));

    MeasurementValueSpec<PhaseTypeMeasurementValue> measurementValueSpec1 = MeasurementValueSpec.<PhaseTypeMeasurementValue>
      builder()
      .setArrivalDao(ARRIVAL_1)
      .setFeatureMeasurementType(FeatureMeasurementTypes.PHASE)
      .build();
    MeasurementValueSpec<PhaseTypeMeasurementValue> measurementValueSpec2 = MeasurementValueSpec.<PhaseTypeMeasurementValue>
      builder()
      .setArrivalDao(ARRIVAL_4)
      .setFeatureMeasurementType(FeatureMeasurementTypes.PHASE)
      .build();

    return Stream.of(
      arguments(ptmValue1, measurementValueSpec1),
      arguments(ptmValue2, measurementValueSpec2)
    );
  }

  @Test
  void testNullArguments() {
    testConvertNull(PhaseTypeMeasurementValueConverter.create());
  }
}
