package gms.shared.workflow.coi;

import gms.shared.utilities.test.TestUtilities;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;

import static java.util.stream.Collectors.toList;

class MockWorkflowTests {

  @Test
  void testMockWorkflowSerialization() throws IOException {

    Workflow mockWorkflow = MockWorkflow.get();
    Workflow serializedMockWorkflow = TestUtilities.testSerialization(mockWorkflow, Workflow.class);
    Assertions.assertEquals(mockWorkflow, serializedMockWorkflow);
  }

  @Test
  void testMockIntervalDataSerialization() throws IOException {

    List<WorkflowDefinitionId> stageIds = Stream.of("AL1", "AL2", "Auto Network", "Auto Post-AL1")
      .map(WorkflowDefinitionId::from)
      .collect(toList());

    var mockIntervals = MockIntervalData.get(Instant.EPOCH, Instant.EPOCH.plusSeconds(1), stageIds);


    for (List<StageInterval> stageIntervals : mockIntervals.values()) {
      StageInterval serializedStageInterval = TestUtilities.testSerialization(stageIntervals.get(0), StageInterval.class);
      Assertions.assertEquals(stageIntervals.get(0), serializedStageInterval);
    }
  }

}
