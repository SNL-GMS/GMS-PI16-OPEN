package gms.shared.workflow.coi;

import com.fasterxml.jackson.core.type.TypeReference;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.coi.utils.CoiObjectMapperFactory;
import gms.shared.utilities.test.TestUtilities;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

class WorkflowCoiTests {

  private static ProcessingStep processingStep;
  private static ProcessingSequence processingSequence;
  private static AutomaticProcessingStage automaticProcessingStage;
  private static Workflow workflow;
  private static Activity activity;
  private static InteractiveAnalysisStage interactiveAnalysisStage;

  @BeforeAll
  public static void init() {
    processingStep = ProcessingStep.from("ProcessingStepName");
    processingSequence = ProcessingSequence.from("ProcessingSequenceName", List.of(processingStep));
    automaticProcessingStage = AutomaticProcessingStage
      .from("AutomaticStageName", Duration.ofHours(10), List.of(processingSequence));
    var stationGroup = StationGroup.createVersionReference("name", Instant.EPOCH);
    activity = Activity.from("Activity1Name", stationGroup, AnalysisMode.SCAN);
    var activity2 = Activity.from("Activity2Name", stationGroup, AnalysisMode.EVENT_REVIEW);
    interactiveAnalysisStage = InteractiveAnalysisStage
      .from("InteractiveStageName", Duration.ofHours(10), List.of(activity, activity2));
    workflow = Workflow
      .from("WorkflowName", List.of(automaticProcessingStage, interactiveAnalysisStage));
  }

  @Test
  void testProcessingStepSerialization() throws IOException {
    ProcessingStep serializedProcessingStep = TestUtilities
        .testSerialization(processingStep, ProcessingStep.class);
    assertEquals(processingStep, serializedProcessingStep);
  }

  @Test
  void testProcessingSequenceSerialization() throws IOException {
    ProcessingSequence serializedProcessingSequence = TestUtilities
        .testSerialization(processingSequence, ProcessingSequence.class);
    assertEquals(processingSequence, serializedProcessingSequence);
  }

  @Test
  void testAutomaticProcessingStageSerialization() throws IOException {
    AutomaticProcessingStage serializedAutomaticProcessingStage = TestUtilities
        .testSerialization(automaticProcessingStage, AutomaticProcessingStage.class);
    assertEquals(automaticProcessingStage, serializedAutomaticProcessingStage);
  }

  @Test
  void testWorkflowSerialization() throws IOException {
    Workflow serializedWorkflow = TestUtilities.testSerialization(workflow, Workflow.class);
    assertEquals(workflow, serializedWorkflow);
  }

  @Test
  void testActivitySerialization() throws IOException {
    Activity serializedActivity = TestUtilities.testSerialization(activity, Activity.class);
    assertEquals(activity, serializedActivity);
  }

  @Test
  void testInteractiveAnalysisStageSerialization() throws IOException {
    InteractiveAnalysisStage serializedInteractiveAnalysisStage = TestUtilities
      .testSerialization(interactiveAnalysisStage, InteractiveAnalysisStage.class);
    assertEquals(interactiveAnalysisStage, serializedInteractiveAnalysisStage);
  }

  @Test
  void testStageCollectionSerialization() throws IOException {
    List<Stage> expectedStages = List.of(interactiveAnalysisStage, automaticProcessingStage);
    String actualJson = CoiObjectMapperFactory.getJsonObjectMapper().writeValueAsString(expectedStages);
    List<Stage> actualStages = CoiObjectMapperFactory.getJsonObjectMapper().readValue(actualJson, new TypeReference<>() {
    });
    assertEquals(expectedStages, actualStages);
  }

  @Test
  void testWorkflowHelperMethods() {
    assertEquals(Set.of(automaticProcessingStage, interactiveAnalysisStage),
      workflow.stages().collect(Collectors.toSet()));
    assertEquals(Set.of(automaticProcessingStage.getStageId(), interactiveAnalysisStage.getStageId()),
      workflow.stageIds().collect(Collectors.toSet()));
  }
}
