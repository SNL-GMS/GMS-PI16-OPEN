package gms.shared.frameworks.osd.api.util;

import static com.google.common.base.Preconditions.checkArgument;
import static org.apache.commons.lang3.StringUtils.isNotEmpty;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import gms.shared.frameworks.osd.coi.soh.SohMonitorType;

@AutoValue
@JsonSerialize(as = HistoricalStationSohRequest.class)
@JsonDeserialize(builder = AutoValue_HistoricalStationSohRequest.Builder.class)
public abstract class HistoricalStationSohRequest {

  public abstract String getStationName();

  public abstract long getStartTime();

  public abstract long getEndTime();

  public abstract SohMonitorType getSohMonitorType();

  public static Builder builder() {
    return new AutoValue_HistoricalStationSohRequest.Builder();
  }

  public abstract Builder toBuilder();

  public static HistoricalStationSohRequest create(
      String stationName,
      long startTime,
      long endTime,
      SohMonitorType sohMonitorType
  ) {
    return builder()
        .setStationName(stationName)
        .setStartTime(startTime)
        .setEndTime(endTime)
        .setSohMonitorType(sohMonitorType)
        .build();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    public abstract Builder setStationName(String stationName);

    public abstract Builder setStartTime(long startTime);

    public abstract Builder setEndTime(long endTime);

    public abstract Builder setSohMonitorType(SohMonitorType sohMonitorType);

    public abstract HistoricalStationSohRequest autoBuild();

    public HistoricalStationSohRequest build() {
      HistoricalStationSohRequest historicalStationSohRequest = autoBuild();

      checkArgument(isNotEmpty(historicalStationSohRequest.getStationName()),
          "HistoricalStationSohRequest requires non-null, non-empty stationName");

      return historicalStationSohRequest;
    }
  }
}
