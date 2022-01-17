package gms.testtools.simulators.bridgeddatasourcesimulator.api;

import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.BridgedDataSourceSimulatorSpec;

public interface BridgedDataSourceSimulator {

  /**
   * Initializes the simulation data based off of the provided simulation specification.
   *
   * @param bridgedDataSourceSimulatorSpec - An {@link BridgedDataSourceSimulatorSpec} to provided
   * the simulation specification details.
   */
  void initialize(BridgedDataSourceSimulatorSpec bridgedDataSourceSimulatorSpec);

  /**
   * Starts the replication process of the simulation based off of the provided simulation
   * specification.
   *
   * @param placeholder - Any string value. This required by the framework, but it will be ignored.
   */
  void start(String placeholder);

  /**
   * Stops the replication process of the simulation.
   *
   * @param placeholder - Any string value. This required by the framework, but it will be ignored.
   */
  void stop(String placeholder);

  /**
   * Cleans up the data created as part the  the simulation.
   *
   * @param placeholder - Any string value. This required by the framework, but it will be ignored.
   */
  void cleanup(String placeholder);

}
