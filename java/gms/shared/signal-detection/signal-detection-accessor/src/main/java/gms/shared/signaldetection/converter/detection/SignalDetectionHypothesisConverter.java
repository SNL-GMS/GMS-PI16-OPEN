package gms.shared.signaldetection.converter.detection;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableSet;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisConverterId;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

public class SignalDetectionHypothesisConverter implements SignalDetectionHypothesisConverterInterface {

  private final FeatureMeasurementConverterInterface featureMeasurementConverter;

  private SignalDetectionHypothesisConverter(FeatureMeasurementConverterInterface featureMeasurementConverter) {
    this.featureMeasurementConverter = featureMeasurementConverter;
  }

  /**
   * Create {@link SignalDetectionHypothesisConverter} instance using {@link FeatureMeasurementConverterInterface}
   * to create the set of {@link FeatureMeasurement}s needed to create a {@link SignalDetectionHypothesis}
   *
   * @param featureMeasurementConverter {@link FeatureMeasurementConverterInterface} instance
   * @return {@link SignalDetectionHypothesisConverter}
   */
  public static SignalDetectionHypothesisConverter create(
    FeatureMeasurementConverterInterface featureMeasurementConverter) {
    Objects.requireNonNull(featureMeasurementConverter);

    return new SignalDetectionHypothesisConverter(featureMeasurementConverter);
  }

  @Override
  public Optional<SignalDetectionHypothesis> convert(SignalDetectionHypothesisConverterId converterId,
    ArrivalDao arrivalDao,
    String monitoringOrganization,
    Station station,
    Channel channel,
    ChannelSegment<? extends Timeseries> channelSegment) {

    Objects.requireNonNull(converterId);
    Objects.requireNonNull(arrivalDao);
    Objects.requireNonNull(station);
    Objects.requireNonNull(channel);
    Objects.requireNonNull(channelSegment);

    // check that the channels are all from the same station
    if (channel.isPresent()) {
      Preconditions.checkState(channel.getStation().getName().equals(station.getName()),
        "Channel must be from the provided station");
    }

    Preconditions.checkState(channelSegment.getId().getChannel().getName().equals(channel.getName()),
      "Channel segment must be from provided channel");
    // create the SignalDetectionHypothesisId object
    long arid = arrivalDao.getId();
    var hypothesisId = UUID.nameUUIDFromBytes(converterId.getStageId().concat(String.valueOf(arid))
      .getBytes(StandardCharsets.UTF_8));

    List<FeatureMeasurement<?>> featureMeasurements = createFeatureMeasurements(arrivalDao,
      channel, channelSegment);

    Optional<SignalDetectionHypothesis.Data> signalDetectionHypothesisData = Optional.of(
      SignalDetectionHypothesis.Data.builder()
        .setMonitoringOrganization(monitoringOrganization)
        .setStation(station)
        .setRejected(false)
        .setParentSignalDetectionHypothesisId(converterId.getParentId())
        .setFeatureMeasurements(ImmutableSet.copyOf(featureMeasurements))
        .build());

    return Optional.ofNullable(SignalDetectionHypothesis.from(
      SignalDetectionHypothesisId.from(converterId.getDetectionId(), hypothesisId),
      signalDetectionHypothesisData));
  }

  @Override
  public Optional<SignalDetectionHypothesis> convertToEntityReference(String stageId, UUID detectionId,
    ArrivalDao arrivalDao) {

    Objects.requireNonNull(stageId);
    Objects.requireNonNull(detectionId);
    Objects.requireNonNull(arrivalDao);

    // create the SignalDetectionHypothesisId object
    long arid = arrivalDao.getId();
    var hypothesisId = UUID.nameUUIDFromBytes(String.valueOf(arid)
      .getBytes(StandardCharsets.UTF_8));

    return Optional.ofNullable(SignalDetectionHypothesis.createEntityReference(detectionId, hypothesisId));
  }

  /**
   * Create list of {@link FeatureMeasurement}s using the {@link ArrivalDao}, {@link Channel},
   * the {@link ChannelSegment}, and finally the {@link FeatureMeasurementTypes}
   *
   * @param arrivalDao input {@link ArrivalDao}
   * @param channel {@link Channel} for the channel segment
   * @param channelSegment {@link ChannelSegment} on which the feature measurements were made
   * @return list of {@link FeatureMeasurement}s
   */
  private List<FeatureMeasurement<?>> createFeatureMeasurements(ArrivalDao arrivalDao, Channel channel,
    ChannelSegment<? extends Timeseries> channelSegment) {

    // List of FM enums that we need for building the FMs
    List<FeatureMeasurementType<?>> fmTypes = List.of(
      FeatureMeasurementTypes.ARRIVAL_TIME,
      FeatureMeasurementTypes.PHASE,
      FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH,
      FeatureMeasurementTypes.SLOWNESS,
      FeatureMeasurementTypes.EMERGENCE_ANGLE,
      FeatureMeasurementTypes.RECTILINEARITY,
      FeatureMeasurementTypes.SHORT_PERIOD_FIRST_MOTION,
      FeatureMeasurementTypes.LONG_PERIOD_FIRST_MOTION
    );

    // create feature measurements from the channels and channel segments
    return fmTypes.stream()
      .flatMap(fmType -> featureMeasurementConverter.createMeasurementValueSpec(fmType, arrivalDao))
      .map(spec -> featureMeasurementConverter.convert(spec, channel, channelSegment))
      .filter(Optional::isPresent)
      .map(Optional::get)
      .collect(Collectors.toList());
  }
}
