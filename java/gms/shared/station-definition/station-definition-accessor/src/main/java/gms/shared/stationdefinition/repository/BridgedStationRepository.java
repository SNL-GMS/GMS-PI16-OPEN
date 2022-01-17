package gms.shared.stationdefinition.repository;

import com.google.common.collect.ImmutableList;
import gms.shared.stationdefinition.api.station.StationRepositoryInterface;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.converter.interfaces.ChannelGroupConverter;
import gms.shared.stationdefinition.converter.util.assemblers.StationAssembler;
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
 * A {@link StationRepositoryInterface} implementation that uses a bridged database to provide {@link Station}
 * instances
 */
public class BridgedStationRepository implements StationRepositoryInterface {

  private final SiteDatabaseConnector siteDatabaseConnector;
  private final SiteChanDatabaseConnector siteChanDatabaseConnector;
  private final StationAssembler stationAssembler;

  private BridgedStationRepository(SiteDatabaseConnector siteDatabaseConnector,
    SiteChanDatabaseConnector siteChanDatabaseConnector,
    StationAssembler stationAssembler) {
    this.siteDatabaseConnector = siteDatabaseConnector;
    this.siteChanDatabaseConnector = siteChanDatabaseConnector;
    this.stationAssembler = stationAssembler;
  }

  /**
   * Creates a {@link BridgedChannelGroupRepository} from the provided Jpa Repositories for Site, SiteChan, Sensor, and
   * Instrument, and a {@link ChannelGroupConverter}
   * @param siteDatabaseConnector The repository for retrieving Sites
   * @param siteChanDatabaseConnector The repository for retrieving SiteChans
   * @return a BridgedStationRepository for retrieving ChannelGroups from a bridged database
   */
  public static BridgedStationRepository create(SiteDatabaseConnector siteDatabaseConnector,
    SiteChanDatabaseConnector siteChanDatabaseConnector,
    StationAssembler stationAssembler) {

    Objects.requireNonNull(siteDatabaseConnector);
    Objects.requireNonNull(siteChanDatabaseConnector);
    Objects.requireNonNull(stationAssembler);

    return new BridgedStationRepository(siteDatabaseConnector,
      siteChanDatabaseConnector,
      stationAssembler);
  }

  @Override
  public List<Station> findStationsByNameAndTime(List<String> stationNames, Instant effectiveTime) {

    List<SiteDao> siteDaos =
      siteDatabaseConnector.findSitesByRefStationAndStartTime(stationNames, effectiveTime);

    List<String> stationCodes = siteDaos.stream()
      .map(SiteDao::getId)
      .map(SiteKey::getStationCode)
      .collect(Collectors.toList());

    List<SiteChanDao> siteChanDaos =
      siteChanDatabaseConnector.findSiteChansByStationCodeAndTime(stationCodes, effectiveTime);

    return stationAssembler.buildAllForTime(siteDaos, siteChanDaos, effectiveTime);
  }

  @Override
  public List<Station> findStationsByNameAndTimeRange(List<String> stationNames, Instant startTime, Instant endTime) {

    List<SiteDao> siteDaos =
      siteDatabaseConnector.findSitesByReferenceStationAndTimeRange(stationNames, startTime, endTime);

    List<String> stationCodes = siteDaos.stream()
      .map(SiteDao::getId)
      .map(SiteKey::getStationCode)
      .collect(Collectors.toList());

    List<SiteChanDao> siteChanDaos =
      siteChanDatabaseConnector.findSiteChansByStationCodeAndTimeRange(stationCodes, startTime, endTime);

    return stationAssembler.buildAllForTimeRange(stationNames, siteDaos, siteChanDaos, startTime);
  }

  private List<Station> findStationsByNameAndTime(ImmutableList<String> stationNames, Instant effectiveTime) {

    List<SiteDao> siteDaos =
      siteDatabaseConnector.findSitesByRefStationAndStartTime(stationNames, effectiveTime);

    List<String> stationCodes = siteDaos.stream()
      .map(SiteDao::getId)
      .map(SiteKey::getStationCode)
      .collect(Collectors.toList());

    List <SiteChanDao> siteChanDaos =
      siteChanDatabaseConnector.findSiteChansByStationCodeAndTime(stationCodes, effectiveTime);

    return stationAssembler.buildAllForTime(siteDaos, siteChanDaos, effectiveTime);
  }
}
