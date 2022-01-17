package gms.shared.stationdefinition.repository;

import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import com.google.common.collect.RangeMap;
import com.google.common.collect.TreeRangeMap;
import gms.shared.stationdefinition.api.channel.ChannelAccessorInterface;
import gms.shared.stationdefinition.api.channel.ChannelRepositoryInterface;
import gms.shared.stationdefinition.cache.VersionCache;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.converter.interfaces.ChannelConverter;
import gms.shared.stationdefinition.converter.util.assemblers.ChannelAssembler;
import gms.shared.stationdefinition.dao.css.BeamDao;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.StationChannelTimeKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import gms.shared.stationdefinition.database.connector.BeamDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SensorDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteChanDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.repository.util.CssCoiConverterUtility;
import gms.shared.stationdefinition.repository.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.repository.util.StationDefinitionVersionUtility;

import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.NavigableSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;

import static gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType.BRIDGED;

/**
 * A {@link ChannelAccessorInterface} implementation that uses a bridged database
 */
public class BridgedChannelRepository implements ChannelRepositoryInterface {

  private final BeamDatabaseConnector beamDatabaseConnector;
  private final SiteDatabaseConnector siteDatabaseConnector;
  private final SiteChanDatabaseConnector siteChanDatabaseConnector;
  private final SensorDatabaseConnector sensorDatabaseConnector;
  private final WfdiscDatabaseConnector wfdiscDatabaseConnector;
  private final ChannelAssembler channelAssembler;
  private final StationDefinitionIdUtility stationDefinitionIdUtility;
  private final VersionCache versionCache;

  private BridgedChannelRepository(BeamDatabaseConnector beamDatabaseConnector,
    SiteDatabaseConnector siteDatabaseConnector,
    SiteChanDatabaseConnector siteChanDatabaseConnector,
    SensorDatabaseConnector sensorDatabaseConnector,
    WfdiscDatabaseConnector wfdiscDatabaseConnector,
    ChannelAssembler channelAssembler,
    StationDefinitionIdUtility stationDefinitionIdUtility,
    VersionCache versionCache) {

    this.beamDatabaseConnector = beamDatabaseConnector;
    this.siteDatabaseConnector = siteDatabaseConnector;
    this.siteChanDatabaseConnector = siteChanDatabaseConnector;
    this.sensorDatabaseConnector = sensorDatabaseConnector;
    this.wfdiscDatabaseConnector = wfdiscDatabaseConnector;
    this.channelAssembler = channelAssembler;
    this.stationDefinitionIdUtility = stationDefinitionIdUtility;
    this.versionCache = versionCache;
  }

  /**
   * Creates a {@link BridgedChannelRepository} from the provided Jpa Repositories for Site, SiteChan, Sensor, and
   * Instrument, and a {@link ChannelConverter}
   *
   * @param siteDatabaseConnector The repository for retrieving Sites
   * @param siteChanDatabaseConnector The repository for retrieving SiteChans
   * @param sensorDatabaseConnector The repository for retrieving Sensors
   * @param channelAssembler a {@link ChannelConverter} for building Channels from Sites, SiteChans, Sensors, and
   * Instruments
   * @return a BridgedChannelRepository for retrieving Channels from a bridged database
   */
  public static BridgedChannelRepository create(BeamDatabaseConnector beamDatabaseConnector,
    SiteDatabaseConnector siteDatabaseConnector,
    SiteChanDatabaseConnector siteChanDatabaseConnector,
    SensorDatabaseConnector sensorDatabaseConnector,
    WfdiscDatabaseConnector wfdiscDatabaseConnector,
    ChannelAssembler channelAssembler,
    StationDefinitionIdUtility stationDefinitionIdUtility,
    VersionCache versionCache) {

    Objects.requireNonNull(beamDatabaseConnector);
    Objects.requireNonNull(siteDatabaseConnector);
    Objects.requireNonNull(siteChanDatabaseConnector);
    Objects.requireNonNull(sensorDatabaseConnector);
    Objects.requireNonNull(wfdiscDatabaseConnector);
    Objects.requireNonNull(channelAssembler);
    Objects.requireNonNull(stationDefinitionIdUtility);
    Objects.requireNonNull(versionCache);

    return new BridgedChannelRepository(beamDatabaseConnector,
      siteDatabaseConnector,
      siteChanDatabaseConnector,
      sensorDatabaseConnector,
      wfdiscDatabaseConnector,
      channelAssembler,
      stationDefinitionIdUtility,
      versionCache);
  }

  @Override
  public List<Channel> findChannelsByNameAndTime(List<String> channelNames, Instant effectiveAt) {

    List<SiteChanKey> siteChanKeys = CssCoiConverterUtility.getSiteChanKeysFromChannelNames(
      channelNames);

    List<SiteChanDao> siteChanDaos = siteChanDatabaseConnector.findSiteChansByKeyAndTime(siteChanKeys,
      effectiveAt);

    Set<String> stationCodes = CssCoiConverterUtility.getStationCodesFromSiteChanKeys(siteChanKeys);

    List<SiteDao> siteDaos = siteDatabaseConnector.findSitesByStationCodesAndStartTime(stationCodes, effectiveAt);

    List<WfdiscDao> wfdiscDaos = StationDefinitionVersionUtility.getWfDiscsWithVersionEndTime(
      wfdiscDatabaseConnector.findWfdiscVersionsByNameAndTime(siteChanKeys, effectiveAt));

    List<SensorDao> sensorDaos = StationDefinitionVersionUtility.getSensorsWithVersionEndTime(
      sensorDatabaseConnector.findSensorVersionsByNameAndTime(siteChanKeys, effectiveAt));

    List<Channel> channels = channelAssembler.buildAllForTime(
      effectiveAt, siteDaos, siteChanDaos, sensorDaos, wfdiscDaos);

    cacheResponseIds(channels);

    return channels;
  }


  @Override
  public List<Channel> findChannelsByNameAndTimeRange(List<String> channelNames, Instant startTime, Instant endTime) {
    Preconditions.checkState(startTime.isBefore(endTime));
    List<SiteChanKey> siteChanKeys = CssCoiConverterUtility.getSiteChanKeysFromChannelNames(
      channelNames);
    Set<String> stationCodes = CssCoiConverterUtility.getStationCodesFromSiteChanKeys(siteChanKeys);
    List<SiteChanDao> siteChanDaos = siteChanDatabaseConnector.findSiteChansByNameAndTimeRange(siteChanKeys, startTime, endTime);
    List<SiteDao> siteDaos = siteDatabaseConnector.findSitesByNamesAndTimeRange(stationCodes, startTime, endTime);
    List<WfdiscDao> wfdiscDaos = wfdiscDatabaseConnector.findWfdiscsByNameAndTimeRange(siteChanKeys, startTime, endTime);
    List<SensorDao> sensorDaos = sensorDatabaseConnector.findSensorsByKeyAndTimeRange(siteChanKeys, startTime, endTime);

    List<Channel> channels = channelAssembler.buildAllForTimeRange(
      startTime, siteDaos, siteChanDaos, sensorDaos, wfdiscDaos);

    cacheResponseIds(channels);

    return channels;
  }

  @Override
  public Channel loadChannelFromWfdisc(long wfid, TagName associatedRecordType, long associatedRecordId,
    Instant channelEffectiveTime, Instant channelEndTime) {

    Objects.requireNonNull(associatedRecordType, "Associated record type cannot be null");
    Preconditions.checkState(channelEffectiveTime.isBefore(channelEndTime),
      "Attempting to load channel from wfdisc, channel effective time must be before channel end time");

    var channel = stationDefinitionIdUtility.getDerivedChannelForWfidRecordId(associatedRecordType,
      associatedRecordId,
      wfid);

    if (channel != null) {
      Channel populated = (Channel) versionCache.retrieveVersionsByEntityIdAndTime(Channel.class.getSimpleName().concat(channel.getName()),
        channel.getEffectiveAt().orElseThrow());
      if (populated != null) {
        return populated;
      }
    }

    EnumMap<ChannelProcessingMetadataType, Object> processingMetadataMap = new EnumMap<>(ChannelProcessingMetadataType.class);
    processingMetadataMap.put(BRIDGED, "/bridged," + associatedRecordType + ":" + associatedRecordId);

    List<WfdiscDao> wfdiscDaoList = wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(wfid));
    //wfid is a pk, guaranteed exactly 1 wfdisc
    Optional<WfdiscDao> possbleWfdiscDao = wfdiscDaoList.stream().findFirst();
    var wfdiscDao = possbleWfdiscDao.orElseThrow(() -> new IllegalStateException("No wfdisc from which to load channel"));

    var stationChannelTimeKey = new StationChannelTimeKey(wfdiscDao.getStationCode(), wfdiscDao.getChannelCode(), channelEffectiveTime);
    List<SiteDao> siteDaoList = siteDatabaseConnector.findSitesByStationCodesAndStartTime(List.of(stationChannelTimeKey.getStationCode()), stationChannelTimeKey.getTime());

    var siteChanKey = new SiteChanKey(stationChannelTimeKey.getStationCode(), stationChannelTimeKey.getChannelCode(), channelEffectiveTime);
    List<SiteChanDao> siteChanDaoList = siteChanDatabaseConnector.findSiteChansByKeyAndTime(List.of(siteChanKey), channelEffectiveTime);
    Optional<SiteChanDao> possibleSiteChanDao = siteChanDaoList.stream().findFirst();
    var siteChanDao = possibleSiteChanDao.orElseThrow(() -> new IllegalStateException("No sitechan from which to load channel"));

    Optional<BeamDao> beamDao = beamDatabaseConnector.findBeamForWfid(wfid);
    Optional<SensorDao> sensorDao = sensorDatabaseConnector.findSensorByKeyInRange(siteChanKey.getStationCode(),
      siteChanKey.getChannelCode(),
      channelEffectiveTime,
      channelEndTime);

    //there should only be one site existing at a certain time
    Optional<SiteDao> possibleSiteDao = siteDaoList.stream()
      .filter(site -> Range.closedOpen(site.getId().getOnDate(), site.getOffDate()).contains(siteChanDao.getId().getOnDate()))
      .findFirst();
    var siteDao = possibleSiteDao.orElseThrow(() -> new IllegalStateException("No site from which to load channel"));

    var built = channelAssembler
      .buildFromAssociatedRecord(processingMetadataMap,
        beamDao,
        siteDao,
        wfdiscDao,
        siteChanDao,
        sensorDao,
        channelEffectiveTime,
        channelEndTime);

    stationDefinitionIdUtility.storeWfidRecordIdChannelMapping(associatedRecordType, associatedRecordId, wfid, built);

    String key = Channel.class.getSimpleName().concat(built.getName());
    NavigableSet<Instant> versionTimes = versionCache.retrieveVersionEffectiveTimesByEntityId(key);
    if (versionTimes == null) {
      versionTimes = new TreeSet<>();
    }

    versionTimes.add(built.getEffectiveAt().orElseThrow());
    versionCache.cacheVersionEffectiveTimesByEntityId(key, versionTimes);

    RangeMap<Instant, Object> versions = versionCache.retrieveVersionsByEntityIdAndTimeRangeMap(key);

    if (versions == null) {
      versions = TreeRangeMap.create();
    }
    Range<Instant> range = built.getEffectiveUntil().isPresent() ?
      Range.closedOpen(built.getEffectiveAt().orElseThrow(), built.getEffectiveUntil().orElseThrow()):
      Range.atLeast(built.getEffectiveAt().orElseThrow());
    versions.put(range, built);
    versionCache.cacheVersionsByEntityIdAndTime(key, versions);

    return built;
  }


  private void cacheResponseIds(List<Channel> channels) {
    channels.forEach(channel -> channel.getResponse()
      .map(Response::getId)
      .ifPresent(id -> stationDefinitionIdUtility.storeResponseIdChannelNameMapping(id, channel.getName())));
  }
}
