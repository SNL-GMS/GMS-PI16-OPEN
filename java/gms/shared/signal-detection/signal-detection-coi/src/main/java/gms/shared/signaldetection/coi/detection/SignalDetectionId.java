package gms.shared.signaldetection.coi.detection;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;

import java.util.UUID;

@AutoValue
public abstract class SignalDetectionId {

  public abstract UUID getId();

  @JsonCreator
  public static SignalDetectionId from(@JsonProperty("id") UUID id) {
    return new AutoValue_SignalDetectionId(id);
  }
}