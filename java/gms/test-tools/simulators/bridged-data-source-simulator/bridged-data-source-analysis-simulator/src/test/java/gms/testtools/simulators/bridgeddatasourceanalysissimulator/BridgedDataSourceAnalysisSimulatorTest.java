package gms.testtools.simulators.bridgeddatasourceanalysissimulator;

import com.google.common.base.Functions;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.database.connector.ArrivalDatabaseConnector;
import gms.shared.stationdefinition.dao.css.BeamDao;
import gms.shared.stationdefinition.dao.css.StationChannelTimeKey;
import gms.shared.stationdefinition.dao.css.WfTagDao;
import gms.shared.stationdefinition.dao.css.WfTagKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.database.connector.BeamDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WftagDatabaseConnector;
import gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures;
import gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.BridgedDataSourceSimulatorSpec;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceRepository;
import org.apache.commons.lang3.Validate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BridgedDataSourceAnalysisSimulatorTest {

  public static final String PLACEHOLDER = "placeholder";
  @Mock
  private BridgedDataSourceRepository bridgedDataSourceRepositoryJpa;
  @Mock
  private ArrivalDatabaseConnector arrivalDatabaseConnectorInstance;
  @Mock
  private WfdiscDatabaseConnector wfdiscDatabaseConnectorInstance;
  @Mock
  private WftagDatabaseConnector wftagDatabaseConnector;
  @Mock
  private BeamDatabaseConnector beamDatabaseConnector;
  @Mock
  private BridgedDataSourceSimulatorSpec simulatorSpec;
  @Captor
  private ArgumentCaptor<List<Object>> recordCaptor;
  private BridgedDataSourceAnalysisSimulator analysisSimulator;
  private static final int CALIB_DELTA = 4;
  private static final Instant currentTime = Instant.now();

  WfdiscDao wfdiscDao1 = new WfdiscDao(CSSDaoTestFixtures.WFDISC_DAO_1);
  WfdiscDao wfdiscDao2 = new WfdiscDao(CSSDaoTestFixtures.WFDISC_DAO_2);
  WfdiscDao wfdiscDao3 = new WfdiscDao(CSSDaoTestFixtures.WFDISC_DAO_3);
  WfdiscDao wfdiscDao4 = new WfdiscDao(CSSDaoTestFixtures.WFDISC_DAO_4);
  WfdiscDao wfdiscDao5 = new WfdiscDao(CSSDaoTestFixtures.WFDISC_DAO_5);
  WfdiscDao wfdiscDao6 = new WfdiscDao(CSSDaoTestFixtures.WFDISC_TEST_DAO_1);
  WfdiscDao wfdiscDao7 = new WfdiscDao(CSSDaoTestFixtures.WFDISC_TEST_DAO_2);
  WfdiscDao wfdiscDao8 = new WfdiscDao(CSSDaoTestFixtures.WFDISC_TEST_DAO_3);
  WfdiscDao wfdiscDao9 = new WfdiscDao(CSSDaoTestFixtures.WFDISC_TEST_DAO_4);
  ArrivalDao arrivalDao1 = new ArrivalDao(CSSDaoTestFixtures.ARRIVAL_DAO_1);
  ArrivalDao arrivalDao2 = new ArrivalDao(CSSDaoTestFixtures.ARRIVAL_DAO_2);
  ArrivalDao arrivalDao3 = new ArrivalDao(CSSDaoTestFixtures.ARRIVAL_DAO_3);

  final List<WfdiscDao> wfdiscDaoList = List.of(wfdiscDao1, wfdiscDao2, wfdiscDao3, wfdiscDao4, wfdiscDao5,
    wfdiscDao6, wfdiscDao7, wfdiscDao8, wfdiscDao9);

  @BeforeEach
  public void testSetup() {
    analysisSimulator = BridgedDataSourceAnalysisSimulator.create(
      arrivalDatabaseConnectorInstance,
      wfdiscDatabaseConnectorInstance,
      wftagDatabaseConnector,
      beamDatabaseConnector,
      bridgedDataSourceRepositoryJpa, CALIB_DELTA);
  }

  @ParameterizedTest
  @MethodSource("constructorValidationCases")
  void testConstructorValidation(
    Class<? extends Exception> expectedError,
    Supplier<ArrivalDatabaseConnector> arrivalRepositorySupplier,
    Supplier<WfdiscDatabaseConnector> wfdiscRepositorySupplier,
    Supplier<WftagDatabaseConnector> wftagRepositorySupplier,
    Supplier<BridgedDataSourceRepository> bridgedDataSourceRepositorySupplier, int calibDeltaValue) {
    ArrivalDatabaseConnector arrivalRepositoryJpa = arrivalRepositorySupplier.get();
    WfdiscDatabaseConnector wfdiscRepositoryJpa = wfdiscRepositorySupplier.get();
    WftagDatabaseConnector wftagRepositoryJpa = wftagRepositorySupplier.get();
    BridgedDataSourceRepository bridgedDataSourceRepository = bridgedDataSourceRepositorySupplier
      .get();
    assertThrows(expectedError,
      () -> BridgedDataSourceAnalysisSimulator.create(
        arrivalRepositoryJpa,
        wfdiscRepositoryJpa,
        wftagDatabaseConnector,
        beamDatabaseConnector,
        bridgedDataSourceRepository, calibDeltaValue));
  }

  private static Stream<Arguments> constructorValidationCases() {
    return Stream.of(
      Arguments.arguments(NullPointerException.class,
        getMockSupplier(ArrivalDatabaseConnector.class),
        getNullSupplier(WfdiscDatabaseConnector.class),
        getMockSupplier(WftagDatabaseConnector.class),
        getMockSupplier(BridgedDataSourceRepository.class),
        CALIB_DELTA
      ),
      Arguments.arguments(NullPointerException.class,
        getMockSupplier(ArrivalDatabaseConnector.class),
        getMockSupplier(WfdiscDatabaseConnector.class),
        getMockSupplier(WftagDatabaseConnector.class),
        getNullSupplier(BridgedDataSourceRepository.class),
        CALIB_DELTA
      ),
      Arguments.arguments(IllegalStateException.class,
        getMockSupplier(ArrivalDatabaseConnector.class),
        getMockSupplier(WfdiscDatabaseConnector.class),
        getMockSupplier(WftagDatabaseConnector.class),
        getMockSupplier(BridgedDataSourceRepository.class),
        0
      )
    );
  }

  private static <T> Supplier<T> getMockSupplier(Class<T> cls) {
    return () -> mock(cls);
  }

  private static <T> Supplier<T> getNullSupplier(Class<T> cls) {
    Validate.notNull(cls);
    return () -> null;
  }

  @Test
  void testInitializeForward() {
    final Duration lengthOfSimulation = Duration.ofHours(10);
    final Duration operationalTimePeriod = Duration.ofDays(5);
    final Duration calibUpdateFrequency = Duration.ofHours(12);
    final Instant seedDataStartTime = CssDaoAndCoiParameters.ONDATE;
    final Instant simulationStartTime = currentTime.minus(lengthOfSimulation);
    final Instant simulationEndTime = simulationStartTime.plus(lengthOfSimulation);
    final Instant endTime1 = CSSDaoTestFixtures.WFDISC_DAO_1.getTime()
      .plus(Duration.ofHours(1));
    final Instant endTime2 = CSSDaoTestFixtures.WFDISC_DAO_1.getTime()
      .plus(Duration.ofHours(2));
    final Instant endTime3 = CSSDaoTestFixtures.WFDISC_DAO_1.getTime()
      .plus(Duration.ofHours(3));
    final Instant endTime4 = wfdiscDao2.getTime()
      .plus(Duration.ofHours(5));
    final Instant endTime5 = wfdiscDao3.getTime()
      .plus(Duration.ofHours(5));
    final Duration seedDataDuration = Duration.between(seedDataStartTime, endTime5);

    wfdiscDao1.setEndTime(endTime1);
    wfdiscDao2.setEndTime(endTime2);
    wfdiscDao3.setEndTime(endTime3);
    wfdiscDao4.setEndTime(endTime4);
    wfdiscDao5.setEndTime(endTime5);
    wfdiscDao6.setEndTime(endTime4);
    wfdiscDao7.setEndTime(endTime3);
    wfdiscDao8.setEndTime(endTime2);
    wfdiscDao9.setEndTime(endTime1);
    List<ArrivalDao> arrivalDaos = new ArrayList<>();
    List<WfTagDao> wfTagDaos = new ArrayList<>();
    List<BeamDao> beamDaos = new ArrayList<>();
    CSSDaoTestFixtures.addArrivalWftagAndBeamDaos(wfdiscDaoList, arrivalDaos, wfTagDaos, beamDaos);


    when(simulatorSpec.getSeedDataStartTime()).thenReturn(seedDataStartTime);
    // return endTime5 because it is the latest end time in wfdisc list
    when(simulatorSpec.getSeedDataEndTime()).thenReturn(endTime5);
    when(simulatorSpec.getSimulationStartTime()).thenReturn(simulationStartTime);
    when(simulatorSpec.getOperationalTimePeriod()).thenReturn(operationalTimePeriod);
    when(simulatorSpec.getCalibUpdateFrequency()).thenReturn(calibUpdateFrequency);
    when(wfdiscDatabaseConnectorInstance.findWfdiscsByTimeRange(any(), any()))
      .thenReturn(wfdiscDaoList);
    when(arrivalDatabaseConnectorInstance.findArrivalsByTimeRange(any(), any()))
      .thenReturn(arrivalDaos);
    when(wftagDatabaseConnector.findWftagsByTagIds(any()))
      .thenReturn(wfTagDaos);
    when(beamDatabaseConnector.findBeamsByWfid(any()))
      .thenReturn(beamDaos);

    assertDoesNotThrow(() -> analysisSimulator.initialize(simulatorSpec));
    Instant testCurrentTime = Instant.now();

    verify(wfdiscDatabaseConnectorInstance, times(1))
      .findWfdiscsByTimeRange(simulatorSpec.getSeedDataStartTime(),
        simulatorSpec.getSeedDataEndTime());
    verify(arrivalDatabaseConnectorInstance, times(1))
      .findArrivalsByTimeRange(simulatorSpec.getSeedDataStartTime(),
        simulatorSpec.getSeedDataEndTime());
    verify(wftagDatabaseConnector, times(1))
      .findWftagsByTagIds(any());
    verify(bridgedDataSourceRepositoryJpa, times(4)).store(recordCaptor.capture());

    List<List<Object>> listStoredValues = recordCaptor.getAllValues();
    final List<WfdiscDao> storedWfdiscs = getListOfValuesOfClass(listStoredValues, WfdiscDao.class, 1);
    final List<ArrivalDao> storedArrivals = getListOfValuesOfClass(listStoredValues, ArrivalDao.class, 1);
    final List<WfTagDao> storedWftags = getListOfValuesOfClass(listStoredValues, WfTagDao.class, 1);

    int expectedSize = getBackwardDataCount(operationalTimePeriod, seedDataDuration, wfdiscDaoList) +
      getForwardDataCount(seedDataDuration, testCurrentTime,simulationStartTime, wfdiscDaoList);

    assertEquals(expectedSize, storedWfdiscs.size());
    assertEquals(27, storedArrivals.size());
    assertEquals(27, storedWftags.size());
    assertEquals(simulationEndTime, storedWfdiscs.get(storedWfdiscs.size() - wfdiscDaoList.size()).getTime());
    assertTrue(storedWfdiscs.stream().max(Comparator.comparing(WfdiscDao::getEndTime)).orElseThrow().getEndTime().isAfter(simulationEndTime));

    verifyNoMoreInteractions(
      wfdiscDatabaseConnectorInstance,
      bridgedDataSourceRepositoryJpa);
  }

  @Test
  void testInitializeBackward() {
    final Duration lengthOfSimulation = Duration.ofHours(10);
    final Duration operationalTimePeriod = Duration.ofDays(5);
    final Duration calibUpdateFrequency = Duration.ofHours(24);
    final Instant seedDataStartTime = CssDaoAndCoiParameters.ONDATE;
    final Instant simulationEndTime = currentTime;
    final Instant simulationStartTime = simulationEndTime.minus(lengthOfSimulation);
    final Instant endTime1 = wfdiscDao1.getTime()
      .plus(Duration.ofHours(3));
    final Instant endTime2 = wfdiscDao2.getTime()
      .plus(Duration.ofHours(3));
    final Instant endTime3 = wfdiscDao3.getTime()
      .plus(Duration.ofHours(3));
    final Instant endTime4 = wfdiscDao4.getTime()
      .plus(Duration.ofHours(3));
    final Instant endTime5 = wfdiscDao5.getTime()
      .plus(Duration.ofHours(3));
    wfdiscDao1.setEndTime(endTime1);
    wfdiscDao2.setEndTime(endTime2);
    wfdiscDao3.setEndTime(endTime3);
    wfdiscDao4.setEndTime(endTime4);
    wfdiscDao5.setEndTime(endTime5);
    wfdiscDao6.setEndTime(endTime5.plus(Duration.ofHours(1)));
    wfdiscDao7.setEndTime(endTime5.plus(Duration.ofHours(2)));
    wfdiscDao8.setEndTime(endTime5.plus(Duration.ofHours(3)));
    wfdiscDao9.setEndTime(endTime5.plus(Duration.ofHours(4)));
    wfdiscDao1.setStationCode("TST1");
    wfdiscDao2.setStationCode("TST2");
    wfdiscDao3.setStationCode("TST3");
    wfdiscDao4.setStationCode("TST4");
    wfdiscDao5.setStationCode("TST5");
    wfdiscDao6.setStationCode("TST6");
    wfdiscDao7.setStationCode("TST7");
    wfdiscDao8.setStationCode("TST8");
    wfdiscDao9.setStationCode("TST9");

    wfdiscDao6.setId(21L);
    wfdiscDao7.setId(20L);
    wfdiscDao8.setId(18L);
    wfdiscDao9.setId(26L);
    List<ArrivalDao> arrivalDaos = List.of(arrivalDao1, arrivalDao2, arrivalDao3);

    when(simulatorSpec.getSeedDataStartTime()).thenReturn(seedDataStartTime);
    // TODO jgl 2021-04-29 return wfdiscDao9 endTime because it is the latest end time in wfdisc list
    //  and simulation data generation is predicated upon the seed data length
    when(simulatorSpec.getSeedDataEndTime()).thenReturn(endTime3);
    when(simulatorSpec.getSimulationStartTime()).thenReturn(simulationStartTime);
    when(simulatorSpec.getOperationalTimePeriod()).thenReturn(operationalTimePeriod);
    when(simulatorSpec.getCalibUpdateFrequency()).thenReturn(calibUpdateFrequency);
    when(wfdiscDatabaseConnectorInstance.findWfdiscsByTimeRange(any(), any()))
      .thenReturn(wfdiscDaoList);
    when(arrivalDatabaseConnectorInstance.findArrivalsByTimeRange(any(), any()))
      .thenReturn(arrivalDaos);

    assertDoesNotThrow(() -> analysisSimulator.initialize(simulatorSpec));
    verify(bridgedDataSourceRepositoryJpa, times(4)).store(recordCaptor.capture());

    final List<WfdiscDao> storedWfdiscs = getListOfValuesOfClass(recordCaptor.getAllValues(), WfdiscDao.class, 1);

    //At the beginning of the test, all wfdisc records had same calib... not now.
    assertNotEquals(storedWfdiscs.stream().max(Comparator.comparing(WfdiscDao::getCalib)).orElseThrow().getCalib(),
      storedWfdiscs.stream().min(Comparator.comparing(WfdiscDao::getCalib)).orElseThrow().getCalib());
    assertTrue(storedWfdiscs.stream().max(Comparator.comparing(WfdiscDao::getEndTime)).orElseThrow().getEndTime().isAfter(simulationEndTime));
    assertNotEquals(storedWfdiscs.stream().max(Comparator.comparing(WfdiscDao::getCalib)).orElseThrow().getCalib(),
      storedWfdiscs.stream().min(Comparator.comparing(WfdiscDao::getCalib)).orElseThrow().getCalib());

    //Show that the Wfdiscs calib is updating on intervals

    int i = 1;
    for (WfdiscDao wfdiscCalib : wfdiscDaoList) {
      assertTrue(correctlyUpdating(findCalibUpdateTimes(storedWfdiscs, wfdiscCalib), calibUpdateFrequency), "Failed due to wfDisc " + i);
      i += 1;
    }

  }

  private List<Instant> findCalibUpdateTimes(List<WfdiscDao> storedWfdiscs, WfdiscDao wfdiscDaoCompare) {
    List<Double> calibValues = new ArrayList<>();
    List<Instant> startTimes = new ArrayList<>();
    for (WfdiscDao wfdisc : storedWfdiscs) {
      if (wfdiscDaoCompare.getStationCode().equals(wfdisc.getStationCode())
        && wfdiscDaoCompare.getChannelCode().equals(wfdisc.getChannelCode())
        && !calibValues.contains(wfdisc.getCalib())) {

        calibValues.add(wfdisc.getCalib());
        startTimes.add(wfdisc.getTime());
      }
    }

    return startTimes;
  }

  //this checks that updates are occuring at correct intervals,
  // only works for updateFrequency that is evenly divisible by seed data length
  private boolean correctlyUpdating(List<Instant> updateTimes, Duration updateFrequency) {

    //the first update time is determined by how we space the updates between channels apart from each other
    //the last is the updatefor the forward data
    if (updateTimes.size() < 4) {
      fail("Must have four update times to determine if spacing is correct.");
    }

    for (int i = 1; i < updateTimes.size() - 2; i++) {
      if (!Duration.between(updateTimes.get(i), updateTimes.get(i + 1)).equals(updateFrequency)) {
        return false;
      }
    }

    return true;
  }

  private int getForwardDataCount(Duration seedDataDuration, Instant currentTime, Instant simulationStartTime,
    List<WfdiscDao> seedData) {

    return (int) Math.ceil(Duration.between(simulationStartTime, currentTime).toNanos() / (double) seedDataDuration.toNanos())
      * seedData.size();
  }

  private int getBackwardDataCount(Duration operationalTimePeriod, Duration seedDataDuration,
    List<WfdiscDao> seedData) {
    return (int) Math.ceil(operationalTimePeriod.toNanos() / (double) seedDataDuration.toNanos()) * seedData.size();
  }

  @Test
  void testStartandStop() throws InterruptedException {
    final Duration operationalTimePeriod = Duration.ofMinutes(2);
    final Duration calibUpdateFrequency = Duration.ofMinutes(30);
    final Instant seedDataStartTime = CssDaoAndCoiParameters.ONDATE;

    final Instant endTime1 = seedDataStartTime.plusSeconds(1);
    final Instant endTime2 = seedDataStartTime.plusSeconds(2);

    final CountDownLatch countDownLatch = new CountDownLatch(1);

    WfdiscDao wfdisc1 = new WfdiscDao(wfdiscDao1);
    WfdiscDao wfdisc2 = new WfdiscDao(wfdiscDao2);
    WfdiscDao wfdisc3 = new WfdiscDao(wfdiscDao3);
    WfdiscDao wfdisc4 = new WfdiscDao(wfdiscDao3);

    wfdisc1.setjDate(seedDataStartTime);
    wfdisc1.setEndTime(endTime1);
    wfdisc2.setjDate(seedDataStartTime);
    wfdisc2.setEndTime(endTime1);
    wfdisc3.setjDate(seedDataStartTime);
    wfdisc3.setEndTime(endTime2);
    wfdisc4.setjDate(seedDataStartTime);
    wfdisc4.setEndTime(endTime2);

    List<WfdiscDao> wfdiscDaos = List.of(wfdisc1, wfdisc2, wfdisc3);
    List<ArrivalDao> arrivalDaos = new ArrayList<>();
    List<WfTagDao> wfTagDaos = new ArrayList<>();
    List<BeamDao> beamDaos = new ArrayList<>();
    CSSDaoTestFixtures.addArrivalWftagAndBeamDaos(wfdiscDaos, arrivalDaos, wfTagDaos, beamDaos);
    wfdiscDaos = List.of(wfdisc1, wfdisc2, wfdisc3, wfdisc4);

    final Duration seedDataDuration = Duration.between(seedDataStartTime, endTime2);

    when(simulatorSpec.getSeedDataStartTime()).thenReturn(seedDataStartTime);
    // return endTime3 because it is the latest end time in wfdisc list
    when(simulatorSpec.getSeedDataEndTime()).thenReturn(endTime2);
    final Instant currentTime = Instant.now();
    when(simulatorSpec.getSimulationStartTime()).thenReturn(currentTime);
    when(simulatorSpec.getOperationalTimePeriod()).thenReturn(operationalTimePeriod);
    when(simulatorSpec.getCalibUpdateFrequency()).thenReturn(calibUpdateFrequency);

    when(wfdiscDatabaseConnectorInstance.findWfdiscsByTimeRange(any(), any()))
      .thenReturn(wfdiscDaos);
    when(arrivalDatabaseConnectorInstance.findArrivalsByTimeRange(any(), any()))
      .thenReturn(arrivalDaos);
    when(wftagDatabaseConnector.findWftagsByTagIds(any()))
      .thenReturn(wfTagDaos);
    when(beamDatabaseConnector.findBeamsByWfid(any()))
      .thenReturn(beamDaos);

    assertDoesNotThrow(() -> analysisSimulator.initialize(simulatorSpec));
    assertDoesNotThrow(() -> analysisSimulator.start(PLACEHOLDER));
    boolean awaitCountDown = countDownLatch.await(2 * seedDataDuration.toSeconds(), TimeUnit.SECONDS);

    //should time out causing awaitCountDown to be false
    if (awaitCountDown) {
      fail();
    }

    verify(bridgedDataSourceRepositoryJpa, times(8)).store(recordCaptor.capture());
    final List<List<Object>> storedValues = recordCaptor.getAllValues();
    List<WfdiscDao> storedWfdiscs = getListOfValuesOfClass(storedValues, WfdiscDao.class, 2);
    List<ArrivalDao> storedArrivals = getListOfValuesOfClass(storedValues, ArrivalDao.class, 2);
    List<WfTagDao> storedWftags = getListOfValuesOfClass(storedValues, WfTagDao.class, 2);
    List<BeamDao> storedBeamDaos = getListOfValuesOfClass(storedValues, BeamDao.class, 2);

    assertNotNull(storedWfdiscs);
    assertNotNull(storedArrivals);
    assertNotNull(storedWftags);
    assertNotNull(storedBeamDaos);

    assertEquals(wfdiscDaos.size(), storedWfdiscs.size());
    assertEquals(arrivalDaos.size(), storedArrivals.size());
    assertEquals(wfTagDaos.size(), storedWftags.size());
    assertEquals(beamDaos.size(), storedBeamDaos.size());

    assertTrue(correctWfdisc(storedWfdiscs, storedArrivals, storedWftags));

    assertTrue(storedWfdiscs.get(0).getTime().isAfter(currentTime), "Start time of regularly loaded wfdisc must be after simulation start time");
    assertTrue(storedWfdiscs.get(0).getEndTime().isBefore(Instant.now()), "End time of regularly loaded wfdisc must be before current time.");

    assertDoesNotThrow(() -> analysisSimulator.stop(PLACEHOLDER));
    verifyNoMoreInteractions(
      wfdiscDatabaseConnectorInstance,
      bridgedDataSourceRepositoryJpa);

    assertDoesNotThrow(() -> analysisSimulator.cleanup(PLACEHOLDER));
    assertDoesNotThrow(() -> analysisSimulator.initialize(simulatorSpec));
    assertDoesNotThrow(() -> analysisSimulator.cleanup(PLACEHOLDER));
  }

  @Test
  void testMissingBeamArrivalAndWftag() throws InterruptedException {
    final Duration operationalTimePeriod = Duration.ofMinutes(2);
    final Duration calibUpdateFrequency = Duration.ofMinutes(30);
    final Instant seedDataStartTime = CssDaoAndCoiParameters.ONDATE;

    final CountDownLatch countDownLatch = new CountDownLatch(1);

    WfdiscDao wfdisc1 = new WfdiscDao(wfdiscDao1);
    WfdiscDao wfdisc2 = new WfdiscDao(wfdiscDao2);
    WfdiscDao wfdisc3 = new WfdiscDao(wfdiscDao3);

    final Instant endTime1 = seedDataStartTime.plusSeconds(1);
    final Instant endTime2 = seedDataStartTime.plusSeconds(2);

    wfdisc1.setjDate(seedDataStartTime);
    wfdisc1.setEndTime(endTime1);
    wfdisc2.setjDate(seedDataStartTime);
    wfdisc2.setEndTime(endTime1);
    wfdisc3.setjDate(seedDataStartTime);
    wfdisc3.setEndTime(endTime2);

    List<WfdiscDao> wfdiscDaos = List.of(wfdisc1, wfdisc2, wfdisc3);
    List<ArrivalDao> arrivalDaos = new ArrayList<>();
    List<WfTagDao> wfTagDaos = new ArrayList<>();
    List<BeamDao> beamDaos = new ArrayList<>();
    CSSDaoTestFixtures.addArrivalWftagAndBeamDaos(wfdiscDaos, arrivalDaos, wfTagDaos, beamDaos);

    long wrongWfid = 314159;
    for (int i = 0; i < wfdiscDaos.size(); i++) {
      wfTagDaos.get(i).getWfTagKey().setWfId(wrongWfid);
      beamDaos.get(i).setWfId(wrongWfid);
    }

    final Duration seedDataDuration = Duration.between(seedDataStartTime, endTime2);

    when(simulatorSpec.getSeedDataStartTime()).thenReturn(seedDataStartTime);
    // return endTime3 because it is the latest end time in wfdisc list
    when(simulatorSpec.getSeedDataEndTime()).thenReturn(endTime2);
    final Instant currentTime = Instant.now();
    when(simulatorSpec.getSimulationStartTime()).thenReturn(currentTime);
    when(simulatorSpec.getOperationalTimePeriod()).thenReturn(operationalTimePeriod);
    when(simulatorSpec.getCalibUpdateFrequency()).thenReturn(calibUpdateFrequency);

    when(wfdiscDatabaseConnectorInstance.findWfdiscsByTimeRange(any(), any()))
      .thenReturn(wfdiscDaos);
    when(arrivalDatabaseConnectorInstance.findArrivalsByTimeRange(any(), any()))
      .thenReturn(arrivalDaos);
    when(wftagDatabaseConnector.findWftagsByTagIds(any()))
      .thenReturn(wfTagDaos);
    when(beamDatabaseConnector.findBeamsByWfid(any()))
      .thenReturn(beamDaos);

    assertDoesNotThrow(() -> analysisSimulator.initialize(simulatorSpec));
    assertDoesNotThrow(() -> analysisSimulator.start(PLACEHOLDER));
    boolean awaitCountDown = countDownLatch.await(2 * seedDataDuration.toSeconds(), TimeUnit.SECONDS);

    //should time out causing awaitCountDown to be false
    if (awaitCountDown) {
      fail();
    }

    verify(bridgedDataSourceRepositoryJpa, times(8)).store(recordCaptor.capture());
    final List<List<Object>> storedValues = recordCaptor.getAllValues();
    List<WfdiscDao> storedWfdiscs = getListOfValuesOfClass(storedValues, WfdiscDao.class, 2);
    List<ArrivalDao> storedArrivals = getListOfValuesOfClass(storedValues, ArrivalDao.class, 2);
    List<WfTagDao> storedWftags = getListOfValuesOfClass(storedValues, WfTagDao.class, 2);
    List<BeamDao> storedBeamDaos = getListOfValuesOfClass(storedValues, BeamDao.class, 2);

    assertNotNull(storedWfdiscs);
    assertNotNull(storedArrivals);
    assertNull(storedWftags);
    assertNull(storedBeamDaos);

    assertEquals(wfdiscDaos.size(), storedWfdiscs.size());
    assertEquals(arrivalDaos.size(), storedArrivals.size());


    assertDoesNotThrow(() -> analysisSimulator.stop(PLACEHOLDER));
    verifyNoMoreInteractions(
      wfdiscDatabaseConnectorInstance,
      bridgedDataSourceRepositoryJpa);
  }

  @Test
  void testCleanupCallsRepositoryToRunCleanup() {
    assertDoesNotThrow(() -> analysisSimulator.cleanup(PLACEHOLDER));

    verify(bridgedDataSourceRepositoryJpa, times(1)).cleanupData();
    verifyNoMoreInteractions(
      wfdiscDatabaseConnectorInstance,
      bridgedDataSourceRepositoryJpa);
  }

  private boolean correctWfdisc(List<WfdiscDao> wfdiscs, List<ArrivalDao> arrivals, List<WfTagDao> wfTags) {
    Map<Long, WfTagDao> aridWftagMap = wfTags.stream()
      .collect(Collectors.toMap(
        Functions.compose(WfTagKey::getId, WfTagDao::getWfTagKey),
        Function.identity()));

    Map<Long, WfdiscDao> wfidToWfdiscMap = wfdiscs.stream()
      .collect(Collectors.toMap(
        WfdiscDao::getId,
        Function.identity()));


    for (ArrivalDao arrival : arrivals) {

      WfTagDao correspondingWftag = aridWftagMap.get((long) arrival.getId());
      if (correspondingWftag == null) {
        return false;
      }
      WfdiscDao correspondingWfDisc = wfidToWfdiscMap.get(correspondingWftag.getWfTagKey().getWfId());
      if (correspondingWfDisc == null) {
        return false;
      }

      StationChannelTimeKey arrivalKey = arrival.getArrivalKey();

      if (!arrivalKey.getStationCode().equals(correspondingWfDisc.getStationCode()) || !arrivalKey.getChannelCode().equals(correspondingWfDisc.getChannelCode())) {
        return false;
      }
    }

    return true;
  }

  private <T> List<T> getListOfValuesOfClass(List<List<Object>> listOfObjects, Class<T> clazz, int times) {

    int i = 0;

    for (List<Object> storedList : listOfObjects) {

      if (!storedList.isEmpty() && clazz.isInstance(storedList.get(0))) {
        i++;
        if (times == i) {
          return (List<T>) storedList;
        }
      }
    }

    return null;
  }

}