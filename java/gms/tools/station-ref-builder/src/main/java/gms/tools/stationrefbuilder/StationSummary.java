package gms.tools.stationrefbuilder;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;

@AutoValue
@JsonSerialize(as = StationSummary.class)
@JsonDeserialize(builder = AutoValue_StationSummary.Builder.class)
public abstract class StationSummary {

  public abstract String getStationName();

  public abstract boolean getAcquired();

  public abstract boolean getFrameProcessingDisabled();

  public abstract int getPortOffset();

  public abstract Builder toBuilder();

  public static Builder builder() {
    return new AutoValue_StationSummary.Builder();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    public abstract Builder setStationName(String stationName);

    public abstract Builder setAcquired(boolean acquired);

    public abstract Builder setFrameProcessingDisabled(boolean frameProcessingDisabled);

    public abstract Builder setPortOffset(int portOffset);

    protected abstract StationSummary autoBuild();

    public StationSummary build() {
      return autoBuild();
    }
  }

}
