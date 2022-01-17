package gms.testtools.mockworkflow.application;

import gms.shared.workflow.api.requests.StageIntervalsByStageIdAndTimeRequest;
import gms.shared.workflow.api.requests.UpdateActivityIntervalStatusRequest;
import gms.shared.workflow.api.requests.UpdateInteractiveAnalysisStageIntervalStatusRequest;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.IntervalStatus;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class MockWorkflowManagerTest {
  Instant startTime = Instant.parse("2010-05-19T20:00:01.000Z");
  Instant endTime = Instant.parse("2010-05-19T21:00:00.000Z");
  @Test
  void testMockWorkflowManagerCreate() {
    var mockWorkflowManager = MockWorkflowManager.create(null);
    assertNotNull(mockWorkflowManager);

    assertNotNull(mockWorkflowManager.getWorkflowDefinition("Placeholder"));
    List<WorkflowDefinitionId> stageIds = new ArrayList<>();
    stageIds.add(WorkflowDefinitionId.from("AL1"));
    stageIds.add(WorkflowDefinitionId.from("AL2"));
    stageIds.add(WorkflowDefinitionId.from("Auto Network"));
    stageIds.add(WorkflowDefinitionId.from("Auto Post-AL1"));
    var request =
      StageIntervalsByStageIdAndTimeRequest.from(
        startTime,
        endTime,
        stageIds
      );
    assertNotNull(mockWorkflowManager.findStageIntervalsByStageIdAndTime(request));
  }

  @Test
  void testUpdateStageIntervalStatus() {
    var mockWorkflowManager = MockWorkflowManager.create(null);
    assertNotNull(mockWorkflowManager);
    // Run open stage interval
    var request =
      UpdateInteractiveAnalysisStageIntervalStatusRequest.builder()
        .setStatus(IntervalStatus.IN_PROGRESS)
        .setUserName("Tom")
        .setTime(startTime)
        .setStageIntervalId(IntervalId.from(startTime, WorkflowDefinitionId.from("AL1")))
        .build();
    mockWorkflowManager.updateInteractiveAnalysisStageIntervalStatus(request);
  }

  @Test
  void testUpdateActivityIntervalStatus() {
    var mockWorkflowManager = MockWorkflowManager.create(null);
    assertNotNull(mockWorkflowManager);
    var request =
      UpdateActivityIntervalStatusRequest.builder()
        .setStatus(IntervalStatus.IN_PROGRESS)
        .setUserName("Joe")
        .setTime(startTime)
        .setStageIntervalId(IntervalId.from(startTime, WorkflowDefinitionId.from("AL1")))
        .setActivityIntervalId(IntervalId.from(startTime, WorkflowDefinitionId.from("Event Review")))
        .build();
    mockWorkflowManager.updateActivityIntervalStatus(request);
  }
}
