package gms.shared.signaldetection.application;

import gms.shared.frameworks.control.ControlFactory;
import gms.shared.signaldetection.manager.SignalDetectionManager;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.slf4j.LoggerFactory;

public class SignalDetectionApplication {
  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(SignalDetectionApplication.class));

  public static void main(String[] args) {
    logger.info("Starting signal detection manager");

    try {
      ControlFactory.runService(SignalDetectionManager.class);
    } catch(Exception ex) {
      logger.error("Error creating control", ex);
    }

  }

}
