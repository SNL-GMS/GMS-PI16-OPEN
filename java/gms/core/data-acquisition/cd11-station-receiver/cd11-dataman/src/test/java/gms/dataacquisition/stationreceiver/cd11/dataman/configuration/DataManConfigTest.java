package gms.dataacquisition.stationreceiver.cd11.dataman.configuration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.dataacquisition.stationreceiver.cd11.common.configuration.Cd11DataConsumerParameters;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import java.io.File;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class DataManConfigTest {

  private static String configurationBase;

  private static final int DATA_CONSUMER_BASE_PORT = 8100;

  private static final RetryConfig retryConfig= RetryConfig.create(1,10, ChronoUnit.SECONDS,1);

  @BeforeAll
  static void setUp() {
    configurationBase = Thread.currentThread().getContextClassLoader()
        .getResource("gms/shared/frameworks/processing/configuration/service/configuration-base")
        .getPath();
  }

  @Test
  void testCreate() {
    assertDoesNotThrow(() -> DataManConfig
        .create(FileConfigurationRepository.create(new File(configurationBase).toPath()),
            DATA_CONSUMER_BASE_PORT, retryConfig));
  }

  @Test
  public void testConfig() {


    DataManConfig config = DataManConfig
        .create(FileConfigurationRepository.create(new File(configurationBase).toPath()),
            DATA_CONSUMER_BASE_PORT, retryConfig);

    List<Cd11DataConsumerParameters> stationList = config
        .cd11DataConsumerParameters().collect(Collectors.toList());

    assertNotNull(stationList);

    Cd11DataConsumerParameters parameters = stationList.get(0);

    assertEquals(8155, parameters.getPort());
    assertTrue(parameters.isAcquired());
    assertFalse(parameters.isFrameProcessingDisabled());
  }
}
