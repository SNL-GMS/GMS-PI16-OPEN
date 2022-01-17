package gms.shared.workflow.accessor;

import gms.shared.workflow.cache.IntervalCache;
import gms.shared.workflow.coi.InteractiveAnalysisStageInterval;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.MockIntervalData;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import gms.shared.workflow.repository.IntervalRepositoryInterface;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static java.util.stream.Collectors.toSet;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class WorkflowAccessorTest {

  @Mock
  Workflow mockWorkflow;

  @Mock
  IntervalRepositoryInterface mockRepository;

  @Mock
  IntervalCache mockCache;

  WorkflowAccessor workflowAccessor;

  @BeforeEach
  void setUp() {
    workflowAccessor = WorkflowAccessor.create(mockWorkflow, mockRepository, mockCache);
  }

  @Test
  void testInitialize() {
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(300);
    Set<String> stageNames = Stream.of("AUTO-TEST", "TEST-1", "TEST-2").collect(toSet());
    Set<WorkflowDefinitionId> stageIds = stageNames.stream()
      .map(WorkflowDefinitionId::from)
      .collect(toSet());
    Map<String, List<StageInterval>> expectedIntervals = MockIntervalData.get(startTime, endTime, stageIds);

    var expectedLatestStoredIntervalModTime = Instant.now().plusSeconds(10000);
    var newInterval = ((InteractiveAnalysisStageInterval) expectedIntervals.get("TEST-1")
      .get(0))
      .toBuilder()
      .setModificationTime(expectedLatestStoredIntervalModTime).build();

    expectedIntervals.put("TEST-1",List.of(newInterval));

    given(mockWorkflow.stageIds()).willReturn(stageIds.stream());
    given(mockRepository.findStageIntervalsByStageIdAndTime(startTime, endTime, stageIds))
      .willReturn(expectedIntervals);
    given(mockCache.getAll(stageNames, startTime, endTime)).willReturn(Map.of());

    workflowAccessor.initialize(startTime, endTime);
    expectedIntervals.forEach((stageName, intervals) -> verify(mockCache).cache(stageName, intervals));
    Assertions.assertEquals(expectedLatestStoredIntervalModTime, workflowAccessor.getTimeLastPolled());

  }

  @Test
  void getWorkflow() {
    assertEquals(mockWorkflow, workflowAccessor.getWorkflow());
  }

  @Test
  void testFindStageIntervalsByStageIdAndTime() {
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(300);
    Set<String> stageNames = Stream.of("AUTO-TEST", "TEST-1", "TEST-2").collect(toSet());
    Set<WorkflowDefinitionId> stageIds = stageNames.stream()
      .map(WorkflowDefinitionId::from)
      .collect(toSet());
    Map<String, List<StageInterval>> expectedIntervals = MockIntervalData.get(startTime, endTime, stageIds);

    given(mockCache.getAll(stageNames, startTime, endTime)).willReturn(expectedIntervals);
    Map<String, List<StageInterval>> actualIntervals = workflowAccessor.findStageIntervalsByStageIdAndTime(startTime, endTime, stageIds);
    assertEquals(expectedIntervals, actualIntervals);
    verify(mockCache).getAll(stageNames, startTime, endTime);
  }

  @Test
  void testIsInCache(){

    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(300);
    var stageNames = Stream.of("AUTO-TEST").collect(toSet());
    var stageIds = stageNames.stream()
      .map(WorkflowDefinitionId::from)
      .collect(toSet());
    var expectedIntervals = MockIntervalData.get(startTime, endTime, stageIds).get("AUTO-TEST");

    var intervalId = IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from("TEST-1"));
    given(mockCache.get(intervalId)).willReturn(Optional.of(expectedIntervals.get(0)));

    Assertions.assertTrue(workflowAccessor.isInCache(intervalId));

    var notCachedInterval = IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from("TEST-2"));
    Assertions.assertFalse(workflowAccessor.isInCache(notCachedInterval));

  }

  @Test
  void testFindStageIntervalById(){

    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(300);
    var stageNames = Stream.of("AUTO-TEST").collect(toSet());
    var stageIds = stageNames.stream()
      .map(WorkflowDefinitionId::from)
      .collect(toSet());

    var expectedStageInterval = MockIntervalData.get(startTime, endTime, stageIds).get("AUTO-TEST").get(0);

    var intervalId = IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from("TEST-1"));
    given(mockCache.get(intervalId)).willReturn(Optional.of(expectedStageInterval));

    Assertions.assertEquals(Optional.of(expectedStageInterval), workflowAccessor.findStageIntervalById(intervalId));

    var notCachedInterval = IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from("TEST-2"));
    Assertions.assertEquals(Optional.empty(),workflowAccessor.findStageIntervalById(notCachedInterval));

  }

  @Test
  void testCacheStageIntervals(){
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(300);
    var stageNames = Stream.of("AUTO-TEST", "TEST-1", "TEST-2").collect(toSet());
    var stageIds = stageNames.stream()
      .map(WorkflowDefinitionId::from)
      .collect(toSet());
    var expectedIntervals = MockIntervalData.get(startTime, endTime, stageIds);

    //No exceptions should be thrown
    Assertions.assertDoesNotThrow(() -> expectedIntervals.values().forEach(workflowAccessor::cacheStageIntervals));

    //accessor should of called mockCache.put 3 times
    verify(mockCache, times(3)).put(any());

    //verify each interval was cached
    expectedIntervals.values().stream()
      .flatMap(Collection::stream)
      .forEach(interval -> verify(mockCache).put(interval));
  }

  @Test
  void testPruneCallsDelegate() {
    Instant olderThan = Instant.EPOCH;
    workflowAccessor.pruneStageIntervals(olderThan);
    verify(mockCache).prune(olderThan);
  }
}