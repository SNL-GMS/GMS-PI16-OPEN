package gms.shared.signaldetection.factory;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.frameworks.test.utils.containers.ZooTestContainer;
import gms.shared.signaldetection.api.SignalDetectionAccessorInterface;
import gms.shared.signaldetection.api.SignalDetectionRepositoryInterface;
import gms.shared.signaldetection.api.facet.SignalDetectionFacetingUtility;
import gms.shared.signaldetection.converter.detection.FeatureMeasurementConverterInterface;
import gms.shared.signaldetection.converter.detection.SignalDetectionConverterInterface;
import gms.shared.signaldetection.converter.detection.SignalDetectionHypothesisConverterInterface;
import gms.shared.signaldetection.database.connector.util.SignalDetectionIdUtility;
import gms.shared.signaldetection.manager.config.SignalDetectionBridgeDefinition;
import gms.shared.stationdefinition.api.StationDefinitionAccessorInterface;
import gms.shared.stationdefinition.factory.StationDefinitionAccessorFactory;
import gms.shared.stationdefinition.repository.BridgedChannelRepository;
import gms.shared.stationdefinition.repository.util.StationDefinitionIdUtility;
import gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider;
import gms.shared.waveform.accessor.WaveformAccessor;
import gms.shared.waveform.accessor.WaveformAccessorFactory;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;

import javax.persistence.EntityManagerFactory;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

import static gms.shared.signaldetection.cache.util.SignalDetectionCacheFactory.REQUEST_CACHE;
import static gms.shared.signaldetection.database.connector.util.SignalDetectionIdUtility.ARID_SIGNAL_DETECTION_ID_CACHE;
import static gms.shared.signaldetection.database.connector.util.SignalDetectionIdUtility.ARRIVAL_ID_SIGNAL_DETECTION_HYPOTHESIS_ID;
import static gms.shared.signaldetection.database.connector.util.SignalDetectionIdUtility.SIGNAL_DETECTION_HYPOTHESIS_ID_ARRIVAL_ID;
import static gms.shared.signaldetection.database.connector.util.SignalDetectionIdUtility.SIGNAL_DETECTION_ID_ARID_CACHE;
import static gms.shared.signaldetection.factory.SignalDetectionAccessorFactory.PERSISTENCE_UNIT_NAME;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
@Disabled //zookeeper has been removed 8/5/2021
@ExtendWith(MockitoExtension.class)
class SignalDetectionAccessorFactoryTest extends ZooTestContainer {

  private static final WorkflowDefinitionId stageId = WorkflowDefinitionId.from("test");
  private static final ImmutableList<WorkflowDefinitionId> orderedStages = ImmutableList.of(stageId);
  private static final ImmutableMap<WorkflowDefinitionId, String> databaseAccountsByStage =
    ImmutableMap.of(stageId, "currentAccount");

  @Mock
  private StationDefinitionAccessorFactory stationDefinitionAccessorFactory;

  @Mock
  private SignalDetectionBridgeDefinition signalDetectionBridgeDefinition;

  @Mock
  private BridgedEntityManagerFactoryProvider bridgedEntityManagerFactoryProvider;

  @Mock
  private SystemConfig mockSystemConfig;

  @Mock
  private WaveformAccessorFactory waveformAccessorFactory;

  private SignalDetectionAccessorFactory signalDetectionAccessorFactory;

  @BeforeAll
  static void igniteSetup() {
    setUpContainer();

    try {
      Path tempIgniteDirectory = Files.createTempDirectory("ignite-work");
      System.setProperty("IGNITE_HOME", tempIgniteDirectory.toString());
    } catch (IOException e) {
      e.printStackTrace();
    }

    try {
      IgniteConnectionManager.create(systemConfig,
        List.of(REQUEST_CACHE,
          ARID_SIGNAL_DETECTION_ID_CACHE,
          SIGNAL_DETECTION_ID_ARID_CACHE,
          ARRIVAL_ID_SIGNAL_DETECTION_HYPOTHESIS_ID,
          SIGNAL_DETECTION_HYPOTHESIS_ID_ARRIVAL_ID));
    } catch (IllegalStateException ex) {
      LoggerFactory.getLogger(SignalDetectionAccessorFactoryTest.class)
        .info("IgniteCache already initialized");
    }
  }

  @BeforeEach
  void setup() {
    signalDetectionAccessorFactory = signalDetectionAccessorFactory.create(stationDefinitionAccessorFactory,
      signalDetectionBridgeDefinition,
      bridgedEntityManagerFactoryProvider,
      mockSystemConfig,
      waveformAccessorFactory);
  }

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(String expectedMessage,
    StationDefinitionAccessorFactory stationDefinitionAccessorFactory,
    SignalDetectionBridgeDefinition signalDetectionBridgeDefinition,
    BridgedEntityManagerFactoryProvider bridgedEntityManagerFactoryProvider,
    SystemConfig systemConfig,
    WaveformAccessorFactory waveformAccessorFactory) {

    NullPointerException exception = assertThrows(NullPointerException.class,
      () -> SignalDetectionAccessorFactory.create(stationDefinitionAccessorFactory,
        signalDetectionBridgeDefinition,
        bridgedEntityManagerFactoryProvider,
        systemConfig,
        waveformAccessorFactory));

    assertEquals(expectedMessage, exception.getMessage());
  }

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(
      arguments("StationDefinitionAccessorFactory cannot be null",
        null,
        mock(SignalDetectionBridgeDefinition.class),
        mock(BridgedEntityManagerFactoryProvider.class),
        mock(SystemConfig.class),
        mock(WaveformAccessorFactory.class)),
      arguments("SignalDetectionBridgeDefinition cannot be null",
        mock(StationDefinitionAccessorFactory.class),
        null,
        mock(BridgedEntityManagerFactoryProvider.class),
        mock(SystemConfig.class),
        mock(WaveformAccessorFactory.class)),
      arguments("BridgedEntityManagerFactoryProvider cannot be null",
        mock(StationDefinitionAccessorFactory.class),
        mock(SignalDetectionBridgeDefinition.class),
        null,
        mock(SystemConfig.class),
        mock(WaveformAccessorFactory.class)),
      arguments("SystemConfig cannot be null",
        mock(StationDefinitionAccessorFactory.class),
        mock(SignalDetectionBridgeDefinition.class),
        mock(BridgedEntityManagerFactoryProvider.class),
        null,
        mock(WaveformAccessorFactory.class)),
      arguments("WaveformAccessorFactory cannot be null",
        mock(StationDefinitionAccessorFactory.class),
        mock(SignalDetectionBridgeDefinition.class),
        mock(BridgedEntityManagerFactoryProvider.class),
        mock(SystemConfig.class),
        null));
  }

  @Test
  void testCreate() {
    SignalDetectionAccessorFactory factory = assertDoesNotThrow(
      () -> SignalDetectionAccessorFactory.create(stationDefinitionAccessorFactory,
        signalDetectionBridgeDefinition,
        bridgedEntityManagerFactoryProvider,
        mockSystemConfig,
        waveformAccessorFactory));

    assertNotNull(factory);
  }

  @Test
  void testGetFeatureMeasurementConverterInstance() {
    FeatureMeasurementConverterInterface converter = assertDoesNotThrow(() ->
      signalDetectionAccessorFactory.getFeatureMeasurementConverterInstance());

    assertNotNull(converter);
    verifyNoMoreInteractions(signalDetectionBridgeDefinition,
      bridgedEntityManagerFactoryProvider,
      waveformAccessorFactory,
      stationDefinitionAccessorFactory);
  }

  @Test
  void testGetSignalDetectionHypothesisConverterInstance() {
    SignalDetectionHypothesisConverterInterface converter = assertDoesNotThrow(() ->
      signalDetectionAccessorFactory.getSignalDetectionHypothesisConverterInstance());

    assertNotNull(converter);
    verifyNoMoreInteractions(signalDetectionBridgeDefinition,
      bridgedEntityManagerFactoryProvider,
      waveformAccessorFactory,
      stationDefinitionAccessorFactory);
  }

  @Test
  void testGetSignalDetectionConverterInstance() {
    when(signalDetectionBridgeDefinition.getOrderedStages()).thenReturn(orderedStages);

    SignalDetectionConverterInterface converter = assertDoesNotThrow(() ->
      signalDetectionAccessorFactory.getSignalDetectionConverterInstance());

    assertNotNull(converter);
    verify(signalDetectionBridgeDefinition).getOrderedStages();
    verifyNoMoreInteractions(signalDetectionBridgeDefinition,
      bridgedEntityManagerFactoryProvider,
      waveformAccessorFactory,
      stationDefinitionAccessorFactory);
  }

  @Test
  void testGetSignalDetectionIdUtilityInstance() {
    SignalDetectionIdUtility idUtility = assertDoesNotThrow(() ->
      signalDetectionAccessorFactory.getSignalDetectionIdUtilityInstance());

    assertNotNull(idUtility);
    verifyNoMoreInteractions(signalDetectionBridgeDefinition,
      bridgedEntityManagerFactoryProvider,
      waveformAccessorFactory,
      stationDefinitionAccessorFactory);
  }

  @Test
  void testGetSignalDetectionRepositoryInstance() {
    when(signalDetectionBridgeDefinition.getOrderedStages()).thenReturn(orderedStages);
    when(signalDetectionBridgeDefinition.getDatabaseAccountByStage()).thenReturn(databaseAccountsByStage);
    when(bridgedEntityManagerFactoryProvider.getEntityManagerFactory(PERSISTENCE_UNIT_NAME,
      databaseAccountsByStage.get(stageId),
      mockSystemConfig))
      .thenReturn(mock(EntityManagerFactory.class));
    when(stationDefinitionAccessorFactory.getBridgedChannelRepositoryInstance())
      .thenReturn((mock(BridgedChannelRepository.class)));

    SignalDetectionRepositoryInterface signalDetectionRepository =  assertDoesNotThrow(() ->
      signalDetectionAccessorFactory.getSignalDetectionRepositoryInstance());
    assertNotNull(signalDetectionRepository);
    verify(signalDetectionBridgeDefinition, times(2)).getOrderedStages();
    verify(signalDetectionBridgeDefinition).getDatabaseAccountByStage();
    verify(bridgedEntityManagerFactoryProvider).getEntityManagerFactory(PERSISTENCE_UNIT_NAME,
      databaseAccountsByStage.get(stageId),
      mockSystemConfig);
    verify(stationDefinitionAccessorFactory).getBridgedChannelRepositoryInstance();

    verifyNoMoreInteractions(signalDetectionBridgeDefinition,
      bridgedEntityManagerFactoryProvider,
      waveformAccessorFactory,
      stationDefinitionAccessorFactory);
  }

  @Test
  void testGetSignalDetectionFacetingUtilityInstance() {
    when(signalDetectionBridgeDefinition.getOrderedStages()).thenReturn(orderedStages);
    when(signalDetectionBridgeDefinition.getDatabaseAccountByStage()).thenReturn(databaseAccountsByStage);
    when(bridgedEntityManagerFactoryProvider.getEntityManagerFactory(PERSISTENCE_UNIT_NAME,
      databaseAccountsByStage.get(stageId),
      mockSystemConfig))
      .thenReturn(mock(EntityManagerFactory.class));
    when(waveformAccessorFactory.getWaveformAccessorInstance()).thenReturn(mock(WaveformAccessor.class));
    when(stationDefinitionAccessorFactory.getBridgedStationDefinitionAccessorInstance())
      .thenReturn(mock(StationDefinitionAccessorInterface.class));
    when(stationDefinitionAccessorFactory.getBridgedChannelRepositoryInstance())
      .thenReturn((mock(BridgedChannelRepository.class)));

    SignalDetectionFacetingUtility facetingUtility =
      signalDetectionAccessorFactory.getSignalDetectionFacetingUtilityInstance();
    assertNotNull(facetingUtility);

    verify(signalDetectionBridgeDefinition, times(2)).getOrderedStages();
    verify(signalDetectionBridgeDefinition).getDatabaseAccountByStage();
    verify(bridgedEntityManagerFactoryProvider).getEntityManagerFactory(PERSISTENCE_UNIT_NAME,
      databaseAccountsByStage.get(stageId),
      mockSystemConfig);
    verify(waveformAccessorFactory, times(3)).getWaveformAccessorInstance();
    verify(stationDefinitionAccessorFactory, times(4)).getBridgedStationDefinitionAccessorInstance();
    verify(stationDefinitionAccessorFactory).getBridgedChannelRepositoryInstance();

    verifyNoMoreInteractions(signalDetectionBridgeDefinition,
      bridgedEntityManagerFactoryProvider,
      waveformAccessorFactory,
      stationDefinitionAccessorFactory);
  }

  @Test
  void testGetSignalDetectionAccessorInstance() {
    when(signalDetectionBridgeDefinition.getOrderedStages()).thenReturn(orderedStages);
    when(signalDetectionBridgeDefinition.getDatabaseAccountByStage()).thenReturn(databaseAccountsByStage);
    when(bridgedEntityManagerFactoryProvider.getEntityManagerFactory(PERSISTENCE_UNIT_NAME,
      databaseAccountsByStage.get(stageId),
      mockSystemConfig))
      .thenReturn(mock(EntityManagerFactory.class));
    when(waveformAccessorFactory.getWaveformAccessorInstance()).thenReturn(mock(WaveformAccessor.class));
    when(stationDefinitionAccessorFactory.getBridgedStationDefinitionAccessorInstance())
      .thenReturn(mock(StationDefinitionAccessorInterface.class));
    when(stationDefinitionAccessorFactory.getBridgedChannelRepositoryInstance())
      .thenReturn((mock(BridgedChannelRepository.class)));

    SignalDetectionAccessorInterface accessorInterface =
      signalDetectionAccessorFactory.getSignalDetectionAccessorInstance();
    assertNotNull(accessorInterface);

    verify(signalDetectionBridgeDefinition, times(2)).getOrderedStages();
    verify(signalDetectionBridgeDefinition).getDatabaseAccountByStage();
    verify(bridgedEntityManagerFactoryProvider).getEntityManagerFactory(PERSISTENCE_UNIT_NAME,
      databaseAccountsByStage.get(stageId),
      mockSystemConfig);
    verify(waveformAccessorFactory, times(2)).getWaveformAccessorInstance();
    verify(stationDefinitionAccessorFactory, times(2)).getBridgedStationDefinitionAccessorInstance();
    verify(stationDefinitionAccessorFactory).getBridgedChannelRepositoryInstance();
    verifyNoMoreInteractions(signalDetectionBridgeDefinition,
      bridgedEntityManagerFactoryProvider,
      waveformAccessorFactory,
      stationDefinitionAccessorFactory);
  }
}