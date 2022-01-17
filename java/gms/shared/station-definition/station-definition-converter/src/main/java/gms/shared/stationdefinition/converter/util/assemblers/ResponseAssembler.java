package gms.shared.stationdefinition.converter.util.assemblers;

import com.google.common.base.Functions;
import com.google.common.base.Preconditions;
import com.google.common.collect.Table;
import gms.shared.stationdefinition.coi.channel.Calibration;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.converter.interfaces.CalibrationConverter;
import gms.shared.stationdefinition.converter.interfaces.FrequencyAmplitudePhaseConverter;
import gms.shared.stationdefinition.converter.interfaces.ResponseConverter;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SensorKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import net.logstash.logback.argument.StructuredArguments;
import org.slf4j.LoggerFactory;

import java.nio.file.Path;
import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

public class ResponseAssembler {

  private static final StructuredLoggingWrapper logger =
    StructuredLoggingWrapper.create(LoggerFactory.getLogger(ResponseAssembler.class));
  private static final String STATION = "Station";
  private static final String CHANNEL = "Channel";
  private static final String EFFECTIVE_TIME = "Effective Time";

  private final ResponseConverter responseConverter;
  private final CalibrationConverter calibrationConverter;
  private final FrequencyAmplitudePhaseConverter fapConverter;

  public ResponseAssembler(ResponseConverter responseConverter,
    CalibrationConverter calibrationConverter,
    FrequencyAmplitudePhaseConverter fapConverter) {
    this.responseConverter = responseConverter;
    this.calibrationConverter = calibrationConverter;
    this.fapConverter = fapConverter;
  }

  public static ResponseAssembler create(ResponseConverter responseConverter,
    CalibrationConverter calibrationConverter,
    FrequencyAmplitudePhaseConverter fapConverter) {
    Objects.requireNonNull(responseConverter);
    Objects.requireNonNull(calibrationConverter);
    Objects.requireNonNull(fapConverter);

    return new ResponseAssembler(responseConverter, calibrationConverter, fapConverter);
  }

  public List<Response> buildAllForTime(Instant effectiveAt,
    List<WfdiscDao> wfdiscs,
    List<SensorDao> sensors,
    List<InstrumentDao> instruments,
    Optional<String> channelName) {

    Objects.requireNonNull(effectiveAt);
    Objects.requireNonNull(wfdiscs);
    Objects.requireNonNull(sensors);
    Objects.requireNonNull(instruments);

    Table<String, String, NavigableMap<Instant, SensorDao>> sensorVersionsByStaChan =
      AssemblerUtils.buildVersionTable(Functions.compose(SensorKey::getStation, SensorDao::getSensorKey),
        Functions.compose(SensorKey::getChannel, SensorDao::getSensorKey),
        Functions.compose(SensorKey::getTime, SensorDao::getSensorKey),
        sensors);

    Map<Long, InstrumentDao> instrumentsById = instruments.stream()
      .collect(Collectors.toMap(InstrumentDao::getInstrumentId, Function.identity()));

    return buildAllForTime(effectiveAt, wfdiscs, sensorVersionsByStaChan, instrumentsById, channelName);
  }

  public List<Response> buildAllForTimeRange(Instant startTime,
    Instant endTime,
    List<WfdiscDao> wfdiscs,
    List<SensorDao> sensors,
    List<InstrumentDao> instruments,
    Optional<String> channelName) {

    Objects.requireNonNull(startTime);
    Objects.requireNonNull(endTime);
    Objects.requireNonNull(wfdiscs);
    Objects.requireNonNull(sensors);
    Objects.requireNonNull(instruments);
    Preconditions.checkState(!endTime.isBefore(startTime), "End time must not be before start time");

    Table<String, String, NavigableMap<Instant, SensorDao>> sensorVersionsByStaChan =
      AssemblerUtils.buildVersionTable(Functions.compose(SensorKey::getStation, SensorDao::getSensorKey),
        Functions.compose(SensorKey::getChannel, SensorDao::getSensorKey),
        Functions.compose(SensorKey::getTime, SensorDao::getSensorKey),
        sensors);

    Map<Long, InstrumentDao> instrumentsById = instruments.stream()
      .collect(Collectors.toMap(InstrumentDao::getInstrumentId, Function.identity()));

    return wfdiscs.stream()
      .sorted(Comparator.comparing(WfdiscDao::getTime))
      .map(wfdisc -> buildAllForTime(wfdisc.getTime(),
        List.of(wfdisc),
        sensorVersionsByStaChan,
        instrumentsById,
        channelName))
      .flatMap(List::stream)
      .collect(Collectors.toList());
  }

  private List<Response> buildAllForTime(Instant effectiveTime,
    Collection<WfdiscDao> wfdiscs,
    Table<String, String, NavigableMap<Instant, SensorDao>> sensorVersionsByStaChan,
    Map<Long, InstrumentDao> instrumentsById,
    Optional<String> channelName) {

    return wfdiscs.stream()
      .filter(wfdisc -> !wfdisc.getTime().isAfter(effectiveTime))
      .map(wfdisc -> {
        String station = wfdisc.getStationCode();
        String channel = wfdisc.getChannelCode();

        if (!sensorVersionsByStaChan.contains(station, channel) ||
          sensorVersionsByStaChan.get(station, channel).floorEntry(effectiveTime) == null) {
          logger.info("Cannot build response for channel {}.{} without sensor",
            StructuredArguments.v(STATION, station),
            StructuredArguments.v(CHANNEL, channel),
            StructuredArguments.v(EFFECTIVE_TIME, effectiveTime));
          return Optional.<Response>empty();
        }

        SensorDao sensor = sensorVersionsByStaChan.get(station, channel).floorEntry(effectiveTime).getValue();

        if (!instrumentsById.containsKey(sensor.getInstrument().getInstrumentId())) {
          logger.info("Cannot build response for channel {}.{} without instrument",
            StructuredArguments.v(STATION, station),
            StructuredArguments.v(CHANNEL, channel),
            StructuredArguments.v(EFFECTIVE_TIME, effectiveTime));
          return Optional.<Response>empty();
        }

        InstrumentDao instrument = instrumentsById.get(sensor.getInstrument().getInstrumentId());
        Calibration calibration = calibrationConverter.convert(wfdisc, sensor);
        FrequencyAmplitudePhase fap = (channelName.isPresent()) ?
          fapConverter.convert(channelName.orElseThrow(), Path.of(instrument.getDirectory(),
            instrument.getDataFile()).toString()) :
          fapConverter.convertToEntityReference(Path.of(instrument.getDirectory(),
            instrument.getDataFile()).toString());

        return Optional.ofNullable(responseConverter.convert(wfdisc, sensor, calibration, fap));
      })
      .filter(Optional::isPresent)
      .map(Optional::get)
      .distinct()
      .collect(Collectors.toList());
  }

  public Response buildResponseEntity(WfdiscDao wfdiscDao) {
    return responseConverter.convertToEntity(wfdiscDao);
  }
}
