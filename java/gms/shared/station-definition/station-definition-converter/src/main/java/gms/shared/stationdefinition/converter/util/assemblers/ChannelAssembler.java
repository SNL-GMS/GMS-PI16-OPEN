package gms.shared.stationdefinition.converter.util.assemblers;

import com.google.common.base.Functions;
import com.google.common.base.Preconditions;
import com.google.common.collect.Table;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType;
import gms.shared.stationdefinition.converter.interfaces.ChannelConverter;
import gms.shared.stationdefinition.converter.interfaces.ResponseConverter;
import gms.shared.stationdefinition.converter.interfaces.ResponseConverterTransform;
import gms.shared.stationdefinition.converter.util.TemporalMap;
import gms.shared.stationdefinition.dao.css.BeamDao;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SensorKey;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.SiteKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.dao.css.enums.StaType;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import net.logstash.logback.argument.StructuredArguments;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

public class ChannelAssembler {

  private static final StructuredLoggingWrapper logger =
    StructuredLoggingWrapper.create(LoggerFactory.getLogger(ChannelAssembler.class));
  private static final String STATION = "Station";
  private static final String CHANNEL = "Channel";
  private static final String EFFECTIVE_TIME = "Effective Time";
  private final ChannelConverter channelConverter;
  private final ResponseConverter responseConverter;

  private ChannelAssembler(ChannelConverter channelConverter, ResponseConverter responseConverter) {
    this.channelConverter = channelConverter;
    this.responseConverter = responseConverter;
  }

  public static ChannelAssembler create(ChannelConverter channelConverter, ResponseConverter responseConverter) {
    Objects.requireNonNull(channelConverter);
    Objects.requireNonNull(responseConverter);
    return new ChannelAssembler(channelConverter, responseConverter);
  }

  private List<Channel> buildFromConverters(
    Instant effectiveTime,
    List<SiteDao> sites,
    List<SiteChanDao> siteChans,
    List<SensorDao> sensors,
    List<WfdiscDao> wfdiscs, ResponseConverterTransform responseConverterTransform) {

    TemporalMap<String, SiteDao> siteVersionsBySta = sites.stream()
      .collect(TemporalMap.collector(Functions.compose(SiteKey::getStationCode, SiteDao::getId),
        Functions.compose(SiteKey::getOnDate, SiteDao::getId)));

    Table<String, String, NavigableMap<Instant, SensorDao>> sensorVersionsByStaChan =
      AssemblerUtils.buildVersionTable(Functions.compose(SensorKey::getStation, SensorDao::getSensorKey),
        Functions.compose(SensorKey::getChannel, SensorDao::getSensorKey),
        Functions.compose(SensorKey::getTime, SensorDao::getSensorKey),
        sensors);

    Table<String, String, NavigableMap<Instant, WfdiscDao>> wfdiscVersionsByStaChan =
      AssemblerUtils.buildVersionTable(WfdiscDao::getStationCode,
        WfdiscDao::getChannelCode,
        WfdiscDao::getTime,
        wfdiscs);

    return siteChans.stream()
      .map(siteChan -> {
        String station = siteChan.getId().getStationCode();
        String channel = siteChan.getId().getChannelCode();

        Optional<SiteDao> site = siteVersionsBySta.getVersionFloor(station, effectiveTime);
        if (site.isEmpty()) {
          logger.info("Cannot build channel {}.{} without site dao",
            StructuredArguments.v(STATION, station),
            StructuredArguments.v(CHANNEL, channel),
            StructuredArguments.v(EFFECTIVE_TIME, effectiveTime));
          return Optional.<Channel>empty();
        }

        if (!sensorVersionsByStaChan.contains(station, channel) ||
          sensorVersionsByStaChan.get(station, channel).floorEntry(effectiveTime) == null) {
          logger.info("Cannot build channel {}.{} without sensor",
            StructuredArguments.v(STATION, station),
            StructuredArguments.v(CHANNEL, channel),
            StructuredArguments.v(EFFECTIVE_TIME, effectiveTime));
          return Optional.<Channel>empty();
        }

        SensorDao sensor = sensorVersionsByStaChan.get(station, channel).floorEntry(effectiveTime).getValue();

        InstrumentDao instrument = sensor.getInstrument();
        if (instrument == null) {
          logger.info("Cannot build channel {}.{} without instrument",
            StructuredArguments.v(STATION, station),
            StructuredArguments.v(CHANNEL, channel),
            StructuredArguments.v(EFFECTIVE_TIME, effectiveTime));
          return Optional.<Channel>empty();
        }

        NavigableMap<Instant, WfdiscDao> wfdiscVersions = wfdiscVersionsByStaChan.get(station, channel);
        WfdiscDao wfdisc = wfdiscVersions != null && wfdiscVersions.floorEntry(effectiveTime) != null ?
          wfdiscVersions.floorEntry(effectiveTime).getValue() : null;

        try {
          return Optional.of(channelConverter.convert(siteChan, site.get(), sensor,
            instrument, wfdisc, responseConverterTransform));
        } catch (Exception ex) {
          logger.error("Error converting channel", ex);
          return Optional.<Channel>empty();
        }
      })
      .filter(Optional::isPresent)
      .map(Optional::get)
      .collect(Collectors.toList());
  }

  public List<Channel> buildAllForTime(Instant effectiveTime,
    List<SiteDao> sites,
    List<SiteChanDao> siteChans,
    List<SensorDao> sensors,
    List<WfdiscDao> wfdiscs) {

    Objects.requireNonNull(effectiveTime);
    Objects.requireNonNull(sites);
    Objects.requireNonNull(siteChans);
    Objects.requireNonNull(sensors);
    Objects.requireNonNull(wfdiscs);

    ResponseConverterTransform responseConverterTransform =
      responseConverter::convert;

    return buildFromConverters(effectiveTime, sites, siteChans, sensors, wfdiscs,
      responseConverterTransform);
  }

  public List<Channel> buildAllForTimeRange(Instant startTime,
    List<SiteDao> sites,
    List<SiteChanDao> siteChans,
    List<SensorDao> sensors,
    List<WfdiscDao> wfdiscs) {

    Objects.requireNonNull(startTime);
    Objects.requireNonNull(sites);
    Objects.requireNonNull(siteChans);
    Objects.requireNonNull(sensors);
    Objects.requireNonNull(wfdiscs);

    ResponseConverterTransform responseConverterTransform =
      (wfdiscDao, sensorDao, calibration, frequencyAmplitudePhase) -> responseConverter
        .convertToEntity(wfdiscDao);

    return siteChans.stream()
      .sorted(Comparator.comparing(sitechan -> sitechan.getId().getOnDate()))
      .map(siteChan -> buildFromConverters(siteChan.getId().getOnDate().isAfter(startTime) ? siteChan.getId().getOnDate() : startTime,
        sites, List.of(siteChan), sensors, wfdiscs, responseConverterTransform))
      .flatMap(List::stream)
      .collect(Collectors.toList());
  }

  public Channel buildFromAssociatedRecord(Map<ChannelProcessingMetadataType, Object> processingMetadataMap,
    Optional<BeamDao> beamDao,
    SiteDao site,
    WfdiscDao wfdisc,
    SiteChanDao siteChan,
    Optional<SensorDao> possibleSensor,
    Instant channelEffectiveTime,
    Instant channelEndTime) {

    Objects.requireNonNull(processingMetadataMap);
    Objects.requireNonNull(beamDao);
    Objects.requireNonNull(site);
    Objects.requireNonNull(wfdisc);
    Objects.requireNonNull(siteChan);
    Objects.requireNonNull(possibleSensor);
    Objects.requireNonNull(channelEffectiveTime);
    Objects.requireNonNull(channelEndTime);

    Preconditions.checkState(channelEffectiveTime.isBefore(channelEndTime),
      "Channel effective time must be before channel end time.");

    // For arrays, we should be able to tell that a derived channel exists when a
    // reference station (e.g., reference station is ASAR in the site table,
    // sta is ASAR in site table) has a channel in the sitechan (e.g., sta is ASAR
    // and it has a channel SHZ ), whereas for channels in the sitechan that don't
    // match a reference station (e.g., sta in site table is AS01 and its reference
    // station is ASAR, sta in sitechan is AS01 and it has a channel SHZ,) those
    // would be raw channels. 3 component channels tend to be raw channels as we don't
    // beam on 3 component channels
    // Statype is ss (single station) == raw

    if (site.getId().getStationCode().equals(site.getReferenceStation())
      && siteChan.getId().getStationCode().equals(site.getReferenceStation())
      && site.getStaType() == StaType.ARRAY_STATION) {
      return channelConverter.convertToBeamDerived(site,
        siteChan,
        wfdisc,
        channelEffectiveTime,
        channelEndTime,
        beamDao,
        processingMetadataMap);
    } else {
      Preconditions.checkState(possibleSensor.isPresent(),
        "Cannot convert raw channel if sensor is not present");
      SensorDao sensor = possibleSensor.get();
      ResponseConverterTransform responseConverterTransform =
        (wfdiscDao, sensorDao, calibration, frequencyAmplitudePhase) -> responseConverter
          .convertToEntity(wfdiscDao);

      return channelConverter.convert(siteChan, site, sensor, sensor.getInstrument(), wfdisc, responseConverterTransform);
    }
  }
}
