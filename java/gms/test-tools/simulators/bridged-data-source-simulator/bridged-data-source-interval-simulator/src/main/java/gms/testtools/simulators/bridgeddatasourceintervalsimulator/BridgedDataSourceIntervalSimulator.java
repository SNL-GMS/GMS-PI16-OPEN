package gms.testtools.simulators.bridgeddatasourceintervalsimulator;

import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.shared.workflow.dao.IntervalDao;
import gms.shared.workflow.repository.IntervalDatabaseConnector;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.BridgedDataSourceDataSimulator;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.BridgedDataSourceSimulatorSpec;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.SourceInterval;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceIntervalRepositoryJpa;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayDeque;
import java.util.List;
import java.util.NavigableMap;
import java.util.Objects;
import java.util.TreeMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Supplier;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;
import org.apache.commons.lang3.Validate;
import org.slf4j.LoggerFactory;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * The Bridged Data Source Interval Simulator is responsible for taking a set of intervals from the
 * past and shifting them into a time span that started sometime in the past and goes until now.
 */
public class BridgedDataSourceIntervalSimulator implements BridgedDataSourceDataSimulator {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(BridgedDataSourceIntervalSimulator.class));

  // The configuration parameters that are used to specify when in the past to pull data from and
  // then when in time to start copying and repeating that seed data
  private BridgedDataSourceSimulatorSpec intervalSimulatorSpec;

  // Grabbed as now during initialise, marks the last time that data can be and still be copied
  // into the simulation database
  private Instant initializationTime;

  // The time difference between the simulationStartTime and seedDataStartTime
  private Duration initializationSeedTimeOffset;

  // The data that was pulled out of the "seed database" and will be copied to fill in the
  // operationalTimePeriod that is a config parameter
  private List<IntervalDao> seedData;

  // The last interval that was put into the DB during initialize()
  private long lastInitializedIntervalId;

  // Link to the smarts of the DB, used to retrieve and store intervals
  private IntervalDatabaseConnector intervalDatabaseConnector;

  // Direct connection to the database used for storing intervals
  private BridgedDataSourceIntervalRepositoryJpa bridgedDataSourceIntervalRepositoryJpa;

  private Disposable simulationFluxDisposable;

  /**
   *
   */
  public BridgedDataSourceIntervalSimulator(
      IntervalDatabaseConnector intervalDatabaseConnector,
      BridgedDataSourceIntervalRepositoryJpa bridgedDataSourceIntervalRepositoryJpa
  ) {
    this.intervalDatabaseConnector = intervalDatabaseConnector;
    this.bridgedDataSourceIntervalRepositoryJpa = bridgedDataSourceIntervalRepositoryJpa;
  }

  /**
   *
   */
  public static BridgedDataSourceIntervalSimulator create(
      IntervalDatabaseConnector intervalDatabaseConnector,
      BridgedDataSourceIntervalRepositoryJpa bridgedDataSourceIntervalRepositoryJpa
  ) {
    return new BridgedDataSourceIntervalSimulator(
        intervalDatabaseConnector,
        bridgedDataSourceIntervalRepositoryJpa
    );
  }

  @Override
  public void initialize(BridgedDataSourceSimulatorSpec bridgedDataSourceSimulatorSpec) {

    intervalSimulatorSpec = bridgedDataSourceSimulatorSpec;

    // The Instants that define when in the past that the seed data starts and stops
    Instant seedDataStartTime = intervalSimulatorSpec.getSeedDataStartTime();
    Instant seedDataEndTime = intervalSimulatorSpec.getSeedDataEndTime();

    // Align the times to hour boundaries and compute duration
    seedDataStartTime = seedDataStartTime.truncatedTo(ChronoUnit.HOURS);

    // To round up the endTime, check if there is a partial hour and then round up if needed
    Instant truncatedEndTime = seedDataEndTime.truncatedTo(ChronoUnit.HOURS);
    if (seedDataEndTime.isAfter(truncatedEndTime)) {
      seedDataEndTime = truncatedEndTime.plus(1, ChronoUnit.HOURS);
    } else {
      seedDataEndTime = truncatedEndTime;
    }

    var seedDuration = Duration.between(seedDataStartTime, seedDataEndTime);

    // query the DB for this seed data
    initializeSeedData(seedDataStartTime, seedDataEndTime);

    // Using the seed times from the spec and now(),compute how many times
    // the seed will be used in backward/forward passes to fill the operational time period

    initializationTime = Instant.now();

    // The time that signals when seed data goes from being considered "done" to pending as it is
    // copied into the simulation database
    Instant simulationStartTime = intervalSimulatorSpec.getSimulationStartTime();
    Validate.isTrue(initializationTime.isAfter(simulationStartTime),
        "Error, simulationStartTime {} is equal to or after now {}, ",
        simulationStartTime, initializationTime);

    var operationalDuration = intervalSimulatorSpec.getOperationalTimePeriod();
    var forwardDuration = Duration.between(simulationStartTime, initializationTime);
    var backwardsDuration = operationalDuration.minus(forwardDuration);

    long numberForwardChunks;
    long numberBackwardChunks;

    if (backwardsDuration.isNegative()) {
      //Having a negative backward duration means that all the data to sim is
      // after the simStartTime so there are 0 chunks to copy backwards
      numberBackwardChunks = 0;

      logger.info("The configured OperationalTimePeriod {} is less than the duration between  "
              + "the simStartTime, {} and now, {}.  No data will be created before the simStartTime",
          operationalDuration,
          simulationStartTime,
          initializationTime);

      //Need to grab the whole chunks and then add one if there was a partial seed
      numberForwardChunks = Math.abs(forwardDuration.dividedBy(seedDuration));
      if (forwardDuration.toSeconds() % seedDuration.toSeconds() != 0) {
        numberForwardChunks++;
      }
    } else {
      //This use case has seed data that is both before and after the simStartTime

      //Need to grab the whole chunks and then add one if there was a partial seed
      numberForwardChunks = Math.abs(forwardDuration.dividedBy(seedDuration));
      if (forwardDuration.toSeconds() % seedDuration.toSeconds() != 0) {
        numberForwardChunks++;
      }

      //Need to grab the whole chunks and then add one if there was a partial seed
      numberBackwardChunks = Math.abs(backwardsDuration.dividedBy(seedDuration));
      if (backwardsDuration.toSeconds() % seedDuration.toSeconds() != 0) {
        numberBackwardChunks++;
      }
    }

    /*
     align the seed data to start at simulationStartTime and then fill backwards till
     simDuration has been reached, then go forward from simulationStartTime till currentSystemTime
     has been reached, this implies that simulationStartTime < currentSystemTime
     store the seed data into the simulator data

     process the numberBackwardChunks and shift all the times by the
     initial time difference equal to the seed and sim so that the seedEnd time aligns with
     the simStart time and then apply a seedDuration*count to shift all the intervals
     */

    final long backwardsTimeShift = Duration.between(seedDataEndTime, simulationStartTime)
        .toSeconds();

    Flux.range(0, (int) numberBackwardChunks)
        .publishOn(Schedulers.boundedElastic())
        .map(shiftIndex -> backwardPassShift(backwardsTimeShift, shiftIndex, seedDuration))
        .doOnNext(shiftedList -> bridgedDataSourceIntervalRepositoryJpa.store(shiftedList))
        .blockLast();

    // process the numberForwardChunks and shift all the times by the
    // initial time difference equal to the seed and sim so that the seedStart time aligns with
    // the simStart time and then apply a seedDuration*count to shift all the intervals

    final long forwardTimeShift = Duration.between(seedDataStartTime, simulationStartTime)
        .toSeconds();
    final long finalNumberBackwardChunks = numberBackwardChunks;

    // The time difference between the simulationStartTime and seedDataStartTime.
    // In case there are 0 forward chunks, init this value for start().
    AtomicReference<Instant> initializationSeedTime = new AtomicReference<>(initializationTime);
    var maxIntervalIdReference = new AtomicLong();

    Flux.range((int) numberBackwardChunks, (int) numberForwardChunks)
        .publishOn(Schedulers.boundedElastic())
        .map(shiftIndex -> {
          initializationSeedTime
              .set(initializationTime
                  .minus(forwardTimeShift, ChronoUnit.SECONDS)
                  .minus((shiftIndex - finalNumberBackwardChunks) * seedDuration.toSeconds(),
                      ChronoUnit.SECONDS));
          return forwardPassShift(forwardTimeShift, (int) finalNumberBackwardChunks, shiftIndex,
              seedDuration);
        })
        .doOnNext(
            shiftedList -> {
              var lastId =  shiftedList
                  .get(shiftedList.size() - 1)
                  .getIntervalIdentifier();

              maxIntervalIdReference.updateAndGet(
                  current -> {
                    if (lastId > current) {
                      return lastId;
                    }
                    return current;
                  }
              );

              bridgedDataSourceIntervalRepositoryJpa.store(shiftedList);
            })
        .blockLast();

    lastInitializedIntervalId = maxIntervalIdReference.get();

    // Storing value needed by start()
    initializationSeedTimeOffset = Duration
        .between(seedDataStartTime, initializationSeedTime.get());

  }

  public IntervalDao applyTimeShift(IntervalDao oldDao, long shift, int passIndex) {


    /*
    The 1e10 constant is added to make the simulated intervals stand out and then keep their
    names unique.  The interval ids for example of 1002449492332 will become 1012449492332 with this
    new constant being 4x the number of current intervals, a collision is unlikely
     */

    return new IntervalDao.Builder()
        .intervalIdentifier((long) (oldDao.getIntervalIdentifier() + 1e10 * passIndex))
        .type(oldDao.getType())
        .name(oldDao.getName())
        .time(oldDao.getTime() + shift)
        .endTime(oldDao.getEndTime() + shift)
        .state(oldDao.getState())
        .author(oldDao.getAuthor())
        .percentAvailable(oldDao.getPercentAvailable())
        .processStartDate(oldDao.getProcessStartDate().plusSeconds(shift))
        .processEndDate(oldDao.getProcessEndDate().plusSeconds(shift))
        .lastModificationDate(oldDao.getLastModificationDate().plusSeconds(shift))
        .loadDate(oldDao.getLoadDate())
        .build();

  }

  List<IntervalDao> backwardPassShift(long initialTimeShift, int passIndex, Duration seedDuration) {

    // For each DAO passed in, mark them as done as this is in the past.
    // Compute the shift in time from the end of the seed to the data.
    // Shift the data back the index-1 seed durations minus the partial shift from the start time.
    return seedData.stream()
        .map(intervalDao ->
        {
          long timeShift = initialTimeShift - passIndex * seedDuration.getSeconds();
          IntervalDao newDao = applyTimeShift(intervalDao, timeShift, passIndex);

          newDao.setState("done");

          return newDao;
        })
        .collect(Collectors.toList());

  }

  private List<IntervalDao> forwardPassShift(long initialTimeShift, int startingIndex,
      int passIndex, Duration seedDuration) {

    return seedData.stream()
        .map(intervalDao ->
        {
          long timeShift =
              initialTimeShift + (passIndex - startingIndex) * seedDuration.getSeconds();
          IntervalDao newDao = applyTimeShift(intervalDao, timeShift, passIndex);

          if (newDao.getType().equalsIgnoreCase("NET") &&
              newDao.getName().equalsIgnoreCase("NETS1")) {
            newDao.setState("done");
          } else {
            newDao.setState("pending");
          }

          return newDao;
        })
        .filter(dao -> dao.getLastModificationDate().isBefore(initializationTime))
        .collect(Collectors.toList());

  }


  @Override
  public void start(String placeholder) {
    simulationFluxDisposable = getSimulationFlux(
        this.intervalSimulatorSpec,
        this.initializationTime,
        this.initializationSeedTimeOffset,
        this.seedData,
        Instant::now,
        this.lastInitializedIntervalId
    ).subscribe(
        shiftedIntervalDao -> {
          bridgedDataSourceIntervalRepositoryJpa.store(List.of(shiftedIntervalDao));

          logger.debug(
              "Stored IntervalDao {}",
              shiftedIntervalDao.getClassEndTimeNameTimeKey()
          );
        }
    );
  }


  @Override
  public void stop(String placeholder) {
    logger.info("Stopping the interval simulator");
    simulationFluxDisposable.dispose();
  }

  @Override
  public void cleanup(String placeholder) {
    logger.info("cleaning up INTERVAL table.");
    bridgedDataSourceIntervalRepositoryJpa.cleanupData();
  }

  public void storeIntervals(List<SourceInterval> intervalList) {

    bridgedDataSourceIntervalRepositoryJpa.storeOrUpdate(
        intervalList.stream()
            .map(s -> new IntervalDao.Builder()
                .intervalIdentifier(s.getIntervalIdentifier())
                .type(s.getType())
                .name(s.getName())
                .time(s.getTime())
                .endTime(s.getEndTime())
                .state(s.getState())
                .author(s.getAuthor())
                .percentAvailable(s.getPercentAvailable())
                .processStartDate(s.getProcessStartDate())
                .processEndDate(s.getProcessEndDate())
                .lastModificationDate(s.getLastModificationDate())
                .loadDate(s.getLoadDate())
                .build())
            .collect(Collectors.toList())
    );
  }

  /**
   * Construct a Flux which emits a simulated interval in real time, based on the modification dates
   * of the seed data set.
   *
   * @param bridgedDataSourceSimulatorSpec Simulator spec which specifies behavior of simulation
   * @param initializationTime When the simulation was initialized
   * @param initializationSeedTimeOffset How far to go past the initialize time to find the start
   * of seed data.
   * @param seedData Set of seed intervals.
   * @param nowSupplier A supplier that indicates "now". Normally, would return Instant.now, but
   * can be made to return whatever is needed for testing.
   * @param intervalIdStart The interval id after which new interval IDs will be created.
   * @return A flux which once subscribed to, will emit simulated intervals on a "dynamic cadence"
   * dependant on the relative modification dates of the seed intervals.
   */
  static Flux<IntervalDao> getSimulationFlux(
      BridgedDataSourceSimulatorSpec bridgedDataSourceSimulatorSpec,
      Instant initializationTime,
      Duration initializationSeedTimeOffset,
      List<IntervalDao> seedData,
      Supplier<Instant> nowSupplier,
      long intervalIdStart
  ) {

    Validate.notEmpty(seedData, "getSimulationFlux: Retrieved empty seed data");
    
    var seedDataLength = Duration.between(
        bridgedDataSourceSimulatorSpec.getSeedDataStartTime(),
        bridgedDataSourceSimulatorSpec.getSeedDataEndTime()
    );

    //
    // Initial offset indicating how far past the modification data of the first seed interval to
    // start.
    //
    var offset = Duration.ofMillis(
        initializationSeedTimeOffset
            .plus(Duration.between(
                initializationTime, nowSupplier.get()
            ))
            .toMillis() % seedDataLength.toMillis()
    );

    //
    // Time of initial seed interval, which can be a seed other than the first in the list,
    // depending on the offset.
    //
    var currentSeedTime = bridgedDataSourceSimulatorSpec.getSeedDataStartTime()
        .truncatedTo(ChronoUnit.HOURS).plus(offset);

    //
    // Here, we will rearrange the seed data so that the seed at currentSeedTime is the first in
    // the list to iterate over. Anything before it is moved to the end of the deque.
    //
    NavigableMap<Instant, IntervalDao> intervalDaoModDateMap = new TreeMap<>();

    seedData.forEach(intervalDao -> intervalDaoModDateMap.put(
        intervalDao.getLastModificationDate(), intervalDao
    ));

    var headMap = intervalDaoModDateMap.headMap(currentSeedTime);
    var tailMap = intervalDaoModDateMap.tailMap(currentSeedTime);

    //
    // Create a Deque data structure. Seeds will constantly be popped off of the front, then pushed
    // on to the back, so that there is a continuous non-ending supply of seeds.
    //
    var rotatedSeedData = new ArrayDeque<IntervalDao>();
    rotatedSeedData.addAll(tailMap.values());
    rotatedSeedData.addAll(headMap.values());

    // This is just used to detect that we have wrapped around our list of seeds.
    var firstInterval = Objects.requireNonNull(
        rotatedSeedData.peekFirst(),
        "getSimulationFlux: Something is wrong: retrieved a null firstInterval)"
    );

    // This will increase each time we have reset to the beginning of the seed list.
    var intervalLengthMultiplierRef = new AtomicInteger(0);

    // Will tell whether we are on the very first iteration, because our clock delay needs to
    // be calculated differently.
    var veryFirstInterval = new AtomicBoolean(true);

    // Will increase with each new simulatedinterval.
    var currentId = new AtomicLong(intervalIdStart);

    return Mono.just(1).repeat() // This is a Flux that just repeatedly emits the number 1.

        //
        // Delay the next emission by a duration determined by the previous and next interval.
        // The first time through needs to be calculated differently, since there is no previous
        // interval.
        //
        .delayUntil(dummy -> {

          // A non-empty list of seed intervals should make these impossible, but we want to make
          // our various scanners happy
          var previousInterval = Objects.requireNonNull(
              rotatedSeedData.peekLast(),
              "getSimulationFlux: Something is wrong: retrieved a null previousInterval"
          );

          var currentInterval = Objects.requireNonNull(
              rotatedSeedData.pop(),
              "getSimulationFlux: Something is wrong: retrieved a null currentInterval"
          );

          // Move the current interval to the end of the deque
          rotatedSeedData.addLast(currentInterval);

          if (veryFirstInterval.get()) {
            veryFirstInterval.set(false);
            return Mono.delay(
                Duration.between(currentSeedTime, currentInterval.getLastModificationDate()));
          } else {

            var previousIntervalModDate = previousInterval.getLastModificationDate();
            var nextIntervalModDate = currentInterval.getLastModificationDate();

            var duration = Duration.between(
                previousIntervalModDate, nextIntervalModDate
            );

            if (duration.isNegative()) {
              duration = duration.plus(seedDataLength);
            }

            if (previousInterval.getClassEndTimeNameTimeKey()
                .equals(firstInterval.getClassEndTimeNameTimeKey())) {
              // Increment the interval length multipler, so that shifted times shift correctly as
              // time moves forward.
              intervalLengthMultiplierRef.incrementAndGet();
            }

            return Mono.delay(duration);
          }

        })
        .map(dummy -> {

          var currentAdjustment = seedDataLength.multipliedBy(intervalLengthMultiplierRef.get());

          // A non-empty list of seed intervals should make these impossible, but we want to make
          // our various scanners happy
          var currentInterval = Objects.requireNonNull(
              rotatedSeedData.peekLast(),
              "getSimulationFlux: Something is wrong: retrieved a null interval; can't create simulated one"
          );
          var now = nowSupplier.get();

          return createSimulatedInterval(
              currentId.addAndGet(1),
              currentInterval,
              Duration.between(
                  currentInterval.getLastModificationDate().plus(currentAdjustment),
                  now
              ).plus(currentAdjustment)
          );
        });
  }

  private static IntervalDao createSimulatedInterval(
      long newId,
      IntervalDao intervalDao,
      Duration timeshift) {

    var primaryKey = intervalDao.getClassEndTimeNameTimeKey();

    double numericalTimeShift = timeshift.toMillis() / 1000.0;

    return new IntervalDao.Builder()
      .intervalIdentifier(newId)
      .type(primaryKey.getType())
      .name(primaryKey.getName())
      .time(primaryKey.getTime() + numericalTimeShift)
      .endTime(primaryKey.getEndTime() + numericalTimeShift)
      .state("NETNETS1".equals(primaryKey.getType() + primaryKey.getName()) ? "done" : "pending")
      .author(intervalDao.getAuthor())
      .percentAvailable(intervalDao.getPercentAvailable())
      .processStartDate(intervalDao.getProcessStartDate().plus(timeshift))
      .processEndDate(intervalDao.getProcessEndDate().plus(timeshift))
      .lastModificationDate(intervalDao.getLastModificationDate().plus(timeshift))
      .loadDate(intervalDao.getLoadDate().plus(timeshift))
      .build();
  }

  void initializeSeedData(Instant seedDataStartTime, Instant seedDataEndTime) {

    seedData = intervalDatabaseConnector
        .findIntervalsByTimeRange(seedDataStartTime, seedDataEndTime);

    logger.info("Using {} to {} as the time range for seed data.",
        seedDataStartTime, seedDataEndTime);
    logger.info("Seed data consists of: {} intervals", seedData.size());

  }

}
