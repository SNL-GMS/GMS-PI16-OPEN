package gms.core.ui.processing.configuration.manager;

import gms.shared.frameworks.client.generation.ClientGenerator;
import gms.shared.frameworks.configuration.ConfigurationRepository;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

class UiProcessingConfigurationManagerTests {

  private RetryConfig retryConfig;

  private UiProcessingConfigurationManager manager;

  @BeforeEach
  void setup() {
    retryConfig = mock(RetryConfig.class);
    manager = UiProcessingConfigurationManager.create(retryConfig);
    assertNotNull(manager);
  }

  @Test
  void testCreateValidation() {
    NullPointerException exception = assertThrows(NullPointerException.class,
      () -> UiProcessingConfigurationManager.create(null));
    assertEquals("RetryConfig cannot be null", exception.getMessage());
  }

  @Test
  @Disabled("resolve static mocking issues")
  void testResolve() {
    ConfigurationRepository configRepo = mock(ConfigurationRepository.class);
    MockedStatic<ClientGenerator> createClientGeneratorMock = mockStatic(ClientGenerator.class);
    createClientGeneratorMock.when(() -> ClientGenerator.createClient(ConfigurationRepository.class))
      .thenReturn(configRepo);

    ConfigurationConsumerUtility.Builder builder = mock(ConfigurationConsumerUtility.Builder.class);
    MockedStatic<ConfigurationConsumerUtility> createBuilderMock =
      mockStatic(ConfigurationConsumerUtility.class);
    createBuilderMock.when(() -> ConfigurationConsumerUtility.builder(configRepo)).thenReturn(builder);

    ConfigurationConsumerUtility configurationConsumer = mock(ConfigurationConsumerUtility.class);
    when(builder.build()).thenReturn(configurationConsumer);

    when(configurationConsumer.resolve(TestFixture.query.getConfigurationName(), TestFixture.query.getSelectors()))
        .thenReturn(TestFixture.result);
    assertEquals(TestFixture.result, manager.resolve(TestFixture.query));
  }
}
