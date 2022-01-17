package gms.shared.workflow.repository;

import gms.shared.workflow.coi.MockIntervalData;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import gms.shared.workflow.dao.IntervalDao;
import gms.shared.workflow.repository.util.IntervalUtility;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static gms.shared.workflow.repository.IntervalConverterTestUtilities.generateIntervalDao;
import static java.util.stream.Collectors.toSet;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class BridgedIntervalRepositoryTest {

  @Mock
  IntervalDatabaseConnector mockConnector;

  @Mock
  IntervalConverter mockConverter;

  BridgedIntervalRepository repository;

  @BeforeEach
  void setUp() {
    repository = BridgedIntervalRepository.create(mockConnector, mockConverter);
  }

  @Test
  void testFindStageIntervalsByStageIdAndTime() {
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(300);
    Set<WorkflowDefinitionId> stageIds = Stream.of(IntervalUtility.AUTO_NETWORK, IntervalUtility.AL_1)
      .map(WorkflowDefinitionId::from)
      .collect(toSet());

    Set<Pair<String, String>> inputClassAndNames = Set.of(Pair.of("NET", "NETS1"), Pair.of("ARS", "AL1"));
    List<IntervalDao> outputIntervalDaos = List.of(
      generateIntervalDao("NET", "NETS1", "network-done", Instant.EPOCH.plusSeconds(150), Instant.EPOCH.plusSeconds(300)),
      generateIntervalDao("NET", "NETS1", "network-done", Instant.EPOCH, Instant.EPOCH.plusSeconds(150)),
      generateIntervalDao("ARS", "AL1", "pending", Instant.EPOCH, Instant.EPOCH.plusSeconds(300))
    );
    //reordering to prove sorting occurred
    List<IntervalDao> sortedIntervalDaos = List.of(outputIntervalDaos.get(2), outputIntervalDaos.get(1), outputIntervalDaos.get(0));

    Map<String, List<StageInterval>> expectedStageIntervals = MockIntervalData.get(startTime, endTime, List.of(
      WorkflowDefinitionId.from("Auto Network"),
      WorkflowDefinitionId.from("AL1")
    ));

    given(mockConnector.findIntervalsByNameAndTimeRange(inputClassAndNames, startTime, endTime))
      .willReturn(outputIntervalDaos);
    given(mockConverter.convert(sortedIntervalDaos, startTime, endTime))
      .willReturn(expectedStageIntervals);

    Map<String, List<StageInterval>> actualStageIntervals = repository.findStageIntervalsByStageIdAndTime(startTime, endTime, stageIds);
    assertEquals(expectedStageIntervals, actualStageIntervals);
    verify(mockConnector).findIntervalsByNameAndTimeRange(inputClassAndNames, startTime, endTime);
    verify(mockConverter).convert(sortedIntervalDaos, startTime, endTime);
  }

  @Test
  void testFindStageIntervalsByStageIdAndTimeModifiedAfter() {
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(300);
    Instant modifiedAfter = endTime.plusSeconds(5);
    Set<WorkflowDefinitionId> stageIds = Stream.of(IntervalUtility.AUTO_NETWORK, IntervalUtility.AL_1)
      .map(WorkflowDefinitionId::from)
      .collect(toSet());

    Set<Pair<String, String>> inputClassAndNames = Set.of(Pair.of("NET", "NETS1"), Pair.of("ARS", "AL1"));
    List<IntervalDao> outputIntervalDaos = List.of(
      generateIntervalDao("NET", "NETS1", "network-done", Instant.EPOCH.plusSeconds(150), Instant.EPOCH.plusSeconds(300), Duration.ofSeconds(5)),
      generateIntervalDao("NET", "NETS1", "network-done", Instant.EPOCH, Instant.EPOCH.plusSeconds(150), Duration.ofSeconds(155)),
      generateIntervalDao("ARS", "AL1", "pending", Instant.EPOCH, Instant.EPOCH.plusSeconds(300), Duration.ofSeconds(5))
    );
    //reordering to prove sorting occurred
    List<IntervalDao> sortedIntervalDaos = List.of(outputIntervalDaos.get(2), outputIntervalDaos.get(1), outputIntervalDaos.get(0));

    Map<String, List<StageInterval>> expectedStageIntervals = MockIntervalData.get(startTime, endTime, List.of(
      WorkflowDefinitionId.from("Auto Network"),
      WorkflowDefinitionId.from("AL1")
    ));

    given(mockConnector.findIntervalsByNameAndTimeRangeAfterModDate(inputClassAndNames, startTime, endTime, modifiedAfter))
      .willReturn(outputIntervalDaos);
    given(mockConverter.convert(sortedIntervalDaos, startTime, endTime))
      .willReturn(expectedStageIntervals);

    Map<String, List<StageInterval>> actualStageIntervals = repository.findStageIntervalsByStageIdAndTime(startTime, endTime, stageIds, modifiedAfter);
    assertEquals(expectedStageIntervals, actualStageIntervals);
    verify(mockConnector).findIntervalsByNameAndTimeRangeAfterModDate(inputClassAndNames, startTime, endTime, modifiedAfter);
    verify(mockConverter).convert(sortedIntervalDaos, startTime, endTime);
  }
}