package gms.shared.signaldetection.coi.types;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;

/**
 * {@link FeatureMeasurementType} for {@link DurationMeasurementType}
 */
@AutoValue
public abstract class DurationMeasurementType implements
    FeatureMeasurementType<DurationMeasurementType> {

  @JsonCreator
  public static DurationMeasurementType from(
      @JsonProperty("featureMeasurementTypeName") String featureMeasurementTypeName) {
    return new AutoValue_DurationMeasurementType(featureMeasurementTypeName);
  }


  @Override
  public Class<DurationMeasurementType> getMeasurementValueType() {
    return DurationMeasurementType.class;
  }
}
