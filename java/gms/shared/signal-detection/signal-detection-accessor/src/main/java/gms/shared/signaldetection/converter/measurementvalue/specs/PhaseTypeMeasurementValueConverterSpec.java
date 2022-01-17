package gms.shared.signaldetection.converter.measurementvalue.specs;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.signaldetection.dao.css.ArrivalDao;

import java.util.stream.Stream;

public class PhaseTypeMeasurementValueConverterSpec implements MeasurementValueConverterSpec<PhaseTypeMeasurementValue> {
  private PhaseTypeMeasurementValueConverterSpec() {
  }

  public static PhaseTypeMeasurementValueConverterSpec create() {
    return new PhaseTypeMeasurementValueConverterSpec();
  }

  @Override
  public Stream<MeasurementValueSpec<PhaseTypeMeasurementValue>> accept(MeasurementValueSpecVisitor<PhaseTypeMeasurementValue> visitor,
    FeatureMeasurementType<PhaseTypeMeasurementValue> type,
    ArrivalDao arrivalDao) {
    return visitor.visit(this, type, arrivalDao);
  }
}
