package gms.shared.signaldetection.coi.types;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import gms.shared.signaldetection.coi.values.FirstMotionMeasurementValue;

/**
 * {@link FeatureMeasurementType} for {@link FirstMotionMeasurementValue}
 */
@AutoValue
public abstract class FirstMotionMeasurementType implements
    FeatureMeasurementType<FirstMotionMeasurementValue> {

  @JsonCreator
  public static FirstMotionMeasurementType from(
      @JsonProperty("featureMeasurementTypeName") String featureMeasurementTypeName) {
    return new AutoValue_FirstMotionMeasurementType(featureMeasurementTypeName);
  }

  @Override
  public Class<FirstMotionMeasurementValue> getMeasurementValueType() {
    return FirstMotionMeasurementValue.class;
  }
}
