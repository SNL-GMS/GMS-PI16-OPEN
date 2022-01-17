package gms.testtools.simulators.bridgeddatasourceintervalsimulator;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.google.common.collect.Streams;
import gms.shared.workflow.dao.IntervalDao;
import gms.shared.workflow.repository.IntervalDatabaseConnector;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.BridgedDataSourceSimulatorSpec;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.SourceInterval;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceIntervalRepositoryJpa;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class BridgedDataSourceIntervalSimulatorTest {

  @Mock
  IntervalDatabaseConnector intervalDatabaseConnector;

  @Mock
  BridgedDataSourceIntervalRepositoryJpa bridgedDataSourceIntervalRepositoryJpa;

  @Mock
  private BridgedDataSourceSimulatorSpec simulatorSpec;

  private BridgedDataSourceIntervalSimulator intervalSimulator;

  List<IntervalDao> intervalDaos;

  @BeforeEach
  public void testSetup() {
    intervalSimulator = new BridgedDataSourceIntervalSimulator(
        intervalDatabaseConnector, bridgedDataSourceIntervalRepositoryJpa);

    intervalDaos = List.of(
        IntervalDaoTestFixture.INTERVAL_DAO_NET_NETS1_DONE,
        IntervalDaoTestFixture.INTERVAL_DAO_AUTO_AL1_DONE,
        IntervalDaoTestFixture.INTERVAL_DAO_ARS_AL1_DONE,
        IntervalDaoTestFixture.INTERVAL_DAO_ARS_AL1_ACTIVE,
        IntervalDaoTestFixture.INTERVAL_DAO_ARS_AL1_SKIPPED);
  }

  @Test
  void testInitializeAllForwards() {

    when(simulatorSpec.getSeedDataStartTime())
        .thenReturn(Instant.now().minusSeconds(86400 + 7200));
    when(simulatorSpec.getSeedDataEndTime())
        .thenReturn(Instant.now().minusSeconds(86400 + 3500));
    when(simulatorSpec.getOperationalTimePeriod()).thenReturn(Duration.ofHours(12));

    when(simulatorSpec.getSimulationStartTime()).
        thenReturn(Instant.now().minusSeconds(86400));

    testInitialize();

    verify(intervalDatabaseConnector, times(1))
        .findIntervalsByTimeRange(any(), any());


    /*
    As this has the operational span less than the difference between now and the sim startTime
    instead of the operationalTimePeriod being used it is the difference between now and the
    simStart time which is a day. given that and a seed interval of 2 hours, store should be called 12 times
     */
    verify(bridgedDataSourceIntervalRepositoryJpa, times(12))
        .store(any());

    verifyNoMoreInteractions(intervalDatabaseConnector);


  }

  @Test
  void testInitializeAllSomeBoth() {

    when(simulatorSpec.getSeedDataStartTime())
        .thenReturn(Instant.now().minusSeconds(5 * 86400 + 7200));
    when(simulatorSpec.getSeedDataEndTime())
        .thenReturn(Instant.now().minusSeconds(5 * 86400 + 3500));
    when(simulatorSpec.getOperationalTimePeriod()).thenReturn(Duration.ofDays(10));

    when(simulatorSpec.getSimulationStartTime()).
        thenReturn(Instant.now().minusSeconds(86400 * 5));

    testInitialize();

    verify(intervalDatabaseConnector, times(1))
        .findIntervalsByTimeRange(any(), any());

    /*
    for a 10 day span and a seed interval of 2 hours, store should be called 120 times
     */

    verify(bridgedDataSourceIntervalRepositoryJpa, times(120))
        .store(any());

    verifyNoMoreInteractions(intervalDatabaseConnector);

  }


  void testInitialize() {

    when(intervalDatabaseConnector
        .findIntervalsByTimeRange(any(), any())).thenReturn(intervalDaos);

    assertDoesNotThrow(() -> intervalSimulator.initialize(simulatorSpec));

  }

  @Test
  void testApplyTimeShift() {

    IntervalDao inDao = IntervalDaoTestFixture.INTERVAL_DAO_ARS_AL1_DONE;
    long shift = 100L;
    int passIndex = 20;

    IntervalDao outDao = intervalSimulator.applyTimeShift(inDao, shift, passIndex);

    assertNotEquals(outDao.getIntervalIdentifier(), inDao.getIntervalIdentifier());
    assertEquals(inDao.getType(), outDao.getType());
    assertEquals(inDao.getName(), outDao.getName());
    assertEquals(inDao.getTime() + shift, outDao.getTime());
    assertEquals(inDao.getEndTime() + shift, outDao.getEndTime());
    assertEquals(inDao.getState(), outDao.getState());
    assertEquals(inDao.getAuthor(), outDao.getAuthor());
    assertEquals(inDao.getPercentAvailable(), outDao.getPercentAvailable());
    assertEquals(inDao.getProcessStartDate().plusSeconds(shift), outDao.getProcessStartDate());
    assertEquals(inDao.getProcessEndDate().plusSeconds(shift), outDao.getProcessEndDate());
    assertEquals(
        inDao.getLastModificationDate().plusSeconds(shift), outDao.getLastModificationDate());
    assertEquals(outDao.getLoadDate(), inDao.getLoadDate());
  }

  @Test
  void testBackwardPassShift() {

    final String DONE_STATE = "done";
    Instant seedDataStartTime = Instant.now().minusSeconds(5 * 86400 + 7200);
    Instant seedDataEndTime = Instant.now().minusSeconds(5 * 86400 + 3500);
    Duration seedDuration = Duration.between(seedDataStartTime, seedDataEndTime);
    when(intervalDatabaseConnector.findIntervalsByTimeRange(any(), any())).thenReturn(intervalDaos);

    intervalSimulator.initializeSeedData(seedDataStartTime, seedDataEndTime);

    long initialTimeShift = 100L;
    int passIndex = 50;
    List<IntervalDao> outList = intervalSimulator.backwardPassShift(
        initialTimeShift, passIndex, seedDuration);

    assertEquals(intervalDaos.size(), outList.size());

    List<Integer> comparisons = Streams.zip(intervalDaos.stream(), outList.stream(), (dao1, dao2) -> {
      assertTrue(dao2.getTime() < dao1.getTime());
      assertTrue(dao2.getEndTime() < dao1.getEndTime());
      assertEquals(DONE_STATE, dao2.getState());
      return 1;
    })
    .collect(Collectors.toList());

    assertEquals(outList.size(), comparisons.size());
  }

  @Test
  void storeIntervals() {

    var intervalDao = IntervalDaoTestFixture.INTERVAL_DAO_ARS_AL1_ACTIVE;

    var sourceInterval = SourceInterval.getBuilder()
        .setIntervalIdentifier(intervalDao.getIntervalIdentifier())
        .setPercentAvailable(intervalDao.getPercentAvailable())
        .setType(intervalDao.getClassEndTimeNameTimeKey().getType())
        .setName(intervalDao.getClassEndTimeNameTimeKey().getName())
        .setTime(intervalDao.getClassEndTimeNameTimeKey().getTime())
        .setEndTime(intervalDao.getClassEndTimeNameTimeKey().getEndTime())
        .setLastModificationDate(intervalDao.getLastModificationDate())
        .setLoadDate(intervalDao.getLoadDate())
        .setAuthor(intervalDao.getAuthor())
        .setProcessStartDate(intervalDao.getProcessStartDate())
        .setProcessEndDate(intervalDao.getProcessEndDate())
        .setState(intervalDao.getState())
        .build();

    intervalSimulator.storeIntervals(List.of(sourceInterval));

    verify(bridgedDataSourceIntervalRepositoryJpa, times(1))
        .storeOrUpdate(List.of(intervalDao));
  }

  /**
   * Test with an "uninteresting" seed data set, that is to say, we start at the very first,
   * all mod dates are on the hour.
   */
  @Test
  void testSimulatorFlux() {

    var seedStartTime = Instant.ofEpochSecond(-60*60);
    var seedEndTime = Instant.ofEpochSecond(2 * 60 * 60);

    var clockSecondsRef = new AtomicInteger(20*60*60);

    //
    // This holds the "now" times that will be read at each successive iteration.
    //
    var clockTicks = new ArrayDeque<Integer>();
    clockTicks.add(0);
    clockTicks.add(2*60*60);
    clockTicks.add(60*60);
    clockTicks.add(0);
    clockTicks.add(2*60*60);
    clockTicks.add(60*60);
    // Adding one more "now" time than needed for the test, because the loop reads the wall clock
    // one more time before starting over.
    clockTicks.add(-1); // ignored

    //
    // This now supplier returns the current "now", and then queues up the next "now" value for the
    // next time it is called. This causes our fake clock to move forward in time each time this is
    // called.
    //
    Supplier<Instant> nowSupplier = () ->
        Instant.ofEpochSecond(clockSecondsRef.getAndAdd(clockTicks.pop()));

    var theFlux = BridgedDataSourceIntervalSimulator.getSimulationFlux(
        BridgedDataSourceSimulatorSpec.builder()
            .setSeedDataStartTime(seedStartTime)
            .setSeedDataEndTime(seedEndTime)
            .setCalibUpdateFrequency(Duration.ofMillis(1))
            .setOperationalTimePeriod(Duration.ofMillis(1))
            .setSimulationStartTime(Instant.now())
            .build(),
        Instant.ofEpochSecond(clockSecondsRef.get()),
        Duration.ofMillis(0),
        List.of(
            IntervalDaoTestFixture.INTERVAL_DAO_FOR_SIMULATOR0,
            IntervalDaoTestFixture.INTERVAL_DAO_FOR_SIMULATOR1,
            IntervalDaoTestFixture.INTERVAL_DAO_FOR_SIMULATOR2
        ),
        nowSupplier,
        0
    );

    StepVerifier.withVirtualTime(() -> theFlux)
        // NO delay.
        .expectNext(IntervalDaoTestFixture.INTERVAL_DAO_SHIFTED0)

        .thenAwait(Duration.ofSeconds(2*60*60))
        .expectNext(IntervalDaoTestFixture.INTERVAL_DAO_SHIFTED1)

        .thenAwait(Duration.ofSeconds(60*60))
        .expectNext(IntervalDaoTestFixture.INTERVAL_DAO_SHIFTED2)

        //NO delay
        .expectNext(IntervalDaoTestFixture.INTERVAL_DAO_SHIFTED0A)

        .thenAwait(Duration.ofSeconds(2*60*60))
        .expectNext(IntervalDaoTestFixture.INTERVAL_DAO_SHIFTED1A)

        .thenAwait(Duration.ofSeconds(60*60))
        .expectNext(IntervalDaoTestFixture.INTERVAL_DAO_SHIFTED2A)

        // Need to cancel or else the Flux will go on forever.
        .thenCancel().verify();
  }

  /**
   * Same seed data set as above, but lets pretend that initialization took a whole hour. This means
   * that the simulation will start at the second interval in the seed data set (given the test data)
   *
   * See the first SimulatorFlux test for an explanation of how the flux is tested.
   */
  @Test
  void testSimulatorFluxShifted() {

    Instant seedStartTime = Instant.ofEpochSecond(-60*60);
    Instant seedEndTime = Instant.ofEpochSecond(2 * 60 * 60);

    AtomicInteger clockSecondsRef = new AtomicInteger(20*60*60);

    var clockTicks = new ArrayDeque<Integer>();
    clockTicks.add(2*60*60);
    clockTicks.add(60*60);
    clockTicks.add(0);
    clockTicks.add(2*60*60);
    clockTicks.add(60*60);
    clockTicks.add(0);
    clockTicks.add(-1); // ignored

    Supplier<Instant> nowSupplier = () ->
        Instant.ofEpochSecond(clockSecondsRef.getAndAdd(clockTicks.pop()));

    var theFlux = BridgedDataSourceIntervalSimulator.getSimulationFlux(
        BridgedDataSourceSimulatorSpec.builder()
            .setSeedDataStartTime(seedStartTime)
            .setSeedDataEndTime(seedEndTime)
            .setCalibUpdateFrequency(Duration.ofMillis(1))
            .setOperationalTimePeriod(Duration.ofMillis(1))
            .setSimulationStartTime(Instant.now())
            .build(),

        // Subtract an hour from the clock, to emulate the init operation having taken an hour.
        Instant.ofEpochSecond(clockSecondsRef.get() - 60*60),

        Duration.ofMillis(0),
        List.of(
            IntervalDaoTestFixture.INTERVAL_DAO_FOR_SIMULATOR0,
            IntervalDaoTestFixture.INTERVAL_DAO_FOR_SIMULATOR1,
            IntervalDaoTestFixture.INTERVAL_DAO_FOR_SIMULATOR2
        ),
        nowSupplier,
        1
    );

    StepVerifier.withVirtualTime(() -> theFlux)

        .thenAwait(Duration.ofSeconds(2*60*60))
        .expectNext(IntervalDaoTestFixture.INTERVAL_DAO_SHIFTED1)

        .thenAwait(Duration.ofSeconds(60*60))
        .expectNext(IntervalDaoTestFixture.INTERVAL_DAO_SHIFTED2)

        //NO delay
        .expectNext(IntervalDaoTestFixture.INTERVAL_DAO_SHIFTED0A)

        .thenAwait(Duration.ofSeconds(2*60*60))
        .expectNext(IntervalDaoTestFixture.INTERVAL_DAO_SHIFTED1A)

        .thenAwait(Duration.ofSeconds(60*60))
        .expectNext(IntervalDaoTestFixture.INTERVAL_DAO_SHIFTED2A)

        // NO delay.
        .expectNext(IntervalDaoTestFixture.INTERVAL_DAO_SHIFTED0B)

        .thenCancel().verify();
  }

  /**
   * Shift the data set by 21 minutes to mimick data that does not have dates that are perfectly on
   * the hour.
   *
   * See the first SimulatorFlux test for an explanation of how the flux is tested.
   */
  @Test
  void testSimulatorFluxIntervalsNotOnTheHour() {

    Instant seedStartTime = Instant.ofEpochSecond(-60*60).plus(IntervalDaoTestFixture.OFF_HOUR_OFFSET);
    Instant seedEndTime = Instant.ofEpochSecond(2 * 60 * 60);

    AtomicInteger clockSecondsRef = new AtomicInteger(20*60*60);

    var clockTicks = new ArrayDeque<Integer>();
    clockTicks.add((int)IntervalDaoTestFixture.OFF_HOUR_OFFSET.toSeconds());
    clockTicks.add(2*60*60);
    clockTicks.add(60*60);
    clockTicks.add(-1); // ignored

    Supplier<Instant> nowSupplier = () -> {
      System.out.println("GETTING NOW!");
      return Instant.ofEpochSecond(clockSecondsRef.getAndAdd(clockTicks.pop()));
    };

    var theFlux = BridgedDataSourceIntervalSimulator.getSimulationFlux(
        BridgedDataSourceSimulatorSpec.builder()
            .setSeedDataStartTime(seedStartTime)
            .setSeedDataEndTime(seedEndTime)
            .setCalibUpdateFrequency(Duration.ofMillis(1))
            .setOperationalTimePeriod(Duration.ofMillis(1))
            .setSimulationStartTime(Instant.now())
            .build(),
        Instant.ofEpochSecond(clockSecondsRef.get()),
        Duration.ofMillis(0),
        List.of(
            IntervalDaoTestFixture.INTERVAL_DAO_FOR_SIMULATOR_OFF_HOUR0,
            IntervalDaoTestFixture.INTERVAL_DAO_FOR_SIMULATOR_OFF_HOUR1,
            IntervalDaoTestFixture.INTERVAL_DAO_FOR_SIMULATOR_OFF_HOUR2
        ),
        nowSupplier,
        0
    );

    StepVerifier.withVirtualTime(() -> theFlux)
        // The delay will be the minutes past the hour.
        .thenAwait(IntervalDaoTestFixture.OFF_HOUR_OFFSET)
        .expectNext(IntervalDaoTestFixture.INTERVAL_DAO_SHIFTED_OFF_HOUR0)

        .thenAwait(Duration.ofSeconds(2*60*60))
        .expectNext(IntervalDaoTestFixture.INTERVAL_DAO_SHIFTED_OFF_HOUR1)

        .thenAwait(Duration.ofSeconds(60*60))
        .expectNext(IntervalDaoTestFixture.INTERVAL_DAO_SHIFTED_OFF_HOUR2)

        .thenCancel()
        .verify();
  }
}