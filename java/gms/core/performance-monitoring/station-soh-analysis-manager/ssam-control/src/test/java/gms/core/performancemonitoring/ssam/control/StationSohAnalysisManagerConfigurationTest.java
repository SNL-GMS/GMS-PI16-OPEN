package gms.core.performancemonitoring.ssam.control;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

import gms.core.performancemonitoring.soh.control.configuration.StationGroupNamesConfigurationOption;
import gms.core.performancemonitoring.ssam.control.StationSohAnalysisManagerConfiguration;
import gms.core.performancemonitoring.ssam.control.config.StationSohMonitoringDisplayParameters;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.osd.api.OsdRepositoryInterface;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;


public class StationSohAnalysisManagerConfigurationTest {

  private static final String STATION_SOH_PREFIX = "soh-control";
  private static final String UI_CONFIG_NAME = "ui.soh-settings";


  @Test
  public void testStationSohAnalysisManagerConfiguration() {

    var stationGroups = List.of("Group1", "Group2", "Group3", "Group4");
    var configurationConsumerUtility = Mockito.mock(ConfigurationConsumerUtility.class);
    var stationGroupNamesConfigurationOption = StationGroupNamesConfigurationOption
        .create(stationGroups);

    Mockito.when(configurationConsumerUtility
        .resolve(eq(STATION_SOH_PREFIX + ".station-group-names"), any(List.class),
            eq(StationGroupNamesConfigurationOption.class)))
        .thenReturn(stationGroupNamesConfigurationOption);

    Mockito.when(configurationConsumerUtility
        .resolve(eq(STATION_SOH_PREFIX), any(List.class)))
        .thenReturn(Map.of("reprocessingPeriod", "PT20S"));

    Mockito.when(configurationConsumerUtility
        .resolve(eq(STATION_SOH_PREFIX + ".rollup-stationsoh-time-tolerance"), any(List.class)))
        .thenReturn(Map.of("rollupStationSohTimeTolerance", "PT30S"));

    var osdRepositoryInterface = Mockito.mock(OsdRepositoryInterface.class);
    var stationSohAnalysisManagerConfiguration = StationSohAnalysisManagerConfiguration
        .create(configurationConsumerUtility, osdRepositoryInterface);

    var stationSohMonitoringDisplayParameters = Mockito
        .mock(StationSohMonitoringDisplayParameters.class);

    Mockito.when(configurationConsumerUtility
        .resolve(eq(UI_CONFIG_NAME), any(List.class),
            eq(StationSohMonitoringDisplayParameters.class)))
        .thenReturn(stationSohMonitoringDisplayParameters);

    Assertions.assertEquals(Duration.ofSeconds(20),
        stationSohAnalysisManagerConfiguration.reprocessingPeriod());

    Assertions.assertEquals(stationSohAnalysisManagerConfiguration.getSohRepositoryInterface(),
        osdRepositoryInterface);

    Assertions.assertEquals(stationGroups,
        stationSohAnalysisManagerConfiguration.resolveDisplayParameters()
            .getStationSohControlConfiguration().getDisplayedStationGroups());

    Assertions.assertEquals(Duration.ofSeconds(30),
        stationSohAnalysisManagerConfiguration.resolveDisplayParameters()
            .getStationSohControlConfiguration().getRollupStationSohTimeTolerance());

    Assertions.assertEquals(0, stationSohAnalysisManagerConfiguration.stationGroups().size());

  }

}
