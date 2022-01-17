package gms.shared.stationdefinition.repository.util;

import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import org.apache.commons.lang3.Validate;
import org.apache.commons.lang3.tuple.Pair;

import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.groupingBy;

public class StationDefinitionVersionUtility {

  private StationDefinitionVersionUtility(){}

  /**
   * Group wfdisc into correct sta.chan bins and return the first wfDisc
   * in the list with it's effectiveUntil set to the last wfdisc endTime.
   *
   * This will be used in setting response versions
   *
   * @param wfdiscDaos list of possibly many wfdisc per sta.chan
   * @return List of 1 wfDisc per sta.chan with wfdisc effectiveUntil set to end of version
   */
  public static List<WfdiscDao> getWfDiscsWithVersionEndTime(List<WfdiscDao> wfdiscDaos){
    Validate.notNull(wfdiscDaos);

    //bin wfDisc into sta.chan with a Pair of first/last wfdisc in list (will be used to create a version)
    LinkedHashMap<String, Pair<WfdiscDao, WfdiscDao>> wfdiscTimes = wfdiscDaos.stream()
      .collect(groupingBy(wfdisc -> StationDefinitionIdUtility.createStationChannelCode(
        wfdisc.getStationCode(), wfdisc.getChannelCode()),
        LinkedHashMap::new,
        Collectors.collectingAndThen(Collectors.toList(),
          list -> Pair.of(
            Collections.min(list, Comparator.comparing(WfdiscDao::getTime)),
            Collections.max(list, Comparator.comparing(WfdiscDao::getEndTime))))));

    //set EndTime of Version
    return wfdiscTimes.values().stream()
        .map(x -> {
          var dao = x.getLeft();
          dao.setEndTime(x.getRight().getEndTime());
          return dao;
        }).collect(Collectors.toList());
  }

  public static List<SensorDao> getSensorsWithVersionEndTime(List<SensorDao> sensorDaos) {
    Validate.notNull(sensorDaos);

    //bin sensor into sta.chan with a Pair of first/last wfdisc in list (will be used to create a version)
    LinkedHashMap<String, Pair<SensorDao, SensorDao>> sensorTimes = sensorDaos.stream()
      .collect(groupingBy(sensor -> StationDefinitionIdUtility.createStationChannelCode(
        sensor.getSensorKey().getStation(), sensor.getSensorKey().getChannel()),
        LinkedHashMap::new,
        Collectors.collectingAndThen(
          Collectors.toList(),
          list -> Pair.of(
            Collections.min(list, Comparator.comparing(x -> x.getSensorKey().getTime())),
            Collections.max(list, Comparator.comparing(x -> x.getSensorKey().getEndTime()))))));

    //set EndTime of Version
    return sensorTimes.values().stream()
      .map(x -> {
        var dao = x.getLeft();
        dao.getSensorKey().setEndTime(x.getRight().getSensorKey().getEndTime());
        return dao;
      }).collect(Collectors.toList());
  }
}
