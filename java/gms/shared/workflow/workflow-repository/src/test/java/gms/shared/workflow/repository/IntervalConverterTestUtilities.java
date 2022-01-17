package gms.shared.workflow.repository;

import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.utilities.bridge.database.converter.InstantToDoubleConverterPositiveNa;
import gms.shared.workflow.coi.Activity;
import gms.shared.workflow.coi.AnalysisMode;
import gms.shared.workflow.coi.AutomaticProcessingStage;
import gms.shared.workflow.coi.InteractiveAnalysisStage;
import gms.shared.workflow.coi.ProcessingSequence;
import gms.shared.workflow.coi.ProcessingStep;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.dao.ClassEndTimeNameTimeKey;
import gms.shared.workflow.dao.IntervalDao;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

public class IntervalConverterTestUtilities {

  private static final String AUTO_NETWORK_SEQ = "Auto Network Seq";
  private static final String AUTO_NETWORK = "Auto Network";
  private static final String AUTO_POST_AL_1_SEQ = "Auto Post-AL1 Seq";
  private static final String AUTO_POST_AL_1 = "Auto Post-AL1";

  private static final InstantToDoubleConverterPositiveNa timeConverter = new InstantToDoubleConverterPositiveNa();

  public static Workflow createTestWorkflow() {

    var stationGroup = StationGroup.createEntityReference("StationGroupName");
    var activity = Activity.from("Activity1Name", stationGroup, AnalysisMode.SCAN);
    var activity2 = Activity.from("Activity2Name", stationGroup, AnalysisMode.EVENT_REVIEW);
    var interactiveAnalysisStage = InteractiveAnalysisStage
      .from("AL1", Duration.ofHours(10), List.of(activity, activity2));
    var interactiveAnalysisStage2 = InteractiveAnalysisStage
      .from("AL2", Duration.ofHours(10), List.of(activity, activity2));

    var al1Stage = generateAl1Stage();
    var autoNetworkStage = generateAutoNetworkStage();

    return Workflow
        .from("WorkflowName", List.of(interactiveAnalysisStage, interactiveAnalysisStage2
            , al1Stage, autoNetworkStage));
  }

  static AutomaticProcessingStage generateAutoNetworkStage() {

    var step1 = ProcessingStep.from("Partial Processing");
    var step2 = ProcessingStep.from("Association");
    var step3 = ProcessingStep.from("Conflict Resolution");
    var step4 = ProcessingStep.from("Origin Beam SP");
    var step5 = ProcessingStep.from("Arrival Beam SP");

    var processingSequence = ProcessingSequence
        .from(AUTO_NETWORK_SEQ,
            List.of(step1, step2, step3, step4, step5));

    return AutomaticProcessingStage.from(
        AUTO_NETWORK, Duration.ofMinutes(5), List.of(processingSequence));

  }

  static AutomaticProcessingStage generateAl1Stage() {

    var step1 = ProcessingStep.from("Origin Beam SP");
    var step2 = ProcessingStep.from("Origin Beam LP");
    var step3 = ProcessingStep.from("Recall");
    var step4 = ProcessingStep.from("Arrival Beam SP");
    var step5 = ProcessingStep.from("Detection LP");
    var step6 = ProcessingStep.from("Recall LP");
    var step7 = ProcessingStep.from("Magnitude");
    var step8 = ProcessingStep.from("Hydro EDP");
    var step9 = ProcessingStep.from("HAE");

    var processingSequence = ProcessingSequence
      .from(AUTO_POST_AL_1_SEQ,
        List.of(step1, step2, step3, step4, step5, step6, step7, step8, step9));

    return AutomaticProcessingStage.from(
      AUTO_POST_AL_1, Duration.ofMinutes(5), List.of(processingSequence));
  }

  static IntervalDao generateIntervalDao(String type, String name, String status) {
    return generateIntervalDao(type, name, status, Duration.ZERO);
  }

  static IntervalDao generateIntervalDao(String type, String name, String status, Duration modDelay) {
    return generateIntervalDao(type, name, status, Instant.EPOCH, Instant.EPOCH.plusSeconds(300), modDelay);
  }

  static IntervalDao generateIntervalDao(String type, String name, String status, Instant startTime, Instant endTime) {
    return generateIntervalDao(type, name, status, startTime, endTime, Duration.ZERO);
  }

  static IntervalDao generateIntervalDao(String type, String name, String status, Instant startTime, Instant endTime, Duration modDelay) {
    IntervalDao intervalDao = new IntervalDao();
    ClassEndTimeNameTimeKey classEndtimeNameTimeKey = new ClassEndTimeNameTimeKey(type, name,
      timeConverter.convertToDatabaseColumn(endTime), timeConverter.convertToDatabaseColumn(startTime));
    intervalDao.setIntervalIdentifier(0);
    intervalDao.setClassEndTimeNameTimeKey(classEndtimeNameTimeKey);
    intervalDao.setState(status);
    intervalDao.setAuthor("author");
    intervalDao.setPercentAvailable(1);
    intervalDao.setProcessStartDate(startTime);
    intervalDao.setProcessEndDate(endTime);
    intervalDao.setLastModificationDate(endTime.plus(modDelay));
    intervalDao.setLoadDate(Instant.EPOCH.plusSeconds(3));

    return intervalDao;
  }

  static InteractiveAnalysisStage generateInteractiveStage(String name) {
    var stationGroup = StationGroup.createEntityReference("StationGroupName");
    var activity = Activity.from("Activity1Name", stationGroup, AnalysisMode.SCAN);
    var activity2 = Activity.from("Activity2Name", stationGroup, AnalysisMode.EVENT_REVIEW);

    return InteractiveAnalysisStage
        .from(name, Duration.ofHours(10), List.of(activity, activity2));
  }
}
