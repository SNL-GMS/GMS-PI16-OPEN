package gms.dataacquisition.stationreceiver.cd11.datamanipulator;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue.AcquiredChannelEnvironmentIssueType;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueAnalog;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;

class Cd11DataSohTests {

  Cd11DataFrameSoh cd11DataFrameSoh = new Cd11DataFrameSoh(null, null, null, null);

  @Test
  void acquiredSohListToBytes_testEmptySoh() {
    List<AcquiredChannelEnvironmentIssue<?>> sohList = new ArrayList<>();
    byte[] oldBytes = new byte[]{(byte) 0xC0, 0x00, 0x00, 0x00};
    byte[] newSohBytes = cd11DataFrameSoh.acquiredSohListToBytes(sohList, oldBytes);
    assertArrayEquals(oldBytes, newSohBytes);
  }

  @Test
  void acquiredSohListToBytes_testNonEmptySoh() {
    List<AcquiredChannelEnvironmentIssue<?>> sohList = new ArrayList<>();
    String station = "SHZ";
    Instant startTime = Instant.parse("2020-02-28T17:44:40Z");
    Instant endTime = Instant.parse("2020-02-28T17:44:49.975Z");
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.DEAD_SENSOR_CHANNEL, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.ZEROED_DATA, startTime, endTime,false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.CLIPPED, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.CALIBRATION_UNDERWAY, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.EQUIPMENT_HOUSING_OPEN, startTime, endTime,  false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.DIGITIZING_EQUIPMENT_OPEN, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.VAULT_DOOR_OPENED, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.AUTHENTICATION_SEAL_BROKEN, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.EQUIPMENT_MOVED, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.CLOCK_DIFFERENTIAL_TOO_LARGE, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.GPS_RECEIVER_OFF, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.GPS_RECEIVER_UNLOCKED, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.DIGITIZER_ANALOG_INPUT_SHORTED, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.DIGITIZER_CALIBRATION_LOOP_BACK, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.MAIN_POWER_FAILURE, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.BACKUP_POWER_UNSTABLE, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueAnalog.from(station, AcquiredChannelEnvironmentIssueType.CLOCK_DIFFERENTIAL_IN_MICROSECONDS, startTime, endTime, 0.0));
    byte[] oldBytes = new byte[]{
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00};
    byte[] newSohBytes = cd11DataFrameSoh.acquiredSohListToBytes(sohList, oldBytes);
    assertArrayEquals(oldBytes, newSohBytes);
  }

  @Test
  void acquiredSohListToBytes_testNonEmptySohWithChanges() {
    List<AcquiredChannelEnvironmentIssue<?>> sohList = new ArrayList<>();
    String station = "SHZ";
    Instant startTime = Instant.parse("2020-02-28T17:44:40Z");
    Instant endTime = Instant.parse("2020-02-28T17:44:49.975Z");
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.DEAD_SENSOR_CHANNEL, startTime, endTime, true));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.ZEROED_DATA, startTime, endTime,false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.CLIPPED, startTime, endTime, true));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.CALIBRATION_UNDERWAY, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.EQUIPMENT_HOUSING_OPEN, startTime, endTime,  true));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.DIGITIZING_EQUIPMENT_OPEN, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.VAULT_DOOR_OPENED, startTime, endTime, true));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.AUTHENTICATION_SEAL_BROKEN, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.EQUIPMENT_MOVED, startTime, endTime, true));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.CLOCK_DIFFERENTIAL_TOO_LARGE, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.GPS_RECEIVER_OFF, startTime, endTime, true));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.GPS_RECEIVER_UNLOCKED, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.DIGITIZER_ANALOG_INPUT_SHORTED, startTime, endTime, true));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.DIGITIZER_CALIBRATION_LOOP_BACK, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.MAIN_POWER_FAILURE, startTime, endTime, true));
    sohList.add(AcquiredChannelEnvironmentIssueBoolean.from(station, AcquiredChannelEnvironmentIssueType.BACKUP_POWER_UNSTABLE, startTime, endTime, false));
    sohList.add(AcquiredChannelEnvironmentIssueAnalog.from(station, AcquiredChannelEnvironmentIssueType.CLOCK_DIFFERENTIAL_IN_MICROSECONDS, startTime, endTime, 5.0));
    byte[] oldBytes = new byte[]{
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00};
    byte[] newSohBytes = cd11DataFrameSoh.acquiredSohListToBytes(sohList, oldBytes);
    assertEquals(0b00000001, newSohBytes[0]);
    assertEquals(0b00000101, newSohBytes[1]);
    assertEquals(0b00010101, newSohBytes[2]);
    assertEquals(0b00001010, newSohBytes[3]);
    assertEquals(0b00000001, newSohBytes[4]);
    IntStream.range(5, 31).forEach( i -> assertEquals(0x00, newSohBytes[i]) );
    assertEquals(0x05, newSohBytes[31]);
  }

}
