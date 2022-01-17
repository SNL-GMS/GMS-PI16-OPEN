package gms.shared.workflow.api.requests;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.IntervalStatus;

import java.time.Instant;

@AutoValue
@JsonSerialize(as = UpdateInteractiveAnalysisStageIntervalStatusRequest.class)
@JsonDeserialize(builder = AutoValue_UpdateInteractiveAnalysisStageIntervalStatusRequest.Builder.class)
public abstract class UpdateInteractiveAnalysisStageIntervalStatusRequest implements UserRequest {

  public abstract IntervalId getStageIntervalId();

  public abstract IntervalStatus getStatus();

  public static Builder builder() {
    return new AutoValue_UpdateInteractiveAnalysisStageIntervalStatusRequest.Builder();
  }

  public abstract Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {
    public abstract Builder setUserName(String userName);

    public abstract Builder setTime(Instant time);

    public abstract Builder setStageIntervalId(IntervalId stageIntervalId);

    public abstract Builder setStatus(IntervalStatus status);

    public abstract UpdateInteractiveAnalysisStageIntervalStatusRequest build();
  }
}
