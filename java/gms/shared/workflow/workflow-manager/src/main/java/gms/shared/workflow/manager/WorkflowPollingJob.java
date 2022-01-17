package gms.shared.workflow.manager;

import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.shared.workflow.accessor.WorkflowAccessor;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.StageMode;
import gms.shared.workflow.repository.BridgedIntervalRepository;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.function.Predicate;
import java.util.function.Supplier;

import static java.util.stream.Collectors.toSet;

public class WorkflowPollingJob {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(WorkflowPollingJob.class));

  private final WorkflowAccessor workflowAccessor;
  private final BridgedIntervalRepository bridgedIntervalRepository;
  private final Supplier<Instant> currentTimeSupplier;
  private final Duration operationalPeriodStart;
  private final Duration operationalPeriodEnd;
  private final SystemEventPublisher systemEventPublisher;

  private WorkflowPollingJob(WorkflowAccessor workflowAccessor, BridgedIntervalRepository bridgedIntervalRepository,
    SystemEventPublisher systemEventPublisher, Supplier<Instant> currentTimeSupplier,
    Duration operationalPeriodStart, Duration operationalPeriodEnd
    ) {
    this.bridgedIntervalRepository = bridgedIntervalRepository;
    this.workflowAccessor = workflowAccessor;
    this.systemEventPublisher = systemEventPublisher;
    this.currentTimeSupplier = currentTimeSupplier;
    this.operationalPeriodStart = operationalPeriodStart;
    this.operationalPeriodEnd = operationalPeriodEnd;
  }

  static WorkflowPollingJob create(WorkflowAccessor workflowAccessor, BridgedIntervalRepository bridgedIntervalRepository,
    SystemEventPublisher systemEventPublisher, Supplier<Instant> currentTimeSupplier,
    Duration operationalPeriodStart, Duration operationalPeriodEnd) {
    return new WorkflowPollingJob(workflowAccessor, bridgedIntervalRepository, systemEventPublisher, currentTimeSupplier,
      operationalPeriodStart, operationalPeriodEnd);
  }


  public void updateWorkflowIntervals() {
    logger.debug("Updating Workflow Intervals...");

    var now = currentTimeSupplier.get();
    var operationalTimeStart = now.minus(operationalPeriodStart);
    var operationalTimeEnd = now.minus(operationalPeriodEnd);
    var stageIds = workflowAccessor.getWorkflow().stageIds()
      .collect(toSet());

    logger.debug("Pruning intervals older than {}", operationalTimeStart);
    workflowAccessor.pruneStageIntervals(operationalTimeStart);

    logger.debug("Polling for intervals after {}", workflowAccessor.getTimeLastPolled());
    var stageIntervals = bridgedIntervalRepository.findStageIntervalsByStageIdAndTime(
      operationalTimeStart,
      operationalTimeEnd,
      stageIds,
      workflowAccessor.getTimeLastPolled());

    var filteredIntervals = stageIntervals
      .values().stream()
      .flatMap(List::stream)
      .filter(keepStageInterval(workflowAccessor))
      .collect(toSet());

    if (!filteredIntervals.isEmpty()) {
      workflowAccessor.cacheStageIntervals(filteredIntervals);
      systemEventPublisher.createAndSendSystemEvents(filteredIntervals);
    }

    filteredIntervals.stream()
      .map(StageInterval::getModificationTime)
      .max(Instant::compareTo)
      .ifPresent(workflowAccessor::setTimeLastPolled);

    logger.debug("Workflow Intervals Update Complete");
  }

  private static Predicate<StageInterval> keepStageInterval(WorkflowAccessor workflowAccessor) {
    return stageInterval -> StageMode.AUTOMATIC.equals(stageInterval.getStageMode())
      || !workflowAccessor.isInCache(stageInterval.getIntervalId());
  }

}
