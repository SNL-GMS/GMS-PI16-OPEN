package gms.testtools.mockworkflow.application;

import gms.shared.workflow.coi.ActivityInterval;
import gms.shared.workflow.coi.AutomaticProcessingStageInterval;
import gms.shared.workflow.coi.IntervalStatus;
import gms.shared.workflow.coi.ProcessingSequenceInterval;
import gms.shared.workflow.coi.StageInterval;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Workflow Repository class called to update workflow intervals to
 * be displayed in the UI.
 */
public class WorkflowRepository {
  private int interactiveSentCount = 0;
  private final SecureRandom randomSeed = new SecureRandom();
  private WorkflowAccessor workflowAccessor;
  private static final String AL1 = "AL1";
  private static final String AL2 = "AL2";
  private static final String AUTO_NETWORK = "Auto Network";
  private static final String AUTO_POST_AL1 = "Auto Post-AL1";

  // Constructor to access the intervals in need of modification
  public WorkflowRepository(WorkflowAccessor workflowAccessor) {
    this.workflowAccessor = workflowAccessor;
  }

  /**
   * Called to generate updated/new Workflow Interval entries.
   *
   * @return the intervals generated from this request
   */
  public List<StageInterval> generateEvents() {
    // Calc percent and post increment count sent
    double percentComplete = ((interactiveSentCount % 12)) / 12.0 * 100;


    // send an Auto Network processing message every time
    List<StageInterval> stageIntervals = this.getAutoNetworkProcessingInterval();

    // Every 12 processing stage messages sent send an interactive analyst stage interval
    // send an Auto Network processing message every time
    if (interactiveSentCount++ == 0) {
      // don't generate a new interval to change to when it's the first interval to send
      stageIntervals.addAll(this.getInteractiveStageInterval(AL1, percentComplete, false));
      stageIntervals.addAll(this.getInteractiveStageInterval(AL2, percentComplete, false));
      stageIntervals.addAll(this.getAutoPostProcessingInterval(percentComplete, false));
    } else {
      stageIntervals.addAll(this.getInteractiveStageInterval(AL1, percentComplete, true));
      stageIntervals.addAll(this.getInteractiveStageInterval(AL2, percentComplete, true));
      stageIntervals.addAll(this.getAutoPostProcessingInterval(percentComplete, true));
    }

    // Update the accessor cache with updated and new StageIntervals
    this.workflowAccessor.updateIntervals(stageIntervals);
    return stageIntervals;
  }

  /**
   * Helper function to update status
   * @param autoInterval
   * @param status
   * @return AutomaticProcessingStageInterval
   */
  public AutomaticProcessingStageInterval updateAutomaticStageIntervalStatus(
    AutomaticProcessingStageInterval autoInterval, IntervalStatus status) {
    return autoInterval.toBuilder().
      setStatus(status).setSequenceIntervals(
      autoInterval.getSequenceIntervals().stream()
        .map(ProcessingSequenceInterval::toBuilder)
        .map(seq -> seq.setStatus(status).build())
        .collect(Collectors.toList())).build();
  }

  private List<StageInterval> getInteractiveStageInterval(String stageName, double percentComplete,
    boolean changeToNewInterval) {

    var stageIntervals = new ArrayList<StageInterval>();
    // Set to complete and add to list
    var stageInterval = workflowAccessor.latestAnalysisInterval(stageName);
    var builder = stageInterval.toBuilder();

    // Create an updated version of the Interactive Stage Interval
    stageInterval = builder
      .setComment("Update interval " + stageInterval.getStatus() + " percent avail: " + percentComplete)
      .build();

    // Add entry to the list
    stageIntervals.add(stageInterval);

    // Every 12th create a new interval
    if (percentComplete == 0.0 && changeToNewInterval) {
      Instant startTime = stageInterval.getStartTime();
      startTime = startTime.plus(60, ChronoUnit.MINUTES);
      Instant endTime = stageInterval.getEndTime();
      endTime = endTime.plus(60, ChronoUnit.MINUTES);

      // Create the next AL1 stage interval and add it to the map
      stageInterval = builder.setProcessingEndTime(endTime)
        .setProcessingStartTime(startTime)
        .setStartTime(startTime)
        .setEndTime(endTime)
        .setModificationTime(endTime)
        .setStatus(IntervalStatus.NOT_STARTED)
        .setPercentAvailable(0.0)
        .setComment("New interval in progress")
        .setActivityIntervals(updateActivities(
          stageInterval.getActivityIntervals(), startTime, endTime))
        .build();

      // Add the stage interval to the list to be returned
      stageIntervals.add(stageInterval);
    }
    return stageIntervals;
  }

  private List<ActivityInterval> updateActivities(List<ActivityInterval> activities,
    Instant startTime, Instant endTime) {
    return activities.stream()
      .map(ActivityInterval::toBuilder)
      .map(activityBuilder -> activityBuilder.setStatus(IntervalStatus.NOT_STARTED)
        .setActiveAnalysts(new ArrayList<>())
        .setStartTime(startTime)
        .setEndTime(endTime)
        .setModificationTime(activityBuilder.build().getModificationTime().plus(5, ChronoUnit.MINUTES))
        .build())
      .collect(Collectors.toList());
  }

  private List<StageInterval> getAutoNetworkProcessingInterval() {
    var stageIntervals = new ArrayList<StageInterval>();
    int randStatus = Math.abs(randomSeed.nextInt() % 20);
    var intervalStatus = IntervalStatus.COMPLETE;
    if (randStatus >= 18) {
      intervalStatus = IntervalStatus.SKIPPED;
    } else if (randStatus <= 2) {
      intervalStatus = IntervalStatus.FAILED;
    }

    var autoNetworkStageInterval = workflowAccessor.latestAutoInterval(AUTO_NETWORK);
    var intervalBuilder = autoNetworkStageInterval.toBuilder();
    intervalBuilder.setStatus(intervalStatus);

    intervalBuilder.setSequenceIntervals(
      updateSequenceIntervals(
        autoNetworkStageInterval.getSequenceIntervals(),
        intervalStatus,
        autoNetworkStageInterval.getStartTime(),
        autoNetworkStageInterval.getEndTime(),
        100.0));
    autoNetworkStageInterval = intervalBuilder.build();

    // Add it to the list
    stageIntervals.add(autoNetworkStageInterval);

    Instant startTime = autoNetworkStageInterval.getStartTime();
    startTime = startTime.plus(5, ChronoUnit.MINUTES);
    Instant endTime = autoNetworkStageInterval.getEndTime();
    endTime = endTime.plus(5, ChronoUnit.MINUTES);
    intervalBuilder.setProcessingEndTime(endTime)
      .setProcessingStartTime(startTime)
      .setStartTime(startTime)
      .setEndTime(endTime)
      .setModificationTime(endTime)
      .setStatus(IntervalStatus.IN_PROGRESS)
      .setSequenceIntervals(
        updateSequenceIntervals(
          autoNetworkStageInterval.getSequenceIntervals(),
          IntervalStatus.IN_PROGRESS,
          startTime,
          endTime,
          0.0));
    // Create next Auto Network stage interval and add it to the map
    autoNetworkStageInterval = intervalBuilder.build();
    stageIntervals.add(autoNetworkStageInterval);
    return stageIntervals;
  }

  private List<StageInterval> getAutoPostProcessingInterval(double percentComplete, boolean changeToNewInterval) {
    var stageIntervals = new ArrayList<StageInterval>();
    var autoPostStageInterval = workflowAccessor.latestAutoInterval(AUTO_POST_AL1);
    var intervalBuilder = autoPostStageInterval.toBuilder();
    var intervalComplete = percentComplete == 0.0 && changeToNewInterval;
    var status = intervalComplete ? IntervalStatus.COMPLETE : IntervalStatus.IN_PROGRESS;
    intervalBuilder.setStatus(status)
      .setPercentAvailable(percentComplete);
    intervalBuilder.setSequenceIntervals(
      updateSequenceIntervals(
        autoPostStageInterval.getSequenceIntervals(),
        status,
        autoPostStageInterval.getStartTime(),
        autoPostStageInterval.getEndTime(),
        intervalComplete? 100 : percentComplete));
    autoPostStageInterval = intervalBuilder.build();

    // Add it to the list
    stageIntervals.add(autoPostStageInterval);

    // Every 12th send an update message
    if (intervalComplete) {
      Instant startTime = autoPostStageInterval.getStartTime();
      startTime = startTime.plus(60, ChronoUnit.MINUTES);
      Instant endTime = autoPostStageInterval.getEndTime();
      endTime = endTime.plus(60, ChronoUnit.MINUTES);
      intervalBuilder.setProcessingEndTime(endTime)
        .setProcessingStartTime(startTime)
        .setStartTime(startTime)
        .setEndTime(endTime)
        .setModificationTime(endTime)
        .setStatus(IntervalStatus.IN_PROGRESS)
        .setSequenceIntervals(
          updateSequenceIntervals(
            autoPostStageInterval.getSequenceIntervals(),
            IntervalStatus.IN_PROGRESS,
            startTime,
            endTime,
            0.0));
      // Create next Auto Network stage interval and add it to the map
      autoPostStageInterval = intervalBuilder.build();
      stageIntervals.add(autoPostStageInterval);
    }
    return stageIntervals;
  }

  private List<ProcessingSequenceInterval> updateSequenceIntervals(List<ProcessingSequenceInterval> sequenceIntervals,
    IntervalStatus status, Instant startTime, Instant endTime, double percentComplete) {
    return sequenceIntervals.stream()
      .map(ProcessingSequenceInterval::toBuilder)
      .map(seq -> seq.setStatus(status)
        .setPercentComplete(percentComplete)
        .setStartTime(startTime)
        .setEndTime(endTime)
        .setModificationTime(endTime)
        .build())
      .collect(Collectors.toList());
  }
}
