package gms.shared.workflow.configuration;

import gms.shared.utilities.test.TestUtilities;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.List;

class WorkflowDefinitionTest {

  @Test
  void testSerialization() throws IOException {
    WorkflowDefinition workflowDefinition = WorkflowDefinition.from("test", List.of("stage1", "stage2", "stage3"));
    TestUtilities.testSerialization(workflowDefinition, WorkflowDefinition.class);
  }
}