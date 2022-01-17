package gms.shared.workflow.repository;

import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.WorkflowDefinitionId;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;

public interface IntervalRepositoryInterface {

  Map<String, List<StageInterval>> findStageIntervalsByStageIdAndTime(Instant startTime, Instant endTime,
    Collection<WorkflowDefinitionId> stageIds);
}
