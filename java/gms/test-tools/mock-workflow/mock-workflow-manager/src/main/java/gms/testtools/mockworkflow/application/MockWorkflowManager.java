package gms.testtools.mockworkflow.application;


import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.system.events.SystemEvent;
import gms.shared.workflow.api.WorkflowManagerInterface;
import gms.shared.workflow.api.requests.StageIntervalsByStageIdAndTimeRequest;
import gms.shared.workflow.api.requests.UpdateActivityIntervalStatusRequest;
import gms.shared.workflow.api.requests.UpdateInteractiveAnalysisStageIntervalStatusRequest;
import gms.shared.workflow.coi.IntervalStatus;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import gms.testtools.mockworkflow.kafka.KafkaPublisher;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MockWorkflowManager implements WorkflowManagerInterface {
  private static final Logger logger = LoggerFactory.getLogger(MockWorkflowManager.class);
  private static final String SYSTEM_EVENT_TOPIC = "system-event";
  WorkflowRepository modifier;
  WorkflowAccessor workflowAccessor;
  SystemConfig systemConfig;
  private int messageCount = 0; // Creates unique message count of system message sent
  static final Duration INTERVAL_UPDATE_TIME = Duration.ofSeconds(20);

  MockWorkflowManager(SystemConfig systemConfig) {
    this.workflowAccessor = new WorkflowAccessor();
    this.modifier = new WorkflowRepository(workflowAccessor);
    this.systemConfig = systemConfig;

    KafkaPublisher.initialize(SYSTEM_EVENT_TOPIC);

    // Pre-populate the intervals with 3 days worth of data
    this.prePopulateIntervals(Duration.ofDays(3));

    // temp till we get kafka flux working
    startIntervalCreationTimer();
  }

  // Populate the Accessor with data
  private void prePopulateIntervals(Duration duration){
    // Call the Repo with duration minutes / 5 mins
    long numberIterations = duration.toMinutes() / 5;
    for (long i=0; i<numberIterations; i++) {
      this.modifier.generateEvents();
    }

    // Now complete the last Auto Network interval
    var lastAutoInterval = this.workflowAccessor.latestAutoInterval("Auto Network");
    lastAutoInterval = this.modifier.updateAutomaticStageIntervalStatus(lastAutoInterval, IntervalStatus.COMPLETE);
    var list = new ArrayList<StageInterval>();
    list.add(lastAutoInterval);
    this.workflowAccessor.updateIntervals(list);
  }

  public static MockWorkflowManager create(SystemConfig systemConfig) {
    return new MockWorkflowManager(systemConfig);
  }

  @Override
  public Workflow getWorkflowDefinition(String var1) {
    return workflowAccessor.getWorkflow();
  }

  @Override
  public Map<String, List<StageInterval>> findStageIntervalsByStageIdAndTime(
    StageIntervalsByStageIdAndTimeRequest var1) {
    return workflowAccessor.getIntervalMap();
  }

  @Override
  public void updateInteractiveAnalysisStageIntervalStatus(
    UpdateInteractiveAnalysisStageIntervalStatusRequest request) {
    var intervalToUpdate = workflowAccessor.updateStageIntervalStatus(request);
    intervalToUpdate.ifPresent(this::sendUpdatedStageInterval);
  }

  @Override
  public void updateActivityIntervalStatus(UpdateActivityIntervalStatusRequest request) {
    var intervalToUpdate = workflowAccessor.updateActivityIntervalStatus(request);
    intervalToUpdate.ifPresent(this::sendUpdatedStageInterval);
  }

  private void startIntervalCreationTimer() {
    var timer = new Timer();
    timer.schedule(new TimerTask() {
      @Override
      public void run() {
        sendUpdatedStageIntervals(modifier.generateEvents());
      }
    }, 0, INTERVAL_UPDATE_TIME.toMillis());
  }

  private void sendUpdatedStageInterval(StageInterval intervalToUpdate){
    List<StageInterval> intervalsToSend = new ArrayList<>();
    intervalsToSend.add(intervalToUpdate);
    this.sendUpdatedStageIntervals(intervalsToSend);
  }

  private void sendUpdatedStageIntervals(List<StageInterval>intervalsToSend){
    try {
      var systemEventInterval = SystemEvent
          .from("intervals", intervalsToSend, messageCount++);
      KafkaPublisher.getInstance().sendRecords(List.of(systemEventInterval));
    } catch (Exception e) {
      logger.warn("Failed to send Workflow interval system event messages ", e);
    }
  }
}
