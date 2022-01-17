package gms.testtools.mockworkflow.application;

import gms.shared.frameworks.service.ServiceGenerator;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.slf4j.LoggerFactory;

public class MockWorkflowApplication {
  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(MockWorkflowApplication.class));

  private MockWorkflowApplication() {
  }

  public static void main(String[] args) {
    logger.info("Starting mock-workflow");


    final var config = SystemConfig.create("mock-workflow");
    ServiceGenerator.runService(
        MockWorkflowManager.create(config),
        config);
  }
}
