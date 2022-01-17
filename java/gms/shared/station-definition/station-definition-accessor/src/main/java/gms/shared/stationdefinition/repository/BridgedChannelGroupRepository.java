package gms.shared.stationdefinition.repository;

import gms.shared.stationdefinition.api.channel.ChannelGroupRepositoryInterface;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.converter.interfaces.ChannelGroupConverter;
import gms.shared.stationdefinition.converter.util.assemblers.ChannelGroupAssembler;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.SiteKey;
import gms.shared.stationdefinition.database.connector.SiteChanDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * A {@link ChannelGroupRepositoryInterface} implementation that uses a bridged database to provide {@link ChannelGroup}
 * instances
 */
public class BridgedChannelGroupRepository implements ChannelGroupRepositoryInterface {

  private final SiteDatabaseConnector siteDatabaseConnector;
  private final SiteChanDatabaseConnector siteChanDatabaseConnector;
  private final ChannelGroupAssembler channelGroupAssembler;

  private BridgedChannelGroupRepository(SiteDatabaseConnector siteDatabaseConnector,
    SiteChanDatabaseConnector siteChanDatabaseConnector,
    ChannelGroupAssembler channelGroupAssembler) {
    this.siteDatabaseConnector = siteDatabaseConnector;
    this.siteChanDatabaseConnector = siteChanDatabaseConnector;
    this.channelGroupAssembler = channelGroupAssembler;
  }

  /**
   * Creates a {@link BridgedChannelGroupRepository} from the provided Jpa Repositories for Site, SiteChan, Sensor, and
   * Instrument, and a {@link ChannelGroupConverter}
   * @param siteDatabaseConnector The repository for retrieving Sites
   * @param siteChanDatabaseConnector The repository for retrieving SiteChans
   * @param channelGroupAssembler a {@link ChannelGroupAssembler} for building ChannelGroups from Sites, SiteChans,
   * Sensors, and Instruments
   * @return a BridgedChannelGroupRepository for retrieving ChannelGroups from a bridged database
   */
  public static BridgedChannelGroupRepository create(SiteDatabaseConnector siteDatabaseConnector,
    SiteChanDatabaseConnector siteChanDatabaseConnector,
    ChannelGroupAssembler channelGroupAssembler) {

    Objects.requireNonNull(siteDatabaseConnector);
    Objects.requireNonNull(siteChanDatabaseConnector);
    Objects.requireNonNull(channelGroupAssembler);

    return new BridgedChannelGroupRepository(siteDatabaseConnector,
      siteChanDatabaseConnector, channelGroupAssembler);
  }

  @Override
  public List<ChannelGroup> findChannelGroupsByNameAndTime(List<String> channelGroupNames, Instant effectiveAt) {
    List<SiteDao> siteDaos =
      siteDatabaseConnector.findSitesByStationCodesAndStartTime(channelGroupNames, effectiveAt);
    List<String> stationCodes = siteDaos.stream()
      .map(SiteDao::getId)
      .map(SiteKey::getStationCode)
      .collect(Collectors.toList());

    List<SiteChanDao> siteChanDaos =
      siteChanDatabaseConnector.findSiteChansByStationCodeAndTime(stationCodes, effectiveAt);

    return channelGroupAssembler.buildAll(siteDaos, siteChanDaos, effectiveAt);
  }

  @Override
  public List<ChannelGroup> findChannelGroupsByNameAndTimeRange(List<String> channelGroupNames,
    Instant startTime,
    Instant endTime) {
    List<SiteDao> sites = siteDatabaseConnector.findSitesByNamesAndTimeRange(channelGroupNames,
      startTime,
      endTime);

    List<String> stationCodes = sites.stream()
      .map(SiteDao::getId)
      .map(SiteKey::getStationCode)
      .distinct()
      .collect(Collectors.toList());

    List<SiteChanDao> siteChans = siteChanDatabaseConnector.findSiteChansByStationCodeAndTimeRange(stationCodes,
      startTime,
      endTime);

    return channelGroupAssembler.buildAllForTimeRange(sites, siteChans, startTime, endTime);
  }
}
