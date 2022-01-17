package gms.shared.stationdefinition.coi.channel;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import java.time.Duration;

/**
 * Represents a limited set of calibration information used during the acquisition of data streams.
 */

@AutoValue
public abstract class Calibration {

  public abstract double getCalibrationPeriodSec();

  public abstract Duration getCalibrationTimeShift();

  public abstract DoubleValue getCalibrationFactor();

  @JsonCreator
  public static Calibration from(
      @JsonProperty("calibrationPeriodSec") double calibrationPeriodSec,
      @JsonProperty("calibrationTimeShift") Duration calibrationTimeShift,
      @JsonProperty("calibrationFactor") DoubleValue calibrationFactor) {
    return new AutoValue_Calibration(calibrationPeriodSec, calibrationTimeShift, calibrationFactor);
  }

}
