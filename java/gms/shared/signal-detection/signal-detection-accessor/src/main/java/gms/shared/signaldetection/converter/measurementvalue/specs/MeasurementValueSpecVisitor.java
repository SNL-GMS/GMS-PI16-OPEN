package gms.shared.signaldetection.converter.measurementvalue.specs;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.dao.css.ArrivalDao;

import java.util.stream.Stream;

public interface MeasurementValueSpecVisitor<V> {
  Stream<MeasurementValueSpec<V>> visit(ArrivalTimeMeasurementValueConverterSpec spec, FeatureMeasurementType<V> type, ArrivalDao arrivalDao);
  Stream<MeasurementValueSpec<V>> visit(EmergenceAngleMeasurementValueConverterSpec spec, FeatureMeasurementType<V> type, ArrivalDao arrivalDao);
  Stream<MeasurementValueSpec<V>> visit(FirstMotionMeasurementValueConverterSpec spec, FeatureMeasurementType<V> type, ArrivalDao arrivalDao);
  Stream<MeasurementValueSpec<V>> visit(PhaseTypeMeasurementValueConverterSpec spec, FeatureMeasurementType<V> type, ArrivalDao arrivalDao);
  Stream<MeasurementValueSpec<V>> visit(ReceiverToSourceAzimuthMeasurementValueConverterSpec spec, FeatureMeasurementType<V> type, ArrivalDao arrivalDao);
  Stream<MeasurementValueSpec<V>> visit(RectilinearityMeasurementValueConverterSpec spec, FeatureMeasurementType<V> type, ArrivalDao arrivalDao);
  Stream<MeasurementValueSpec<V>> visit(SlownessMeasurementValueConverterSpec spec, FeatureMeasurementType<V> type, ArrivalDao arrivalDao);
}
