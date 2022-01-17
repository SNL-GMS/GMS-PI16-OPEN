package gms.shared.signaldetection.converter.detection;

import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.database.connector.util.SignalDetectionIdUtility;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_CHANNEL;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_CHANNEL_SEGMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.DETECTION_FROM_ARRIVAL;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.DETECTION_FROM_BOTH_ARRIVALS;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.MONITORING_ORG;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SignalDetectionConverterTest {

  private static final WorkflowDefinitionId stage1Id = WorkflowDefinitionId.from(STAGE_1);
  private static final WorkflowDefinitionId stage2Id = WorkflowDefinitionId.from(STAGE_2);
  private static final List<WorkflowDefinitionId> orderedStages = List.of(stage1Id, stage2Id);

  @Mock
  private SignalDetectionHypothesisConverterInterface signalDetectionHypothesisConverter;

  @Mock
  private SignalDetectionIdUtility signalDetectionIdUtility;

  private SignalDetectionConverter converter;

  @BeforeEach
  void setup() {
    converter = SignalDetectionConverter.create(signalDetectionHypothesisConverter,
      signalDetectionIdUtility,
      orderedStages);
  }

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(SignalDetectionHypothesisConverterInterface signalDetectionHypothesisConverter,
    SignalDetectionIdUtility signalDetectionIdUtility,
    List<WorkflowDefinitionId> orderedStages) {
    assertThrows(NullPointerException.class, () -> SignalDetectionConverter.create(signalDetectionHypothesisConverter,
      signalDetectionIdUtility,
      orderedStages));
  }

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(
      arguments(null,
        mock(SignalDetectionIdUtility.class),
        orderedStages),
      arguments(mock(SignalDetectionHypothesisConverterInterface.class),
        null,
        orderedStages),
      arguments(mock(SignalDetectionHypothesisConverterInterface.class),
        mock(SignalDetectionIdUtility.class),
        null));
  }

  @Test
  void testCreate() {
    SignalDetectionConverter converter =
      Assertions.assertDoesNotThrow(() -> SignalDetectionConverter.create(signalDetectionHypothesisConverter,
        signalDetectionIdUtility,
        orderedStages));
    assertNotNull(converter);
  }

  @ParameterizedTest
  @MethodSource("getConvertValidationArguments")
  void testConvertValidation(Class<? extends Exception> expectedException,
    Map<WorkflowDefinitionId, ArrivalDao> arrivals,
    Station station,
    String monitoringOrganization) {

    assertThrows(expectedException,
      () -> converter.convert(arrivals, station, monitoringOrganization));
  }

  static Stream<Arguments> getConvertValidationArguments() {
    return Stream.of(
      arguments(NullPointerException.class,
        null,
        STATION,
        MONITORING_ORG),
      arguments(NullPointerException.class,
        Map.of(stage1Id, ARRIVAL_1),
        null,
        MONITORING_ORG),
      arguments(NullPointerException.class,
        Map.of(stage1Id, ARRIVAL_1),
        STATION,
        null),
      arguments(IllegalStateException.class,
        Map.of(),
        STATION,
        MONITORING_ORG,
        List.of(ARRIVAL_CHANNEL),
        List.of(ARRIVAL_CHANNEL_SEGMENT)),
      arguments(IllegalStateException.class,
        Map.of(stage1Id, ARRIVAL_1, stage2Id, ARRIVAL_3),
        STATION,
        MONITORING_ORG,
        List.of(ARRIVAL_CHANNEL),
        List.of(ARRIVAL_CHANNEL_SEGMENT)));
  }

  @ParameterizedTest
  @MethodSource("getConvertArguments")
  void testConvert(SignalDetection expected,
    Consumer<SignalDetectionHypothesisConverterInterface> setupMocks,
    Consumer<SignalDetectionHypothesisConverterInterface> verifyMocks,
    Map<WorkflowDefinitionId, ArrivalDao> arrivals,
    Station station,
    String monitoringOrganization) {

    setupMocks.accept(signalDetectionHypothesisConverter);

    Optional<SignalDetection> actual = converter.convert(arrivals,
      station,
      monitoringOrganization);

    assertTrue(actual.isPresent());
    assertEquals(expected, actual.get());

    verifyMocks.accept(signalDetectionHypothesisConverter);
  }

  static Stream<Arguments> getConvertArguments() {
    Consumer<SignalDetectionHypothesisConverterInterface> singleArrivalSetup = sdhConverter ->
      when(sdhConverter.convertToEntityReference(STAGE_1, DETECTION_FROM_ARRIVAL.getId().getId(), ARRIVAL_1))
      .thenReturn(Optional.ofNullable(HYPOTHESIS_FROM_ARRIVAL_1));
    Consumer<SignalDetectionHypothesisConverterInterface> singleArrivalVerification = sdhConverter -> {
      verify(sdhConverter).convertToEntityReference(STAGE_1, DETECTION_FROM_ARRIVAL.getId().getId(), ARRIVAL_1);
      verifyNoMoreInteractions(sdhConverter);
    };

    Consumer<SignalDetectionHypothesisConverterInterface> twoArrivalSetup = sdhConverter -> {
      when(sdhConverter.convertToEntityReference(STAGE_1, DETECTION_FROM_BOTH_ARRIVALS.getId().getId(), ARRIVAL_1))
        .thenReturn(Optional.ofNullable(HYPOTHESIS_FROM_ARRIVAL_1));
      when(sdhConverter.convertToEntityReference(STAGE_2, DETECTION_FROM_BOTH_ARRIVALS.getId().getId(), ARRIVAL_2))
        .thenReturn(Optional.ofNullable(HYPOTHESIS_FROM_ARRIVAL_2));
    };

    Consumer<SignalDetectionHypothesisConverterInterface> twoArrivalVerification = sdhConverter -> {
      verify(sdhConverter).convertToEntityReference(STAGE_1, DETECTION_FROM_BOTH_ARRIVALS.getId().getId(), ARRIVAL_1);
      verify(sdhConverter).convertToEntityReference(STAGE_2, DETECTION_FROM_BOTH_ARRIVALS.getId().getId(), ARRIVAL_2);
      verifyNoMoreInteractions(sdhConverter);
    };

    return Stream.of(
      arguments(DETECTION_FROM_ARRIVAL,
        singleArrivalSetup,
        singleArrivalVerification,
        Map.of(stage1Id, ARRIVAL_1),
        STATION,
        MONITORING_ORG),
      arguments(DETECTION_FROM_BOTH_ARRIVALS,
        twoArrivalSetup,
        twoArrivalVerification,
        Map.of(stage1Id, ARRIVAL_1, stage2Id, ARRIVAL_2),
        STATION,
        MONITORING_ORG));
  }
}