package gms.shared.waveform.accessor;

import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.frameworks.test.utils.containers.ZooTestContainer;
import gms.shared.stationdefinition.api.StationDefinitionAccessorInterface;
import gms.shared.stationdefinition.factory.StationDefinitionAccessorFactory;
import gms.shared.waveform.repository.BridgedWaveformRepository;
import gms.shared.waveform.repository.BridgedWaveformRepositoryFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.mock;

@Disabled //zookeeper has been removed 8/5/2021
@ExtendWith(MockitoExtension.class)
class WaveformAccessorFactoryTest extends ZooTestContainer {

  @Mock
  private StationDefinitionAccessorFactory stationDefinitionAccessorFactory;

  @Mock
  private BridgedWaveformRepositoryFactory bridgedWaveformRepositoryFactory;

  @Mock
  private BridgedWaveformRepository bridgedWaveformRepository;

  @Mock
  private StationDefinitionAccessorInterface stationDefinitionAccessorImpl;

  @BeforeAll
  protected static void fixtureSetUp() {
    setUpContainer();
  }

  @AfterEach
  protected void testTeardown() {
    IgniteConnectionManager.close();
  }

  @AfterAll
  protected static void fixtureTeardown() {
    IgniteConnectionManager.close();
  }

  @Test
  void create() {
    assertNotNull(WaveformAccessorFactory.create(
        systemConfig, bridgedWaveformRepositoryFactory, stationDefinitionAccessorFactory));
  }

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(Class<? extends Exception> expectedException,
      SystemConfig systemConfig,
      BridgedWaveformRepositoryFactory bridgedWaveformRepositoryFactory,
      StationDefinitionAccessorFactory stationDefinitionAccessorFactory) {
    assertThrows(NullPointerException.class,
        () -> WaveformAccessorFactory.create(systemConfig, bridgedWaveformRepositoryFactory, stationDefinitionAccessorFactory));
  }

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(
        arguments(NullPointerException.class, null, mock(BridgedWaveformRepositoryFactory.class), mock(StationDefinitionAccessorFactory.class)),
        arguments(NullPointerException.class, mock(SystemConfig.class), null, mock(StationDefinitionAccessorFactory.class)),
        arguments(NullPointerException.class, mock(SystemConfig.class), mock(BridgedWaveformRepositoryFactory.class), null));
  }

  @Test
  void getWaveformAccessorInstance() {
    WaveformAccessorFactory factory = WaveformAccessorFactory.create(
        systemConfig, bridgedWaveformRepositoryFactory, stationDefinitionAccessorFactory);

    Mockito.when(bridgedWaveformRepositoryFactory.getBridgedWaveformRepositoryInstance())
        .thenReturn(bridgedWaveformRepository);
    Mockito.when(stationDefinitionAccessorFactory.getBridgedStationDefinitionAccessorInstance())
        .thenReturn(stationDefinitionAccessorImpl);

    assertNotNull(factory.getWaveformAccessorInstance());
  }

  @Test
  void getWaveformAccessorInstance_alreadyInitialized() {
    WaveformAccessorFactory factory = WaveformAccessorFactory.create(
        systemConfig, bridgedWaveformRepositoryFactory, stationDefinitionAccessorFactory);

    Mockito.when(bridgedWaveformRepositoryFactory.getBridgedWaveformRepositoryInstance())
        .thenReturn(bridgedWaveformRepository);
    Mockito.when(stationDefinitionAccessorFactory.getBridgedStationDefinitionAccessorInstance())
        .thenReturn(stationDefinitionAccessorImpl);
    WaveformAccessor accessor = factory.getWaveformAccessorInstance();
    WaveformAccessor accessor2 = factory.getWaveformAccessorInstance();
    assertEquals(accessor, accessor2);
  }
}
