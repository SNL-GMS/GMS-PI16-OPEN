package gms.dataacquisition.stationreceiver.cd11.dataman.configuration;

import static com.google.common.base.Preconditions.checkNotNull;

import gms.dataacquisition.stationreceiver.cd11.common.configuration.Cd11DataConsumerParameters;
import gms.dataacquisition.stationreceiver.cd11.common.configuration.Cd11DataConsumerParametersTemplatesFile;
import gms.shared.frameworks.configuration.ConfigurationRepository;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import java.util.Collections;
import java.util.List;
import java.util.function.UnaryOperator;
import java.util.stream.Stream;

public class DataManConfig {

  private static final String SEPARATOR = ".";
  private static final String CONFIGURATION_NAME_PREFIX = "dataman" + SEPARATOR;
  private static final UnaryOperator<String> KEY_BUILDER = s -> CONFIGURATION_NAME_PREFIX + s;

  private final ConfigurationConsumerUtility configurationConsumerUtility;
  private static final String CONFIGURATION_NAME =
      KEY_BUILDER.apply("station-parameters");

  private final int cd11DataConsumerBasePort;

  private DataManConfig(ConfigurationConsumerUtility configurationConsumerUtility,
      int dataConsumerBasePort) {
    this.configurationConsumerUtility = configurationConsumerUtility;
    this.cd11DataConsumerBasePort = dataConsumerBasePort;
  }

  public static DataManConfig create(
      ConfigurationConsumerUtility processingConfigurationConsumerUtility, int dataConsumerBasePort) {
    return new DataManConfig(processingConfigurationConsumerUtility, dataConsumerBasePort);
  }

  public static DataManConfig create(ConfigurationRepository configurationRepository,
      int dataConsumerBasePort, RetryConfig retryConfig) {

    checkNotNull(configurationRepository,
        "Cd11StationConfigurationControl cannot be created with null "
            + "ConfigurationRepository");

    // Construct a ConfigurationConsumerUtility with the provided configurationRepository and
    // the necessary ConfigurationTransforms
    final ConfigurationConsumerUtility configurationConsumerUtility = ConfigurationConsumerUtility
        .builder(configurationRepository)
        .configurationNamePrefixes(List.of(CONFIGURATION_NAME_PREFIX))
        .retryConfiguration(retryConfig)
        .build();

    return new DataManConfig(configurationConsumerUtility, dataConsumerBasePort);
  }


  public Stream<Cd11DataConsumerParameters> cd11DataConsumerParameters() {
    Cd11DataConsumerParametersTemplatesFile stationConfig = configurationConsumerUtility
        .resolve(CONFIGURATION_NAME, Collections.emptyList(),
            Cd11DataConsumerParametersTemplatesFile.class);

    return stationConfig.getCd11DataConsumerParametersTemplates().stream()
        .map(template -> Cd11DataConsumerParameters.create(template, cd11DataConsumerBasePort));
  }
}
