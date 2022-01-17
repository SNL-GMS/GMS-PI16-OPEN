package gms.shared.workflow.manager;

import gms.shared.frameworks.control.ControlContext;
import gms.shared.frameworks.service.InvalidInputException;
import gms.shared.workflow.accessor.WorkflowAccessorInterface;
import gms.shared.workflow.api.requests.StageIntervalsByStageIdAndTimeRequest;
import gms.shared.workflow.api.requests.UpdateActivityIntervalStatusRequest;
import gms.shared.workflow.api.requests.UpdateInteractiveAnalysisStageIntervalStatusRequest;
import gms.shared.workflow.coi.ActivityInterval;
import gms.shared.workflow.coi.InteractiveAnalysisStageInterval;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.IntervalStatus;
import gms.shared.workflow.coi.MockIntervalData;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.locks.Lock;
import java.util.stream.Stream;

import static java.util.stream.Collectors.toSet;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class WorkflowManagerTest {

  @Mock
  WorkflowAccessorInterface mockAccessor;

  @Mock
  SystemEventPublisher mockSystemEventPublisher;

  @Mock
  Lock mockCacheLock;

  WorkflowManager workflowManager;

  @BeforeEach
  void setUp() {
    workflowManager = WorkflowManager.create(mockAccessor, mockSystemEventPublisher);
  }

  @ParameterizedTest
  @NullSource
  void testCreateNull(ControlContext context) {
    Throwable t = assertThrows(NullPointerException.class, () -> WorkflowManager.create(context));
    assertEquals("Null context", t.getMessage());
  }

  @Test
  void testGetWorkflow() {
    var expectedWorkflow = Workflow.from("TEST", List.of());
    given(mockAccessor.getWorkflow()).willReturn(expectedWorkflow);

    var actualWorkflow = workflowManager.getWorkflowDefinition("");
    assertEquals(expectedWorkflow, actualWorkflow);
    verify(mockAccessor).getWorkflow();
  }

  @Test
  void testFindStageIntervalsByStageIdAndTime() {
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(30);
    WorkflowDefinitionId stageId = WorkflowDefinitionId.from("test");

    StageIntervalsByStageIdAndTimeRequest request = StageIntervalsByStageIdAndTimeRequest
      .from(startTime, endTime, Set.of(stageId));
    var expectedResponse = MockIntervalData.get(startTime, endTime, List.of(stageId));

    given(mockAccessor.findStageIntervalsByStageIdAndTime(request.getStartTime(), request.getEndTime(), request.getStageIds()))
      .willReturn(expectedResponse);

    var actualResponse = workflowManager.findStageIntervalsByStageIdAndTime(request);
    assertEquals(expectedResponse, actualResponse);
    verify(mockAccessor).findStageIntervalsByStageIdAndTime(request.getStartTime(), request.getEndTime(), request.getStageIds());
  }

  @Test
  void testUpdateInteractiveAnalysisStageIntervalStatusInvalidRequest() {
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(300);
    var stageNames = Stream.of("Test", "Auto").collect(toSet());
    var stageIds = stageNames.stream()
      .map(WorkflowDefinitionId::from)
      .collect(toSet());
    Map<String, List<StageInterval>> mockIntervalData = MockIntervalData.get(startTime, endTime, stageIds);

    var intervalId = IntervalId.from(startTime, WorkflowDefinitionId.from("Test"));
    var validRequest = UpdateInteractiveAnalysisStageIntervalStatusRequest.builder()
      .setStageIntervalId(intervalId)
      .setStatus(IntervalStatus.NOT_COMPLETE)
      .setTime(Instant.EPOCH)
      .setUserName("username")
      .build();

    //invalid status
    var invalidStatusRequest = validRequest.toBuilder()
      .setStatus(IntervalStatus.FAILED).build();
    given(mockAccessor.acquireLock(any())).willReturn(mockCacheLock);
    given(mockAccessor.findStageIntervalById(intervalId))
      .willReturn(Optional.of(mockIntervalData.get("Test").get(0)));
    assertThrows(InvalidInputException.class,
      () -> workflowManager.updateInteractiveAnalysisStageIntervalStatus(invalidStatusRequest));

    // No data found
    var autoIntervalRequest = validRequest.toBuilder()
      .setStageIntervalId(IntervalId.from(startTime, WorkflowDefinitionId.from("Auto")))
      .build();
    assertThrows(InvalidInputException.class,
      () -> workflowManager.updateInteractiveAnalysisStageIntervalStatus(autoIntervalRequest));

    //invalid StageInterval Type
    var intervalIdforAuto = IntervalId.from(startTime, WorkflowDefinitionId.from("Auto"));
    given(mockAccessor.findStageIntervalById(intervalIdforAuto))
      .willReturn(Optional.of(mockIntervalData.get("Auto").get(0)));
    assertThrows(InvalidInputException.class,
      () -> workflowManager.updateInteractiveAnalysisStageIntervalStatus(autoIntervalRequest));
  }

  @ParameterizedTest
  @MethodSource("updateStageIntervalStatusChanges")
  void testUpdateStageIntervalStatusChanges(StageInterval stageInterval,
    IntervalStatus updateStatus, String userName) {
    given(mockAccessor.acquireLock(any())).willReturn(mockCacheLock);
    given(mockAccessor.findStageIntervalById(stageInterval.getIntervalId()))
      .willReturn(Optional.of(stageInterval));

    var validRequest = UpdateInteractiveAnalysisStageIntervalStatusRequest.builder()
      .setStageIntervalId(stageInterval.getIntervalId())
      .setStatus(updateStatus)
      .setTime(Instant.now())
      .setUserName(userName)
      .build();

    //valid request to close
    assertDoesNotThrow(
      () -> workflowManager.updateInteractiveAnalysisStageIntervalStatus(validRequest));

    //should create and send System message events
    verify(mockSystemEventPublisher).createAndSendSystemEvents(argThat(intervals ->
      intervals.size() == 1 && intervals.stream()
        .allMatch(interval -> interval.getStatus().equals(updateStatus))));

    //should cache
    verify(mockAccessor).cacheStageIntervals(argThat(intervals ->
      intervals.size() == 1 && intervals.stream()
        .allMatch(interval -> interval.getStatus().equals(updateStatus))));
  }

  private static Stream<Arguments> updateStageIntervalStatusChanges() {
    return Stream.of(
      arguments(IntervalFixtures.notStartedInteractiveAnalysisStageInterval,
        IntervalStatus.IN_PROGRESS, IntervalFixtures.ANALYST_1),
      arguments(IntervalFixtures.singleActivityInProgressInteractiveAnalysisStageInterval,
        IntervalStatus.NOT_COMPLETE, IntervalFixtures.ANALYST_1),
      arguments(IntervalFixtures.readyForCompleteInteractiveAnalysisStageInterval,
        IntervalStatus.COMPLETE, IntervalFixtures.ANALYST_1)
    );
  }

  @Test
  void testUpdateActivityIntervalStatus() {

    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(300);
    var stageNames = Stream.of("TEST", "AUTO").collect(toSet());
    var stageIds = stageNames.stream()
      .map(WorkflowDefinitionId::from)
      .collect(toSet());
    var expectedInterval = MockIntervalData.get(startTime, endTime, stageIds).get("TEST").get(0);
    var automaticStageInterval = MockIntervalData.get(startTime, endTime, stageIds).get("AUTO").get(0);
    var intervalId = IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from("TEST"));
    var intervalIdforAuto = IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from("AUTO"));
    var invalidRequest =
      UpdateActivityIntervalStatusRequest.builder()
        .setStageIntervalId(IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from("TEST")))
        .setStatus(IntervalStatus.SKIPPED)
        .setTime(Instant.EPOCH)
        .setUserName("username")
        .setActivityIntervalId(IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from("Event Review")))
        .build();
    var invalidRequest2 = invalidRequest
      .toBuilder()
      .setStageIntervalId(intervalIdforAuto)
      .build();
    var validRequest = invalidRequest
      .toBuilder()
      .setUserName("analyst 1")
      .setStatus(IntervalStatus.NOT_COMPLETE)
      .build();

    given(mockAccessor.acquireLock(any())).willReturn(mockCacheLock);
    given(mockAccessor.findStageIntervalById(intervalId)).willReturn(Optional.of(expectedInterval));
    given(mockAccessor.findStageIntervalById(intervalIdforAuto)).willReturn(Optional.of(automaticStageInterval));

    //invalid status requested
    assertThrows(InvalidInputException.class,
      () -> workflowManager.updateActivityIntervalStatus(invalidRequest));

    //invalid StageInterval Type
    assertThrows(InvalidInputException.class,
      () -> workflowManager.updateActivityIntervalStatus(invalidRequest2));

    //valid request to close
    assertDoesNotThrow(
      () -> workflowManager.updateActivityIntervalStatus(validRequest));

    //should produce kafka message
    verify(mockSystemEventPublisher).createAndSendSystemEvents(any());
    verify(mockAccessor).cacheStageIntervals(any());

  }

  @ParameterizedTest
  @MethodSource("testNoOpUpdateActivityIntervalStatus")
  void testNoOpUpdateActivityIntervalStatus(InteractiveAnalysisStageInterval expectedInterval,
    ActivityInterval activityInterval, String userName) {

    given(mockAccessor.findStageIntervalById(expectedInterval.getIntervalId()))
      .willReturn(Optional.of(expectedInterval));
    given(mockAccessor.acquireLock(any())).willReturn(mockCacheLock);

    var noOpRequest = UpdateActivityIntervalStatusRequest.builder()
      .setStageIntervalId(expectedInterval.getIntervalId())
      .setActivityIntervalId(IntervalFixtures.inProgressActivityInterval1.getIntervalId())
      .setStatus(expectedInterval.getStatus())
      .setTime(Instant.now())
      .setUserName(userName)
      .build();

    //valid request to close
    assertDoesNotThrow(
      () -> workflowManager.updateActivityIntervalStatus(noOpRequest));

    //should not produce kafka message
    verify(mockSystemEventPublisher, never()).createAndSendSystemEvents(argThat(record -> record.stream().allMatch(
      interval -> interval.equals(expectedInterval))));
    //should not cache
    verify(mockAccessor, never()).cacheStageIntervals(argThat(intervals ->
      intervals.size() == 1 && intervals.stream()
        .allMatch(interval -> interval.getStatus().equals(expectedInterval.getStatus()))));

  }

  private static Stream<Arguments> testNoOpUpdateActivityIntervalStatus() {
    return Stream.of(
      arguments(IntervalFixtures.inProgressInteractiveAnalysisStageInterval, IntervalFixtures.inProgressActivityInterval1,
        IntervalFixtures.ANALYST_1),
      arguments(IntervalFixtures.notCompleteInteractiveAnalysisStageInterval, IntervalFixtures.notCompleteActivityInterval1,
        IntervalFixtures.ANALYST_1),
      arguments(IntervalFixtures.completedInteractiveAnalysisStageInterval, IntervalFixtures.completeActivityInterval1,
        IntervalFixtures.ANALYST_1)
    );
  }

  @ParameterizedTest
  @MethodSource("testNoOpUpdateInteractiveAnalysisStageIntervalStatus")
  void testNoOpUpdateInteractiveAnalysisStageIntervalStatus(InteractiveAnalysisStageInterval expectedInterval,
    String userName) {

    given(mockAccessor.acquireLock(any())).willReturn(mockCacheLock);
    given(mockAccessor.findStageIntervalById(expectedInterval.getIntervalId()))
      .willReturn(Optional.of(expectedInterval));

    var noOpRequest = UpdateInteractiveAnalysisStageIntervalStatusRequest.builder()
      .setStageIntervalId(expectedInterval.getIntervalId())
      .setStatus(expectedInterval.getStatus())
      .setTime(Instant.now())
      .setUserName(userName)
      .build();

    //valid request to close
    assertDoesNotThrow(
      () -> workflowManager.updateInteractiveAnalysisStageIntervalStatus(noOpRequest));

    //should not produce kafka message
    verify(mockSystemEventPublisher, never()).createAndSendSystemEvents(argThat(record -> record.stream().allMatch(
      interval -> interval.equals(expectedInterval))));
    //should not cache
    verify(mockAccessor, never()).cacheStageIntervals(argThat(intervals ->
      intervals.size() == 1 && intervals.stream()
        .allMatch(interval -> interval.getStatus().equals(expectedInterval.getStatus()))));

  }

  private static Stream<Arguments> testNoOpUpdateInteractiveAnalysisStageIntervalStatus() {
    return Stream.of(
      arguments(IntervalFixtures.inProgressInteractiveAnalysisStageInterval, IntervalFixtures.ANALYST_1),
      arguments(IntervalFixtures.notCompleteInteractiveAnalysisStageInterval, IntervalFixtures.ANALYST_1),
      arguments(IntervalFixtures.completedInteractiveAnalysisStageInterval, IntervalFixtures.ANALYST_1)
    );
  }

  @ParameterizedTest
  @MethodSource("testModTimeUpdateInteractiveAnalysisStageIntervalStatus")
  void testModTimeUpdateInteractiveAnalysisStageIntervalStatus(InteractiveAnalysisStageInterval stageInterval,
    IntervalStatus intervalStatus, String userName) {

    given(mockAccessor.findStageIntervalById(stageInterval.getIntervalId()))
      .willReturn(Optional.of(stageInterval));
    given(mockAccessor.acquireLock(any())).willReturn(mockCacheLock);

    var noOpRequest = UpdateInteractiveAnalysisStageIntervalStatusRequest.builder()
      .setStageIntervalId(stageInterval.getIntervalId())
      .setStatus(intervalStatus)
      .setTime(Instant.now())
      .setUserName(userName)
      .build();

    //valid request to close
    assertDoesNotThrow(
      () -> workflowManager.updateInteractiveAnalysisStageIntervalStatus(noOpRequest));

    var expectedModTime = DateTimeFormatter.ISO_INSTANT.format(Instant.now()).substring(0, 13);

    //should create and send System message events with an updated modificationTime of now
    verify(mockSystemEventPublisher).createAndSendSystemEvents(argThat(intervals ->
      intervals.size() == 1 && intervals.stream()
        .allMatch(interval ->
          DateTimeFormatter.ISO_INSTANT.format(interval.getModificationTime()).substring(0,13).equals(expectedModTime))));
  }

  private static Stream<Arguments> testModTimeUpdateInteractiveAnalysisStageIntervalStatus() {
    return Stream.of(
      arguments(IntervalFixtures.notStartedInteractiveAnalysisStageInterval, IntervalStatus.IN_PROGRESS, IntervalFixtures.ANALYST_1),
      arguments(IntervalFixtures.inProgressInteractiveAnalysisStageInterval, IntervalStatus.NOT_COMPLETE, IntervalFixtures.ANALYST_1),
      arguments(IntervalFixtures.notCompleteInteractiveAnalysisStageInterval, IntervalStatus.IN_PROGRESS, IntervalFixtures.ANALYST_1),
      arguments(IntervalFixtures.readyForCompleteInteractiveAnalysisStageInterval, IntervalStatus.COMPLETE, IntervalFixtures.ANALYST_1),
      arguments(IntervalFixtures.completedInteractiveAnalysisStageInterval, IntervalStatus.IN_PROGRESS, IntervalFixtures.ANALYST_1),
      arguments(IntervalFixtures.inProgressInteractiveAnalysisStageInterval, IntervalStatus.IN_PROGRESS, IntervalFixtures.ANALYST_2)
    );
  }

  @ParameterizedTest
  @MethodSource("testModTimeUpdateActivityIntervalStatus")
  void testModTimeUpdateActivityIntervalStatus(InteractiveAnalysisStageInterval stageInterval, ActivityInterval activityInterval,
    IntervalStatus intervalStatus, String userName) {

    given(mockAccessor.findStageIntervalById(stageInterval.getIntervalId()))
      .willReturn(Optional.of(stageInterval));
    given(mockAccessor.acquireLock(any())).willReturn(mockCacheLock);

    var noOpRequest = UpdateActivityIntervalStatusRequest.builder()
      .setStageIntervalId(stageInterval.getIntervalId())
      .setActivityIntervalId(activityInterval.getIntervalId())
      .setStatus(intervalStatus)
      .setTime(Instant.now())
      .setUserName(userName)
      .build();

    //valid request to close
    assertDoesNotThrow(
      () -> workflowManager.updateActivityIntervalStatus(noOpRequest));

    var expectedModTime = DateTimeFormatter.ISO_INSTANT.format(Instant.now()).substring(0, 13);

    //should create and send System message events with an updated modificationTime of now
    verify(mockSystemEventPublisher).createAndSendSystemEvents(argThat(intervals ->
      intervals.size() == 1 && intervals.stream()
        .allMatch(interval ->
          DateTimeFormatter.ISO_INSTANT.format(interval.getModificationTime()).substring(0,13).equals(expectedModTime))));
  }

  private static Stream<Arguments> testModTimeUpdateActivityIntervalStatus() {
    return Stream.of(
      arguments(IntervalFixtures.notStartedInteractiveAnalysisStageInterval, IntervalFixtures.notStartedActivityInterval1,
        IntervalStatus.IN_PROGRESS, IntervalFixtures.ANALYST_1),
      arguments(IntervalFixtures.inProgressInteractiveAnalysisStageInterval, IntervalFixtures.inProgressActivityInterval1,
        IntervalStatus.NOT_COMPLETE, IntervalFixtures.ANALYST_1),
      arguments(IntervalFixtures.notCompleteInteractiveAnalysisStageInterval, IntervalFixtures.notCompleteActivityInterval1,
        IntervalStatus.IN_PROGRESS, IntervalFixtures.ANALYST_1),
      arguments(IntervalFixtures.completedInteractiveAnalysisStageInterval, IntervalFixtures.completeActivityInterval1,
        IntervalStatus.IN_PROGRESS, IntervalFixtures.ANALYST_1),
      arguments(IntervalFixtures.inProgressInteractiveAnalysisStageInterval, IntervalFixtures.inProgressActivityInterval2,
        IntervalStatus.IN_PROGRESS, IntervalFixtures.ANALYST_2)
    );
  }

}
