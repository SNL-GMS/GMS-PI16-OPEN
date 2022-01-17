package gms.testtools.simulators.bridgeddatasourcesimulator.application;


import gms.shared.stationdefinition.dao.css.enums.ChannelType;
import gms.shared.stationdefinition.dao.css.enums.StaType;
import gms.shared.stationdefinition.database.connector.factory.StationDefinitionDatabaseConnectorFactory;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.BridgedDataSourceDataSimulator;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.coi.Site;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.coi.SiteChan;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.BridgedDataSourceSimulatorSpec;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.BridgedDataSourceSimulatorStatus;
import gms.testtools.simulators.bridgeddatasourcestationsimulator.BridgedDataSourceStationSimulator;
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
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

@ExtendWith(MockitoExtension.class)
class BridgedDataSourceSimulatorControllerTest {

  private static final String CURRENT_STATE_IS_UNINITIALIZED_ERROR = "Invalid Status Transition Detected. The current status is UNINITIALIZED. The next valid status transitions are [INITIALIZE].";
  private static final String CURRENT_STATE_IS_INITIALIZED_ERROR = "Invalid Status Transition Detected. The current status is INITIALIZED. The next valid status transitions are [START, CLEANUP].";
  private static final String CURRENT_STATE_IS_STARTED_ERROR = "Invalid Status Transition Detected. The current status is STARTED. The next valid status transitions are [STOP].";
  private static final String CURRENT_STATE_IS_STOPPED_ERROR = "Invalid Status Transition Detected. The current status is STOPPED. The next valid status transitions are [START, CLEANUP].";
  public static final String PLACEHOLDER = "placeholder";
  //This spec uses the archi guidance defaults = 45 days of operational time period and 4 days calib update.
  private final BridgedDataSourceSimulatorSpec bridgedDataSourceSimulatorSpec = BridgedDataSourceSimulatorSpec.builder()
    .setSeedDataStartTime(Instant.parse("2010-05-20T16:00:00.00Z"))
    .setSeedDataEndTime(Instant.parse("2010-05-20T18:00:00.00Z"))
    .setSimulationStartTime(Instant.now())
    .setOperationalTimePeriod(Duration.ofHours(1080))
    .setCalibUpdateFrequency(Duration.ofHours(96))
    .build();

  private BridgedDataSourceSimulatorController simulatorController;

  @Mock
  private BridgedDataSourceDataSimulator simulator1;
  @Mock
  private BridgedDataSourceDataSimulator simulator2;
  @Mock
  private BridgedDataSourceStationSimulator simulator3;

  private List<BridgedDataSourceDataSimulator> dataSimulators;

  private StationDefinitionDatabaseConnectorFactory seedDataJpaRepositoryFactory;
  @Mock
  private StationDefinitionDatabaseConnectorFactory simulationDataJpaRepositoryFactory;


  @BeforeEach
  void testSetup() {
    dataSimulators = List.of(simulator1, simulator2, simulator3);
    simulatorController = BridgedDataSourceSimulatorController.create(dataSimulators);

  }

  @ParameterizedTest
  @MethodSource("constructorValidationCases")
  void testConstructorValidation(List<BridgedDataSourceDataSimulator> dataSimulators,
    Class<? extends Exception> expectedError) {
    assertThrows(expectedError, () -> BridgedDataSourceSimulatorController.create(dataSimulators));
  }

  private static Stream<Arguments> constructorValidationCases() {
    List<BridgedDataSourceDataSimulator> nullSimulatorList = null;
    List<BridgedDataSourceDataSimulator> emptySimulatorList = List.of();
    BridgedDataSourceDataSimulator nullSimulator = null;
    final ArrayList<BridgedDataSourceDataSimulator> bridgedDataSourceDataSimulators = new ArrayList<>();
    bridgedDataSourceDataSimulators.add(nullSimulator);

    return Stream.of(
      Arguments.arguments(nullSimulatorList, NullPointerException.class),
      Arguments.arguments(emptySimulatorList, IllegalArgumentException.class),
      Arguments.arguments(bridgedDataSourceDataSimulators, IllegalArgumentException.class)
    );
  }

  @Test
  void testInitialize() {
    assertDoesNotThrow(this::runValidInitialize);

    dataSimulators.forEach(s -> {
      verify(s, times(1)).initialize(bridgedDataSourceSimulatorSpec);
      verifyNoMoreInteractions(s);
    });
  }

  @Test
  void testStart_error() {
    final Exception error = assertThrows(IllegalArgumentException.class,
      () -> simulatorController.start(PLACEHOLDER));

    assertEquals(CURRENT_STATE_IS_UNINITIALIZED_ERROR, error.getMessage());
  }

  @Test
  void testStop_error() {
    final Exception error = assertThrows(IllegalArgumentException.class,
      () -> simulatorController.stop(PLACEHOLDER));

    assertEquals(CURRENT_STATE_IS_UNINITIALIZED_ERROR, error.getMessage());
  }

  @Test
  void testCleanup_error() {
    final Exception error = assertThrows(IllegalArgumentException.class,
      () -> simulatorController.cleanup(PLACEHOLDER));

    assertEquals(CURRENT_STATE_IS_UNINITIALIZED_ERROR, error.getMessage());
  }

  @Test
  void testInitialize_thenInitialize_error() {
    runValidInitialize();

    final Exception error = assertThrows(IllegalArgumentException.class, this::runValidInitialize);

    assertEquals(CURRENT_STATE_IS_INITIALIZED_ERROR, error.getMessage());
  }

  @Test
  void testInitialize_thenCleanup_error() {
    runValidInitialize();

    assertDoesNotThrow(() -> simulatorController.cleanup(PLACEHOLDER));
  }

  @Test
  void testInitialize_thenStart() {
    assertDoesNotThrow(this::runValidStart);

    dataSimulators.forEach(s -> {
      verify(s, times(1)).initialize(bridgedDataSourceSimulatorSpec);
      verify(s, times(1)).start(PLACEHOLDER);
      verifyNoMoreInteractions(s);
    });
  }

  @Test
  void testInitialize_thenStart_thenStart_error() {
    runValidStart();

    final Exception error = assertThrows(IllegalArgumentException.class,
      () -> simulatorController.start(PLACEHOLDER));

    assertEquals(CURRENT_STATE_IS_STARTED_ERROR, error.getMessage());
  }

  @Test
  void testInitialize_thenStart_thenInitialize_error() {
    runValidStart();

    final Exception error = assertThrows(IllegalArgumentException.class,
      this::runValidInitialize);

    assertEquals(CURRENT_STATE_IS_STARTED_ERROR, error.getMessage());
  }

  @Test
  void testInitialize_thenStart_thenCleanup_error() {
    runValidStart();

    final Exception error = assertThrows(IllegalArgumentException.class,
      () -> simulatorController.cleanup(PLACEHOLDER));

    assertEquals(CURRENT_STATE_IS_STARTED_ERROR, error.getMessage());
  }

  @Test
  void testInitialize_thenStart_thenStop() {
    assertDoesNotThrow(this::runValidStop);

    dataSimulators.forEach(s -> {
      verify(s, times(1)).initialize(bridgedDataSourceSimulatorSpec);
      verify(s, times(1)).start(PLACEHOLDER);
      verify(s, times(1)).stop(PLACEHOLDER);
      verifyNoMoreInteractions(s);
    });
  }

  @Test
  void testInitialize_thenStart_thenStop_thenStart() {
    assertDoesNotThrow(this::runValidRestart);

    dataSimulators.forEach(s -> {
      verify(s, times(1)).initialize(bridgedDataSourceSimulatorSpec);
      verify(s, times(2)).start(PLACEHOLDER);
      verify(s, times(1)).stop(PLACEHOLDER);
      verifyNoMoreInteractions(s);
    });
  }

  @Test
  void testInitialize_thenStart_thenStop_thenStart_thenStop() {
    runValidRestart();

    assertDoesNotThrow(() -> simulatorController.stop(PLACEHOLDER));
  }

  @Test
  void testInitialize_thenStart_thenStop_thenStop_error() {
    runValidStop();

    final Exception error = assertThrows(IllegalArgumentException.class,
      () -> simulatorController.stop(PLACEHOLDER));

    assertEquals(CURRENT_STATE_IS_STOPPED_ERROR, error.getMessage());
  }

  @Test
  void testInitialize_thenStart_thenStop_thenInitialize_error() {
    runValidStop();

    final Exception error = assertThrows(IllegalArgumentException.class, this::runValidInitialize);

    assertEquals(CURRENT_STATE_IS_STOPPED_ERROR, error.getMessage());
  }

  @Test
  void testInitialize_thenStart_thenStop_thenCleanup() {
    assertDoesNotThrow(this::runValidCleanup);

    dataSimulators.forEach(s -> {
      verify(s, times(1)).initialize(bridgedDataSourceSimulatorSpec);
      verify(s, times(1)).start(PLACEHOLDER);
      verify(s, times(1)).stop(PLACEHOLDER);
      verify(s, times(1)).cleanup(PLACEHOLDER);
      verifyNoMoreInteractions(s);
    });
  }

  @Test
  void testInitialize_thenStart_thenStop_thenCleanup_thenInitialize() {
    runValidCleanup();

    assertDoesNotThrow(this::runValidInitialize);

    dataSimulators.forEach(s -> {
      verify(s, times(2)).initialize(bridgedDataSourceSimulatorSpec);
      verify(s, times(1)).start(PLACEHOLDER);
      verify(s, times(1)).stop(PLACEHOLDER);
      verify(s, times(1)).cleanup(PLACEHOLDER);
      verifyNoMoreInteractions(s);
    });
  }

  @Test
  void testInitialize_thenStart_thenStop_thenCleanup_thenStart_error() {
    runValidCleanup();

    final Exception error = assertThrows(IllegalArgumentException.class,
      () -> simulatorController.start(PLACEHOLDER));

    assertEquals(CURRENT_STATE_IS_UNINITIALIZED_ERROR, error.getMessage());
  }

  @Test
  void testInitialize_thenStart_thenStop_thenCleanup_thenStop_error() {
    runValidCleanup();

    final Exception error = assertThrows(IllegalArgumentException.class,
      () -> simulatorController.stop(PLACEHOLDER));

    assertEquals(CURRENT_STATE_IS_UNINITIALIZED_ERROR, error.getMessage());
  }

  @Test
  void testInitialize_thenStart_thenStop_thenCleanup_thenCleanup_error() {
    runValidCleanup();

    final Exception error = assertThrows(IllegalArgumentException.class,
      () -> simulatorController.cleanup(PLACEHOLDER));

    assertEquals(CURRENT_STATE_IS_UNINITIALIZED_ERROR, error.getMessage());
  }

  @Test
  void testGetStatus() {
    final BridgedDataSourceSimulatorStatus result = simulatorController.status(PLACEHOLDER);

    assertEquals(BridgedDataSourceSimulatorStatus.UNINITIALIZED, result);
  }

  @Test
  void testInitialize_thenGetStatus() {
    runValidInitialize();

    final BridgedDataSourceSimulatorStatus result = simulatorController.status(PLACEHOLDER);

    assertEquals(BridgedDataSourceSimulatorStatus.INITIALIZED, result);
  }

  @Test
  void testInitialize_thenStart_thenGetStatus() {
    runValidStart();

    final BridgedDataSourceSimulatorStatus result = simulatorController.status(PLACEHOLDER);

    assertEquals(BridgedDataSourceSimulatorStatus.STARTED, result);
  }

  @Test
  void testInitialize_thenStart_thenStop_thenGetStatus() {
    runValidStop();

    final BridgedDataSourceSimulatorStatus result = simulatorController.status(PLACEHOLDER);

    assertEquals(BridgedDataSourceSimulatorStatus.STOPPED, result);
  }

  @Test
  void testInitialize_thenStart_thenStop_thenCleanup_thenGetStatus() {
    runValidCleanup();

    final BridgedDataSourceSimulatorStatus result = simulatorController.status(PLACEHOLDER);

    assertEquals(BridgedDataSourceSimulatorStatus.UNINITIALIZED, result);
  }

  @Test
  void testInitialize_thenStoreNewChannelVersions() {
    runValidInitialize();

    List<SiteChan> siteChans = getSiteChanList();
    assertDoesNotThrow(() -> simulatorController.storeNewChannelVersions(siteChans));
  }

  @Test
  void testInitialize_thenStart_thenStoreNewChannelVersions() {
    runValidStart();

    List<SiteChan> siteChans = getSiteChanList();
    assertDoesNotThrow(() -> simulatorController.storeNewChannelVersions(siteChans));
  }

  @Test
  void testInitialize_thenStart_thenStop_thenStoreNewChannelVersions() {
    runValidStop();

    List<SiteChan> siteChans = getSiteChanList();
    assertDoesNotThrow(() -> simulatorController.storeNewChannelVersions(siteChans));
  }

  @Test
  void testInitialize_thenStart_thenStop_thenCleanup_thenStoreNewChannelVersionsError() {
    runValidCleanup();

    List<SiteChan> siteChans = getSiteChanList();
    assertThrows(IllegalArgumentException.class,
      () -> simulatorController.storeNewChannelVersions(siteChans));
  }

  @Test
  void testStoreNewSiteChannelVersionsUninitializedError() {

    List<SiteChan> siteChans = getSiteChanList();
    assertThrows(IllegalArgumentException.class,
      () -> simulatorController.storeNewChannelVersions(siteChans));
  }

  @Test
  void testInitialize_thenStoreNewSiteVersions() {
    runValidInitialize();

    List<Site> sites = getSiteList();
    assertDoesNotThrow(() -> simulatorController.storeNewSiteVersions(sites));
  }

  @Test
  void testInitialize_thenStart_thenStoreNewSiteVersions() {
    runValidStart();

    List<Site> sites = getSiteList();
    assertDoesNotThrow(() -> simulatorController.storeNewSiteVersions(sites));
  }

  @Test
  void testInitialize_thenStart_thenStop_thenStoreNewSiteVersions() {
    runValidStop();

    List<Site> sites = getSiteList();
    assertDoesNotThrow(() -> simulatorController.storeNewSiteVersions(sites));
  }

  @Test
  void testInitialize_thenStart_thenStop_thenCleanup_thenStoreNewSiteVersionsError() {
    runValidCleanup();

    List<Site> sites = getSiteList();
    assertThrows(IllegalArgumentException.class,
      () -> simulatorController.storeNewSiteVersions(sites));
  }

  @Test
  void testStoreNewSiteVersionsUninitializedError() {

    List<Site> sites = getSiteList();
    assertThrows(IllegalArgumentException.class,
      () -> simulatorController.storeNewSiteVersions(sites));
  }

  private void runValidInitialize() {
    simulatorController.initialize(bridgedDataSourceSimulatorSpec);
  }

  private void runValidStart() {
    runValidInitialize();
    simulatorController.start(PLACEHOLDER);
  }

  private void runValidStop() {
    runValidStart();
    simulatorController.stop(PLACEHOLDER);
  }

  private void runValidRestart() {
    runValidStop();
    simulatorController.start(PLACEHOLDER);
  }

  private void runValidCleanup() {
    runValidStop();
    simulatorController.cleanup(PLACEHOLDER);
  }

  private static List<SiteChan> getSiteChanList() {

    return List.of(SiteChan.builder()
      .setStationCode("STA1")
      .setChannelCode("CHAN1")
      .setOnDate(Instant.now())
      .setOffDate(Instant.now())
      .setChannelType(ChannelType.N)
      .setChannelDescription("STRING")
      .setEmplacementDepth(1)
      .setHorizontalAngle(2)
      .setVerticalAngle(3)
      .setLoadDate(Instant.now())
      .build());
  }

  private static List<Site> getSiteList(){
    return List.of(Site.builder()
      .setStationCode("WAH")
      .setOnDate(Instant.now())
      .setOffDate(Instant.now())
      .setLatitude(1)
      .setLongitude(2)
      .setElevation(3)
      .setStationName("WOH")
      .setStationType(StaType.SINGLE_STATION)
      .setDegreesNorth(4)
      .setDegreesEast(5)
      .setReferenceStation("REF")
      .setLoadDate(Instant.now()).build());
  }

}