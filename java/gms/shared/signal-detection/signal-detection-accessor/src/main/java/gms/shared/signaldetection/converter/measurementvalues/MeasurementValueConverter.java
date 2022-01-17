package gms.shared.signaldetection.converter.measurementvalues;

import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;

import java.util.Optional;

/**
 * Base signal detection measurement value converter for initializing
 * objects needed for the measurement value converters
 */
public interface MeasurementValueConverter<V> {

  Optional<V> convert(MeasurementValueSpec<V> measurementValueSpec);
}
