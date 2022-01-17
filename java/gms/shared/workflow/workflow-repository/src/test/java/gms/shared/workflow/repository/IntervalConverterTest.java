package gms.shared.workflow.repository;

import gms.shared.workflow.coi.AutomaticProcessingStageInterval;
import gms.shared.workflow.coi.IntervalStatus;
import gms.shared.workflow.coi.StageInterval;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static gms.shared.workflow.repository.IntervalConverterTestUtilities.generateIntervalDao;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IntervalConverterTest {

  IntervalConverter converter;

  @BeforeEach
  void setUp() {
    converter = IntervalConverter.create(IntervalConverterTestUtilities.createTestWorkflow());
  }

  @Test
  void testConvertOnePerStage() {
    var intervalDao1 = generateIntervalDao("NET", "NETS1", "pending");
    var intervalDao2 = generateIntervalDao("ARS", "AL1", "pending");
    var intervalDao3 = generateIntervalDao("AUTO", "AL1", "pending");
    var intervalDao4 = generateIntervalDao("ARS", "AL2", "pending");

    var actualIntervals = converter
        .convert(List.of(intervalDao1, intervalDao2, intervalDao3, intervalDao4), Instant.EPOCH,
            Instant.EPOCH.plusSeconds(300));

    assertEquals(4, actualIntervals.size());
    actualIntervals.values().forEach(intervals -> {
      assertEquals(1, intervals.size());
      assertEquals(IntervalStatus.NOT_STARTED, intervals.get(0).getStatus());
    });
  }

  @Test
  void testConvertAutoNetworkOverlaps() {
    var intervalDao1 = generateIntervalDao("NET", "NETS1", "pending");
    var intervalDao2 = generateIntervalDao("NET", "NETS1", "partproc-start",
        Duration.ofSeconds(10));
    var intervalDao3 = generateIntervalDao("NET", "NETS1", "conflict-start",
        Duration.ofSeconds(20));
    var intervalDao4 = generateIntervalDao("NET", "NETS1", "arrbeamSP-start",
        Duration.ofSeconds(30));

    var actualIntervals = converter
        .convert(List.of(intervalDao1, intervalDao2, intervalDao3, intervalDao4), Instant.EPOCH,
            Instant.EPOCH.plusSeconds(300));
    assertEquals(1, actualIntervals.size());
    assertTrue(actualIntervals.containsKey("Auto Network"));
    List<StageInterval> autoNetworkIntervals = actualIntervals.get("Auto Network");
    assertEquals(1, autoNetworkIntervals.size());
    assertTrue(autoNetworkIntervals.get(0) instanceof AutomaticProcessingStageInterval);
    AutomaticProcessingStageInterval autoNetworkInterval = (AutomaticProcessingStageInterval) autoNetworkIntervals
      .get(0);
    assertEquals(IntervalStatus.IN_PROGRESS, autoNetworkInterval.getStatus());
    assertEquals("Origin Beam SP",
      autoNetworkInterval.getSequenceIntervals().get(0).getLastExecutedStepName());
  }

  @Test
  void testConvertAutoNetworkShiftedQuery() {
    var intervalDao1 = generateIntervalDao("NET", "NETS1", "network-done", Instant.EPOCH,
      Instant.EPOCH.plusSeconds(900), Duration.ZERO);

    var actualIntervals = converter.convert(List.of(intervalDao1), Instant.EPOCH.plusSeconds(150), Instant.EPOCH.plusSeconds(750));
    assertEquals(1, actualIntervals.size());
    assertTrue(actualIntervals.containsKey("Auto Network"));
    var autoNetworkIntervals = actualIntervals.get("Auto Network");
    assertEquals(3, autoNetworkIntervals.size());

    autoNetworkIntervals.forEach(interval -> assertEquals(IntervalStatus.COMPLETE, interval.getStatus()));
    assertEquals(Instant.EPOCH, autoNetworkIntervals.get(0).getStartTime());
    assertEquals(Instant.EPOCH.plusSeconds(300), autoNetworkIntervals.get(0).getEndTime());
    assertEquals(Instant.EPOCH.plusSeconds(300), autoNetworkIntervals.get(1).getStartTime());
    assertEquals(Instant.EPOCH.plusSeconds(600), autoNetworkIntervals.get(1).getEndTime());
    assertEquals(Instant.EPOCH.plusSeconds(600), autoNetworkIntervals.get(2).getStartTime());
    assertEquals(Instant.EPOCH.plusSeconds(900), autoNetworkIntervals.get(2).getEndTime());
  }

  @Test
  void testConvertAutoNetworkQueryEdges() {
    var intervalDao1 = generateIntervalDao("NET", "NETS1", "network-done", Instant.EPOCH,
      Instant.EPOCH.plusSeconds(300));
    var intervalDao2 = generateIntervalDao("NET", "NETS1", "conflict-start", Instant.EPOCH.plusSeconds(300),
      Instant.EPOCH.plusSeconds(600));
    var intervalDao3 = generateIntervalDao("NET", "NETS1", "pending", Instant.EPOCH.plusSeconds(600),
      Instant.EPOCH.plusSeconds(900));

    var actualIntervals = converter.convert(List.of(intervalDao1, intervalDao2, intervalDao3), Instant.EPOCH.plusSeconds(300), Instant.EPOCH.plusSeconds(600));
    assertEquals(1, actualIntervals.size());
    assertTrue(actualIntervals.containsKey("Auto Network"));
    var autoNetworkIntervals = actualIntervals.get("Auto Network");
    assertEquals(1, autoNetworkIntervals.size());

    assertEquals(Instant.EPOCH.plusSeconds(300), autoNetworkIntervals.get(0).getStartTime());
    assertEquals(Instant.EPOCH.plusSeconds(600), autoNetworkIntervals.get(0).getEndTime());
    assertEquals(IntervalStatus.IN_PROGRESS, autoNetworkIntervals.get(0).getStatus());
  }

  @Test
  void testIntervalConverterBadStageName() {

    var legacyInterval = IntervalConverterTestUtilities
      .generateIntervalDao("BADTYPE", "BADNAME", "pending");

    Throwable t = assertThrows(IllegalArgumentException.class,
      () -> converter.convert(legacyInterval));

    assertEquals("No matching stage found for interval BADTYPE:BADNAME",
        t.getMessage());
  }

  @Test
  void testIntervalConverterBadStatus() {

    var legacyInterval = IntervalConverterTestUtilities
        .generateIntervalDao("ARS", "AL1", "badstatus");

    Throwable t = assertThrows(IllegalArgumentException.class,
        () -> converter.convert(legacyInterval));

    assertEquals("Could not convert legacy state {badstatus} to {IntervalStatus}",
        t.getMessage());
  }
}
