package gms.shared.signaldetection.converter.measurementvalue.specs;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.function.Consumer;
import java.util.stream.Stream;

import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SLOWNESS_MEASUREMENT_SPEC;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SlownessMeasurementValueConverterSpecTest extends MeasurementValueConverterTest<NumericMeasurementValue> {
  protected SlownessMeasurementValueConverterSpec converterSpec;

  @BeforeEach
  void setup() {
    converterSpec = SlownessMeasurementValueConverterSpec.create();
  }

  @Test
  void testAccept() {
    testConverterSpec(SLOWNESS_MEASUREMENT_SPEC,
      FeatureMeasurementTypes.SLOWNESS,
      converterSpec,
      buildSpecVisitorConsumer(FeatureMeasurementTypes.SLOWNESS, SLOWNESS_MEASUREMENT_SPEC, ARRIVAL_1),
      ARRIVAL_1);
  }

  @Override
  Consumer<MeasurementValueSpecVisitor<NumericMeasurementValue>> buildSpecVisitorConsumer(
    FeatureMeasurementType<NumericMeasurementValue> featureMeasurementType,
    MeasurementValueSpec<NumericMeasurementValue> measurementValueSpec,
    ArrivalDao arrivalDao) {
    // Measurement value spec visitor setup
    return visitor ->
      when(visitor.visit(converterSpec,
        featureMeasurementType,
        arrivalDao))
        .thenReturn(Stream.of(measurementValueSpec));
  }

}