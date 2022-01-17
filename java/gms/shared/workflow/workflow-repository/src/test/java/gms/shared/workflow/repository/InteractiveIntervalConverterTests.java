package gms.shared.workflow.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.shared.workflow.coi.ActivityInterval;
import gms.shared.workflow.coi.InteractiveAnalysisStageInterval;
import gms.shared.workflow.coi.IntervalStatus;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class InteractiveIntervalConverterTests {

  @Test
  void testIntervalConverterInteractive() {

    var interactiveIntervalConverter = new InteractiveIntervalConverter();

    var legacyInterval = IntervalConverterTestUtilities.generateIntervalDao("ARS", "AL1", "pending");
    var interactiveAnalysisStage = IntervalConverterTestUtilities.generateInteractiveStage("AL1");
    var expectedInterval = createExpectedStageInterval("AL1", IntervalStatus.NOT_STARTED);
    var convertedInterval = interactiveIntervalConverter.fromLegacy(legacyInterval, interactiveAnalysisStage);
    assertEquals(expectedInterval, convertedInterval);

    legacyInterval = IntervalConverterTestUtilities.generateIntervalDao("ARS", "AL1", "queued");
    interactiveAnalysisStage = IntervalConverterTestUtilities.generateInteractiveStage("AL1");
    convertedInterval = interactiveIntervalConverter.fromLegacy(legacyInterval, interactiveAnalysisStage);
    assertEquals(expectedInterval, convertedInterval);

    legacyInterval = IntervalConverterTestUtilities.generateIntervalDao("ARS", "AL2", "active");
    interactiveAnalysisStage = IntervalConverterTestUtilities.generateInteractiveStage("AL2");
    expectedInterval = createExpectedStageInterval("AL2", IntervalStatus.IN_PROGRESS);
    convertedInterval = interactiveIntervalConverter.fromLegacy(legacyInterval, interactiveAnalysisStage);
    assertEquals(expectedInterval, convertedInterval);

    legacyInterval = IntervalConverterTestUtilities.generateIntervalDao("ARS", "AL2", "done");
    interactiveAnalysisStage = IntervalConverterTestUtilities.generateInteractiveStage("AL2");
    expectedInterval = createExpectedStageInterval("AL2", IntervalStatus.COMPLETE);
    convertedInterval = interactiveIntervalConverter.fromLegacy(legacyInterval, interactiveAnalysisStage);
    assertEquals(expectedInterval, convertedInterval);

    legacyInterval = IntervalConverterTestUtilities.generateIntervalDao("ARS", "AL2", "done");
    expectedInterval = createExpectedStageInterval("AL2", IntervalStatus.COMPLETE);
    convertedInterval = interactiveIntervalConverter.fromLegacy(legacyInterval, interactiveAnalysisStage);
    assertEquals(expectedInterval, convertedInterval);
  }

  private InteractiveAnalysisStageInterval createExpectedStageInterval(String name,
      IntervalStatus status) {

    var percentAvailable = 1.0;
    var endTime = Instant.EPOCH.plusSeconds(300);
    var comment = "";
    var storageTime = Instant.EPOCH.plusSeconds(3);
    var activityInterval = ActivityInterval.builder()
        .setName("Activity1Name")
        .setStageName(name)
        .setStartTime(Instant.EPOCH)
        .setEndTime(endTime)
        .setStatus(status)
        .setActiveAnalysts(List.of())
        .setPercentAvailable(percentAvailable)
        .setProcessingStartTime(Instant.EPOCH)
        .setProcessingEndTime(endTime)
        .setModificationTime(endTime)
        .setStorageTime(storageTime)
        .setComment(comment)
        .build();

    var activityInterval2 = ActivityInterval.builder()
        .setName("Activity2Name")
        .setStageName(name)
        .setStartTime(Instant.EPOCH)
        .setEndTime(endTime)
        .setStatus(status)
        .setActiveAnalysts(List.of())
        .setPercentAvailable(percentAvailable)
        .setProcessingStartTime(Instant.EPOCH)
        .setProcessingEndTime(endTime)
        .setModificationTime(endTime)
        .setStorageTime(storageTime)
        .setComment(comment)
        .build();

    return InteractiveAnalysisStageInterval.builder()
        .setName(name)
        .setStartTime(Instant.EPOCH)
        .setEndTime(endTime)
        .setStatus(status)
        .setPercentAvailable(percentAvailable)
        .setProcessingStartTime(Instant.EPOCH)
        .setProcessingEndTime(endTime)
        .setModificationTime(endTime)
        .setStorageTime(storageTime)
        .setActivityIntervals(List.of(activityInterval, activityInterval2))
        .setComment(comment)
        .build();
  }
}
