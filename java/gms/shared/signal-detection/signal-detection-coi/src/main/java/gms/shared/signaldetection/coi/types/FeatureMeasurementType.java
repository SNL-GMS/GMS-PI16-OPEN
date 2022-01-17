package gms.shared.signaldetection.coi.types;


import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;

import java.io.Serializable;

/**
 * Enumeration for types of {@link gms.shared.signaldetection.coi.detection.FeatureMeasurement}
 */

// This is used to deserialize references of FeatureMeasurementType into particular implementing classes based on name.
@JsonTypeIdResolver(FeatureMeasurementTypeIdResolver.class)
public interface FeatureMeasurementType<T> extends Serializable {

  /**
   * Gets the class of the feature measurement.
   *
   * @return the class
   */
  @JsonIgnore
  Class<T> getMeasurementValueType();

  /**
   * Gets the name of the feature measurement type.
   *
   * @return the name
   */
  String getFeatureMeasurementTypeName();
}
