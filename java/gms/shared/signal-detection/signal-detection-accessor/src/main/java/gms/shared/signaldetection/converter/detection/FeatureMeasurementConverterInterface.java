package gms.shared.signaldetection.converter.detection;

import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;

import java.util.Optional;
import java.util.stream.Stream;

public interface FeatureMeasurementConverterInterface {

  /**
   * Create the {@link MeasurementValueSpec} spec from {@link FeatureMeasurementType} and {@link ArrivalDao}
   * @return {@link MeasurementValueSpec}
   */
  <V> Stream<MeasurementValueSpec<V>> createMeasurementValueSpec(FeatureMeasurementType<V> featureMeasurementType,
    ArrivalDao arrivalDao);

  /**
   * Gets the associated converter for the input {@link FeatureMeasurementType} and {@link ArrivalDao}
   */
   <V> Optional<FeatureMeasurement<V>> convert(MeasurementValueSpec<V> measurementValueSpec,
     Channel channel,
     ChannelSegment<? extends Timeseries> channelSegment);
}
