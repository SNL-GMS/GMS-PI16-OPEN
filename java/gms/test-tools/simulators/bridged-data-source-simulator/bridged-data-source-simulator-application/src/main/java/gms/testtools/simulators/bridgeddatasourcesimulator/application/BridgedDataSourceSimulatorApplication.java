package gms.testtools.simulators.bridgeddatasourcesimulator.application;


import gms.shared.frameworks.control.ControlFactory;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.slf4j.LoggerFactory;

/**
 * This is the main class used to the start a Bridged Data Source Simulator Service
 */
public abstract class BridgedDataSourceSimulatorApplication {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(BridgedDataSourceSimulatorApplication.class));

  private BridgedDataSourceSimulatorApplication() {
  }

  public static void main(String[] args) {
    logger.info("Starting bridged-data-source-simulator-service");

    ControlFactory.runService(BridgedDataSourceSimulatorController.class);
  }
}
