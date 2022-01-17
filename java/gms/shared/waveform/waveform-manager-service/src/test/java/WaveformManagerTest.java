import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.control.ControlContext;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider;
import gms.shared.waveform.manager.service.WaveformManager;
import javax.persistence.EntityManagerFactory;


import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

class WaveformManagerTest {

  @Test
  void getEntityManagerFactory() {

    ControlContext controlContext = mock(ControlContext.class);
    SystemConfig systemConfig = mock(SystemConfig.class);
    ConfigurationConsumerUtility configurationConsumerUtility = mock(ConfigurationConsumerUtility.class);
    BridgedEntityManagerFactoryProvider bridgedEMFProvider = mock(BridgedEntityManagerFactoryProvider.class);
    EntityManagerFactory entityManagerFactory = mock(EntityManagerFactory.class);

    when(controlContext.getSystemConfig()).thenReturn(systemConfig);
    when(controlContext.getProcessingConfigurationConsumerUtility()).thenReturn(configurationConsumerUtility);

    MockedStatic<BridgedEntityManagerFactoryProvider> createEmfMock = mockStatic(BridgedEntityManagerFactoryProvider.class);
    createEmfMock.when(() -> BridgedEntityManagerFactoryProvider.create()).thenReturn(bridgedEMFProvider);
    when(bridgedEMFProvider.getEntityManagerFactory(any(), eq(systemConfig))).thenReturn(entityManagerFactory);

    EntityManagerFactory entityManagerFactoryReceived = WaveformManager.getEntityManagerFactory(controlContext);
    assertEquals(entityManagerFactory, entityManagerFactoryReceived);
  }

}
