package gms.shared.signaldetection.manager.config;

import com.google.common.collect.ImmutableList;
import gms.shared.utilities.test.TestUtilities;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.params.provider.Arguments.arguments;

class StagePersistenceDefinitionTest {

  private static final WorkflowDefinitionId workflowDefinitionID1 = WorkflowDefinitionId.from("Stage1");
  private static final WorkflowDefinitionId workflowDefinitionID2 = WorkflowDefinitionId.from("Stage2");
  private static final WorkflowDefinitionId workflowDefinitionID3 = WorkflowDefinitionId.from("Stage3");
  private static final String firstStageAcct = "Acc1";
  private static final String secondStageAcct = "Acc2";
  private static final String thirdStageAcct = "Acc3";

  private static final List<WorkflowDefinitionId> orderedStages =
    List.of(workflowDefinitionID1, workflowDefinitionID2, workflowDefinitionID3);

  private static final ImmutableList<StageDatabaseAccountPair> databaseAccountStages =
    ImmutableList.of(StageDatabaseAccountPair.create(workflowDefinitionID1, firstStageAcct),
      StageDatabaseAccountPair.create(workflowDefinitionID2, secondStageAcct),
      StageDatabaseAccountPair.create(workflowDefinitionID3, thirdStageAcct));

  private static final ImmutableList<StageDatabaseAccountPair> previousStages =
    ImmutableList.of(StageDatabaseAccountPair.create(workflowDefinitionID2, firstStageAcct),
      StageDatabaseAccountPair.create(workflowDefinitionID3, secondStageAcct));


  @ParameterizedTest
  @MethodSource("getCreateArgumentsFailed")
  void testCreateInvalid(String expectedMessage,
    ImmutableList<StageDatabaseAccountPair> databaseAccountsByStage,
    ImmutableList<StageDatabaseAccountPair> previousDatabaseAccountsByStage) {

    IllegalStateException exception = assertThrows(IllegalStateException.class,
      () -> StagePersistenceDefinition.create(databaseAccountsByStage, previousDatabaseAccountsByStage));

    assertEquals(expectedMessage, exception.getMessage());

  }

  static Stream<Arguments> getCreateArgumentsFailed() {
    return Stream.of(
      arguments("Database Accounts per stage have to be set", ImmutableList.of(), previousStages),
      arguments("Previous Stage has to be set", databaseAccountStages, ImmutableList.of()));
  }

  @Test
  void testCreateValid() {
    assertDoesNotThrow(() -> StagePersistenceDefinition.create(databaseAccountStages, previousStages));
  }

  @Test
  void testSerialization() throws IOException {
    StagePersistenceDefinition definition = StagePersistenceDefinition.create(databaseAccountStages, previousStages);
    TestUtilities.testSerialization(definition, StagePersistenceDefinition.class);
  }

}

