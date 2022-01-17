package gms.shared.stationdefinition.converter.util.assemblers;


import com.google.common.base.Functions;
import com.google.common.collect.HashBasedTable;
import com.google.common.collect.Range;
import com.google.common.collect.RangeMap;
import com.google.common.collect.Streams;
import com.google.common.collect.Table;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.converter.interfaces.StationConverter;
import gms.shared.stationdefinition.converter.interfaces.StationGroupConverter;
import gms.shared.stationdefinition.dao.css.AffiliationDao;
import gms.shared.stationdefinition.dao.css.NetworkDao;
import gms.shared.stationdefinition.dao.css.NetworkStationTimeKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import org.apache.commons.lang3.tuple.Triple;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collector;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Assemble CSS DAOS into COI StationGroups
 */
public class StationGroupAssembler {

  private final StationGroupConverter stationGroupConverter;
  private final StationConverter stationConverter;

  private StationGroupAssembler(StationGroupConverter stationGroupConverter, StationConverter stationConverter) {
    this.stationGroupConverter = stationGroupConverter;
    this.stationConverter = stationConverter;
  }

  public static StationGroupAssembler create(StationGroupConverter stationGroupConverter,
    StationConverter stationConverter) {
    Objects.requireNonNull(stationGroupConverter);
    Objects.requireNonNull(stationConverter);

    return new StationGroupAssembler(stationGroupConverter, stationConverter);
  }

  private List<StationGroup> createStationGroupsHelper(Instant effectiveAt,
    Map<String, Instant> effectiveUntilByNetwork,
    List<NetworkDao> networkDaos, List<AffiliationDao> affiliationDaos, List<SiteDao> siteDaos,
    Function<SiteDao, Station> stationFunction) {

    Map<String, List<AffiliationDao>> affiliationsByNetwork = affiliationDaos.stream()
      .filter(affiliationDao -> Range.closed(affiliationDao.getNetworkStationTimeKey().getTime().truncatedTo(ChronoUnit.DAYS),
        affiliationDao.getEndTime().truncatedTo(ChronoUnit.DAYS)).contains(effectiveAt))
      .collect(Collectors.groupingBy(Functions.compose(NetworkStationTimeKey::getNetwork, AffiliationDao::getNetworkStationTimeKey)));

    Map<String, List<SiteDao>> sitesByReferenceStation = siteDaos.stream()
      .filter(siteDao -> Range.closed(siteDao.getId().getOnDate(), siteDao.getOffDate()).contains(effectiveAt))
      .collect(Collectors.groupingBy(SiteDao::getReferenceStation));

    return networkDaos.stream()
      .map(networkDao -> {
        List<AffiliationDao> affiliationsForNetwork = affiliationsByNetwork.computeIfAbsent(networkDao.getNet(),
          key -> new ArrayList<>());
        List<SiteDao> sitesForNetwork = affiliationsForNetwork.stream()
          .map(AffiliationDao::getNetworkStationTimeKey)
          .map(NetworkStationTimeKey::getStation)
          .map(station -> sitesByReferenceStation.computeIfAbsent(station, key -> List.of()))
          .flatMap(List::stream)
          .collect(Collectors.toList());

        if (sitesForNetwork.isEmpty()) {
          return Optional.<StationGroup>empty();
        } else {
          return Optional.of(stationGroupConverter.convert(networkDao, affiliationsForNetwork,
            effectiveUntilByNetwork.get(networkDao.getNet()), sitesForNetwork, stationFunction));
        }
      })
      .filter(Optional::isPresent)
      .map(Optional::get)
      .distinct()
      .collect(Collectors.toList());
  }

  public List<StationGroup> buildAllForTimeRange(Range<Instant> timeRange, List<NetworkDao> networkDaos,
    List<AffiliationDao> affiliationDaos, List<AffiliationDao> nextAffiliationDaos, List<SiteDao> siteDaos) {

    Objects.requireNonNull(timeRange);
    Objects.requireNonNull(networkDaos);
    Objects.requireNonNull(affiliationDaos);
    Objects.requireNonNull(siteDaos);

    Function<SiteDao, Station> stationFunction = stationConverter::convertToEntityReference;

    Map<String, List<Instant>> affiliationTimesByNetwork = affiliationDaos.stream()
      .collect(Collectors.toMap(Functions.compose(NetworkStationTimeKey::getNetwork, AffiliationDao::getNetworkStationTimeKey),
        Functions.compose(Functions.compose(List::of, NetworkStationTimeKey::getTime), AffiliationDao::getNetworkStationTimeKey),
        (listA, listB) -> Streams.concat(listA.stream(), listB.stream())
          .sorted()
          .collect(Collectors.toList())
      ));
    List<Instant> affiliationTimesForRange = affiliationTimesByNetwork.values().stream()
      .map(effectiveTimes -> {
        List<Instant> timesInRange = effectiveTimes.stream()
          .filter(timeRange::contains)
          .collect(Collectors.toList());
        return timesInRange.isEmpty() ? List.of(timeRange.lowerEndpoint()): timesInRange;
      })
      .flatMap(List::stream)
      .sorted()
      .distinct()
      .collect(Collectors.toList());

    Map<String, Instant> lastEffectiveUntilByNetwork = nextAffiliationDaos.stream()
      .collect(Collectors.toMap(
        Functions.compose(NetworkStationTimeKey::getNetwork, AffiliationDao::getNetworkStationTimeKey),
        Functions.compose(NetworkStationTimeKey::getTime, AffiliationDao::getNetworkStationTimeKey),
        (existing, replacement) -> existing));

    Table<String, Instant, Instant> effectiveUntilByNetworkAndTime = affiliationTimesByNetwork.entrySet().stream()
      .flatMap(entrySet -> {
        List<Instant> startTimesList = new ArrayList<>(entrySet.getValue());
        List<Optional<Instant>> endTimesList = entrySet.getValue().stream()
          .map(Optional::of)
          .collect(Collectors.toList());
        endTimesList.remove(0);
        endTimesList.add(Optional.ofNullable(lastEffectiveUntilByNetwork.get(entrySet.getKey())));
        return Streams.zip(startTimesList.stream(), endTimesList.stream(),
          (startTime, endTime) -> Triple.of(entrySet.getKey(), startTime, endTime));
      })
      .collect(Collector.of(HashBasedTable::create,
        (table, netStartEndTriple) -> {
          if (netStartEndTriple.getRight().isPresent()) {
            table.put(netStartEndTriple.getLeft(), netStartEndTriple.getMiddle(),
              netStartEndTriple.getRight().get());
          }
        },
        (table1, table2) -> {
          table1.putAll(table2);
          return table1;
        }));

    return affiliationTimesForRange.stream()
      .map(effectiveTime -> createStationGroupsHelper(effectiveTime, effectiveUntilByNetworkAndTime.column(effectiveTime),
        networkDaos, affiliationDaos, siteDaos, stationFunction))
      .flatMap(Collection::stream)
      .distinct()
      .collect(Collectors.toList());
  }

  public List<StationGroup> buildAllForTime(Instant effectiveAt,
    List<NetworkDao> networkDaos,
    List<AffiliationDao> affiliationDaos,
    List<AffiliationDao> nextAffiliationDaos,
    List<SiteDao> siteDaos) {

    Objects.requireNonNull(effectiveAt, "Cannot build station groups from null effective time");
    Objects.requireNonNull(networkDaos, "Cannot build station groups from null networks");
    Objects.requireNonNull(affiliationDaos, "Cannot build station groups from null affiliations");
    Objects.requireNonNull(siteDaos, "Cannot build station groups from null sites");

    Function<SiteDao, Station> stationFunction = stationConverter::convertToVersionReference;
    Map<String, Instant> effectiveUntilByNetwork = nextAffiliationDaos.stream()
      .collect(Collectors.toMap(
        Functions.compose(NetworkStationTimeKey::getNetwork, AffiliationDao::getNetworkStationTimeKey),
        Functions.compose(NetworkStationTimeKey::getTime, AffiliationDao::getNetworkStationTimeKey)));
    return createStationGroupsHelper(effectiveAt, effectiveUntilByNetwork, networkDaos, affiliationDaos,
      siteDaos, stationFunction);
  }
}
