package gms.shared.workflow.accessor;

import com.google.common.annotations.VisibleForTesting;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.shared.workflow.cache.IntervalCache;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import gms.shared.workflow.repository.IntervalRepositoryInterface;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.locks.Lock;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toSet;

/**
 * Accessor implementation of the Manager/Accessor/Repository pattern for the Workflow domain. Responsible for
 * Managing a cache of the {@link Workflow} and all {@link gms.shared.workflow.coi.Interval}s within the operational
 * time period. Delegates storage of intervals to an underlying {@link IntervalRepositoryInterface}
 */
public class WorkflowAccessor implements WorkflowAccessorInterface {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper.create(LoggerFactory.getLogger(WorkflowAccessor.class));

  private final Workflow workflow;
  private final IntervalRepositoryInterface intervalRepository;
  private final IntervalCache intervalCache;
  private Instant timeLastPolled;

  private WorkflowAccessor(Workflow workflow, IntervalRepositoryInterface intervalRepository,
    IntervalCache intervalCache) {
    this.workflow = workflow;
    this.intervalCache = intervalCache;
    this.intervalRepository = intervalRepository;
    //This defaults to a "min"-like value of 1/1/1900 without the problems converting back and forth from Instant.MIN
    this.timeLastPolled = Instant.ofEpochSecond(-2208988800L);
  }

  /**
   * Factory method responsible for creating a WorkflowAccessor, initializing its {@link IntervalCache} and caching the
   * {@link Workflow}
   *
   * @param workflow           Input workflow to cache
   * @param intervalRepository Delegating interval repository for persistence CRUD operations
   * @return The created WorkflowAccessor
   */
  public static WorkflowAccessor create(Workflow workflow, IntervalRepositoryInterface intervalRepository) {
    var intervalCache = IntervalCache.create();
    return new WorkflowAccessor(workflow, intervalRepository, intervalCache);
  }

  @VisibleForTesting
  static WorkflowAccessor create(Workflow workflow, IntervalRepositoryInterface intervalRepository,
    IntervalCache intervalCache) {
    return new WorkflowAccessor(workflow, intervalRepository, intervalCache);
  }

  /**
   * Initializes the cache by retrieving all relevant intervals within the provided operational time period and
   * caching them in the {@link IntervalCache}, overwriting previously cached values for the respective stage names.
   *
   * @param operationalPeriodStart Start of the operational time period
   * @param operationalPeriodEnd   End of the operational time period
   */
  public void initialize(Instant operationalPeriodStart, Instant operationalPeriodEnd) {
    logger.info("Initializing WorkflowAccessor...");
    logger.info("Attempting cache retrieval of Intervals for operational period {}:{}", operationalPeriodStart, operationalPeriodEnd);

    var stageIds = workflow.stageIds().collect(toSet());
    var stageNames = stageIds.stream().map(WorkflowDefinitionId::getName).collect(Collectors.toSet());
    var stageIntervals = intervalCache.getAll(stageNames, operationalPeriodStart, operationalPeriodEnd);

    if (stageIntervals.isEmpty()) {
      logger.info("Cache is empty retrieving Intervals for operational period {}:{}", operationalPeriodStart, operationalPeriodEnd);
      stageIntervals = intervalRepository.findStageIntervalsByStageIdAndTime(
        operationalPeriodStart,
        operationalPeriodEnd,
        stageIds);
      logger.info("Caching Intervals...");
      stageIntervals.forEach(intervalCache::cache);
    }

    logger.debug("Intervals found for {} stages", stageIntervals.keySet().size());
    if (logger.getWrappedLogger().isDebugEnabled()) {
      stageIntervals.forEach((name, intervals) -> logger.debug("{} intervals found for stage {}", intervals.size(), name));
    }

    stageIntervals
      .values()
      .stream()
      .flatMap(List::stream)
      .map(StageInterval::getModificationTime)
      .max(Instant::compareTo)
      .ifPresent(this::setTimeLastPolled);

    logger.info("WorkflowAccessor initialization complete");
  }

  @Override
  public Workflow getWorkflow() {
    return workflow;
  }

  @Override
  public void setTimeLastPolled(Instant timeLastPolled) {
    this.timeLastPolled = timeLastPolled;
  }

  @Override
  public Instant getTimeLastPolled() {
    return timeLastPolled;
  }

  @Override
  public Optional<StageInterval> findStageIntervalById(IntervalId intervalId) {
    return intervalCache.get(intervalId);
  }

  @Override
  public void cacheStageIntervals(Collection<? extends StageInterval> stageIntervals) {
    stageIntervals.forEach(intervalCache::put);
  }

  @Override
  public void pruneStageIntervals(Instant olderThan) {
    intervalCache.prune(olderThan);
  }

  @Override
  public boolean isInCache(IntervalId intervalId) {
    return intervalCache.get(intervalId).isPresent();
  }

  @Override
  public Lock acquireLock(IntervalId stageIntervalId) {
    return intervalCache.acquireLock(stageIntervalId.getDefinitionId().getName());
  }

  @Override
  public Map<String, List<StageInterval>> findStageIntervalsByStageIdAndTime(Instant startTime, Instant endTime,
    Collection<WorkflowDefinitionId> stageIds) {
    return intervalCache.getAll(stageIds.stream().map(WorkflowDefinitionId::getName).collect(toSet()), startTime, endTime);
  }

}
