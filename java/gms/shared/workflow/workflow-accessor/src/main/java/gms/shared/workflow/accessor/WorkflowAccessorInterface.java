package gms.shared.workflow.accessor;

import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.repository.IntervalRepositoryInterface;

import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import java.util.concurrent.locks.Lock;

public interface WorkflowAccessorInterface extends IntervalRepositoryInterface {

  Workflow getWorkflow();

  Instant getTimeLastPolled();

  void setTimeLastPolled(Instant timeLastPolled);

  Optional<StageInterval> findStageIntervalById(IntervalId intervalId);

  void cacheStageIntervals(Collection<? extends StageInterval> stageIntervals);

  void pruneStageIntervals(Instant olderThan);

  boolean isInCache(IntervalId stageIntervalId);

  Lock acquireLock(IntervalId stageIntervalId);
}
