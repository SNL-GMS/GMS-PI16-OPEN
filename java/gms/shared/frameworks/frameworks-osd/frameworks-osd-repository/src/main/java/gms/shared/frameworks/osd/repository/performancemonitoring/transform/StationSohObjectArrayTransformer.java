package gms.shared.frameworks.osd.repository.performancemonitoring.transform;

import gms.shared.frameworks.osd.coi.soh.DurationSohMonitorValueAndStatus;
import gms.shared.frameworks.osd.coi.soh.PercentSohMonitorValueAndStatus;
import gms.shared.frameworks.osd.coi.soh.SohMonitorType;
import gms.shared.frameworks.osd.coi.soh.StationSoh;
import gms.shared.frameworks.osd.dao.soh.SohMonitorTypeConverter;
import gms.shared.frameworks.osd.dao.soh.SohStatusConverter;
import gms.shared.frameworks.osd.dto.soh.DurationSohMonitorValues;
import gms.shared.frameworks.osd.dto.soh.HistoricalSohMonitorValues;
import gms.shared.frameworks.osd.dto.soh.HistoricalStationSoh;
import gms.shared.frameworks.osd.dto.soh.PercentSohMonitorValues;
import gms.shared.frameworks.osd.dto.soh.SohMonitorValues;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Transformation utility for converting {@link StationSoh} objects into other forms, be it UI DTOs
 * or otherwise.
 */
public class StationSohObjectArrayTransformer {

  private static final int CALCULATION_TIME_INDEX = 1;
  private static final int CHANNEL_NAME_INDEX = 2;
  private static final int MONITOR_TYPE_INDEX = 3;
  private static final int DURATION_VALUE_INDEX = 4;
  private static final int PERCENT_VALUE_INDEX = 5;
  private static final int SOH_STATUS_INDEX = 6;

  private static final Logger logger = LoggerFactory
      .getLogger(StationSohObjectArrayTransformer.class);

  private StationSohObjectArrayTransformer() {

  }

  /**
   * Converts Result set (which is an Object[]) into 2 associative maps of different
   * SohMonitorValueAndStatus types This is then later processed into HistoricalStationSoh
   *
   * @param stationName stationName that the data is relevant for
   * @param stationSohObjects    results of query to be post-processed
   * @return HistoricalStationSoh - result of Query post-processed to correct format
   */
  public static HistoricalStationSoh createHistoricalStationSoh(String stationName,
      List<Object[]> stationSohObjects) {

    Set<Long> calcValues = new LinkedHashSet<>();
    Set<String> channelNames = new LinkedHashSet<>();
    Map<String, List<DurationSohMonitorValueAndStatus>> durationSmvsMap = new LinkedHashMap<>();
    Map<String, List<PercentSohMonitorValueAndStatus>> percentSmvsMap = new LinkedHashMap<>();
    SohStatusConverter sohStatusConverter = new SohStatusConverter();
    SohMonitorTypeConverter sohMonitorTypeConverter = new SohMonitorTypeConverter();
    for (Object[] stationSohObject : stationSohObjects) {
      String channelName = (String) stationSohObject[CHANNEL_NAME_INDEX];
      channelNames.add(channelName);
      durationSmvsMap.putIfAbsent(channelName, new ArrayList<>());
      percentSmvsMap.putIfAbsent(channelName, new ArrayList<>());
      SohMonitorType sohMonitorType = sohMonitorTypeConverter
          .convertToEntityAttribute((short) stationSohObject[MONITOR_TYPE_INDEX]);
      if (sohMonitorType.getSohValueType() == SohMonitorType.SohValueType.DURATION) {
        Duration lag = null;
        if (stationSohObject[DURATION_VALUE_INDEX] != null) {
          long dbValue = ((Integer) stationSohObject[DURATION_VALUE_INDEX]).longValue();
          lag = Duration.ofSeconds(dbValue);
        }
        DurationSohMonitorValueAndStatus smvs = DurationSohMonitorValueAndStatus.from(
            lag,
            sohStatusConverter.convertToEntityAttribute((short) stationSohObject[SOH_STATUS_INDEX]),
            sohMonitorType);
        durationSmvsMap.get(channelName).add(smvs);
      } else {
        // initialize percent to worst case for now
        double percent = 100;
        if (stationSohObject[PERCENT_VALUE_INDEX] != null) {
          percent = ((Float) stationSohObject[PERCENT_VALUE_INDEX]).doubleValue();
        }
        PercentSohMonitorValueAndStatus smvs = PercentSohMonitorValueAndStatus.from(
            percent,
            sohStatusConverter.convertToEntityAttribute((short) stationSohObject[SOH_STATUS_INDEX]),
            sohMonitorType);
        percentSmvsMap.get(channelName).add(smvs);
      }
      calcValues.add(((java.sql.Timestamp) stationSohObject[CALCULATION_TIME_INDEX]).getTime());
    }
    logger.info("Query returned {} num Channels", channelNames.size());
    List<HistoricalSohMonitorValues> monitorValues =
        createHistoricalSohMonitorValues(channelNames, durationSmvsMap, percentSmvsMap);

    return HistoricalStationSoh.create(
        stationName,
        calcValues.stream().mapToLong(l -> l).toArray(),
        monitorValues);
  }

  /**
   * loop through SMVS maps to construct arrays containing values to be used to create
   * HistoricalSohMonitorValues This currently only works with Percent/Duration MonitorTypes
   *
   * @param durationSmvsMap map of duration SMVS
   * @param percentSmvsMap  map of percent SMVS
   * @return - List of HistoricalSohMonitorValues
   */
  private static List<HistoricalSohMonitorValues> createHistoricalSohMonitorValues(
      Set<String> channelNames,
      Map<String, List<DurationSohMonitorValueAndStatus>> durationSmvsMap,
      Map<String, List<PercentSohMonitorValueAndStatus>> percentSmvsMap) {

    List<HistoricalSohMonitorValues> monitorValues = new ArrayList<>();

    for (String channelName : channelNames) {
      SohMonitorType durationMonitorType = null;
      SohMonitorType percentMonitorType = null;
      long[] durations = new long[durationSmvsMap.get(channelName).size()];
      double[] percents = new double[percentSmvsMap.get(channelName).size()];
      Map<SohMonitorType, SohMonitorValues> valueMap = new LinkedHashMap<>();
      int index = 0;

      for (DurationSohMonitorValueAndStatus smvs : durationSmvsMap.get(channelName)) {
        if (durationMonitorType == null) {
          durationMonitorType = smvs.getMonitorType();
        }
        durations[index++] = smvs.getValue().orElse(Duration.of(-1, ChronoUnit.MILLIS)).toMillis();
      }
      index = 0;
      for (PercentSohMonitorValueAndStatus smvs : percentSmvsMap.get(channelName)) {
        if (percentMonitorType == null) {
          percentMonitorType = smvs.getMonitorType();
        }
        percents[index++] = smvs.getValue().orElse(-1.0);
      }
      if (durations.length > 0) {
        valueMap.put(durationMonitorType, DurationSohMonitorValues.create(durations));
      }
      if (percents.length > 0) {
        valueMap.put(percentMonitorType, PercentSohMonitorValues.create(percents));
      }
      monitorValues.add(HistoricalSohMonitorValues.create(channelName, valueMap));
    }
    return monitorValues;
  }
}
