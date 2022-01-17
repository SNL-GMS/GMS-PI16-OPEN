package gms.shared.stationdefinition.repository.util;

import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures;
import org.junit.jupiter.api.Test;

import java.util.List;

import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.END_TIME;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.ONDATE;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.START_TIME;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class StationDefinitionVersionUtilityTest {

  @Test
  void getWfDiscsWithVersionEndTime() {
    List<WfdiscDao> updatedWfdisc = StationDefinitionVersionUtility.getWfDiscsWithVersionEndTime(
      List.of(CSSDaoTestFixtures.WFDISC_TEST_DAO_4, CSSDaoTestFixtures.WFDISC_TEST_DAO_5));
    assertEquals(1, updatedWfdisc.size());
    assertEquals(ONDATE, updatedWfdisc.get(0).getTime());
    assertEquals(END_TIME, updatedWfdisc.get(0).getEndTime());
  }
  @Test
  void getWfDiscsWithVersionEndTime_emptyList() {
    List<WfdiscDao> updatedWfdisc = StationDefinitionVersionUtility.getWfDiscsWithVersionEndTime(List.of());
    assertEquals(0, updatedWfdisc.size());
  }
  @Test
  void getWfDiscsWithVersionEndTime_null() {
    assertThrows(NullPointerException.class, () ->
      StationDefinitionVersionUtility.getWfDiscsWithVersionEndTime(null));
  }
  @Test
  void getSensorsWithVersionEndTime() {
    List<SensorDao> updatedSensor = StationDefinitionVersionUtility.getSensorsWithVersionEndTime(
      List.of(CSSDaoTestFixtures.SENSOR_DAO_1_1, CSSDaoTestFixtures.SENSOR_DAO_1_2));
    assertEquals(1, updatedSensor.size());
    assertEquals(START_TIME, updatedSensor.get(0).getSensorKey().getTime());
    assertEquals(END_TIME, updatedSensor.get(0).getSensorKey().getEndTime());
  }
  @Test
  void getSensorsWithVersionEndTime_emptyList() {
    List<SensorDao> updatedSensor = StationDefinitionVersionUtility.getSensorsWithVersionEndTime(List.of());
    assertEquals(0, updatedSensor.size());
  }
  @Test
  void getSensorsWithVersionEndTime_null() {
    assertThrows(NullPointerException.class, () ->
      StationDefinitionVersionUtility.getSensorsWithVersionEndTime(null));
  }
}