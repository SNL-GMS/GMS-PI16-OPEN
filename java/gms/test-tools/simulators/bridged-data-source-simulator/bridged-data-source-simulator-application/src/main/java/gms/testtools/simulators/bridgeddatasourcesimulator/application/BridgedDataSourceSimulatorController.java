package gms.testtools.simulators.bridgeddatasourcesimulator.application;

import gms.shared.frameworks.control.ControlContext;
import gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.testtools.simulators.bridgeddatasourceintervalsimulator.BridgedDataSourceIntervalSimulator;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.BridgedDataSourceDataSimulator;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.BridgedDataSourceSimulatorService;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.BridgedDataSourceSimulatorStateMachine;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.coi.Site;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.coi.SiteChan;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.BridgedDataSourceSimulatorSpec;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.BridgedDataSourceSimulatorStatus;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.SourceInterval;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.factory.DataSimulatorFactory;
import gms.testtools.simulators.bridgeddatasourcestationsimulator.BridgedDataSourceStationSimulator;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import org.apache.commons.lang3.Validate;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

/**
 * This is the backing implementation of the restful api defined in {@link
 * BridgedDataSourceSimulatorService} and is used the start the Bridged Data Source Simulator
 * Service in {@link BridgedDataSourceSimulatorApplication}.
 */
public class BridgedDataSourceSimulatorController extends
  BridgedDataSourceSimulatorStateMachine implements BridgedDataSourceSimulatorService {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(BridgedDataSourceSimulatorController.class));
  private final List<BridgedDataSourceDataSimulator> dataSimulators;

  private static final String SIMULATOR_BRIDGED_DATA_SOURCE_CONFIG = "simulator.bridged-data-source-config";
  private static final String DEFAULT_SCHEMA_CONFIG_KEY = "default_schema";
  private static final String SIMULATION_SCHEMA_CONFIG_KEY = "simulation_schema";
  private static final String CALIB_DELTA = "calib_delta";


  private BridgedDataSourceSimulatorController(
    List<BridgedDataSourceDataSimulator> dataSimulators) {
    super();
    this.dataSimulators = dataSimulators;
  }

  /**
   * Initializes a {@link BridgedDataSourceSimulatorController} by providing a Processing Config
   * {@link ControlContext}
   *
   * @param context - the context used to retrieve processing config.
   * @return an initialized {@link BridgedDataSourceSimulatorController}
   */
  public static BridgedDataSourceSimulatorController create(ControlContext context) {
    Validate.notNull(context, "ControlContext");

    //get config values
    var configurationConsumerUtility = context
      .getProcessingConfigurationConsumerUtility();

    Map<String, Object> processingConfig = configurationConsumerUtility
      .resolve(SIMULATOR_BRIDGED_DATA_SOURCE_CONFIG, List.of());

    var defaultSchemaConfigStringValue = getProcessingConfigStringValue(processingConfig,
      DEFAULT_SCHEMA_CONFIG_KEY, "Default Schema");
    var simulationSchemaConfigStringValue = getProcessingConfigStringValue(
      processingConfig,
      SIMULATION_SCHEMA_CONFIG_KEY, "Simulation Schema");

    var calibDeltaValue = (Integer) (processingConfig.getOrDefault(
      CALIB_DELTA, 5));

    //create database connections
    var seedDataEntityManagerFactoryProvider = BridgedEntityManagerFactoryProvider
      .create(defaultSchemaConfigStringValue);
    var simulationDataEntityManagerFactoryProvider = BridgedEntityManagerFactoryProvider
      .create(simulationSchemaConfigStringValue);

    var dataSimulatorFactory = DataSimulatorFactory
        .create(
            seedDataEntityManagerFactoryProvider,
            simulationDataEntityManagerFactoryProvider,
            calibDeltaValue
        );

    Runtime.getRuntime().addShutdownHook(new Thread(dataSimulatorFactory::cleanup));

    var bridgedDataSourceStationSimulator = dataSimulatorFactory
      .getBridgedDataSourceStationSimulatorInstance();

    var bridgedDataSourceAnalysisSimulator = dataSimulatorFactory
      .getBridgedDataSourceAnalysisSimulatorInstance();

    var bridgedDataSourceIntervalSimulator = dataSimulatorFactory
        .getBridgedDataSourceIntervalSimulatorInstance();

    List<BridgedDataSourceDataSimulator> dataSimulators = List
        .of(
            bridgedDataSourceStationSimulator,
            bridgedDataSourceAnalysisSimulator,
            bridgedDataSourceIntervalSimulator
        );

    return BridgedDataSourceSimulatorController.create(dataSimulators);
  }

  protected static BridgedDataSourceSimulatorController create(
    List<BridgedDataSourceDataSimulator> dataSimulators) {
    Validate.notNull(dataSimulators, "dataSimulators must be provided");
    Validate.notEmpty(dataSimulators, "dataSimulators must be provided");
    Validate.isTrue(dataSimulators.stream().noneMatch(Objects::isNull),
      "no null dataSimulators are allowed");

    return new BridgedDataSourceSimulatorController(dataSimulators);
  }

  private static String getProcessingConfigStringValue(Map<String, Object> processingConfig,
    String cacheKey, final String dataTypeString) {
    final Object configValue = processingConfig.get(cacheKey);
    final String errorMessage = String
      .format("No %s were found in processing config for simulation config.", dataTypeString);
    Validate.notNull(configValue, errorMessage);
    final String configStringValue = String.valueOf(configValue);
    Validate.isTrue(!configStringValue.isBlank(), errorMessage);
    return configStringValue;
  }

  /**
   * Verifies that the the state machine can be transitioned to the {@link
   * BridgedDataSourceSimulatorStatus#INITIALIZED} state using the {@link
   * BridgedDataSourceSimulatorTransition#INITIALIZE} transition.
   * <p>
   * If the transition is allowed, then {@link BridgedDataSourceDataSimulator#initialize(BridgedDataSourceSimulatorSpec)}
   * is called on each {@link BridgedDataSourceSimulatorController#dataSimulators}
   *
   * @param bridgedDataSourceSimulatorSpec - An {@link BridgedDataSourceSimulatorSpec} to provided
   * the simulation specification details.
   */
  @Override
  public void initialize(BridgedDataSourceSimulatorSpec bridgedDataSourceSimulatorSpec) {
    super.verifyInitializeTransition(bridgedDataSourceSimulatorSpec);
    logger.info("Valid Status Transition Detected. Initializing Simulation...");
    runFlux(simulator -> {
      simulator.initialize(bridgedDataSourceSimulatorSpec);
      return bridgedDataSourceSimulatorSpec;
    });
    super.initialize(bridgedDataSourceSimulatorSpec);
    logger.info("Simulation Initialized.");
  }

  /**
   * Verifies that the the state machine can be transitioned to the {@link
   * BridgedDataSourceSimulatorStatus#STARTED} state using the {@link
   * BridgedDataSourceSimulatorTransition#START} transition.
   * <p>
   * If the transition is allowed, then {@link BridgedDataSourceDataSimulator#start(String)} is
   * called on each {@link BridgedDataSourceSimulatorController#dataSimulators}
   *
   * @param placeholder - Any string value. This required by the framework, but it will be ignored.
   */
  @Override
  public void start(String placeholder) {
    super.verifyStartTransition();
    logger.info("Valid Status Transition Detected. Starting Simulation...");
    super.start(placeholder);
    logger.info("Simulation Started.");
    runFlux(simulator -> {
      simulator.start(placeholder);
      return placeholder;
    });
  }

  /**
   * Verifies that the the state machine can be transitioned to the {@link
   * BridgedDataSourceSimulatorStatus#STOPPED} state using the {@link
   * BridgedDataSourceSimulatorTransition#STOP} transition.
   * <p>
   * If the transition is allowed, then {@link BridgedDataSourceDataSimulator#stop(String)} is
   * called on each {@link BridgedDataSourceSimulatorController#dataSimulators}
   *
   * @param placeholder - Any string value. This required by the framework, but it will be ignored.
   */
  @Override
  public void stop(String placeholder) {
    super.verifyStopTransition();
    logger.info("Valid Status Transition Detected. Stopping Simulation...");
    runFlux(simulator -> {
      simulator.stop(placeholder);
      return placeholder;
    });
    super.stop(placeholder);
    logger.info("Simulation Stopped.");
  }


  /**
   * Verifies that the the state machine can be transitioned to the {@link
   * BridgedDataSourceSimulatorStatus#UNINITIALIZED} state using the {@link
   * BridgedDataSourceSimulatorTransition#CLEANUP} transition.
   * <p>
   * If the transition is allowed, then {@link BridgedDataSourceDataSimulator#cleanup(String)} is
   * called on each {@link BridgedDataSourceSimulatorController#dataSimulators}
   *
   * @param placeholder - Any string value. This required by the framework, but it will be ignored.
   */
  @Override
  public void cleanup(String placeholder) {
    super.verifyCleanupTransition();
    logger.info("Valid Status Transition Detected. Cleaning Up Simulation...");
    runFlux(simulator -> {
      simulator.cleanup(placeholder);
      return placeholder;
    });
    super.cleanup(placeholder);
    logger.info("Simulation Uninitialized.");
  }

  /**
   * Verifies that simulator is not in {@link BridgedDataSourceSimulatorStatus#UNINITIALIZED} state so that
   * {@link BridgedDataSourceSimulatorController#storeNewChannelVersions(Collection<SiteChan>)} can be called
   * <p>
   * - @param chans - A collections of SiteChan.
   */
  @Override
  public void storeNewChannelVersions(Collection<SiteChan> chans) {

    Validate.isTrue(super.status("status") != BridgedDataSourceSimulatorStatus.UNINITIALIZED,
      "Cannot store new channel versions if simulator is uninitialized.");

    Flux.fromIterable(dataSimulators)
      .parallel()
      .runOn(Schedulers.boundedElastic())
      .doOnNext(bridgedDataSourceDataSimulator -> {
        if (bridgedDataSourceDataSimulator instanceof BridgedDataSourceStationSimulator) {
          ((BridgedDataSourceStationSimulator) bridgedDataSourceDataSimulator).storeNewChannelVersions(chans);
        }
      })
      .sequential()
      .blockLast();

    logger.info("New Channel Versions stored.");
  }

  /**
   * Verifies that simulator is not in {@link BridgedDataSourceSimulatorStatus#UNINITIALIZED} state so that
   * {@link BridgedDataSourceSimulatorController#storeNewSiteVersions(Collection<Site>)} can be called
   * <p>
   * - @param sites - A collections of Sites.
   */
  @Override
  public void storeNewSiteVersions(Collection<Site> sites) {

    Validate.isTrue(super.status("status") != BridgedDataSourceSimulatorStatus.UNINITIALIZED,
      "Cannot store new site versions if simulator is uninitialized.");

    Flux.fromIterable(dataSimulators)
      .parallel()
      .runOn(Schedulers.boundedElastic())
      .doOnNext(bridgedDataSourceDataSimulator -> {
        if (bridgedDataSourceDataSimulator instanceof BridgedDataSourceStationSimulator) {
          ((BridgedDataSourceStationSimulator) bridgedDataSourceDataSimulator).storeNewSiteVersions(sites);
        }
      })
      .sequential()
      .blockLast();

    logger.info("New Site Versions stored.");
  }

  @Override
  public BridgedDataSourceSimulatorStatus status(String placeholder) {
    logger.info("Simulation Status Requested.");
    return super.status(placeholder);
  }

  @Override
  public void storeIntervals(List<SourceInterval> intervalList) {
    runFlux(simulator -> {
      if (simulator instanceof BridgedDataSourceIntervalSimulator) {
        ((BridgedDataSourceIntervalSimulator)simulator).storeIntervals(intervalList);
      }
      return true;
    });
  }

  protected <T> void runFlux(Function<BridgedDataSourceDataSimulator, T> simulatorConsumer) {
    Flux.fromIterable(dataSimulators)
      .parallel()
      .runOn(Schedulers.boundedElastic())
      .map(simulatorConsumer)
      .sequential()
      .blockLast();
  }

}
