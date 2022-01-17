package gms.shared.stationdefinition.converter.util.assemblers;

import com.google.common.base.Functions;
import com.google.common.collect.HashBasedTable;
import com.google.common.collect.HashMultimap;

import com.google.common.collect.SetMultimap;
import com.google.common.collect.Table;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SensorKey;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.time.Instant;
import java.util.List;
import java.util.NavigableMap;
import java.util.TreeMap;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class AssemblerUtilsTest {

  @Test
  void testBuildVersionTable(){

    //get list of sensors to use to test version table
    SetMultimap<SiteChanKey, Instant> siteChanKeyTimeMultimap = HashMultimap.create();

    SiteChanKey siteChanKey1 = new SiteChanKey("STA1", "BHZ", Instant.now());
    SiteChanKey siteChanKey2 = new SiteChanKey("STA2", "BHE", Instant.now());
    siteChanKeyTimeMultimap.putAll(siteChanKey1, List.of(Instant.parse("2006-12-30T13:35:24.00Z"),
        Instant.parse("2009-06-13T12:35:24.00Z")));

    siteChanKeyTimeMultimap.putAll(siteChanKey2, List.of(Instant.parse("2010-12-30T13:35:24.00Z"),
        Instant.parse("2011-06-13T12:35:24.00Z"), Instant.parse("2011-06-13T12:35:24.00Z")));
    List<SensorDao> sensorDaos =  UtilsTestFixtures.getListOfSensorsFromMultimap(siteChanKeyTimeMultimap);

    NavigableMap<Instant, SensorDao> navigableMap1 =
        sensorDaos.stream().filter(sensorDao -> sensorDao.getSensorKey().getStation().equals("STA1"))
        .collect(Collectors.toMap(
            Functions.compose(SensorKey::getTime, SensorDao::getSensorKey),
            Functions.identity(),
            (val1, val2) -> val1.getSensorKey().getTime().isAfter(val2.getSensorKey().getTime()) ? val1 : val2,
            TreeMap::new));

    NavigableMap<Instant, SensorDao> navigableMap2 =
        sensorDaos.stream().filter(sensorDao -> sensorDao.getSensorKey().getStation().equals("STA2"))
            .collect(Collectors.toMap(
                Functions.compose(SensorKey::getTime, SensorDao::getSensorKey),
                Functions.identity(),
                (val1, val2) -> val1.getSensorKey().getTime().isAfter(val2.getSensorKey().getTime()) ? val1 : val2,
                TreeMap::new));

    Table<String, String, NavigableMap<Instant, SensorDao>> correctTable = HashBasedTable.create();
    correctTable.put("STA1", "BHZ", navigableMap1);
    correctTable.put("STA2", "BHE", navigableMap2);

    Table<String, String, NavigableMap<Instant, SensorDao>> sensorVersionsByStaChan =
      AssemblerUtils.buildVersionTable(Functions.compose(SensorKey::getStation, SensorDao::getSensorKey),
          Functions.compose(SensorKey::getChannel, SensorDao::getSensorKey),
          Functions.compose(SensorKey::getTime, SensorDao::getSensorKey),
          sensorDaos);

    assertEquals(sensorVersionsByStaChan, correctTable);

  }

}
