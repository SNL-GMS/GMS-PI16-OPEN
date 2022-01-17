package gms.shared.signaldetection.converter.measurementvalue.specs;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.function.Consumer;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(MockitoExtension.class)
abstract class MeasurementValueConverterTest<V> {

  @Mock
  private MeasurementValueSpecVisitor<V> specVisitor;

  abstract Consumer<MeasurementValueSpecVisitor<V>> buildSpecVisitorConsumer(
    FeatureMeasurementType<V> featureMeasurementType,
    MeasurementValueSpec<V> measurementValueSpec,
    ArrivalDao arrivalDao);

  void testConverterSpec(MeasurementValueSpec<V> expectedSpec,
    FeatureMeasurementType<V> featureMeasurementType,
    MeasurementValueConverterSpec<V> converterSpec,
    Consumer<MeasurementValueSpecVisitor<V>> specVisitorSetup,
    ArrivalDao arrivalDao) {

    specVisitorSetup.accept(specVisitor);

    Stream<MeasurementValueSpec<V>> valueSpec = converterSpec.accept(specVisitor,
      featureMeasurementType, arrivalDao);

    assertEquals(expectedSpec, valueSpec.findFirst().orElseThrow());
  }
}
