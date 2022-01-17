package gms.shared.waveform.manager.application;

import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.shared.waveform.manager.service.WaveformManager;
import gms.shared.frameworks.control.ControlFactory;
import org.slf4j.LoggerFactory;

public class WaveformManagerApplication {
  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(WaveformManagerApplication.class));

  private WaveformManagerApplication() {
  }

  public static void main(String[] args) {
    logger.info("Starting waveform-manager-service");

    ControlFactory.runService(WaveformManager.class);
  }
}

