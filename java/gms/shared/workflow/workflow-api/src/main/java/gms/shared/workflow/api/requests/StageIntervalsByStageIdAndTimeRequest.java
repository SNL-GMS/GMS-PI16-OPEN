package gms.shared.workflow.api.requests;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableSet;
import gms.shared.workflow.coi.WorkflowDefinitionId;

import java.time.Instant;
import java.util.Collection;
import java.util.Set;

@AutoValue
public abstract class StageIntervalsByStageIdAndTimeRequest {

  public abstract Instant getStartTime();

  public abstract Instant getEndTime();

  public abstract Set<WorkflowDefinitionId> getStageIds();

  @JsonCreator
  public static StageIntervalsByStageIdAndTimeRequest from(
    @JsonProperty("startTime") Instant startTime,
    @JsonProperty("endTime") Instant endTime,
    @JsonProperty("stageIds") Collection<WorkflowDefinitionId> stageIds
  ) {
    return new AutoValue_StageIntervalsByStageIdAndTimeRequest(startTime, endTime, ImmutableSet.copyOf(stageIds));
  }
}
