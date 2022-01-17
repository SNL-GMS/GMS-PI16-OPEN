package gms.shared.signaldetection.converter.measurementvalue.specs;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.dao.css.ArrivalDao;

import java.util.stream.Stream;

public class ArrivalTimeMeasurementValueConverterSpec implements MeasurementValueConverterSpec<ArrivalTimeMeasurementValue>  {
  private ArrivalTimeMeasurementValueConverterSpec() {
  }

  public static ArrivalTimeMeasurementValueConverterSpec create() {
    return new ArrivalTimeMeasurementValueConverterSpec();
  }

  @Override
  public Stream<MeasurementValueSpec<ArrivalTimeMeasurementValue>> accept(MeasurementValueSpecVisitor<ArrivalTimeMeasurementValue> visitor,
    FeatureMeasurementType<ArrivalTimeMeasurementValue> type,
    ArrivalDao arrivalDao) {
    return visitor.visit(this, type, arrivalDao);
  }
}
