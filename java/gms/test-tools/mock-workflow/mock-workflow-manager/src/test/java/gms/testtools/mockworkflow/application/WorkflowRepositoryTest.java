package gms.testtools.mockworkflow.application;

import gms.shared.workflow.coi.IntervalStatus;
import gms.shared.workflow.coi.StageInterval;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.BinaryOperator;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class WorkflowRepositoryTest {

  public static final BinaryOperator<List<StageInterval>> LIST_ADD_ALL = (list1, list2) -> {
    list1.addAll(list2);
    return list1;
  };

  @Test
  void testWorkflowRepositoryCreation() {
    WorkflowAccessor workflowAccessor = new WorkflowAccessor();
    WorkflowRepository workflowRepository = new WorkflowRepository(workflowAccessor);
    assertNotNull(workflowRepository);

    // Call the modifier 12 times to exercise creating a new Processing stage
    // and an updated interactive and processing stage
    for (int i = 0; i < 12; i++) {
      var resultByStage = workflowRepository.generateEvents().stream()
        .collect(Collectors.toMap(StageInterval::getName, si -> new ArrayList<>(List.of(si)), LIST_ADD_ALL));
      verifyAutoNetwork(resultByStage);
      verifyInteractiveAndPost(resultByStage, false);
    }

    // Call 13th time creates a new interactive stage along with the 5 from above
    var resultByStage = workflowRepository.generateEvents().stream()
      .collect(Collectors.toMap(StageInterval::getName, si -> new ArrayList<>(List.of(si)), LIST_ADD_ALL));

    verifyAutoNetwork(resultByStage);
    verifyInteractiveAndPost(resultByStage, true);

    // Test sending an empty list
    workflowAccessor.updateIntervals(Collections.emptyList());

    // Test sending an null list
    workflowAccessor.updateIntervals(null);
  }

  private void verifyAutoNetwork(Map<String, List<StageInterval>> intervalsByStageName) {
    var autoNetworkIntervals = intervalsByStageName.get("Auto Network");
    assertEquals(2, autoNetworkIntervals.size());
    assertEquals(1, autoNetworkIntervals.stream().filter(si -> si.getStatus().equals(IntervalStatus.COMPLETE)
      || si.getStatus().equals(IntervalStatus.SKIPPED)
      || si.getStatus().equals(IntervalStatus.FAILED)).count());
    assertEquals(1, autoNetworkIntervals.stream().filter(si -> si.getStatus().equals(IntervalStatus.IN_PROGRESS)).count());
  }

  private void verifyInteractiveAndPost(Map<String, List<StageInterval>> intervalsByStageName,
    boolean expectNewIntervals) {

    var expectedCountByName = expectNewIntervals ? 2 : 1;

    intervalsByStageName.entrySet().stream()
      .filter(entry -> !entry.getKey().equals("Auto Network"))
      .forEach(entry -> {
        assertEquals(expectedCountByName, entry.getValue().size());
        if (expectNewIntervals) {
          assertEquals(1, entry.getValue().stream().filter(si -> si.getStatus().equals(IntervalStatus.COMPLETE)).count());
        }
      });
  }
}
