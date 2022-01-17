package gms.shared.signaldetection.coi.types;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import gms.shared.signaldetection.coi.values.AmplitudeMeasurementValue;

/**
 * {@link FeatureMeasurementType} for {@link AmplitudeMeasurementValue}
 */
@AutoValue
public abstract class AmplitudeMeasurementType implements
    FeatureMeasurementType<AmplitudeMeasurementValue> {

  @JsonCreator
  public static AmplitudeMeasurementType from(
      @JsonProperty("featureMeasurementTypeName") String featureMeasurementTypeName) {
    return new AutoValue_AmplitudeMeasurementType(featureMeasurementTypeName);
  }

  @Override
  public Class<AmplitudeMeasurementValue> getMeasurementValueType() {
    return AmplitudeMeasurementValue.class;
  }
}
