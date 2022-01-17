package gms.shared.signaldetection.manager.config;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import com.google.auto.value.extension.memoized.Memoized;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import gms.shared.workflow.coi.WorkflowDefinitionId;

@AutoValue
public abstract class StagePersistenceDefinition {

  @JsonIgnore
  @Memoized
  public ImmutableMap<WorkflowDefinitionId, String> getDatabaseAccountsByStageMap() {
    return getDatabaseAccountsByStage().stream()
      .collect(ImmutableMap.toImmutableMap(StageDatabaseAccountPair::getWorkflowDefinitionId,
        StageDatabaseAccountPair::getDatabaseAccount));
  }

  @JsonIgnore
  @Memoized
  public ImmutableMap<WorkflowDefinitionId, String> getPreviousDatabaseAccountsByStageMap() {
    return getPreviousDatabaseAccountsByStage().stream()
      .collect(ImmutableMap.toImmutableMap(StageDatabaseAccountPair::getWorkflowDefinitionId,
        StageDatabaseAccountPair::getDatabaseAccount));
  }

  public abstract ImmutableList<StageDatabaseAccountPair> getDatabaseAccountsByStage();

  public abstract ImmutableList<StageDatabaseAccountPair> getPreviousDatabaseAccountsByStage();

  @JsonCreator
  public static StagePersistenceDefinition create(
    @JsonProperty("databaseAccountsByStage") ImmutableList<StageDatabaseAccountPair> databaseAccountsByStage,
    @JsonProperty("previousDatabaseAccountsByStage") ImmutableList<StageDatabaseAccountPair> previousDatabaseAccountsByStage)
   {
     Preconditions.checkState(!databaseAccountsByStage.isEmpty(), "Database Accounts per stage have to be set");
     Preconditions.checkState(!previousDatabaseAccountsByStage.isEmpty(), "Previous Stage has to be set");

     return new AutoValue_StagePersistenceDefinition(databaseAccountsByStage, previousDatabaseAccountsByStage);
   }
}
