package gms.shared.workflow.manager;

import com.google.common.annotations.VisibleForTesting;
import gms.shared.frameworks.configuration.Selector;
import gms.shared.frameworks.control.ControlContext;
import gms.shared.frameworks.service.InvalidInputException;
import gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.shared.workflow.accessor.WorkflowAccessor;
import gms.shared.workflow.accessor.WorkflowAccessorInterface;
import gms.shared.workflow.api.WorkflowManagerInterface;
import gms.shared.workflow.api.requests.StageIntervalsByStageIdAndTimeRequest;
import gms.shared.workflow.api.requests.UpdateActivityIntervalStatusRequest;
import gms.shared.workflow.api.requests.UpdateInteractiveAnalysisStageIntervalStatusRequest;
import gms.shared.workflow.cache.util.WorkflowCacheFactory;
import gms.shared.workflow.coi.ActivityInterval;
import gms.shared.workflow.coi.InteractiveAnalysisStageInterval;
import gms.shared.workflow.coi.IntervalStatus;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.configuration.WorkflowConfiguration;
import gms.shared.workflow.repository.BridgedIntervalRepository;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static com.google.common.base.Preconditions.checkArgument;
import static java.lang.String.format;
import static java.util.stream.Collectors.toList;

public class WorkflowManager implements WorkflowManagerInterface {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(WorkflowManager.class));

  private static final String OPERATIONAL_TIME_PERIOD_CONFIG = "global.operational-time-period";
  private static final String OPERATIONAL_PERIOD_START = "operationalPeriodStart";
  private static final String OPERATIONAL_PERIOD_END = "operationalPeriodEnd";
  static final String BRIDGE_POLLING_PERIOD_CONFIG = "workflow-manager.bridge-polling-period";
  private static final String BRIDGE_POLLING_PERIOD = "bridgePollingPeriod";
  private static final String PERSISTENCE_UNIT = "workflow-dao";


  private final WorkflowAccessorInterface workflowAccessor;
  private final SystemEventPublisher systemEventPublisher;

  private WorkflowManager(WorkflowAccessorInterface workflowAccessor,
    SystemEventPublisher systemEventPublisher) {
    this.workflowAccessor = workflowAccessor;
    this.systemEventPublisher = systemEventPublisher;
  }

  public static WorkflowManager create(ControlContext context) {
    Objects.requireNonNull(context, "Null context");
    var processingConfig = context.getProcessingConfigurationConsumerUtility();
    var operationalTimeConfig = processingConfig.resolve(OPERATIONAL_TIME_PERIOD_CONFIG,
      List.of(Selector.from("TestType", "12-year-test")));
    var operationalStart = Duration.parse(operationalTimeConfig.get(OPERATIONAL_PERIOD_START).toString());
    var operationalEnd = Duration.parse(operationalTimeConfig.get(OPERATIONAL_PERIOD_END).toString());
    var bridgedPollingPeriodConfig = processingConfig.resolve(BRIDGE_POLLING_PERIOD_CONFIG, List.of());
    var bridgedPollingPeriod = Duration.parse(bridgedPollingPeriodConfig.get(BRIDGE_POLLING_PERIOD).toString());
    var workflowConfiguration = WorkflowConfiguration.create(processingConfig);

    var systemConfig = context.getSystemConfig();
    WorkflowCacheFactory.setUpCache(systemConfig);
    var entityManagerFactory =
      BridgedEntityManagerFactoryProvider.create()
        .getEntityManagerFactory(PERSISTENCE_UNIT, systemConfig);

    var workflow = workflowConfiguration.resolveWorkflowDefinition();
    var bridgedIntervalRepository = BridgedIntervalRepository
      .create(entityManagerFactory, workflow);
    var workflowAccessor = WorkflowAccessor
      .create(workflow, bridgedIntervalRepository);
    workflowAccessor.initialize(Instant.now().minus(operationalStart), Instant.now().minus(operationalEnd));

    var systemEventPublisher = SystemEventPublisher.create(systemConfig);

    var workflowPollingJob = WorkflowPollingJob.create(
      workflowAccessor,
      bridgedIntervalRepository,
      systemEventPublisher,
      Instant::now,
      operationalStart,
      operationalEnd);

    var scheduledExecutorService = Executors.newSingleThreadScheduledExecutor();
    var pollingHandle = scheduledExecutorService.scheduleAtFixedRate(workflowPollingJob::updateWorkflowIntervals,
      bridgedPollingPeriod.getSeconds(),
      bridgedPollingPeriod.getSeconds(),
      TimeUnit.SECONDS);

    Runtime.getRuntime().addShutdownHook(new Thread(()-> pollingHandle.cancel(true)));

    return create(workflowAccessor, systemEventPublisher);
  }

  @VisibleForTesting
  static WorkflowManager create(WorkflowAccessorInterface workflowAccessor,
    SystemEventPublisher systemEventPublisher) {
    return new WorkflowManager(workflowAccessor, systemEventPublisher);
  }

  @Override
  public Workflow getWorkflowDefinition(String placeholder) {
    return workflowAccessor.getWorkflow();
  }

  @Override
  public Map<String, List<StageInterval>> findStageIntervalsByStageIdAndTime(
    StageIntervalsByStageIdAndTimeRequest request) {
    return workflowAccessor
      .findStageIntervalsByStageIdAndTime(request.getStartTime(), request.getEndTime(),
        request.getStageIds());
  }

  @Override
  public void updateInteractiveAnalysisStageIntervalStatus(
    UpdateInteractiveAnalysisStageIntervalStatusRequest request) {
    logger.debug("Handling InteractiveAnalysisStage update for stage {} with status {}",
      request.getStageIntervalId().getDefinitionId().getName(), request.getStatus());

    var lock = workflowAccessor.acquireLock(request.getStageIntervalId());
    try {
      lock.lock();
      var originalStageInterval = workflowAccessor
        .findStageIntervalById(request.getStageIntervalId())
        .orElseThrow(() -> new InvalidInputException(format("No Stage Interval found for IntervalID:%s", request.getStageIntervalId())));

      if (!(originalStageInterval instanceof InteractiveAnalysisStageInterval)) {
        throw new InvalidInputException(
          format("The requested StageInterval for Id {%s} was an AutomaticProcessingStageInterval",
            request.getStageIntervalId().getDefinitionId().getName()));
      }

      var interactiveAnalysisStageIntervals = List.of((InteractiveAnalysisStageInterval) originalStageInterval);
      var requestedIntervalStatus = request.getStatus();
      var modTime = Instant.now();

      List<InteractiveAnalysisStageInterval> updatedStageIntervals;
      if (requestedIntervalStatus.equals(IntervalStatus.IN_PROGRESS)) {
        updatedStageIntervals = IntervalUtility.openInteractiveStageIntervals(interactiveAnalysisStageIntervals, request.getUserName());
      } else if (requestedIntervalStatus.equals(IntervalStatus.NOT_COMPLETE)) {
        updatedStageIntervals = IntervalUtility.closeInteractiveStageIntervals(interactiveAnalysisStageIntervals, request.getUserName());
      } else if (requestedIntervalStatus.equals(IntervalStatus.COMPLETE)) {
        updatedStageIntervals = IntervalUtility.completeInteractiveStageIntervals(interactiveAnalysisStageIntervals);
      } else {
        throw new InvalidInputException(
          format("Attempting to update analysis stage interval to invalid status {%s}", requestedIntervalStatus));
      }

      var updatedStageIntervalOpt = updateModTime(
        (InteractiveAnalysisStageInterval) originalStageInterval,
        updatedStageIntervals.get(0),
        modTime
      );

      updatedStageIntervalOpt.ifPresent(si -> {
          var updatedStageIntervalList = List.of(si);
          logger.debug("Sending {} Stage SystemEvent(s) updates", updatedStageIntervalList.size());
          workflowAccessor.cacheStageIntervals(updatedStageIntervalList);
          systemEventPublisher.createAndSendSystemEvents(updatedStageIntervalList);
        }
      );
    } finally {
      lock.unlock();
    }

  }

  @Override
  public void updateActivityIntervalStatus(UpdateActivityIntervalStatusRequest request) {

    logger.debug("Handling ActivityIntervalStatus update for activity {} with status {}",
      request.getActivityIntervalId(), request.getStatus());

    var lock = workflowAccessor.acquireLock(request.getStageIntervalId());
    try {
      lock.lock();
      var stageInterval = workflowAccessor
        .findStageIntervalById(request.getStageIntervalId())
        .orElseThrow(() -> new InvalidInputException(format("No Stage Interval found for IntervalID:%s", request.getStageIntervalId())));

      checkArgument(stageInterval instanceof InteractiveAnalysisStageInterval,
        "The StageIntervals returned contained for the request ID contain AutomaticProcessingStageIntervals");

      var interactiveAnalysisStageIntervals = List.of((InteractiveAnalysisStageInterval) stageInterval);

      var intervalStatus = request.getStatus();

      var modTime = Instant.now();

      var updatedStageIntervals = interactiveAnalysisStageIntervals
        .stream()
        .map(originalStageInterval -> {

          InteractiveAnalysisStageInterval updatedStageInterval;
          if (intervalStatus.equals(IntervalStatus.IN_PROGRESS)) {

            updatedStageInterval = IntervalUtility.openActivityInterval(
              originalStageInterval, request.getActivityIntervalId(), request.getUserName());
          } else if (intervalStatus.equals(IntervalStatus.NOT_COMPLETE)) {

            updatedStageInterval = IntervalUtility.closeActivityInterval(
              originalStageInterval, request.getActivityIntervalId(), request.getUserName());
          } else if (intervalStatus.equals(IntervalStatus.COMPLETE)) {

            updatedStageInterval = IntervalUtility.completeActivityInterval(
              originalStageInterval, request.getActivityIntervalId(), request.getUserName());
          } else {
            throw new InvalidInputException(
              format("Attempting to update activity interval to status {%s}", intervalStatus));
          }

          return updateModTime(originalStageInterval, updatedStageInterval, modTime);
        })
        .flatMap(Optional::stream)
        .collect(toList());

      updatedStageIntervals.forEach(si -> {
        var wrappedStageInterval = List.of(si);
        logger.debug("Sending {} Stage SystemEvent(s) updates", wrappedStageInterval.size());
        workflowAccessor.cacheStageIntervals(wrappedStageInterval);
        systemEventPublisher.createAndSendSystemEvents(wrappedStageInterval);
      });
    } finally {
      lock.unlock();
    }
  }

  private Optional<InteractiveAnalysisStageInterval> updateModTime(
    InteractiveAnalysisStageInterval originalStageInterval,
    InteractiveAnalysisStageInterval updatedStageInterval,
    Instant modTime) {

    checkArgument(originalStageInterval.getActivityIntervals().size() == updatedStageInterval.getActivityIntervals().size(),
      "The originalStageInterval and the updatedStageInterval do not have the same number of activities!");

    var originalActivitiesIterator = originalStageInterval.activityIntervals().iterator();
    var updatedActivitiesIterator = updatedStageInterval.activityIntervals().iterator();

    var updatedActivityIntervals = new ArrayList<ActivityInterval>();
    var activitiesUpdated = false;
    var stageIntervalUpdated = false;

    while (originalActivitiesIterator.hasNext() && updatedActivitiesIterator.hasNext()) {
      var activityInterval = originalActivitiesIterator.next();
      var updatedActivity = updatedActivitiesIterator.next();

      if (!activityInterval.equals(updatedActivity)) {
        activitiesUpdated = true;
        updatedActivity = updatedActivity.toBuilder()
          .setModificationTime(modTime)
          .build();
      }

      updatedActivityIntervals.add(updatedActivity);
    }

    //check if the originalStage status got updated
    stageIntervalUpdated = !originalStageInterval.getStatus().equals(updatedStageInterval.getStatus());

    if (activitiesUpdated || stageIntervalUpdated) {
      return Optional.of(
        updatedStageInterval.toBuilder()
          .setModificationTime(modTime)
          .setActivityIntervals(updatedActivityIntervals)
          .build()
      );
    } else {
      return Optional.empty();
    }
  }

}
