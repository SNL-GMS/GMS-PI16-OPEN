package gms.shared.signaldetection.converter.detection;

import com.google.common.base.Preconditions;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.converter.measurementvalue.specs.ArrivalTimeMeasurementValueConverterSpec;
import gms.shared.signaldetection.converter.measurementvalue.specs.EmergenceAngleMeasurementValueConverterSpec;
import gms.shared.signaldetection.converter.measurementvalue.specs.FirstMotionMeasurementValueConverterSpec;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueConverterSpec;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueConverterVisitor;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;
import gms.shared.signaldetection.converter.measurementvalue.specs.PhaseTypeMeasurementValueConverterSpec;
import gms.shared.signaldetection.converter.measurementvalue.specs.ReceiverToSourceAzimuthMeasurementValueConverterSpec;
import gms.shared.signaldetection.converter.measurementvalue.specs.RectilinearityMeasurementValueConverterSpec;
import gms.shared.signaldetection.converter.measurementvalue.specs.SlownessMeasurementValueConverterSpec;
import gms.shared.signaldetection.converter.measurementvalues.ArrivalTimeMeasurementValueConverter;
import gms.shared.signaldetection.converter.measurementvalues.EmergenceAngleMeasurementValueConverter;
import gms.shared.signaldetection.converter.measurementvalues.FirstMotionMeasurementValueConverter;
import gms.shared.signaldetection.converter.measurementvalues.MeasurementValueConverter;
import gms.shared.signaldetection.converter.measurementvalues.PhaseTypeMeasurementValueConverter;
import gms.shared.signaldetection.converter.measurementvalues.ReceiverToSourceAzimuthMeasurementValueConverter;
import gms.shared.signaldetection.converter.measurementvalues.RectilinearityMeasurementValueConverter;
import gms.shared.signaldetection.converter.measurementvalues.SlownessMeasurementValueConverter;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;

import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Supplier;
import java.util.stream.Stream;

public class FeatureMeasurementConverter implements FeatureMeasurementConverterInterface {

  // initialize the maps from measurement types to value specs and signal detection converter functions
  private static final Map<FeatureMeasurementType<?>,
    Supplier<? extends MeasurementValueConverter<?>>> featureMeasurementFunctionMap = Map.of(
    FeatureMeasurementTypes.ARRIVAL_TIME, ArrivalTimeMeasurementValueConverter::create,
    FeatureMeasurementTypes.PHASE, PhaseTypeMeasurementValueConverter::create,
    FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH, ReceiverToSourceAzimuthMeasurementValueConverter::create,
    FeatureMeasurementTypes.SLOWNESS, SlownessMeasurementValueConverter::create,
    FeatureMeasurementTypes.EMERGENCE_ANGLE, EmergenceAngleMeasurementValueConverter::create,
    FeatureMeasurementTypes.RECTILINEARITY, RectilinearityMeasurementValueConverter::create,
    FeatureMeasurementTypes.SHORT_PERIOD_FIRST_MOTION, FirstMotionMeasurementValueConverter::create,
    FeatureMeasurementTypes.LONG_PERIOD_FIRST_MOTION, FirstMotionMeasurementValueConverter::create);
  private static final Map<FeatureMeasurementType<?>,
    Supplier<? extends MeasurementValueConverterSpec<?>>> featureMeasurementSpecMap = Map.of(
    FeatureMeasurementTypes.ARRIVAL_TIME, ArrivalTimeMeasurementValueConverterSpec::create,
    FeatureMeasurementTypes.PHASE, PhaseTypeMeasurementValueConverterSpec::create,
    FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH, ReceiverToSourceAzimuthMeasurementValueConverterSpec::create,
    FeatureMeasurementTypes.SLOWNESS, SlownessMeasurementValueConverterSpec::create,
    FeatureMeasurementTypes.EMERGENCE_ANGLE, EmergenceAngleMeasurementValueConverterSpec::create,
    FeatureMeasurementTypes.RECTILINEARITY, RectilinearityMeasurementValueConverterSpec::create,
    FeatureMeasurementTypes.SHORT_PERIOD_FIRST_MOTION, FirstMotionMeasurementValueConverterSpec::create,
    FeatureMeasurementTypes.LONG_PERIOD_FIRST_MOTION, FirstMotionMeasurementValueConverterSpec::create);


  private FeatureMeasurementConverter() {
  }

  public static FeatureMeasurementConverter create() {
    return new FeatureMeasurementConverter();
  }

  @Override
  public <V> Stream<MeasurementValueSpec<V>> createMeasurementValueSpec(
    FeatureMeasurementType<V> featureMeasurementType,
    ArrivalDao arrivalDao) {

    Objects.requireNonNull(featureMeasurementType);
    Objects.requireNonNull(arrivalDao);
    Preconditions.checkState(featureMeasurementSpecMap.containsKey(featureMeasurementType),
      "Converter not found for measurement type: %s", featureMeasurementType);

    MeasurementValueConverterSpec<V> converterSpec = (MeasurementValueConverterSpec<V>)
      featureMeasurementSpecMap.get(featureMeasurementType).get();
    return converterSpec.accept(MeasurementValueConverterVisitor.create(), featureMeasurementType, arrivalDao);
  }

  @Override
  public <V> Optional<FeatureMeasurement<V>> convert(MeasurementValueSpec<V> measurementValueSpec,
    Channel channel,
    ChannelSegment<? extends Timeseries> channelSegment) {

    Objects.requireNonNull(measurementValueSpec);
    Objects.requireNonNull(channel);
    Objects.requireNonNull(channelSegment);

    FeatureMeasurementType<V> featureMeasurementType = measurementValueSpec.getFeatureMeasurementType();
    Preconditions.checkState(featureMeasurementSpecMap.containsKey(featureMeasurementType),
      "Converter not found for measurement type: %s", featureMeasurementType);

    // searches the map for the measurement value spec
    MeasurementValueConverter<V> converter = (MeasurementValueConverter<V>)
      featureMeasurementFunctionMap.get(featureMeasurementType).get();

    Optional<V> valueOpt = converter.convert(measurementValueSpec);
    return valueOpt.map(value ->
      FeatureMeasurement.from(
        channel, channelSegment, featureMeasurementType, value));
  }
}
