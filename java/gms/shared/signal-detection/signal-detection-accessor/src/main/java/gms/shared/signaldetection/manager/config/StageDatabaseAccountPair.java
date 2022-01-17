package gms.shared.signaldetection.manager.config;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import gms.shared.workflow.coi.WorkflowDefinitionId;

@AutoValue
public abstract class StageDatabaseAccountPair {

  public abstract WorkflowDefinitionId getWorkflowDefinitionId();

  public abstract String getDatabaseAccount();

  @JsonCreator
  public static StageDatabaseAccountPair create(
    @JsonProperty("workflowDefinitionId") WorkflowDefinitionId workflowDefinitionId,
    @JsonProperty("databaseAccount") String databaseAccount) {
    return new AutoValue_StageDatabaseAccountPair(workflowDefinitionId, databaseAccount);
  }

}
