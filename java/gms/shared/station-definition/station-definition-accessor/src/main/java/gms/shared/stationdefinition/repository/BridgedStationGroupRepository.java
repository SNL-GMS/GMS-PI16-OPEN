package gms.shared.stationdefinition.repository;


import com.google.common.collect.Range;
import gms.shared.stationdefinition.api.station.StationGroupRepositoryInterface;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.converter.interfaces.StationGroupConverter;
import gms.shared.stationdefinition.converter.util.assemblers.StationGroupAssembler;
import gms.shared.stationdefinition.dao.css.AffiliationDao;
import gms.shared.stationdefinition.dao.css.NetworkDao;
import gms.shared.stationdefinition.dao.css.NetworkStationTimeKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.database.connector.AffiliationDatabaseConnector;
import gms.shared.stationdefinition.database.connector.NetworkDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * A {@link StationGroupRepositoryInterface} implementation that uses a bridged database to provide {@link StationGroup}
 * instances
 */
public class BridgedStationGroupRepository implements StationGroupRepositoryInterface {

  private final NetworkDatabaseConnector networkDatabaseConnector;
  private final AffiliationDatabaseConnector affiliationDatabaseConnector;
  private final SiteDatabaseConnector siteDatabaseConnector;
  private final StationGroupAssembler stationGroupAssembler;

  private BridgedStationGroupRepository(NetworkDatabaseConnector networkDatabaseConnector,
    AffiliationDatabaseConnector affiliationDatabaseConnector,
    SiteDatabaseConnector siteDatabaseConnector,
    StationGroupAssembler stationGroupAssembler) {

    this.networkDatabaseConnector = networkDatabaseConnector;
    this.affiliationDatabaseConnector = affiliationDatabaseConnector;
    this.siteDatabaseConnector = siteDatabaseConnector;
    this.stationGroupAssembler = stationGroupAssembler;
  }

  /**
   * Creates a {@link BridgedStationGroupRepository} from the provided Jpa Repositories for Network, Afffiliation, Site,
   * SiteChan, Sensor, and Instrument, and a {@link StationGroupConverter}
   *
   * @param networkDatabaseConnector - Repository for retrieving Networks
   * @param affiliationDatabaseConnector - Repository for retrieving Affiliations
   * @param siteDatabaseConnector - The repository for retrieving Sites
   * @param stationGroupAssembler - group assembler
   */
  public static BridgedStationGroupRepository create(NetworkDatabaseConnector networkDatabaseConnector,
    AffiliationDatabaseConnector affiliationDatabaseConnector,
    SiteDatabaseConnector siteDatabaseConnector,
    StationGroupAssembler stationGroupAssembler) {

    Objects.requireNonNull(networkDatabaseConnector);
    Objects.requireNonNull(affiliationDatabaseConnector);
    Objects.requireNonNull(siteDatabaseConnector);
    Objects.requireNonNull(stationGroupAssembler);

    return new BridgedStationGroupRepository(networkDatabaseConnector,
      affiliationDatabaseConnector,
      siteDatabaseConnector,
      stationGroupAssembler);
  }

  @Override
  public List<StationGroup> findStationGroupsByNameAndTime(List<String> stationGroupNames, Instant effectiveTime) {
    List<NetworkDao> networkDaos = getNetworksByName(stationGroupNames);

    // Query all AffiliationDaos associated with NetworkDao Ids and Request EffectiveTime
    List<String> networkNames = networkDaos.stream()
      .map(NetworkDao::getNet)
      .collect(Collectors.toList());

    List<AffiliationDao> affiliationDaos = affiliationDatabaseConnector.findAffiliationsByNameAndTime(
      networkNames, effectiveTime);

    List<AffiliationDao> nextAffiliationDaos = affiliationDatabaseConnector.findNextAffiliationByNameAfterTime(
      networkNames, effectiveTime);

    List<String> referenceStations = affiliationDaos.stream()
      .map(AffiliationDao::getNetworkStationTimeKey)
      .map(NetworkStationTimeKey::getStation)
      .distinct()
      .collect(Collectors.toList());

    List<SiteDao> siteDaos = siteDatabaseConnector.findMainSitesByRefStaAndTime(referenceStations, effectiveTime);
    return stationGroupAssembler.buildAllForTime(effectiveTime, networkDaos, affiliationDaos, nextAffiliationDaos, siteDaos);
  }

  @Override
  public List<StationGroup> findStationGroupsByNameAndTimeRange(List<String> stationGroupNames,
    Instant startTime,
    Instant endTime) {

    List<NetworkDao> networkDaos = getNetworksByName(stationGroupNames);
    List<String> networkNames = networkDaos.stream()
      .map(NetworkDao::getNet)
      .collect(Collectors.toList());

    List<AffiliationDao> affiliationDaos = affiliationDatabaseConnector.findAffiliationsByNameAndTimeRange(networkNames,
      startTime,
      endTime);
    List<String> referenceStations = affiliationDaos.stream()
      .map(AffiliationDao::getNetworkStationTimeKey)
      .map(NetworkStationTimeKey::getStation)
      .distinct()
      .collect(Collectors.toList());

    List<AffiliationDao> nextAffiliationDaos = affiliationDatabaseConnector.findNextAffiliationByNameAfterTime(
      networkNames, endTime);

    List<SiteDao> siteDaos = siteDatabaseConnector.findSitesByNamesAndTimeRange(referenceStations, startTime, endTime);
    return stationGroupAssembler.buildAllForTimeRange(Range.closed(startTime, endTime),
      networkDaos, affiliationDaos, nextAffiliationDaos, siteDaos);
  }

  /**
   * Query for {@link NetworkDao}s using list of network names
   *
   * @param networkNames - list of names
   * @return list of NetworkDaos
   */
  private List<NetworkDao> getNetworksByName(Collection<String> networkNames) {
    return networkDatabaseConnector.findNetworks(networkNames);
  }
}
