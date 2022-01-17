package gms.shared.workflow.cache;

import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.test.utils.containers.ZooTestContainer;
import gms.shared.workflow.cache.util.WorkflowCacheFactory;
import gms.shared.workflow.coi.InteractiveAnalysisStageInterval;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.MockIntervalData;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Disabled
  //zookeeper has been removed 8/5/20201
class IntervalCacheTest extends ZooTestContainer {
  IntervalCache intervalCache;

  @BeforeAll
  static void setup() {
    try {
      Path tempIgniteDirectory = Files.createTempDirectory("ignite-work");
      System.setProperty("IGNITE_HOME", tempIgniteDirectory.toString());
    } catch (IOException e) {
      e.printStackTrace();
    }

    IgniteConnectionManager.create(systemConfig, List.of(WorkflowCacheFactory.INTERVAL_CACHE));
  }

  @BeforeEach
  void setUp() {
    intervalCache = IntervalCache.create();
  }

  @AfterEach
  void tearDown() {
    intervalCache.clear();
  }

  @AfterAll
  static void afterAll() {
    IgniteConnectionManager.close();
  }

  @Test
  void testGet() {
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(500);
    String stageName = "Test Stage";
    var intervalData = MockIntervalData.get(
      startTime,
      endTime,
      Set.of(WorkflowDefinitionId.from(stageName)));
    StageInterval stageInterval = intervalData.get(stageName).get(0);
    IntervalId intervalId = stageInterval.getIntervalId();

    assertTrue(intervalCache.get(intervalId).isEmpty());
    assertTrue(intervalCache.get(stageName, startTime).isEmpty());

    intervalCache.put(stageInterval);
    intervalCache.get(intervalId).ifPresentOrElse(
      interval -> assertEquals(stageInterval, interval),
      Assertions::fail
    );
    intervalCache.get(stageName, startTime).ifPresentOrElse(
      interval -> assertEquals(stageInterval, interval),
      Assertions::fail
    );
  }

  @Test
  void testGetRange() {
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(500);
    String stageName = "Test Stage";
    var intervalData = MockIntervalData.get(
      startTime,
      endTime,
      Set.of(WorkflowDefinitionId.from(stageName)));
    var stageInterval = (InteractiveAnalysisStageInterval) intervalData.get(stageName).get(0);

    assertTrue(intervalCache.get(stageName, startTime, endTime).isEmpty());
    StageInterval nextInterval = stageInterval.toBuilder()
      .setStartTime(startTime.plusSeconds(500))
      .setEndTime(endTime.plusSeconds(500))
      .build();
    intervalCache.cache(stageName, List.of(stageInterval, nextInterval));

    List<StageInterval> actualIntervals = intervalCache.get(stageName, startTime, endTime);
    assertEquals(List.of(stageInterval), actualIntervals);

    actualIntervals = intervalCache.get(stageName, startTime.plusSeconds(300), endTime.plusSeconds(300));
    assertEquals(List.of(nextInterval), actualIntervals);

    actualIntervals = intervalCache.get(stageName, startTime, endTime.plusSeconds(300));
    assertEquals(List.of(stageInterval, nextInterval), actualIntervals);
  }

  @Test
  void testGetAll() {
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(500);
    String firstStage = "Test 1";
    String secondStage = "Test 2";
    var intervalData = MockIntervalData.get(
      startTime,
      endTime,
      Set.of(WorkflowDefinitionId.from(firstStage), WorkflowDefinitionId.from(secondStage)));
    var firstInterval = (InteractiveAnalysisStageInterval) intervalData.get(firstStage).get(0);
    var secondInterval = (InteractiveAnalysisStageInterval) intervalData.get(secondStage).get(0);

    assertTrue(intervalCache.getAll(Set.of(firstStage, secondStage), startTime, endTime).isEmpty());

    intervalCache.put(firstInterval);
    intervalCache.put(secondInterval);

    Map<String, List<StageInterval>> actualIntervalsMap = intervalCache.getAll(Set.of(firstStage, secondStage), startTime, endTime);
    assertEquals(2, actualIntervalsMap.size());
    assertEquals(List.of(firstInterval), actualIntervalsMap.get(firstStage));
    assertEquals(List.of(secondInterval), actualIntervalsMap.get(secondStage));
  }


  @Test
  void testPrune() {
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(500);
    String firstStage = "Test 1";
    String secondStage = "Test 2";
    var intervalData = MockIntervalData.get(
      startTime,
      endTime,
      Set.of(WorkflowDefinitionId.from(firstStage), WorkflowDefinitionId.from(secondStage)));
    var firstInterval = (InteractiveAnalysisStageInterval) intervalData.get(firstStage).get(0);
    var nextFirstInterval = firstInterval.toBuilder()
      .setStartTime(startTime.plusSeconds(500))
      .setEndTime(endTime.plusSeconds(500))
      .build();
    var secondInterval = (InteractiveAnalysisStageInterval) intervalData.get(secondStage).get(0);
    var nextSecondInterval = secondInterval.toBuilder()
      .setStartTime(startTime.plusSeconds(500))
      .setEndTime(endTime.plusSeconds(500))
      .build();

    assertTrue(intervalCache.getAll(Set.of(firstStage, secondStage), startTime, endTime.plusSeconds(500)).isEmpty());
    intervalCache.cache(firstStage, Set.of(firstInterval, nextFirstInterval));
    intervalCache.cache(secondStage, Set.of(secondInterval, nextSecondInterval));

    assertEquals(
      Map.of(
        firstStage, List.of(firstInterval, nextFirstInterval),
        secondStage, List.of(secondInterval, nextSecondInterval)
      ),
      intervalCache.getAll(Set.of(firstStage, secondStage), startTime, endTime.plusSeconds(500)));

    intervalCache.prune(startTime);

    assertEquals(
      Map.of(
        firstStage, List.of(firstInterval, nextFirstInterval),
        secondStage, List.of(secondInterval, nextSecondInterval)
      ),
      intervalCache.getAll(Set.of(firstStage, secondStage), startTime, endTime.plusSeconds(500)));

    intervalCache.prune(startTime.plusSeconds(500));
    assertEquals(
      Map.of(
        firstStage, List.of(nextFirstInterval),
        secondStage, List.of(nextSecondInterval)
      ),
      intervalCache.getAll(Set.of(firstStage, secondStage), startTime, endTime.plusSeconds(500)));
  }
}