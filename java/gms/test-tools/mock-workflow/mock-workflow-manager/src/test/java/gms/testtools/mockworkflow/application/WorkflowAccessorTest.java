package gms.testtools.mockworkflow.application;

import gms.shared.workflow.api.requests.UpdateActivityIntervalStatusRequest;
import gms.shared.workflow.api.requests.UpdateInteractiveAnalysisStageIntervalStatusRequest;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.IntervalStatus;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import gms.testtools.mockworkflow.util.WorkflowLoaderUtility;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class WorkflowAccessorTest {

  @Test
  void testWorkflowAccessorCreation() {
    WorkflowAccessor workflowAccessor = new WorkflowAccessor();
    assertNotNull(workflowAccessor);
    assertNotNull(workflowAccessor.getWorkflow());
    assertNotNull(workflowAccessor.getIntervalMap());
  }

  @Test
  void testUpdateStageIntervalStatus() {
    WorkflowAccessor workflowAccessor = new WorkflowAccessor();
    assertNotNull(workflowAccessor);
    var startTime = Instant.parse("2019-01-02T22:00:01.000Z");
    // Run open stage interval
    var request =
      UpdateInteractiveAnalysisStageIntervalStatusRequest.builder()
        .setStatus(IntervalStatus.IN_PROGRESS)
        .setUserName("Tom")
        .setTime(startTime)
        .setStageIntervalId(IntervalId.from(startTime, WorkflowDefinitionId.from("AL1")))
        .build();
    assert(workflowAccessor.updateStageIntervalStatus(request).isPresent());

    // Now do for close
    request = request.toBuilder().setStatus(IntervalStatus.NOT_COMPLETE).build();
    assert(workflowAccessor.updateStageIntervalStatus(request).isPresent());
  }

  @Test
  void testUpdateActivityIntervalStatus() {
    WorkflowAccessor workflowAccessor = new WorkflowAccessor();
    assertNotNull(workflowAccessor);
    var startTime = Instant.parse("2019-01-02T22:00:01.000Z");
    var request =
      UpdateActivityIntervalStatusRequest.builder()
        .setStatus(IntervalStatus.IN_PROGRESS)
        .setUserName("Joe")
        .setTime(startTime)
        .setStageIntervalId(IntervalId.from(startTime, WorkflowDefinitionId.from("AL1")))
        .setActivityIntervalId(IntervalId.from(startTime, WorkflowDefinitionId.from("Event Review")))
        .build();
    var optionalRes = workflowAccessor.updateActivityIntervalStatus(request);
    assert(optionalRes.isPresent());

    // Now do for close
    request = request.toBuilder().setStatus(IntervalStatus.NOT_COMPLETE).build();
    assert(workflowAccessor.updateActivityIntervalStatus(request).isPresent());
  }

  @Test
  void testLoadingMockWorkflow() {
    assertNotNull(WorkflowLoaderUtility.loadWorkflowFromFile(WorkflowAccessor.Config.WORKFLOW_FILE_PATH));

    // Try it with wrong JSON i.e. Intervals.json
    assertThrows(IllegalArgumentException.class, () ->
      WorkflowLoaderUtility.loadWorkflowFromFile(WorkflowAccessor.Config.WORKFLOW_INTERVALS_FILE_PATH));
  }

  @Test
  void testLoadingMockWorkflowIntervalMap() {
    assertNotNull(WorkflowLoaderUtility.loadWorkflowIntervalsFromFile(WorkflowAccessor.Config.WORKFLOW_INTERVALS_FILE_PATH));

    // Try it with wrong JSON i.e. Workflow.json
    assertThrows(IllegalArgumentException.class, () ->
      WorkflowLoaderUtility.loadWorkflowIntervalsFromFile(WorkflowAccessor.Config.WORKFLOW_FILE_PATH));
  }
}
