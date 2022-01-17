package gms.shared.stationdefinition.application;

import gms.shared.frameworks.control.ControlFactory;
import gms.shared.stationdefinition.accessor.StationDefinitionManager;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.slf4j.LoggerFactory;

public class StationDefinitionApplication {
  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(StationDefinitionApplication.class));

  private StationDefinitionApplication() {
  }

  public static void main(String[] args) {
    logger.info("Starting station-definition-service");

    ControlFactory.runService(StationDefinitionManager.class);
  }
}
