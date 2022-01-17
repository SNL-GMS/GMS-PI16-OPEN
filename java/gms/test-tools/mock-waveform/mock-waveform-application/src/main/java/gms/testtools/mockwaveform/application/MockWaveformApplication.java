package gms.testtools.mockwaveform.application;

import gms.shared.frameworks.service.ServiceGenerator;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.slf4j.LoggerFactory;

public class MockWaveformApplication {
  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(MockWaveformApplication.class));

  private MockWaveformApplication() {
  }

  public static void main(String[] args) {
    logger.info("Starting mock-waveform-service");


    final SystemConfig config = SystemConfig.create("mock-waveform-service");
    ServiceGenerator.runService(
        MockWaveformController.create(),
        config);
  }
}
