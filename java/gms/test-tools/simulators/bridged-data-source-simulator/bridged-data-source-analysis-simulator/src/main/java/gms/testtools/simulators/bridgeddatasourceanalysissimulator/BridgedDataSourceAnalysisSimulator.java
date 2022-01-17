package gms.testtools.simulators.bridgeddatasourceanalysissimulator;

import com.google.common.base.Functions;
import com.google.common.collect.ImmutableList;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.database.connector.ArrivalDatabaseConnector;
import gms.shared.stationdefinition.dao.css.BeamDao;
import gms.shared.stationdefinition.dao.css.WfTagDao;
import gms.shared.stationdefinition.dao.css.WfTagKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.database.connector.BeamDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WftagDatabaseConnector;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.BridgedDataSourceDataSimulator;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.BridgedDataSourceSimulatorSpec;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceRepository;
import org.apache.commons.lang3.Validate;
import org.slf4j.LoggerFactory;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * The Bridged Data Source Analysis Data Simulator is responsible for loading analysis data -
 * including waveforms, arrivals, origins, etc. - into the simulation database for a specified
 * simulation by copying and modifying records from the pre-installed seed data set into the
 * simulation data set. The Simulator loads an initial copy of the specified analysis data from the
 * seed set when the simulation is initialized. Once the simulation is started, the Simulator
 * periodically loads additional copies of the specified analysis data from the seed data set to
 * simulate ongoing data processing and storage.
 */
public class BridgedDataSourceAnalysisSimulator implements BridgedDataSourceDataSimulator {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(BridgedDataSourceAnalysisSimulator.class));

  //let updates of calib be spread over this duration for different channels, if calib update frequency allows
  private static final Duration CALIB_UPDATE_RANGE = Duration.ofHours(24);
  private long maxTimeOffset;

  private final ArrivalDatabaseConnector arrivalDatabaseConnector;
  private final WfdiscDatabaseConnector wfdiscDatabaseConnector;
  private final WftagDatabaseConnector wftagDatabaseConnector;
  private final BeamDatabaseConnector beamDatabaseConnector;
  private final BridgedDataSourceRepository bridgedDataSourceRepository;
  private final double calibUpdatePercentage;

  //seed data determined at initialize() and periodically used to create new data for start()
  private List<ArrivalDao> arrivalData;
  private List<WfdiscDao> wfDiscData;
  private List<WfTagDao> wfTagData;
  private List<BeamDao> beamData;
  private Map<Long, WfTagDao> idToWftagMap;
  private List<WfdiscDao> backwardSeedData;

  private long nextWfid;
  private long nextArid;
  private Instant preloadDataEndtime;
  private Instant seedDataStartTime;
  private Instant seedDataEndTime;
  private Disposable loadingDisposable;

  private BridgedDataSourceAnalysisSimulator(
    ArrivalDatabaseConnector arrivalDatabaseConnector,
    WfdiscDatabaseConnector wfdiscDatabaseConnector,
    WftagDatabaseConnector wftagDatabaseConnector,
    BeamDatabaseConnector beamDatabaseConnector,
    BridgedDataSourceRepository bridgedDataSourceRepository, int calibDelta) {
    this.arrivalDatabaseConnector = arrivalDatabaseConnector;
    this.wfdiscDatabaseConnector = wfdiscDatabaseConnector;
    this.wftagDatabaseConnector = wftagDatabaseConnector;
    this.beamDatabaseConnector = beamDatabaseConnector;
    this.bridgedDataSourceRepository = bridgedDataSourceRepository;
    this.calibUpdatePercentage = calibDelta;
    this.nextWfid = 1;
    this.nextArid = 1;
    this.loadingDisposable = null;
  }

  /**
   * Creates a {@link BridgedDataSourceAnalysisSimulator} given the required, non null components.
   *
   * @param wfdiscDatabaseConnector - provides read access to {@link gms.shared.stationdefinition.dao.css.WfdiscDao}s
   * in the database's seed schema
   * @param bridgedDataSourceRepository - provides write and cleanup access in the database's
   * simulation schema
   * @param calibDeltaValue - the configurable delta value for the calibration update shift delta
   * @return {@link BridgedDataSourceAnalysisSimulator}
   */
  public static BridgedDataSourceAnalysisSimulator create(
    ArrivalDatabaseConnector arrivalDatabaseConnector,
    WfdiscDatabaseConnector wfdiscDatabaseConnector,
    WftagDatabaseConnector wftagDatabaseConnector,
    BeamDatabaseConnector beamDatabaseConnector,
    BridgedDataSourceRepository bridgedDataSourceRepository,
    int calibDeltaValue) {
    Validate.notNull(wfdiscDatabaseConnector);
    Validate.notNull(bridgedDataSourceRepository);
    Validate.validState(calibDeltaValue != 0);

    return new BridgedDataSourceAnalysisSimulator(arrivalDatabaseConnector, wfdiscDatabaseConnector,
      wftagDatabaseConnector, beamDatabaseConnector, bridgedDataSourceRepository, calibDeltaValue);
  }

  /**
   * Initialize analysis data - including waveforms, arrivals, origins, etc. - for the specified
   * simulation based on the provided spec, copying and modifying data from the seed data set.
   *
   * @param bridgeSimulatorSpec - An {@link BridgedDataSourceSimulatorSpec} to provided the
   * simulation specification details.
   */
  @Override
  public void initialize(BridgedDataSourceSimulatorSpec bridgeSimulatorSpec) {

    seedDataStartTime = bridgeSimulatorSpec.getSeedDataStartTime();
    seedDataEndTime = bridgeSimulatorSpec.getSeedDataEndTime();

    final Instant simulationStartTime = bridgeSimulatorSpec.getSimulationStartTime();
    final Duration operationalTimePeriod = bridgeSimulatorSpec.getOperationalTimePeriod();
    final Duration seedDataSetLength = Duration.between(seedDataStartTime, seedDataEndTime);
    final Duration calibUpdateFrequency = bridgeSimulatorSpec.getCalibUpdateFrequency();
    final Instant start = Instant.now();

    if (calibUpdateFrequency.compareTo(CALIB_UPDATE_RANGE) >= 0) {
      maxTimeOffset = CALIB_UPDATE_RANGE.dividedBy(seedDataSetLength);
    } else {
      maxTimeOffset = calibUpdateFrequency.dividedBy(seedDataSetLength);
    }

    logger.info("BridgedDataSourceAnalysisSimulator initialize");
    logger.info("Seed data start time: {} ({})", seedDataStartTime, seedDataStartTime.toEpochMilli());
    logger.info("Seed data end time: {} ({})", seedDataEndTime, seedDataEndTime.toEpochMilli());
    logger.info("Seed data duration: {}ms (={}s ={}m ={}h)", seedDataSetLength.toMillis(),
      seedDataSetLength.toSeconds(), seedDataSetLength.toMinutes(), seedDataSetLength.toHours());
    logger.info("Simulation start time: {} ({})", simulationStartTime, simulationStartTime.toEpochMilli());
    logger.info("Operational time period: {}ms (={}s ={}m ={}h)", operationalTimePeriod.toMillis(),
      operationalTimePeriod.toSeconds(), operationalTimePeriod.toMinutes(), operationalTimePeriod.toHours());
    logger.info("Calibration update frequency: {}ms (={}s ={}m ={}h)", calibUpdateFrequency.toMillis(),
      calibUpdateFrequency.toSeconds(), calibUpdateFrequency.toMinutes(), calibUpdateFrequency.toHours());

    initializeSeedDataDataSetEpoch(seedDataStartTime, seedDataEndTime);
    preloadData(simulationStartTime, seedDataSetLength, operationalTimePeriod, calibUpdateFrequency);

    final Instant operationalDurationStartTime = start.minus(operationalTimePeriod);
    final Duration backwardLoadDuration = Duration.between(operationalDurationStartTime, simulationStartTime);

    logger.info("Backward load end time: {}, backward load duration: {}ms (={}s ={}m ={}h)", operationalDurationStartTime, backwardLoadDuration.toMillis(),
      backwardLoadDuration.toSeconds(), backwardLoadDuration.toMinutes(), backwardLoadDuration.toHours());
    final int expectedLoadCount = (int) Math.ceil(operationalTimePeriod.toNanos() / (double) seedDataSetLength.toNanos()) *
      wfDiscData.size();
    final Instant end = Instant.now();
    final Duration totalTime = Duration.between(start, end);
    logger.info("Initialization completed in {}ms, expected record load count: {}, actual record load count: {}",
      totalTime.toMillis(), expectedLoadCount, nextWfid - 1);
  }

  private void initializeSeedDataDataSetEpoch(Instant seedDataStartTime, Instant seedDataEndTime) {

    final List<WfdiscDao> initialWfdiscSeedData;

    if (arrivalData == null) {
      arrivalData = arrivalDatabaseConnector.findArrivalsByTimeRange(seedDataStartTime, seedDataEndTime);
      logger.info("Arrival seed data size: {}", arrivalData.size());
    }

    if (wfDiscData == null) {
      initialWfdiscSeedData = wfdiscDatabaseConnector.findWfdiscsByTimeRange(seedDataStartTime, seedDataEndTime);
      wfDiscData = ImmutableList.copyOf(initialWfdiscSeedData);
      backwardSeedData = getCopyOfWfdiscList(initialWfdiscSeedData);
      logger.info("Wfdisc seed data size: {}", wfDiscData.size());
    }

    if (beamData == null) {

      List<Long> wfids = wfDiscData.stream()
        .map(WfdiscDao::getId)
        .distinct()
        .collect(Collectors.toList());

      beamData = beamDatabaseConnector.findBeamsByWfid(wfids);
      logger.info("Beam seed data size: {}", beamData.size());
    }

    if (wfTagData == null) {

      List<Long> arids = arrivalData.stream()
        .map(ArrivalDao::getId)
        .distinct()
        .collect(Collectors.toList());

      wfTagData = wftagDatabaseConnector.findWftagsByTagIds(arids);

      idToWftagMap = wfTagData.stream()
        .collect(Collectors.toMap(
          Functions.compose(WfTagKey::getId, WfTagDao::getWfTagKey),
          Function.identity()));

      logger.info("Wftag data size: {}", wfTagData.size());
    }

  }

  private void preloadData(Instant simulationStartTime,
    Duration seedDataSetLength, Duration operationalTimePeriod, Duration calibUpdateFrequency) {

    List<WfdiscDao> wfdiscDaos = new ArrayList<>();
    List<ArrivalDao> arrivalDaos = new ArrayList<>();
    List<WfTagDao> wfTagDaos = new ArrayList<>();
    List<BeamDao> beamDaos = new ArrayList<>();

    //determine when the first backwards load occurs (backwardsStartTime)
    // (needs to be aligned with simulation start time so that the last backwards data load ends at simulation start time)
    long numberOfLoads = (long) Math.ceil(operationalTimePeriod.toNanos() / (double) seedDataSetLength.toNanos());
    Instant backwardsStartTime = simulationStartTime.minus(seedDataSetLength.multipliedBy(numberOfLoads));
    Instant currentBackwardsTime = backwardsStartTime;

    while (currentBackwardsTime.isBefore(simulationStartTime)) {
      wfdiscDaos.addAll(createWfdiscDaoListForBackward(currentBackwardsTime, calibUpdateFrequency, backwardsStartTime, seedDataSetLength));
      currentBackwardsTime = currentBackwardsTime.plus(seedDataSetLength);
    }
    logger.info("Completed backward loading.");

    //forward loading
    Instant seedDataForward = simulationStartTime;
    while (seedDataForward.isBefore(Instant.now())) {
      AnalysisSimulatorData data = getData(seedDataForward);
      wfdiscDaos.addAll(data.getWfdiscDaos());
      arrivalDaos.addAll(data.getArrivalDaos());
      wfTagDaos.addAll(data.getWfTagDaos());
      beamDaos.addAll(data.getBeamDaos());
      seedDataForward = seedDataForward.plus(seedDataSetLength);
    }
    logger.info("Completed forward loading.");
    preloadDataEndtime = seedDataForward;

    Instant approximateForwardLoadPeriodEndTime = Instant.now();
    final Duration forwardLoadDuration = Duration.between(simulationStartTime, approximateForwardLoadPeriodEndTime);
    logger.info("Approximate forward load time period end time: {} ({})",
      approximateForwardLoadPeriodEndTime, approximateForwardLoadPeriodEndTime.toEpochMilli());
    logger.info("Forward load duration: {}ms (={}s ={}m ={}h)", forwardLoadDuration.toMillis(),
      forwardLoadDuration.toSeconds(), forwardLoadDuration.toMinutes(), forwardLoadDuration.toHours());

    bridgedDataSourceRepository.store(wfdiscDaos);
    bridgedDataSourceRepository.store(arrivalDaos);
    bridgedDataSourceRepository.store(wfTagDaos);
    bridgedDataSourceRepository.store(beamDaos);
  }

  private List<WfdiscDao> createWfdiscDaoListForBackward(Instant seedDataBackward, Duration calibUpdateFrequency,
    Instant backwardsStartTime,
    Duration seedDataSetLength) {

    List<WfdiscDao> wfdiscDaos = new ArrayList<>();
    final var copiedDataTimeShift = Duration.between(seedDataStartTime, seedDataBackward);

    long timeOffset = 0;

    for (WfdiscDao wfdiscDao : backwardSeedData) {
      long currentWfid = wfdiscDao.getId();
      double oldCalib = wfdiscDao.getCalib();

      //to spread out updates, we are adding a time offset
      Instant intervalStart = backwardsStartTime.plus(seedDataSetLength.multipliedBy(timeOffset));

      Duration timeElapsed = Duration.between(intervalStart, seedDataBackward);
      Duration timeElapsedPreviously = Duration.between(intervalStart, seedDataBackward.minus(seedDataSetLength));

      //use this value to determine if we have reached or passed a point at which the calib would update
      long changeInNumberUpdates = (timeElapsed.dividedBy(calibUpdateFrequency)) - (timeElapsedPreviously.dividedBy(calibUpdateFrequency));

      if ((!timeElapsedPreviously.isNegative() && changeInNumberUpdates == 1) ||
        (timeElapsedPreviously.isNegative() && !timeElapsed.isNegative())) {
        //time to update for this wfdisc
        //This sets the actual seedData for backward, NOT the copy... but then the copy picks it up.
        wfdiscDao.setCalib(wfdiscDao.getCalib() * ((100 + calibUpdatePercentage) / 100));
        logger.debug("Updated calib for record with wfid {}, from {} to {}",
          currentWfid, oldCalib, wfdiscDao.getCalib());
      }

      WfdiscDao wfdiscDaoCopy = new WfdiscDao(wfdiscDao);
      if (wfdiscDao.getCalib() != oldCalib) {
        logger.debug("TimeStamp for Calib Update: StartTime: {}\t EndTime: {}",
          wfdiscDaoCopy.getTime(), wfdiscDaoCopy.getEndTime());
      }

      updateWfidAndTime(wfdiscDaoCopy, copiedDataTimeShift);
      wfdiscDaos.add(wfdiscDaoCopy);
      timeOffset = timeOffset == maxTimeOffset ? 0 : timeOffset + 1;
    }

    return wfdiscDaos;
  }

  private void loadWfdiscAndArrivalsFromSeed(Instant simulationStartTime) {
    AnalysisSimulatorData data = getData(simulationStartTime);

    List<WfdiscDao> wfdiscDaos = data.getWfdiscDaos();
    List<ArrivalDao> arrivalDaos = data.getArrivalDaos();
    List<WfTagDao> wfTagDaos = data.getWfTagDaos();
    List<BeamDao> beamDaos = data.getBeamDaos();

    bridgedDataSourceRepository.store(wfdiscDaos);
    bridgedDataSourceRepository.store(arrivalDaos);
    bridgedDataSourceRepository.store(wfTagDaos);
    bridgedDataSourceRepository.store(beamDaos);
    logger.info("Wfdisc, Arrival, and Wftag Daos loaded into repository at time {}", Instant.now());
  }

  private AnalysisSimulatorData getData(Instant simulationStartTime) {

    List<WfdiscDao> wfdiscDaos;
    List<ArrivalDao> arrivalDaos;
    List<WfTagDao> wfTagDaos = new ArrayList<>();
    List<BeamDao> beamDaos;

    final var copiedDataTimeShift = Duration.between(seedDataStartTime, simulationStartTime);

    Map<Long, Long> tempNewWfidToOldMap = new HashMap<>();

    wfdiscDaos = wfDiscData.stream()
      .map(WfdiscDao::new)
      .map(wfdiscDao -> {

        long oldWfid = wfdiscDao.getId();
        updateWfidAndTime(wfdiscDao, copiedDataTimeShift);
        long newWfid = wfdiscDao.getId();
        tempNewWfidToOldMap.put(oldWfid, newWfid);
        return wfdiscDao;
      })
      .collect(Collectors.toList());

    arrivalDaos = arrivalData.stream()
      .map(ArrivalDao::new)
      .map(arrivalDao -> {

        long oldArid = arrivalDao.getId();
        updateAridAndTime(arrivalDao, copiedDataTimeShift);
        long newArid = arrivalDao.getId();
        WfTagDao associatedWfTag = idToWftagMap.get(oldArid);

        if (associatedWfTag == null) {
          logger.warn("No associated WfTag found for Arrival with arid {}, " +
            "Wftag will not be added to the database.", oldArid);
        } else {
          WfTagDao newWfTag = new WfTagDao(associatedWfTag);
          long oldWfid = newWfTag.getWfTagKey().getWfId();
          Long newWfid = tempNewWfidToOldMap.get(oldWfid);

          if (newWfid == null) {
            logger.warn("No associated new wfid found for wftag with wfid {}, " +
              "Wftag will not be added to the database.", oldWfid);
          } else {

            newWfTag.getWfTagKey().setWfId(newWfid);
            newWfTag.getWfTagKey().setId(newArid);
            wfTagDaos.add(newWfTag);
          }
        }
        return arrivalDao;
      })
      .collect(Collectors.toList());

    beamDaos = beamData.stream()
      .map(BeamDao::new)
      .map(beamDao -> {

        long oldWfid = beamDao.getWfId();
        Long newWfid = tempNewWfidToOldMap.get(oldWfid);

        if (newWfid == null) {
          logger.warn("No associated new wfid found for Beam with wfid {}, " +
            "Beam will not be added to the database.", oldWfid);
          return Optional.<BeamDao>empty();
        }

        beamDao.setWfId(newWfid);
        return Optional.of(beamDao);
      }).filter(Optional::isPresent)
      .map(Optional::get)
      .collect(Collectors.toList());

    return AnalysisSimulatorData.create(wfdiscDaos, arrivalDaos, wfTagDaos, beamDaos);
  }

  /**
   * initialize a timer to periodically load additional analysis data (waveforms, arrivals, origins,
   * etc.) into the simulation database from the seed data set.
   *
   * @param placeholder - Any string value. This is required by the framework, but it will be *
   * ignored.
   */
  @Override
  public void start(String placeholder) {

    final Duration seedDataSetLength = Duration.between(seedDataStartTime, seedDataEndTime);
    Instant nextLoadTime = preloadDataEndtime.plus(seedDataSetLength);
    logger.info("Next load time {}", nextLoadTime);
    Duration waitBeforeFiring = Duration.between(Instant.now(), nextLoadTime);

    if (waitBeforeFiring.isNegative()) {
      waitBeforeFiring = Duration.ZERO;
    }

    loadingDisposable = Flux.interval(waitBeforeFiring, seedDataSetLength)
      .subscribe(value ->
        loadWfdiscAndArrivalsFromSeed(preloadDataEndtime.plus(seedDataSetLength.multipliedBy(value))));
  }

  /**
   * Cancel the timer that periodically loads additional simulation data into the simulation
   * database from the seed data set.
   *
   * @param placeholder - Any string value. This is required by the framework, but it will be *
   * ignored.
   */
  @Override
  public void stop(String placeholder) {

    if (loadingDisposable != null) {
      loadingDisposable.dispose();
      loadingDisposable = null;
    }
  }

  /**
   * clear the current BridgedDataSourceSimulationSpec and deletes the simulation analysis data
   * (waveforms, arrivals, origins, etc.) from the simulation database (the seed data set is
   * unaffected).
   *
   * @param placeholder - Any string value. This is required by the framework, but it will be *
   * ignored.
   */
  @Override
  public void cleanup(String placeholder) {

    arrivalData = null;
    wfDiscData = null;
    wfTagData = null;
    idToWftagMap = null;
    backwardSeedData = null;
    nextArid = 1;
    nextWfid = 1;
    preloadDataEndtime = null;
    seedDataEndTime = null;
    seedDataStartTime = null;

    bridgedDataSourceRepository.cleanupData();
  }

  private void updateWfidAndTime(WfdiscDao wfdiscDao, Duration epochShift) {

    wfdiscDao.setjDate(wfdiscDao.getjDate().plus(epochShift));
    wfdiscDao.setEndTime(wfdiscDao.getEndTime().plus(epochShift));
    wfdiscDao.setTime(wfdiscDao.getTime().plus(epochShift));
    wfdiscDao.setId(nextWfid);
    nextWfid += 1;
  }

  private void updateAridAndTime(ArrivalDao arrivalDao, Duration epochShift) {

    arrivalDao.setjDate(arrivalDao.getjDate().plus(epochShift));
    arrivalDao.getArrivalKey().setTime(arrivalDao.getArrivalKey().getTime().plus(epochShift));
    arrivalDao.setId(nextArid);
    nextArid += 1;
  }

  private List<WfdiscDao> getCopyOfWfdiscList(List<WfdiscDao> wfdiscDaos) {

    List<WfdiscDao> newWfdiscList = new ArrayList<>();
    wfdiscDaos.forEach(wfdiscDao -> newWfdiscList.add(new WfdiscDao(wfdiscDao)));

    return newWfdiscList;
  }
}
