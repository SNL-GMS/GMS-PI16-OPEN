package gms.testtools.simulators.bridgeddatasourcesimulator.application.factory;

import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.signaldetection.database.connector.factory.SignalDetectionDatabaseConnectorFactory;
import gms.shared.stationdefinition.database.connector.factory.StationDefinitionDatabaseConnectorFactory;
import gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider;
import gms.shared.workflow.repository.IntervalDatabaseConnectorFactory;
import gms.testtools.simulators.bridgeddatasourceanalysissimulator.BridgedDataSourceAnalysisSimulator;
import gms.testtools.simulators.bridgeddatasourceintervalsimulator.BridgedDataSourceIntervalSimulator;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.BridgedDataSourceSimulatorController;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceAnalysisRepositoryJpa;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceIntervalRepositoryJpa;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceStationRepositoryJpa;
import gms.testtools.simulators.bridgeddatasourcestationsimulator.BridgedDataSourceStationSimulator;

import java.util.ArrayList;
import java.util.List;
import javax.persistence.EntityManagerFactory;

import org.apache.commons.lang3.Validate;

/**
 * This is a utility class for building the dependencies of a Bridged Data Source Simulator Service
 * in singleton patterns. This will help simplify the initialization of a {@link
 * BridgedDataSourceSimulatorController}.
 */
public class DataSimulatorFactory {

  private static final String STATION_DEFINITION_PERSISTENCE_UNIT = "gms_station_definition";
  private static final String ANALYSIS_SIMULATION_PERSISTENCE_UNIT = "gms_analysis_simulation";
  private static final String ANALYSIS_PERSISTENCE_UNIT = "gms_signal_detection";
  private static final String WORKFLOW_PERSISTENCE_UNIT = "workflow-dao";

  private static final String SEED_SYSTEM_CONFIG_ROOT = "bridged-data-source-simulator.seed";
  private static final String SIMULATION_SYSTEM_CONFIG_ROOT = "bridged-data-source-simulator.simulation";
  private final SystemConfig seedConfig;
  private final SystemConfig simulationConfig;

  private BridgedDataSourceStationSimulator bridgedDataSourceStationSimulatorInstance;
  private BridgedDataSourceAnalysisSimulator bridgedDataSourceAnalysisSimulatorInstance;
  private BridgedDataSourceIntervalSimulator bridgedDataSourceIntervalSimulatorInstance;

  private final BridgedEntityManagerFactoryProvider seedDataBridgedEntityManagerFactoryProvider;
  private final BridgedEntityManagerFactoryProvider simulationBridgedEntityManagerFactoryProvider;

  private final List<Runnable> cleanupHookList = new ArrayList<>();

  private final int calibDeltaValue;

  private DataSimulatorFactory(
    BridgedEntityManagerFactoryProvider seedDataBridgedEntityManagerFactoryProvider,
    BridgedEntityManagerFactoryProvider simulationBridgedEntityManagerFactoryProvider,
    SystemConfig systemConfig,
    int calibDeltaValue
  ) {
    this.seedDataBridgedEntityManagerFactoryProvider = seedDataBridgedEntityManagerFactoryProvider;
    this.simulationBridgedEntityManagerFactoryProvider = simulationBridgedEntityManagerFactoryProvider;

    this.seedConfig = systemConfig;
    this.simulationConfig = systemConfig;
    this.calibDeltaValue = calibDeltaValue;
  }

  private DataSimulatorFactory(
    BridgedEntityManagerFactoryProvider seedDataBridgedEntityManagerFactoryProvider,
    BridgedEntityManagerFactoryProvider simulationBridgedEntityManagerFactoryProvider,
    int calibDeltaValue
  ) {
    this.seedDataBridgedEntityManagerFactoryProvider = seedDataBridgedEntityManagerFactoryProvider;
    this.simulationBridgedEntityManagerFactoryProvider = simulationBridgedEntityManagerFactoryProvider;

    this.seedConfig = SystemConfig.create(SEED_SYSTEM_CONFIG_ROOT);
    this.simulationConfig = SystemConfig.create(SIMULATION_SYSTEM_CONFIG_ROOT);
    this.calibDeltaValue = calibDeltaValue;
  }

  /**
   * Initializes a factory to manage the creation of items in the dependency graph of a Bridged Data
   * Source Simulator Service. This is only used for testing.
   *
   * @param seedDataBridgedEntityManagerFactoryProvider BridgedEntityManagerFactoryProvider for seed
   * data
   * @param simulationBridgedEntityManagerFactoryProvider BridgedEntityManagerFactoryProvider for the
   * simulated data.
   * @param systemConfig system config to use, likely to ba a mock
   * @param calibDeltaValue the percent by which to update the calibration value
   */
  static DataSimulatorFactory create(
    BridgedEntityManagerFactoryProvider seedDataBridgedEntityManagerFactoryProvider,
    BridgedEntityManagerFactoryProvider simulationBridgedEntityManagerFactoryProvider,
    SystemConfig systemConfig,
    int calibDeltaValue
  ) {
    Validate.notNull(seedDataBridgedEntityManagerFactoryProvider);
    Validate.notNull(simulationBridgedEntityManagerFactoryProvider);
    Validate.notNull(systemConfig);

    return new DataSimulatorFactory(
      seedDataBridgedEntityManagerFactoryProvider,
      simulationBridgedEntityManagerFactoryProvider,
      systemConfig,
      calibDeltaValue
    );
  }

  /**
   * Initializes a factory to manage the creation of items in the dependency graph of a Bridged Data
   * Source Simulator Service.
   *
   * @param seedDataBridgedEntityManagerFactoryProvider BridgedEntityManagerFactoryProvider for seed
   * data
   * @param simulationBridgedEntityManagerFactoryProvider BridgedEntityManagerFactoryProvider for the
   * simulated data.
   * @param calibDeltaValue the percent by which to update the calibration value
   */
  public static DataSimulatorFactory create(
    BridgedEntityManagerFactoryProvider seedDataBridgedEntityManagerFactoryProvider,
    BridgedEntityManagerFactoryProvider simulationBridgedEntityManagerFactoryProvider,
    int calibDeltaValue
  ) {
    Validate.notNull(seedDataBridgedEntityManagerFactoryProvider);
    Validate.notNull(simulationBridgedEntityManagerFactoryProvider);

    return new DataSimulatorFactory(
      seedDataBridgedEntityManagerFactoryProvider,
      simulationBridgedEntityManagerFactoryProvider,
      calibDeltaValue
    );
  }


  /**
   * Initializes or returns a {@link BridgedDataSourceStationSimulator} using a singleton pattern.
   *
   * @return {@link DataSimulatorFactory#bridgedDataSourceStationSimulatorInstance}
   */
  public BridgedDataSourceStationSimulator getBridgedDataSourceStationSimulatorInstance() {
    if (bridgedDataSourceStationSimulatorInstance == null) {

      var stationDefinitionSeedDataJpaRepositoryFactory =
        StationDefinitionDatabaseConnectorFactory.create(
          addToCleanupHooks(
            seedDataBridgedEntityManagerFactoryProvider.getEntityManagerFactory(
              STATION_DEFINITION_PERSISTENCE_UNIT, seedConfig
            )
          )
        );

      bridgedDataSourceStationSimulatorInstance = BridgedDataSourceStationSimulator
        .create(
          stationDefinitionSeedDataJpaRepositoryFactory.getNetworkDatabaseConnectorInstance(),
          stationDefinitionSeedDataJpaRepositoryFactory
            .getAffiliationDatabaseConnectorInstance(),
          stationDefinitionSeedDataJpaRepositoryFactory.getSiteDatabaseConnectorInstance(),
          stationDefinitionSeedDataJpaRepositoryFactory.getSiteChanDatabaseConnectorInstance(),
          stationDefinitionSeedDataJpaRepositoryFactory.getSensorDatabaseConnectorInstance(),
          stationDefinitionSeedDataJpaRepositoryFactory
            .getInstrumentDatabaseConnectorInstance(),

          BridgedDataSourceStationRepositoryJpa.create(
            addToCleanupHooks(
              simulationBridgedEntityManagerFactoryProvider.getEntityManagerFactory(
                STATION_DEFINITION_PERSISTENCE_UNIT, simulationConfig
              )
            )
          )

        );
    }
    return bridgedDataSourceStationSimulatorInstance;
  }

  /**
   * Initializes or returns a {@link BridgedDataSourceAnalysisSimulator} using a singleton pattern.
   *
   * @return {@link DataSimulatorFactory#bridgedDataSourceAnalysisSimulatorInstance}
   */
  public BridgedDataSourceAnalysisSimulator getBridgedDataSourceAnalysisSimulatorInstance() {
    if (bridgedDataSourceAnalysisSimulatorInstance == null) {

      SignalDetectionDatabaseConnectorFactory signalDetectionDatabaseConnectorFactory =
        SignalDetectionDatabaseConnectorFactory.create(
          addToCleanupHooks(
            seedDataBridgedEntityManagerFactoryProvider.getEntityManagerFactory(
              ANALYSIS_PERSISTENCE_UNIT, seedConfig
            )
          )
        );

      StationDefinitionDatabaseConnectorFactory stationDefinitionDatabaseConnectorFactory =
        StationDefinitionDatabaseConnectorFactory.create(
          addToCleanupHooks(
            seedDataBridgedEntityManagerFactoryProvider.getEntityManagerFactory(
              ANALYSIS_SIMULATION_PERSISTENCE_UNIT, seedConfig
            )
          )
        );

      bridgedDataSourceAnalysisSimulatorInstance = BridgedDataSourceAnalysisSimulator
        .create(
          signalDetectionDatabaseConnectorFactory.getArrivalDatabaseConnectorInstance(),
          stationDefinitionDatabaseConnectorFactory.getWfdiscDatabaseConnectorInstance(),
          stationDefinitionDatabaseConnectorFactory.getWftagfDatabaseConnectorInstance(),
          stationDefinitionDatabaseConnectorFactory.getBeamDatabaseConnectorInstance(),
          BridgedDataSourceAnalysisRepositoryJpa.create(
            addToCleanupHooks(
              simulationBridgedEntityManagerFactoryProvider.getEntityManagerFactory(
                ANALYSIS_SIMULATION_PERSISTENCE_UNIT, simulationConfig
              )
            )
          ),
          calibDeltaValue);
    }
    return bridgedDataSourceAnalysisSimulatorInstance;
  }

  /**
   * Initializes or returns a {@link BridgedDataSourceIntervalSimulator} using a singleton pattern.
   *
   * @return {@link DataSimulatorFactory#bridgedDataSourceIntervalSimulatorInstance}
   */
  public BridgedDataSourceIntervalSimulator getBridgedDataSourceIntervalSimulatorInstance() {
    if (bridgedDataSourceIntervalSimulatorInstance == null) {
      bridgedDataSourceIntervalSimulatorInstance = BridgedDataSourceIntervalSimulator
        .create(
          IntervalDatabaseConnectorFactory
            .create(
              addToCleanupHooks(
                seedDataBridgedEntityManagerFactoryProvider
                  .getEntityManagerFactory(WORKFLOW_PERSISTENCE_UNIT, seedConfig))
            )
            .getIntervalDatabaseConnectorInstance(),
          BridgedDataSourceIntervalRepositoryJpa.create(
            addToCleanupHooks(
              simulationBridgedEntityManagerFactoryProvider.getEntityManagerFactory(
                WORKFLOW_PERSISTENCE_UNIT, simulationConfig
              )
            )
          )
        );
    }
    return bridgedDataSourceIntervalSimulatorInstance;
  }

  /**
   * Perform clean up, such as closing all of the entity menager factories.
   */
  public void cleanup() {
    cleanupHookList.forEach(Runnable::run);
  }

  private EntityManagerFactory addToCleanupHooks(EntityManagerFactory entityManagerFactory) {

    cleanupHookList.add(entityManagerFactory::close);

    return entityManagerFactory;
  }

}
