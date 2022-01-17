package gms.shared.stationdefinition.converter;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.converter.interfaces.StationGroupConverter;
import gms.shared.stationdefinition.dao.css.AffiliationDao;
import gms.shared.stationdefinition.dao.css.NetworkDao;
import gms.shared.stationdefinition.dao.css.NetworkStationTimeKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import org.apache.commons.lang3.Validate;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.List;
import java.util.NavigableSet;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

public class DaoStationGroupConverter implements StationGroupConverter {

  private static final Logger logger = LoggerFactory.getLogger(DaoStationGroupConverter.class);

  private DaoStationGroupConverter() {
  }

  /**
   * creates a new {@link DaoStationGroupConverter}
   *
   * @return a {@link DaoStationGroupConverter}
   */
  public static DaoStationGroupConverter create() {
    return new DaoStationGroupConverter();
  }

  /**
   * Converts a NetworkKey pair and a list of {@link Station}s into {@link StationGroup}
   *
   * @param networkKey - pair containing network name and effective at time
   * @param networkDescription - network description for network
   * @param stationList - list of {@link Station}s
   * @return station group coi
   */
  @Override
  public StationGroup convert(Pair<String, Instant> networkKey, String networkDescription, List<Station> stationList) {

    Validate.notNull(networkKey);

    String networkName = networkKey.getLeft();
    Instant networkEffectiveAt = networkKey.getRight();

    StationGroup.Data stationGroupData = StationGroup.Data.builder()
      .setDescription(networkDescription)
      .setStations(stationList)
      .build();

    return StationGroup.builder()
      .setName(networkName)
      .setEffectiveAt(networkEffectiveAt)
      .setData(stationGroupData)
      .build();
  }

  @Override
  public StationGroup convert(NetworkDao network, List<AffiliationDao> affiliations, Instant effectiveUntil,
    List<SiteDao> sites, Function<SiteDao, Station> stationFunction) {
    Objects.requireNonNull(network);
    Objects.requireNonNull(affiliations);
    Objects.requireNonNull(sites);
    Objects.requireNonNull(stationFunction);

    Preconditions.checkState(!affiliations.isEmpty(), "Cannot create affiliation from empty affiliations");
    Preconditions.checkState(!sites.isEmpty(), "Cannot create affiliation from empty sites");

    // Create list of ref Stations
    List<Station> refStationList = sites.stream()
      .map(stationFunction::apply)
      .collect(Collectors.toList());

    StationGroup.Data stationGroupData = StationGroup.Data.builder()
      .setDescription(network.getDescription())
      .setStations(refStationList)
      .build();

    Instant effectiveAt = affiliations.stream()
      .map(AffiliationDao::getNetworkStationTimeKey)
      .map(NetworkStationTimeKey::getTime)
      .max(Instant::compareTo)
      .orElse(network.getLdDate());  // not actually possible

    return StationGroup.builder()
      .setName(network.getNet())
      .setEffectiveAt(effectiveAt)
      .setEffectiveUntil(Optional.ofNullable(effectiveUntil))
      .setData(stationGroupData)
      .build();
  }
}
