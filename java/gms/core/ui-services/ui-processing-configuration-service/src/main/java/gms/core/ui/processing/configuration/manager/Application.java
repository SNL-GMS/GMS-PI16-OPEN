package gms.core.ui.processing.configuration.manager;

import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.service.ServiceGenerator;
import gms.shared.frameworks.systemconfig.SystemConfig;

import java.time.temporal.ChronoUnit;

import static gms.core.ui.processing.configuration.manager.UiProcessingConfigurationManager.COMPONENT_NAME;

/**
 * Application for running the interactive analysis config service.
 */
public class Application {

  private Application() {
  }

  public static void main(String[] args) {
    var sysConfig = SystemConfig.create(COMPONENT_NAME);
    var retryConfig= RetryConfig
        .create(sysConfig.getValueAsInt("processing-retry-initial-delay"),sysConfig.getValueAsInt("processing-retry-max-delay"),
        ChronoUnit.valueOf(sysConfig.getValue("processing-retry-delay-units")),sysConfig.getValueAsInt("processing-retry-max-attempts"));
    ServiceGenerator.runService(
        UiProcessingConfigurationManager.create(retryConfig),
        sysConfig);
  }
}
