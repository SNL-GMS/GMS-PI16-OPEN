package gms.shared.workflow.repository;

import gms.shared.workflow.coi.IntervalStatus;
import gms.shared.workflow.dao.IntervalDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.text.DecimalFormat;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.params.provider.Arguments.arguments;

class AutomaticIntervalConverterTest {


  private static final DecimalFormat DECIMAL_FORMAT = new DecimalFormat("####0.00");

  AutomaticIntervalConverter intervalConverter;

  @BeforeEach
  void setUp() {
    intervalConverter = new AutomaticIntervalConverter();
  }

  @ParameterizedTest
  @MethodSource("autoNetworkParameters")
  void testFromLegacyAutoNetwork(IntervalDao inputInterval, IntervalStatus expectedStatus,
      String expectedLastStep, String expectedPercent) {
    var stage = IntervalConverterTestUtilities.generateAutoNetworkStage();
    var stageInterval = intervalConverter.fromLegacy(inputInterval, stage);

    assertEquals(expectedStatus, stageInterval.getStatus());
    assertEquals(stage.getName(), stageInterval.getName());

    assertEquals(1, stageInterval.getSequenceIntervals().size());
    var sequenceInterval = stageInterval.getSequenceIntervals().get(0);
    assertEquals(expectedLastStep, sequenceInterval.getLastExecutedStepName());
    assertEquals(expectedPercent, DECIMAL_FORMAT.format(sequenceInterval.getPercentComplete()));
    assertEquals(stage.getSequences().get(0).getName(), sequenceInterval.getName());
  }

  private static Stream<Arguments> autoNetworkParameters() {
    return Stream.of(
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("NET", "NETS1", "failed"),
        IntervalStatus.FAILED, "", "0.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("NET", "NETS1", "pending"),
        IntervalStatus.NOT_STARTED, "", "0.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("NET", "NETS1", "queued"),
        IntervalStatus.NOT_STARTED, "", "0.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("NET", "NETS1", "skipped"),
        IntervalStatus.NOT_STARTED, "", "0.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("NET", "NETS1", "partproc-start"),
        IntervalStatus.IN_PROGRESS, "", "0.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("NET", "NETS1", "conflict-start"),
        IntervalStatus.IN_PROGRESS, "Association", "40.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("NET", "NETS1", "arrbeamSP-start"),
        IntervalStatus.IN_PROGRESS, "Origin Beam SP", "80.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("NET", "NETS1", "done"),
        IntervalStatus.COMPLETE, "Arrival Beam SP", "100.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("NET", "NETS1", "network-done"),
        IntervalStatus.COMPLETE, "Arrival Beam SP", "100.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("NET", "NETS1", "late-done"),
        IntervalStatus.COMPLETE, "Arrival Beam SP", "100.00")
    );
  }

  @ParameterizedTest
  @MethodSource("autoAl1Parameters")
  void testFromLegacyAutoAl1(IntervalDao inputInterval, IntervalStatus expectedStatus,
      String expectedLastStep, String expectedPercent) {
    var stage = IntervalConverterTestUtilities.generateAl1Stage();
    var stageInterval = intervalConverter.fromLegacy(inputInterval, stage);

    assertEquals(expectedStatus, stageInterval.getStatus());
    assertEquals(stage.getName(), stageInterval.getName());

    assertEquals(1, stageInterval.getSequenceIntervals().size());
    var sequenceInterval = stageInterval.getSequenceIntervals().get(0);
    assertEquals(expectedLastStep, sequenceInterval.getLastExecutedStepName());
    assertEquals(expectedPercent, DECIMAL_FORMAT.format(sequenceInterval.getPercentComplete()));
    assertEquals(stage.getSequences().get(0).getName(), sequenceInterval.getName());
  }

  private static Stream<Arguments> autoAl1Parameters() {
    return Stream.of(
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("AUTO", "AL1", "failed"),
        IntervalStatus.FAILED, "", "0.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("AUTO", "AL1", "pending"),
        IntervalStatus.NOT_STARTED, "", "0.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("AUTO", "AL1", "queued"),
        IntervalStatus.NOT_STARTED, "", "0.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("AUTO", "AL1", "skipped"),
        IntervalStatus.NOT_STARTED, "", "0.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("AUTO", "AL1", "origbeamSP-start"),
        IntervalStatus.IN_PROGRESS, "", "0.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("AUTO", "AL1", "arrbeamSP-start"),
        IntervalStatus.IN_PROGRESS, "Recall", "33.33"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("AUTO", "AL1", "HAE-start"),
        IntervalStatus.IN_PROGRESS, "Hydro EDP", "88.89"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("AUTO", "AL1", "done"),
        IntervalStatus.COMPLETE, "HAE", "100.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("AUTO", "AL1", "network-done"),
        IntervalStatus.COMPLETE, "HAE", "100.00"),
      arguments(
        IntervalConverterTestUtilities.generateIntervalDao("AUTO", "AL1", "late-done"),
        IntervalStatus.COMPLETE, "HAE", "100.00")
    );
  }
}
