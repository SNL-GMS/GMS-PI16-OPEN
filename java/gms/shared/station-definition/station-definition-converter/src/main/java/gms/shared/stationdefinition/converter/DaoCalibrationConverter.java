package gms.shared.stationdefinition.converter;

import gms.shared.stationdefinition.coi.channel.Calibration;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.converter.interfaces.CalibrationConverter;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;

import java.time.Duration;
import java.util.Objects;
import java.util.Optional;

public class DaoCalibrationConverter implements CalibrationConverter {

  private DaoCalibrationConverter() {
  }

  /**
   * creates a new {@link DaoCalibrationConverter}
   *
   * @return a {@link DaoCalibrationConverter}
   */
  public static DaoCalibrationConverter create() {
    return new DaoCalibrationConverter();
  }

  /**
   * Converts the SensorDao object to a
   * {@link gms.shared.stationdefinition.coi.channel.Calibration} object.
   *
   * @param wfdiscDao The wfdiscdao to pull necessary calibration params from
   * @param sensorDao The sensordao to pull TShift from
   * @return A Calibration object containing the information passed in through sensorDao
   */
  public Calibration convert(WfdiscDao wfdiscDao, SensorDao sensorDao) {

    Objects.requireNonNull(wfdiscDao, "WfDiscDao cannot be null");
    Objects.requireNonNull(sensorDao, "SensorDao cannot be null");

    return Calibration.from(wfdiscDao.getCalper(),
      Duration.ofSeconds((long) sensorDao.gettShift()),
      DoubleValue.from(wfdiscDao.getCalib(),
        Optional.of(0.0), Units.NANOMETERS_PER_COUNT));
  }

}
