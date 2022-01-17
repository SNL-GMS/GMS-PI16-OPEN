package gms.shared.workflow.configuration;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableList;

import java.util.Collection;
import java.util.List;

@AutoValue
public abstract class WorkflowDefinition {

  public abstract String getName();

  public abstract List<String> getStageNames();

  @JsonCreator
  public static WorkflowDefinition from(
    @JsonProperty("name") String name,
    @JsonProperty("stageNames") Collection<String> stageNames
  ) {
    return new AutoValue_WorkflowDefinition(name, ImmutableList.copyOf(stageNames));
  }


}
