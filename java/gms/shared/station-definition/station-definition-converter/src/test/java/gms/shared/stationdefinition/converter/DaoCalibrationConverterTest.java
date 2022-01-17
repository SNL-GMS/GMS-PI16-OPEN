package gms.shared.stationdefinition.converter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.stationdefinition.coi.channel.Calibration;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures;
import java.time.Duration;
import java.util.Optional;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class DaoCalibrationConverterTest {

  private static DaoCalibrationConverter daoCalibrationConverter = DaoCalibrationConverter.create();

  private static WfdiscDao wfdiscDao;
  private static SensorDao sensorDao;
  private static Calibration sampleCalibration;

  @BeforeAll
  static void createReferenceObjects() {
    wfdiscDao = CSSDaoTestFixtures.WFDISC_DAO_1;
    sensorDao = CSSDaoTestFixtures.SENSOR_DAO_1;

    sampleCalibration = Calibration.from(wfdiscDao.getCalper(),
        Duration.ofSeconds((long) sensorDao.gettShift()),
        DoubleValue.from(wfdiscDao.getCalib(), Optional.of(0.0), Units.NANOMETERS_PER_COUNT));
  }

  @Test
  void testCalibrationConverterTestPass() {
    Calibration cal = daoCalibrationConverter.convert(wfdiscDao, sensorDao);
    assertEquals(cal, sampleCalibration);
  }

  @Test
  void testCalibrationConverterNullWfdisc() {
    assertThrows( NullPointerException.class,
        () -> { daoCalibrationConverter.convert(null, sensorDao);
    });
  }

  @Test
  void testCalibrationConverterNullSensorDao() {
    assertThrows( NullPointerException.class,
        () -> { daoCalibrationConverter.convert(wfdiscDao, null);
        });
  }
}
