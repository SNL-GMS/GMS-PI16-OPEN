package gms.testtools.mockworkflow.application;

import gms.shared.workflow.api.requests.UpdateActivityIntervalStatusRequest;
import gms.shared.workflow.api.requests.UpdateInteractiveAnalysisStageIntervalStatusRequest;
import gms.shared.workflow.coi.ActivityInterval;
import gms.shared.workflow.coi.AutomaticProcessingStageInterval;
import gms.shared.workflow.coi.InteractiveAnalysisStageInterval;
import gms.shared.workflow.coi.IntervalStatus;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.StageMode;
import gms.shared.workflow.coi.Workflow;
import gms.testtools.mockworkflow.util.WorkflowLoaderUtility;
import org.apache.commons.lang3.Validate;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public class WorkflowAccessor {
  /* Constructor initialize station list and SystemMessageGenerator for each station */
  private final Workflow workflow;
  private final Map<String, List<StageInterval>> intervalMap;
  private static final String AL1 = "AL1";
  private static final String AL2 = "AL2";
  private static final String AUTO_NETWORK = "Auto Network";
  private static final String AUTO_POST_AL1 = "Auto Post-AL1";
  private static final String[] stageNames = {AL1, AL2, AUTO_NETWORK, AUTO_POST_AL1};
  static class Config {
    private Config() {
    }
    private static final String BASE_FILE_PATH = "gms/testtools/mockworkflow/";
    static final String WORKFLOW_FILE_PATH = BASE_FILE_PATH + "workflow.json";
    static final String WORKFLOW_INTERVALS_FILE_PATH = BASE_FILE_PATH + "workflow-intervals.json";
  }

  /* Constructor initialize Workflow and Interval Map */
  public WorkflowAccessor() {
    this.workflow = WorkflowLoaderUtility.loadWorkflowFromFile(Config.WORKFLOW_FILE_PATH);
    this.intervalMap = WorkflowLoaderUtility.loadWorkflowIntervalsFromFile(Config.WORKFLOW_INTERVALS_FILE_PATH);
    for(var stageName : stageNames) {
      Validate.notNull(this.intervalMap.get(stageName), "No %s Stage Interval found!", stageName);
    }
  }

  public Workflow getWorkflow() {
    return this.workflow;
  }

  public Map<String, List<StageInterval>> getIntervalMap() {
    return this.intervalMap;
  }

  // Helper get the last interactive interval in the list
  public InteractiveAnalysisStageInterval latestAnalysisInterval(String stageName) {
    var interactiveStage = this.intervalMap.get(stageName);
    return (InteractiveAnalysisStageInterval) interactiveStage.get(interactiveStage.size() - 1);
  }

  // Helper get the last processing interval in the list
  public AutomaticProcessingStageInterval latestAutoInterval(String automaticName) {
    var autoInterval = this.intervalMap.get(automaticName);
    return (AutomaticProcessingStageInterval) autoInterval.get(autoInterval.size() - 1);
  }

  public void updateIntervals(List<StageInterval> stageIntervals) {
    // Nothing to do
    if(stageIntervals == null || stageIntervals.isEmpty()) {
      return;
    }

    // Figure which type of interval it is Interactive or Automated
    for (StageInterval stageInterval : stageIntervals) {
      this.addInterval(stageInterval);
    }
  }

  public Optional<StageInterval> updateStageIntervalStatus(
    UpdateInteractiveAnalysisStageIntervalStatusRequest request) {
    Optional<List<StageInterval>> possibleStageIntervals = Optional.ofNullable(intervalMap.get(request.getStageIntervalId().getDefinitionId().getName()));
    if (possibleStageIntervals.isPresent()) {
      Optional<StageInterval> possibleStageInterval = possibleStageIntervals.flatMap(sis -> sis.stream().filter(si -> si.getStartTime().equals(request.getStageIntervalId().getStartTime())).findFirst());
      if (possibleStageInterval.isPresent()) {
        var stageIntervals = possibleStageIntervals.get();
        var stageInterval = possibleStageInterval.get();
        var index = stageIntervals.indexOf(stageInterval);
        if (stageInterval.getStageMode().equals(StageMode.INTERACTIVE)) {
          var interStageInterval = (InteractiveAnalysisStageInterval) stageInterval;
          var activities = interStageInterval.getActivityIntervals().stream().map(
            activity -> {
              if (request.getStatus().equals(IntervalStatus.IN_PROGRESS)) {
                return openActivityInterval(activity, request.getUserName());
              } else if (request.getStatus().equals(IntervalStatus.NOT_COMPLETE)) {
                return closeActivityInterval(activity, request.getUserName());
              }
              return activity;
            }).collect(Collectors.toList());

          // reuse the add method
          interStageInterval = interStageInterval.toBuilder().setStatus(request.getStatus()).setActivityIntervals(activities).build();
          stageIntervals.set(index, interStageInterval);

          return Optional.of(interStageInterval);
        } else {
          return Optional.empty();
        }
      } else {
        return Optional.empty();
      }
    } else {
      return Optional.empty();
    }
  }

  public Optional<StageInterval> updateActivityIntervalStatus(UpdateActivityIntervalStatusRequest request) {
    Optional<List<StageInterval>> possibleStageIntervals = Optional.ofNullable(intervalMap.get(request.getStageIntervalId().getDefinitionId().getName()));
    if (possibleStageIntervals.isPresent()) {
      Optional<StageInterval> possibleStageInterval = possibleStageIntervals.flatMap(sis -> sis.stream().filter(si -> si.getStartTime().equals(request.getStageIntervalId().getStartTime())).findFirst());
      if (possibleStageInterval.isPresent()) {
        var stageIntervals = possibleStageIntervals.get();
        var stageInterval = possibleStageInterval.get();
        var stageIndex = stageIntervals.indexOf(stageInterval);
        if (stageInterval.getStageMode().equals(StageMode.INTERACTIVE)) {
          return updateActivityWithinStageInterval(request, stageIntervals, (InteractiveAnalysisStageInterval) stageInterval, stageIndex);
        } else {
          return Optional.empty();
        }
      } else {
        return Optional.empty();
      }
    } else {
      return Optional.empty();
    }
  }

  private Optional<StageInterval> updateActivityWithinStageInterval(UpdateActivityIntervalStatusRequest request,
    List<StageInterval> stageIntervals, InteractiveAnalysisStageInterval stageInterval, int stageIndex) {
    var interStageInterval = stageInterval;
    var activityIntervals = interStageInterval.getActivityIntervals();
    var possibleActivityInterval = activityIntervals.stream().filter(
      ai -> ai.getName().equals(request.getActivityIntervalId().getDefinitionId().getName()) &&
        ai.getStartTime().equals(request.getActivityIntervalId().getStartTime())).findFirst();

    if (possibleActivityInterval.isPresent()) {
      var activityInterval = possibleActivityInterval.get();
      var activityIndex = activityIntervals.indexOf(activityInterval);
      if (request.getStatus().equals(IntervalStatus.IN_PROGRESS)) {
        activityInterval = openActivityInterval(activityInterval, request.getUserName());
      } else if (request.getStatus().equals(IntervalStatus.NOT_COMPLETE)) {
        activityInterval = closeActivityInterval(activityInterval, request.getUserName());
      }
      activityIntervals.set(activityIndex, activityInterval);
      var interSIBuilder = interStageInterval.toBuilder();

      if (activityIntervals.stream().anyMatch(ai -> ai.getStatus().equals(IntervalStatus.IN_PROGRESS))) {
        interSIBuilder.setStatus(IntervalStatus.IN_PROGRESS);
      } else if (activityIntervals.stream().anyMatch(ai -> ai.getStatus().equals(IntervalStatus.NOT_COMPLETE))) {
        interSIBuilder.setStatus(IntervalStatus.NOT_COMPLETE);
      } else if (activityIntervals.stream().allMatch(ai -> ai.getStatus().equals(IntervalStatus.COMPLETE))) {
        interSIBuilder.setStatus(IntervalStatus.COMPLETE);
      }

      interStageInterval = interSIBuilder.setActivityIntervals(activityIntervals).build();
      stageIntervals.set(stageIndex, interStageInterval);

      return Optional.of(interStageInterval);
    } else {
      return Optional.empty();
    }
  }

  private void addInterval(StageInterval interval){
    // Find the list based on the stageName
    var isUpdate =false;
    var intervals = this.intervalMap.get(interval.getName());
    for(var i=0; i<intervals.size(); i++) {
      var listInterval = intervals.get(i);
      if (listInterval.getName().equals(interval.getName()) &&
        listInterval.getStartTime().equals(interval.getStartTime()) &&
        listInterval.getEndTime().equals(interval.getEndTime())) {
        intervals.set(i, interval);
        isUpdate=true;
        break;
      }
    }

    // else add it to the end
    if(!isUpdate) {
      intervals.add(interval);
    }
  }

  private ActivityInterval openActivityInterval(ActivityInterval activityInterval,
    String userName) {
    var aiBuilder = activityInterval.toBuilder();
    var analystList = activityInterval.getActiveAnalysts();
    if(!analystList.contains(userName)){
      analystList.add(userName);
    }
    aiBuilder.setStatus(IntervalStatus.IN_PROGRESS).setActiveAnalysts(analystList);
    return aiBuilder.build();
  }

  private ActivityInterval closeActivityInterval(ActivityInterval activityInterval,
    String userName) {
    // Remove userName from the list no need to check since will fail harmlessly
    var analystList = activityInterval.getActiveAnalysts();
    analystList.remove(userName);
    var aiBuilder = activityInterval.toBuilder();
    if (analystList.isEmpty()) {
      aiBuilder.setStatus(IntervalStatus.NOT_COMPLETE);
    }
    aiBuilder.setActiveAnalysts(analystList);
    return aiBuilder.build();
  }
}
