package gms.shared.signaldetection.converter.measurementvalue.specs;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.FirstMotionMeasurementValue;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.ThrowingSupplier;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.stream.Stream;

import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.EMERGENCE_ANGLE_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.PHASE_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.RECEIVER_AZIMUTH_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.RECTILINEARITY_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SHORT_PERIOD_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SLOWNESS_MEASUREMENT_SPEC;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@ExtendWith(MockitoExtension.class)
class MeasurementValueConverterVisitorTest {
  @Mock
  private ArrivalTimeMeasurementValueConverterSpec arrivalSpec;
  @Mock
  private EmergenceAngleMeasurementValueConverterSpec emergenceSpec;
  @Mock
  private FirstMotionMeasurementValueConverterSpec firstMotionSpec;
  @Mock
  private PhaseTypeMeasurementValueConverterSpec phaseSpec;
  @Mock
  private ReceiverToSourceAzimuthMeasurementValueConverterSpec receiverSpec;
  @Mock
  private RectilinearityMeasurementValueConverterSpec rectilinearitySpec;
  @Mock
  private SlownessMeasurementValueConverterSpec slownessSpec;

  @Test
  <V>
  void testCreate() {
    MeasurementValueConverterVisitor<V> converterVisitor =
      assertDoesNotThrow((ThrowingSupplier<MeasurementValueConverterVisitor<V>>) MeasurementValueConverterVisitor::create);
    assertNotNull(converterVisitor);
  }

  @Test
  void test_visitArrival() {
    MeasurementValueConverterVisitor<ArrivalTimeMeasurementValue> converterVisitor =
      MeasurementValueConverterVisitor.create();
    Stream<MeasurementValueSpec<ArrivalTimeMeasurementValue>> spec = converterVisitor.visit(arrivalSpec,
      FeatureMeasurementTypes.ARRIVAL_TIME, ARRIVAL_1);
    assertEquals(ARRIVAL_MEASUREMENT_SPEC, spec.findFirst().orElseThrow());
  }

  @Test
  void test_visitEmergence() {
    MeasurementValueConverterVisitor<NumericMeasurementValue> converterVisitor = MeasurementValueConverterVisitor.create();
    Stream<MeasurementValueSpec<NumericMeasurementValue>> specStream = converterVisitor.visit(emergenceSpec,
      FeatureMeasurementTypes.EMERGENCE_ANGLE, ARRIVAL_1);
    MeasurementValueSpec<NumericMeasurementValue> spec = specStream.findFirst().orElseThrow();
    assertEquals(EMERGENCE_ANGLE_MEASUREMENT_SPEC.getArrivalDao(), spec.getArrivalDao());
    assertEquals(EMERGENCE_ANGLE_MEASUREMENT_SPEC.getFeatureMeasurementType(), spec.getFeatureMeasurementType());
    assertEquals(EMERGENCE_ANGLE_MEASUREMENT_SPEC.getMeasuredValueExtractor().isPresent(), spec.getMeasuredValueExtractor().isPresent());
    assertEquals(EMERGENCE_ANGLE_MEASUREMENT_SPEC.getUnits(), spec.getUnits());
  }

  @Test
  void test_visitFirstMotion() {
    MeasurementValueConverterVisitor<FirstMotionMeasurementValue> converterVisitor = MeasurementValueConverterVisitor.create();
    Stream<MeasurementValueSpec<FirstMotionMeasurementValue>> spec = converterVisitor.visit(firstMotionSpec,
      FeatureMeasurementTypes.SHORT_PERIOD_FIRST_MOTION, ARRIVAL_1);
    assertEquals(SHORT_PERIOD_MEASUREMENT_SPEC, spec.findFirst().orElseThrow());
  }

  @Test
  void test_visitPhase() {
    MeasurementValueConverterVisitor<PhaseTypeMeasurementValue> converterVisitor = MeasurementValueConverterVisitor.create();
    Stream<MeasurementValueSpec<PhaseTypeMeasurementValue>> spec = converterVisitor.visit(phaseSpec,
      FeatureMeasurementTypes.PHASE, ARRIVAL_1);
    assertEquals(PHASE_MEASUREMENT_SPEC, spec.findFirst().orElseThrow());
  }

  @Test
  void test_visitReceiver() {
    MeasurementValueConverterVisitor<NumericMeasurementValue> converterVisitor = MeasurementValueConverterVisitor.create();
    Stream<MeasurementValueSpec<NumericMeasurementValue>> specStream = converterVisitor.visit(receiverSpec,
      FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH, ARRIVAL_2);
    MeasurementValueSpec<NumericMeasurementValue> spec = specStream.findFirst().orElseThrow();
    assertEquals(RECEIVER_AZIMUTH_MEASUREMENT_SPEC.getArrivalDao(), spec.getArrivalDao());
    assertEquals(RECEIVER_AZIMUTH_MEASUREMENT_SPEC.getFeatureMeasurementType(), spec.getFeatureMeasurementType());
    assertEquals(RECEIVER_AZIMUTH_MEASUREMENT_SPEC.getMeasuredValueExtractor().isPresent(), spec.getMeasuredValueExtractor().isPresent());
    assertEquals(RECEIVER_AZIMUTH_MEASUREMENT_SPEC.getUncertaintyValueExtractor().isPresent(), spec.getUncertaintyValueExtractor().isPresent());
    assertEquals(RECEIVER_AZIMUTH_MEASUREMENT_SPEC.getUnits(), spec.getUnits());
  }

  @Test
  void test_visitRectilinearity() {
    MeasurementValueConverterVisitor<NumericMeasurementValue> converterVisitor = MeasurementValueConverterVisitor.create();
    Stream<MeasurementValueSpec<NumericMeasurementValue>> specStream = converterVisitor.visit(rectilinearitySpec,
      FeatureMeasurementTypes.RECTILINEARITY, ARRIVAL_1);
    MeasurementValueSpec<NumericMeasurementValue> spec = specStream.findFirst().orElseThrow();
    assertEquals(RECTILINEARITY_MEASUREMENT_SPEC.getArrivalDao(), spec.getArrivalDao());
    assertEquals(RECTILINEARITY_MEASUREMENT_SPEC.getArrivalDao(), spec.getArrivalDao());
    assertEquals(RECTILINEARITY_MEASUREMENT_SPEC.getArrivalDao(), spec.getArrivalDao());
    assertEquals(RECTILINEARITY_MEASUREMENT_SPEC.getArrivalDao(), spec.getArrivalDao());
  }

  @Test
  void test_visitSlowness() {
    MeasurementValueConverterVisitor<NumericMeasurementValue> converterVisitor = MeasurementValueConverterVisitor.create();
    Stream<MeasurementValueSpec<NumericMeasurementValue>> specStream = converterVisitor.visit(slownessSpec,
      FeatureMeasurementTypes.SLOWNESS, ARRIVAL_1);
    MeasurementValueSpec<NumericMeasurementValue> spec = specStream.findFirst().orElseThrow();
    assertEquals(SLOWNESS_MEASUREMENT_SPEC.getArrivalDao(), spec.getArrivalDao());
    assertEquals(SLOWNESS_MEASUREMENT_SPEC.getFeatureMeasurementType(), spec.getFeatureMeasurementType());
    assertEquals(SLOWNESS_MEASUREMENT_SPEC.getMeasuredValueExtractor().isPresent(), spec.getMeasuredValueExtractor().isPresent());
    assertEquals(SLOWNESS_MEASUREMENT_SPEC.getUnits(), spec.getUnits());
  }
}