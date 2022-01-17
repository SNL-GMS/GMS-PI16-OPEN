package gms.shared.signaldetection.converter.measurementvalue.specs;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.stationdefinition.coi.utils.Units;

import java.util.stream.Collectors;
import java.util.stream.Stream;

public class MeasurementValueConverterVisitor<V> implements MeasurementValueSpecVisitor<V> {

  private MeasurementValueConverterVisitor()  {
  }

  public static <V> MeasurementValueConverterVisitor<V> create() {
    return new MeasurementValueConverterVisitor<>();
  }
  @Override
  public Stream<MeasurementValueSpec<V>> visit(ArrivalTimeMeasurementValueConverterSpec spec, FeatureMeasurementType<V> type, ArrivalDao arrivalDao) {
    return Stream.of(MeasurementValueSpec.<V>builder()
      .setArrivalDao(arrivalDao)
      .setFeatureMeasurementType(type)
      .build());
  }

  @Override
  public Stream<MeasurementValueSpec<V>> visit(EmergenceAngleMeasurementValueConverterSpec spec, FeatureMeasurementType<V> type, ArrivalDao arrivalDao) {
    return Stream.of(MeasurementValueSpec.<V>builder()
      .setArrivalDao(arrivalDao)
      .setFeatureMeasurementType(type)
      .setMeasuredValueExtractor(ArrivalDao::getEmergenceAngle)
      .setUnits(Units.DEGREES)
      .build());
  }

  @Override
  public Stream<MeasurementValueSpec<V>> visit(FirstMotionMeasurementValueConverterSpec spec, FeatureMeasurementType<V> type, ArrivalDao arrivalDao) {
    return arrivalDao.getFirstMotion().chars()
      .mapToObj(code -> MeasurementValueSpec.<V>builder()
        .setArrivalDao(arrivalDao)
        .setFeatureMeasurementType(type)
        .setFeatureMeasurementTypeCode(Character.toString(code))
        .build()).collect(Collectors.toList()).stream();
  }

  @Override
  public Stream<MeasurementValueSpec<V>> visit(PhaseTypeMeasurementValueConverterSpec spec, FeatureMeasurementType<V> type, ArrivalDao arrivalDao) {
    return Stream.of(MeasurementValueSpec.<V>builder()
      .setArrivalDao(arrivalDao)
      .setFeatureMeasurementType(type)
      .build());
  }

  @Override
  public Stream<MeasurementValueSpec<V>> visit(ReceiverToSourceAzimuthMeasurementValueConverterSpec spec, FeatureMeasurementType<V> type, ArrivalDao arrivalDao) {
    return Stream.of(MeasurementValueSpec.<V>builder()
      .setArrivalDao(arrivalDao)
      .setFeatureMeasurementType(type)
      .setMeasuredValueExtractor(ArrivalDao::getAzimuth)
      .setUncertaintyValueExtractor(ArrivalDao::getAzimuthUncertainty)
      .setUnits(Units.DEGREES)
      .build());
  }

  @Override
  public Stream<MeasurementValueSpec<V>> visit(RectilinearityMeasurementValueConverterSpec spec, FeatureMeasurementType<V> type, ArrivalDao arrivalDao) {
    return Stream.of(MeasurementValueSpec.<V>builder()
      .setArrivalDao(arrivalDao)
      .setFeatureMeasurementType(type)
      .setMeasuredValueExtractor(ArrivalDao::getRectilinearity)
      .setUnits(Units.UNITLESS)
      .build());
  }

  @Override
  public Stream<MeasurementValueSpec<V>> visit(SlownessMeasurementValueConverterSpec spec, FeatureMeasurementType<V> type, ArrivalDao arrivalDao) {
    return Stream.of(MeasurementValueSpec.<V>builder()
      .setArrivalDao(arrivalDao)
      .setFeatureMeasurementType(type)
      .setMeasuredValueExtractor(ArrivalDao::getSlowness)
      .setUnits(Units.SECONDS_PER_DEGREE)
      .build());
  }
}
