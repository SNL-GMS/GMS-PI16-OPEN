package gms.core.ui.processing.configuration.manager;

import gms.shared.frameworks.client.generation.ClientGenerator;
import gms.shared.frameworks.configuration.ConfigurationRepository;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Service providing Configuration to the interactive analysis components.
 */
@Path("/ui-processing-configuration-service")
public class UiProcessingConfigurationManager {

  private static final Logger logger = LoggerFactory.getLogger(UiProcessingConfigurationManager.class);

  static final String COMPONENT_NAME = "ui-processing-configuration-service";

  private final RetryConfig retryConfig;

  public UiProcessingConfigurationManager(RetryConfig retryConfig) {
    this.retryConfig = retryConfig;
  }

  /**
   * Create {@link UiProcessingConfigurationManager} from all it's dependencies
   *
   * @param retryConfig the retryConfig to use
   * @return a {@link UiProcessingConfigurationManager}
   * @throws NullPointerException if systemConfig or retryConfig is null
   */
  static UiProcessingConfigurationManager create(RetryConfig retryConfig) {
    Objects.requireNonNull(retryConfig, "RetryConfig cannot be null");

    return new UiProcessingConfigurationManager(retryConfig);
  }

  @Path("/resolve")
  @POST
  @Operation(description = "Resolves a configuration")
  public Map<String, Object> resolve(@RequestBody(
      description = "A query", required = true)
      ConfigQuery query) {
    try {
      return buildConfigurationConsumerUtility().resolve(query.getConfigurationName(), query.getSelectors());
    } catch(Exception ex) {
      logger.error("Error resolving configuration for query " + query, ex);
      return Map.of();
    }
  }

  private ConfigurationConsumerUtility buildConfigurationConsumerUtility() {
    var configRepo = ClientGenerator.createClient(ConfigurationRepository.class);
    return ConfigurationConsumerUtility
      .builder(configRepo)
      .retryConfiguration(retryConfig)
      .configurationNamePrefixes(List.of(
        "ui.analyst-settings", "ui.common-settings"))
      .build();
  }
}
