package gms.shared.signaldetection.converter.measurementvalue.specs;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.FirstMotionMeasurementValue;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.function.Consumer;
import java.util.stream.Stream;

import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.LONG_PERIOD_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SHORT_PERIOD_MEASUREMENT_SPEC;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FirstMotionMeasurementValueConverterSpecTest extends MeasurementValueConverterTest<FirstMotionMeasurementValue> {
  protected FirstMotionMeasurementValueConverterSpec converterSpec;

  @BeforeEach
  void setup() {
    converterSpec = FirstMotionMeasurementValueConverterSpec.create();
  }

  @ParameterizedTest
  @MethodSource("getTestConvertSpecArguments")
  void testAccept(
    FeatureMeasurementType<FirstMotionMeasurementValue> featureMeasurementType,
    MeasurementValueSpec<FirstMotionMeasurementValue> measurementValueSpec,
    ArrivalDao arrivalDao) {

    testConverterSpec(measurementValueSpec,
      featureMeasurementType,
      converterSpec,
      buildSpecVisitorConsumer(featureMeasurementType, measurementValueSpec, arrivalDao),
      arrivalDao);
  }

  static Stream<Arguments> getTestConvertSpecArguments() {
    return Stream.of(
      arguments(FeatureMeasurementTypes.SHORT_PERIOD_FIRST_MOTION,
        SHORT_PERIOD_MEASUREMENT_SPEC,
        ARRIVAL_1),
      arguments(FeatureMeasurementTypes.LONG_PERIOD_FIRST_MOTION,
        LONG_PERIOD_MEASUREMENT_SPEC,
        ARRIVAL_3)
      );
  }

  @Override
  Consumer<MeasurementValueSpecVisitor<FirstMotionMeasurementValue>> buildSpecVisitorConsumer(
    FeatureMeasurementType<FirstMotionMeasurementValue> featureMeasurementType,
    MeasurementValueSpec<FirstMotionMeasurementValue> measurementValueSpec,
    ArrivalDao arrivalDao) {

    // Measurement value spec visitor setup
    return visitor ->
      when(visitor.visit(converterSpec,
        featureMeasurementType,
        arrivalDao))
        .thenReturn(Stream.of(measurementValueSpec));
  }

}