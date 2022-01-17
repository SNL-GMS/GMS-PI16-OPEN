package gms.shared.stationdefinition.repository;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.api.channel.ResponseRepositoryInterface;
import gms.shared.stationdefinition.coi.channel.Calibration;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.converter.util.assemblers.ResponseAssembler;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.database.connector.InstrumentDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SensorDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.repository.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.repository.util.StationDefinitionVersionUtility;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

public class BridgedResponseRepository implements ResponseRepositoryInterface {

  private final WfdiscDatabaseConnector wfdiscDatabaseConnector;
  private final SensorDatabaseConnector sensorDatabaseConnector;
  private final InstrumentDatabaseConnector instrumentDatabaseConnector;
  private final StationDefinitionIdUtility stationDefinitionIdUtility;
  private final ResponseAssembler responseAssembler;

  private BridgedResponseRepository(WfdiscDatabaseConnector wfdiscDatabaseConnector,
    SensorDatabaseConnector sensorDatabaseConnector,
    InstrumentDatabaseConnector instrumentDatabaseConnector, StationDefinitionIdUtility stationDefinitionIdUtility,
    ResponseAssembler responseAssembler) {
    this.wfdiscDatabaseConnector = wfdiscDatabaseConnector;
    this.sensorDatabaseConnector = sensorDatabaseConnector;
    this.instrumentDatabaseConnector = instrumentDatabaseConnector;
    this.stationDefinitionIdUtility = stationDefinitionIdUtility;
    this.responseAssembler = responseAssembler;
  }

  public static BridgedResponseRepository create(WfdiscDatabaseConnector wfdiscDatabaseConnector,
    SensorDatabaseConnector sensorDatabaseConnector,
    InstrumentDatabaseConnector instrumentDatabaseConnector,
    StationDefinitionIdUtility stationDefinitionIdUtility,
    ResponseAssembler responseAssembler) {

    Objects.requireNonNull(wfdiscDatabaseConnector);
    Objects.requireNonNull(sensorDatabaseConnector);
    Objects.requireNonNull(instrumentDatabaseConnector);
    Objects.requireNonNull(stationDefinitionIdUtility);
    Objects.requireNonNull(responseAssembler);

    return new BridgedResponseRepository(wfdiscDatabaseConnector,
      sensorDatabaseConnector,
      instrumentDatabaseConnector,
      stationDefinitionIdUtility, responseAssembler);
  }

  @Override
  public List<Response> findResponsesById(Collection<UUID> responseIds, Instant effectiveTime) {
    Objects.requireNonNull(responseIds);
    Objects.requireNonNull(effectiveTime);

    List<SiteChanKey> siteChanKeys = responseIds.stream()
      .map(stationDefinitionIdUtility::getChannelForResponseId)
      .filter(Optional::isPresent)
      .map(Optional::get)
      .map(StationDefinitionIdUtility::getCssKeyFromName)
      .collect(Collectors.toList());

    List<WfdiscDao> wfdiscs = StationDefinitionVersionUtility.getWfDiscsWithVersionEndTime(
      wfdiscDatabaseConnector.findWfdiscVersionsByNameAndTime(siteChanKeys, effectiveTime));
    List<SensorDao> sensors = StationDefinitionVersionUtility.getSensorsWithVersionEndTime(
      sensorDatabaseConnector.findSensorVersionsByNameAndTime(siteChanKeys, effectiveTime));

    List<Long> instrumentIds = sensors.stream()
      .map(SensorDao::getInstrument)
      .map(InstrumentDao::getInstrumentId)
      .collect(Collectors.toList());
    List<InstrumentDao> instruments = instrumentDatabaseConnector.findInstruments(instrumentIds);

    return responseAssembler.buildAllForTime(effectiveTime, wfdiscs, sensors, instruments, Optional.empty());
  }

  @Override
  public List<Response> findResponsesByIdAndTimeRange(Collection<UUID> responseIds, Instant startTime,
    Instant endTime) {
    Objects.requireNonNull(responseIds);
    Objects.requireNonNull(startTime);
    Objects.requireNonNull(endTime);
    Preconditions.checkState(!endTime.isBefore(startTime), "End time must not be before start time");

    List<SiteChanKey> siteChanKeys = responseIds.stream()
      .map(stationDefinitionIdUtility::getChannelForResponseId)
      .filter(Optional::isPresent)
      .map(Optional::get)
      .map(StationDefinitionIdUtility::getCssKeyFromName)
      .collect(Collectors.toList());

    List<WfdiscDao> wfdiscs = wfdiscDatabaseConnector.findWfdiscsByNameAndTimeRange(siteChanKeys, startTime, endTime);
    List<SensorDao> sensors = sensorDatabaseConnector.findSensorsByKeyAndTimeRange(siteChanKeys, startTime, endTime);

    List<Long> instrumentIds = sensors.stream()
      .map(SensorDao::getInstrument)
      .map(InstrumentDao::getInstrumentId)
      .collect(Collectors.toList());
    List<InstrumentDao> instruments = instrumentDatabaseConnector.findInstruments(instrumentIds);

    return responseAssembler.buildAllForTimeRange(startTime,
      endTime,
      wfdiscs,
      sensors,
      instruments,
      Optional.empty());
  }

  @Override
  public Response loadResponseFromWfdisc(long wfdiscRecord) {

    var wfdiscs = wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(wfdiscRecord));

    if (wfdiscs.isEmpty()) {
      throw new IllegalStateException("Unable to retrieve wfdiscs for ID " +
        wfdiscRecord + " from which to load Response");
    }

    Optional<WfdiscDao> firstWfdisc = wfdiscs.stream().findFirst();
    var wfdisc = firstWfdisc.orElseThrow(() -> new IllegalStateException("No wfdisc from which to load Response"));
    var startTime = wfdisc.getTime();
    var endTime = wfdisc.getEndTime();
    var siteChanKey = new SiteChanKey(wfdisc.getStationCode(), wfdisc.getChannelCode(), startTime);

    var sensors = sensorDatabaseConnector
      .findSensorsByKeyAndTimeRange(List.of(siteChanKey), startTime, endTime);
    var instrumentIds = sensors.stream()
      .map(SensorDao::getInstrument)
      .map(InstrumentDao::getInstrumentId)
      .collect(Collectors.toList());
    var instruments = instrumentDatabaseConnector.findInstruments(instrumentIds);

    var id = wfdisc.getStationCode() + wfdisc.getChannelCode();
    var responseId = UUID.nameUUIDFromBytes(id.getBytes());
    var channelName = stationDefinitionIdUtility.getChannelForResponseId(responseId);

    var responses = responseAssembler.buildAllForTimeRange(startTime,
      endTime,
      List.of(wfdisc),
      sensors,
      instruments,
      channelName);

    var response = responseAssembler.buildResponseEntity(wfdisc);

    var responseBuilder = Response.builder();
    var responseDataBuilder = Response.Data.builder();

    if (!responses.isEmpty()) {

      var updatedCalibration = Calibration.from(wfdisc.getCalper(),
        Duration.ZERO,
        DoubleValue.from(wfdisc.getCalib(),
          Optional.empty(), Units.UNITLESS));
      response = responses.get(0);
      responseDataBuilder
        .setFapResponse(response.getFapResponse())
        .setCalibration(updatedCalibration)
        .setEffectiveUntil(response.getEffectiveUntil());
      responseBuilder.setEffectiveAt(response.getEffectiveAt());
    }

    responseBuilder.setId(response.getId());

    var updatedResponse = responseBuilder
      .setData(
        responseDataBuilder
          .build())
      .build();

    stationDefinitionIdUtility.storeWfidResponseMapping(wfdiscRecord, updatedResponse);

    return updatedResponse;
  }
}
