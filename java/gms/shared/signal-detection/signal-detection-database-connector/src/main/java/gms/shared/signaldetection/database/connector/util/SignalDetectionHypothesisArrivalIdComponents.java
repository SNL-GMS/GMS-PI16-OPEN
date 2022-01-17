package gms.shared.signaldetection.database.connector.util;

import com.google.auto.value.AutoValue;
import gms.shared.workflow.coi.WorkflowDefinitionId;

@AutoValue
public abstract class SignalDetectionHypothesisArrivalIdComponents {

  public abstract WorkflowDefinitionId getStageId();

  public abstract long getArid();

  public static SignalDetectionHypothesisArrivalIdComponents create(WorkflowDefinitionId stageId, long arid) {
    return new AutoValue_SignalDetectionHypothesisArrivalIdComponents(stageId, arid);
  }

}
