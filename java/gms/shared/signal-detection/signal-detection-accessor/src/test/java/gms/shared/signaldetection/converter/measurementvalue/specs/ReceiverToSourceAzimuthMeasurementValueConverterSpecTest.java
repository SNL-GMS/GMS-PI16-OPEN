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
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.RECEIVER_AZIMUTH_MEASUREMENT_SPEC;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReceiverToSourceAzimuthMeasurementValueConverterSpecTest extends MeasurementValueConverterTest<NumericMeasurementValue> {
  protected ReceiverToSourceAzimuthMeasurementValueConverterSpec converterSpec;

  @BeforeEach
  void setup() {
    converterSpec = ReceiverToSourceAzimuthMeasurementValueConverterSpec.create();
  }

  @Test
  void testAccept() {
    testConverterSpec(RECEIVER_AZIMUTH_MEASUREMENT_SPEC,
      FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH,
      converterSpec,
      buildSpecVisitorConsumer(FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH, RECEIVER_AZIMUTH_MEASUREMENT_SPEC, ARRIVAL_1),
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