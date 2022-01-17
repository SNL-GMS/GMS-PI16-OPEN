package gms.shared.signaldetection.repository;

import com.google.common.collect.ImmutableList;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisConverterId;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signaldetection.coi.detection.SignalDetectionId;
import gms.shared.signaldetection.converter.detection.SignalDetectionConverter;
import gms.shared.signaldetection.converter.detection.SignalDetectionHypothesisConverter;
import gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnector;
import gms.shared.signaldetection.database.connector.util.SignalDetectionHypothesisArrivalIdComponents;
import gms.shared.signaldetection.database.connector.util.SignalDetectionIdUtility;
import gms.shared.signaldetection.manager.config.SignalDetectionBridgeDefinition;
import gms.shared.stationdefinition.api.channel.ChannelRepositoryInterface;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import gms.shared.stationdefinition.repository.BridgedChannelRepository;
import gms.shared.stationdefinition.repository.util.StationDefinitionIdUtility;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.WFTAG_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.WFTAG_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_CHANNEL;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.MEASURED_WAVEFORM_LAG_DURATION;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.MEASURED_WAVEFORM_LEAD_DURATION;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.MONITORING_ORG;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ARRIVAL_ID_COMPONENTS_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ARRIVAL_ID_COMPONENTS_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ID;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ID_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_ID;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_ID_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.WORKFLOW_DEFINITION_ID1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.WORKFLOW_DEFINITION_ID2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.WORKFLOW_DEFINITION_ID3;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_3;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.WFID_1;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.WFID_3;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BridgedSignalDetectionRepositoryTest {
  @Mock
  private SignalDetectionBridgeDefinition signalDetectionBridgeDefinition;

  @Mock
  private BridgedChannelRepository bridgedChannelRepository;

  @Mock
  private SignalDetectionDatabaseConnector stage1DBConnector;

  @Mock
  private SignalDetectionDatabaseConnector stage2DBConnector;

  @Mock
  private SignalDetectionDatabaseConnector stage3DBConnector;

  @Mock
  private SignalDetectionIdUtility signalDetectionIdUtility;

  @Mock
  private SignalDetectionHypothesisConverter signalDetectionHypothesisConverter;

  @Mock
  private SignalDetectionConverter signalDetectionConverter;

  private static Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> currentStageDatabaseConnectors;

  private static Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> previousStageDatabaseConnectors;

  private BridgedSignalDetectionRepository repository;

  private static final List<SignalDetectionId> SIGNAL_DETECTION_IDS = List.of(SIGNAL_DETECTION.getId(),
    SIGNAL_DETECTION_3.getId());

  private static final List<SignalDetectionHypothesisId> SIGNAL_DETECTION_HYPOTHESIS_IDS = List.of(
    SIGNAL_DETECTION_HYPOTHESIS_ID, SIGNAL_DETECTION_HYPOTHESIS_ID_3);

  private static final Instant START_TIME = Instant.EPOCH;
  private static final Instant END_TIME = Instant.EPOCH.plusSeconds(300);

  @BeforeEach
  void setUp() {

    currentStageDatabaseConnectors = Map.of(
      WORKFLOW_DEFINITION_ID1, stage1DBConnector,
      WORKFLOW_DEFINITION_ID2, stage2DBConnector,
      WORKFLOW_DEFINITION_ID3, stage3DBConnector);
    previousStageDatabaseConnectors = Map.of(
      WORKFLOW_DEFINITION_ID2, stage2DBConnector,
      WORKFLOW_DEFINITION_ID3, stage2DBConnector);

    repository = BridgedSignalDetectionRepository.create(signalDetectionBridgeDefinition,
      bridgedChannelRepository,
      currentStageDatabaseConnectors,
      previousStageDatabaseConnectors,
      signalDetectionIdUtility,
      signalDetectionHypothesisConverter,
      signalDetectionConverter);
  }

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(SignalDetectionBridgeDefinition signalDetectionBridgeDefinition,
    ChannelRepositoryInterface bridgedChannelRepository,
    Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> currentStageDatabaseConnectors,
    Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> previousStageDatabaseConnectors,
    SignalDetectionIdUtility signalDetectionIdUtility,
    SignalDetectionHypothesisConverter signalDetectionHypothesisConverter,
    SignalDetectionConverter signalDetectionConverter) {

    assertThrows(NullPointerException.class,
      () -> BridgedSignalDetectionRepository.create(signalDetectionBridgeDefinition,
        bridgedChannelRepository,
        currentStageDatabaseConnectors,
        previousStageDatabaseConnectors,
        signalDetectionIdUtility,
        signalDetectionHypothesisConverter,
        signalDetectionConverter));
  }

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(
      arguments(null,
        mock(ChannelRepositoryInterface.class),
        mock(Map.class),
        mock(Map.class),
        mock(SignalDetectionIdUtility.class),
        mock(SignalDetectionHypothesisConverter.class),
        mock(SignalDetectionConverter.class)),
      arguments(mock(SignalDetectionBridgeDefinition.class),
        null,
        mock(Map.class),
        mock(Map.class),
        mock(SignalDetectionIdUtility.class),
        mock(SignalDetectionHypothesisConverter.class),
        mock(SignalDetectionConverter.class)),
      arguments(mock(SignalDetectionBridgeDefinition.class),
        mock(ChannelRepositoryInterface.class),
        null,
        mock(Map.class),
        mock(SignalDetectionIdUtility.class),
        mock(SignalDetectionHypothesisConverter.class),
        mock(SignalDetectionConverter.class)),
      arguments(mock(SignalDetectionBridgeDefinition.class),
        mock(ChannelRepositoryInterface.class),
        mock(Map.class),
        null,
        mock(SignalDetectionIdUtility.class),
        mock(SignalDetectionHypothesisConverter.class),
        mock(SignalDetectionConverter.class)),
      arguments(mock(SignalDetectionBridgeDefinition.class),
        mock(ChannelRepositoryInterface.class),
        mock(Map.class),
        mock(Map.class),
        null,
        mock(SignalDetectionHypothesisConverter.class),
        mock(SignalDetectionConverter.class)),
      arguments(mock(SignalDetectionBridgeDefinition.class),
        mock(ChannelRepositoryInterface.class),
        mock(Map.class),
        mock(Map.class),
        mock(SignalDetectionIdUtility.class),
        null,
        mock(SignalDetectionConverter.class)),
      arguments(mock(SignalDetectionBridgeDefinition.class),
        mock(ChannelRepositoryInterface.class),
        mock(Map.class),
        mock(Map.class),
        mock(SignalDetectionIdUtility.class),
        mock(SignalDetectionHypothesisConverter.class),
        null));
  }

  @ParameterizedTest
  @MethodSource("getFindByIdsArguments")
  void testFindByIds(List<SignalDetection> expectedValues,
    Consumer<SignalDetectionIdUtility> setupMocks,
    Consumer<SignalDetectionIdUtility> verifyMocks) {

    when(signalDetectionBridgeDefinition.getOrderedStages())
      .thenReturn(ImmutableList.of(WORKFLOW_DEFINITION_ID1, WORKFLOW_DEFINITION_ID2));
    SignalDetectionDatabaseConnector currentDBConnector = currentStageDatabaseConnectors.get(WORKFLOW_DEFINITION_ID2);
    SignalDetectionDatabaseConnector previousDBConnector = previousStageDatabaseConnectors.get(WORKFLOW_DEFINITION_ID2);

    when(currentDBConnector.findArrivals(List.of(ARRIVAL_1.getId(), ARRIVAL_3.getId())))
      .thenReturn(List.of(ARRIVAL_1, ARRIVAL_3));
    when(previousDBConnector.findArrivals(List.of(ARRIVAL_1.getId(), ARRIVAL_3.getId())))
      .thenReturn(List.of(ARRIVAL_1));
    when(signalDetectionBridgeDefinition.getMonitoringOrganization())
      .thenReturn(MONITORING_ORG);
    when(signalDetectionConverter.convert(any(), any(), any()))
      .thenReturn(Optional.of(SIGNAL_DETECTION), Optional.of(SIGNAL_DETECTION_3));

    setupMocks.accept(signalDetectionIdUtility);
    List<SignalDetection> signalDetections = repository.findByIds(SIGNAL_DETECTION_IDS, WORKFLOW_DEFINITION_ID2);
    assertTrue(signalDetections.size() > 0);
    signalDetections.forEach(sd -> assertTrue(expectedValues.contains(sd)));
    verify(signalDetectionBridgeDefinition).getOrderedStages();
    verify(currentDBConnector).findArrivals(List.of(ARRIVAL_1.getId(), ARRIVAL_3.getId()));
    verify(previousDBConnector).findArrivals(List.of(ARRIVAL_1.getId(), ARRIVAL_3.getId()));
    verify(signalDetectionBridgeDefinition).getMonitoringOrganization();
    verify(signalDetectionConverter).convert(anyMap(), any(), eq(MONITORING_ORG));
  }

  @ParameterizedTest
  @MethodSource("getFindByIdsArguments")
  void testFindByIds_nullPrevious(List<SignalDetection> expectedValues,
    Consumer<SignalDetectionIdUtility> setupMocks,
    Consumer<SignalDetectionIdUtility> verifyMocks) {

    when(signalDetectionBridgeDefinition.getOrderedStages())
      .thenReturn(ImmutableList.of(WORKFLOW_DEFINITION_ID1));
    SignalDetectionDatabaseConnector currentDBConnector = currentStageDatabaseConnectors.get(WORKFLOW_DEFINITION_ID1);

    when(currentDBConnector.findArrivals(List.of(ARRIVAL_1.getId(), ARRIVAL_3.getId())))
      .thenReturn(List.of(ARRIVAL_1, ARRIVAL_3));
    when(signalDetectionBridgeDefinition.getMonitoringOrganization())
      .thenReturn(MONITORING_ORG);
    when(signalDetectionConverter.convert(any(), any(), any()))
      .thenReturn(Optional.of(SIGNAL_DETECTION), Optional.of(SIGNAL_DETECTION_3));

    setupMocks.accept(signalDetectionIdUtility);
    List<SignalDetection> signalDetections = repository.findByIds(SIGNAL_DETECTION_IDS, WORKFLOW_DEFINITION_ID1);
    assertTrue(signalDetections.size() > 0);
    signalDetections.forEach(sd -> assertTrue(expectedValues.contains(sd)));
    verifyMocks.accept(signalDetectionIdUtility);
  }

  @Test
  void testFindHypothesesByIds() {
    List<SignalDetectionHypothesis> expectedValues = List.of(SIGNAL_DETECTION_HYPOTHESIS, SIGNAL_DETECTION_HYPOTHESIS_3);

    when(signalDetectionBridgeDefinition.getOrderedStages())
      .thenReturn(ImmutableList.of(WORKFLOW_DEFINITION_ID1, WORKFLOW_DEFINITION_ID2, WORKFLOW_DEFINITION_ID3));

    SignalDetectionDatabaseConnector currentDBConnector = currentStageDatabaseConnectors.get(WORKFLOW_DEFINITION_ID2);
    SignalDetectionDatabaseConnector previousDBConnector = previousStageDatabaseConnectors.get(WORKFLOW_DEFINITION_ID2);

    var idComponents1 = SignalDetectionHypothesisArrivalIdComponents.create(WORKFLOW_DEFINITION_ID2,
      ARRIVAL_1.getId());
    doReturn(idComponents1)
      .when(signalDetectionIdUtility)
        .getArrivalIdComponentsFromSignalDetectionHypothesisId(SIGNAL_DETECTION_HYPOTHESIS_ID.getId());

    var idComponents2 = SignalDetectionHypothesisArrivalIdComponents.create(WORKFLOW_DEFINITION_ID2,
      ARRIVAL_3.getId());
    doReturn(idComponents2)
      .when(signalDetectionIdUtility)
      .getArrivalIdComponentsFromSignalDetectionHypothesisId(SIGNAL_DETECTION_HYPOTHESIS_ID_3.getId());

    when(currentDBConnector.findArrivals(List.of(ARRIVAL_1.getId(), ARRIVAL_3.getId())))
      .thenReturn(List.of(ARRIVAL_1));
    when(previousDBConnector.findArrivals(List.of(ARRIVAL_1.getId(), ARRIVAL_3.getId())))
      .thenReturn(List.of(ARRIVAL_3));
    when(currentDBConnector.findWftags(List.of(ARRIVAL_1.getId(), ARRIVAL_3.getId())))
      .thenReturn(List.of(WFTAG_1, WFTAG_3));
    when(currentDBConnector.findWfdiscs(anyCollection()))
      .thenReturn(List.of(WFDISC_TEST_DAO_1, WFDISC_TEST_DAO_3));

    when(signalDetectionBridgeDefinition.getMonitoringOrganization())
      .thenReturn(MONITORING_ORG);
    when(signalDetectionBridgeDefinition.getMeasuredWaveformLeadDuration())
      .thenReturn(Duration.ZERO);
    when(signalDetectionBridgeDefinition.getMeasuredWaveformLagDuration())
      .thenReturn(Duration.ZERO);


    doReturn(SIGNAL_DETECTION_HYPOTHESIS_ID_3.getId())
      .when(signalDetectionIdUtility).getOrCreateSignalDetectionHypothesisIdFromAridAndStageId(ARRIVAL_3.getId(),
      WORKFLOW_DEFINITION_ID1);

    doReturn(SIGNAL_DETECTION_HYPOTHESIS_ID_3.getSignalDetectionId())
      .when(signalDetectionIdUtility).getOrCreateSignalDetectionIdfromArid(ARRIVAL_3.getId());

    doReturn(CHANNEL)
      .when(bridgedChannelRepository).loadChannelFromWfdisc(WFID_3,
      TagName.ARID,
      ARRIVAL_3.getId(),
      WFDISC_TEST_DAO_3.getTime(),
      WFDISC_TEST_DAO_3.getEndTime());

    doReturn(Optional.of(SIGNAL_DETECTION_HYPOTHESIS_3))
      .when(signalDetectionHypothesisConverter).convert(any(SignalDetectionHypothesisConverterId.class),
      eq(ARRIVAL_3),
      eq(MONITORING_ORG),
      any(),
      any(),
      any());

    List<SignalDetectionHypothesis> signalDetectionHypotheses = repository.findHypothesesByIds(SIGNAL_DETECTION_HYPOTHESIS_IDS);

    assertTrue(signalDetectionHypotheses.size() > 0);
    signalDetectionHypotheses.forEach(sdh -> assertTrue(expectedValues.contains(sdh)));
  }

  @ParameterizedTest
  @MethodSource("getFindByStationsAndTime")
  void testFindByStationsAndTime(List<SignalDetection> expectedValues,
    Consumer<SignalDetectionIdUtility> setupMocks,
    Consumer<SignalDetectionIdUtility> verifyMocks) {

    SignalDetectionDatabaseConnector currentDBConnector = currentStageDatabaseConnectors.get(WORKFLOW_DEFINITION_ID2);
    SignalDetectionDatabaseConnector previousDBConnector = previousStageDatabaseConnectors.get(WORKFLOW_DEFINITION_ID2);

    when(signalDetectionBridgeDefinition.getOrderedStages())
      .thenReturn(ImmutableList.of(WORKFLOW_DEFINITION_ID1, WORKFLOW_DEFINITION_ID2));

    when(currentDBConnector.findArrivals(List.of(STATION.getName()), List.of(ARRIVAL_1.getId()),
      START_TIME, END_TIME, MEASURED_WAVEFORM_LEAD_DURATION, MEASURED_WAVEFORM_LAG_DURATION ))
      .thenReturn(List.of());
    when(previousDBConnector.findArrivals(List.of(STATION.getName()), List.of(ARRIVAL_1.getId()),
      START_TIME, END_TIME, MEASURED_WAVEFORM_LEAD_DURATION, MEASURED_WAVEFORM_LAG_DURATION ))
      .thenReturn(List.of(ARRIVAL_1, ARRIVAL_3));
    when(signalDetectionBridgeDefinition.getMonitoringOrganization())
      .thenReturn(MONITORING_ORG);
    when(signalDetectionBridgeDefinition.getMeasuredWaveformLeadDuration())
      .thenReturn(MEASURED_WAVEFORM_LEAD_DURATION);
    when(signalDetectionBridgeDefinition.getMeasuredWaveformLagDuration())
      .thenReturn(MEASURED_WAVEFORM_LAG_DURATION);
    when(signalDetectionConverter.convert(anyMap(), any(), any()))
      .thenReturn(Optional.of(SIGNAL_DETECTION_3));

    setupMocks.accept(signalDetectionIdUtility);
    List<SignalDetection> signalDetections = repository.findByStationsAndTime(List.of(STATION),
      START_TIME, END_TIME, WORKFLOW_DEFINITION_ID2, List.of(SIGNAL_DETECTION));
    assertTrue(signalDetections.size() > 0);
    signalDetections.forEach(sd -> assertTrue(expectedValues.contains(sd)));
    verifyMocks.accept(signalDetectionIdUtility);
  }

  // Create find signal detection by ids arguments
  static Stream<Arguments> getFindByIdsArguments() {
    List<SignalDetection> expectedValues = List.of(SIGNAL_DETECTION, SIGNAL_DETECTION_3);
    Consumer<SignalDetectionIdUtility> twoAridSetup = sdUtil -> {
      when(sdUtil.getAridForSignalDetectionUUID(SIGNAL_DETECTION_ID))
        .thenReturn(ARRIVAL_1.getId());
      when(sdUtil.getAridForSignalDetectionUUID(SIGNAL_DETECTION_ID_3))
        .thenReturn(ARRIVAL_3.getId());
    };
    Consumer<SignalDetectionIdUtility> twoAridVerification = sdUtil -> {
      verify(sdUtil).getAridForSignalDetectionUUID(SIGNAL_DETECTION_ID);
      verify(sdUtil).getAridForSignalDetectionUUID(SIGNAL_DETECTION_ID_3);
      verifyNoMoreInteractions(sdUtil);
    };

    return Stream.of(
      arguments(expectedValues, twoAridSetup, twoAridVerification)
    );
  }

  // Create find signal detections by stations and time
  static Stream<Arguments> getFindByStationsAndTime() {
    List<SignalDetection> expectedValues = List.of(SIGNAL_DETECTION_3);
    Consumer<SignalDetectionIdUtility> aridSetup = sdUtil -> {
      when(sdUtil.getAridForSignalDetectionUUID(SIGNAL_DETECTION_ID))
        .thenReturn(ARRIVAL_1.getId());
    };
    Consumer<SignalDetectionIdUtility> aridVerification = sdUtil -> {
      verify(sdUtil).getAridForSignalDetectionUUID(SIGNAL_DETECTION_ID);
      verifyNoMoreInteractions(sdUtil);
    };

    return Stream.of(
      arguments(expectedValues, aridSetup, aridVerification)
    );
  }
}
