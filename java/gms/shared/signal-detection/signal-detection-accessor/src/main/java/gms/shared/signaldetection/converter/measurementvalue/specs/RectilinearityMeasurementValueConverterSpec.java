package gms.shared.signaldetection.converter.measurementvalue.specs;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.dao.css.ArrivalDao;

import java.util.stream.Stream;

public class RectilinearityMeasurementValueConverterSpec implements MeasurementValueConverterSpec<NumericMeasurementValue> {
  private RectilinearityMeasurementValueConverterSpec() {
  }

  public static RectilinearityMeasurementValueConverterSpec create() {
    return new RectilinearityMeasurementValueConverterSpec();
  }

  @Override
  public Stream<MeasurementValueSpec<NumericMeasurementValue>> accept(MeasurementValueSpecVisitor<NumericMeasurementValue> visitor,
    FeatureMeasurementType<NumericMeasurementValue> type,
    ArrivalDao arrivalDao) {
    return visitor.visit(this, type, arrivalDao);
  }
}
