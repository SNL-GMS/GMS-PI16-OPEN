package gms.shared.workflow;

import gms.shared.frameworks.control.ControlFactory;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.shared.workflow.manager.WorkflowManager;
import org.slf4j.LoggerFactory;

public class WorkflowApplication {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(WorkflowApplication.class));

  private WorkflowApplication() {
  }

  public static void main(String[] args) {
    logger.info("Starting workflow-manager-service");

    ControlFactory.runService(WorkflowManager.class);
  }

}
