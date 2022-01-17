package gms.shared.signaldetection.converter.measurementvalue.specs;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.values.FirstMotionMeasurementValue;
import gms.shared.signaldetection.dao.css.ArrivalDao;

import java.util.stream.Stream;

public class FirstMotionMeasurementValueConverterSpec implements MeasurementValueConverterSpec<FirstMotionMeasurementValue> {
  private FirstMotionMeasurementValueConverterSpec() {
  }

  public static FirstMotionMeasurementValueConverterSpec create() {
    return new FirstMotionMeasurementValueConverterSpec();
  }

  @Override
  public Stream<MeasurementValueSpec<FirstMotionMeasurementValue>> accept(MeasurementValueSpecVisitor<FirstMotionMeasurementValue> visitor,
    FeatureMeasurementType<FirstMotionMeasurementValue> type,
    ArrivalDao arrivalDao) {
    return visitor.visit(this, type, arrivalDao);
  }
}
