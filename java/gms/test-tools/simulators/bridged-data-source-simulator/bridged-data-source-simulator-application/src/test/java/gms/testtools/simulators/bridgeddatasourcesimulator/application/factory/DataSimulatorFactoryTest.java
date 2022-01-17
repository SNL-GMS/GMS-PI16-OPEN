package gms.testtools.simulators.bridgeddatasourcesimulator.application.factory;

import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class DataSimulatorFactoryTest {

  @Mock
  private BridgedEntityManagerFactoryProvider seedDataBridgedEntityManagerFactoryProvider;

  @Mock
  private BridgedEntityManagerFactoryProvider simulationBridgedEntityManagerFactoryProvider;

  @Mock
  private SystemConfig systemConfig;

  private final int CALIB_DELTA = 3;

  @BeforeEach
  public void testSetup() {

    var dataSimulatorFactory = DataSimulatorFactory.create(
        seedDataBridgedEntityManagerFactoryProvider,
        simulationBridgedEntityManagerFactoryProvider,
        systemConfig,
        CALIB_DELTA
    );

  }

  @ParameterizedTest
  @MethodSource("constructorValidationCases")
  void testConstructorValidation(
      BridgedEntityManagerFactoryProvider seedDataBridgedEntityManagerFactoryProvider,
      BridgedEntityManagerFactoryProvider simulationBridgedEntityManagerFactoryProvider,
      SystemConfig systemConfig
    ) {
    assertThrows(NullPointerException.class,
      () -> DataSimulatorFactory
        .create(
            seedDataBridgedEntityManagerFactoryProvider,
            simulationBridgedEntityManagerFactoryProvider,
            systemConfig,
            CALIB_DELTA)
    );
  }

  private static Stream<Arguments> constructorValidationCases() {
    return Stream.of(
        Arguments.arguments(
            null,
            mock(BridgedEntityManagerFactoryProvider.class),
            mock(SystemConfig.class)
        ),

        Arguments.arguments(
            mock(BridgedEntityManagerFactoryProvider.class),
            null,
            mock(SystemConfig.class)
        ),

        Arguments.arguments(
            mock(BridgedEntityManagerFactoryProvider.class),
            mock(BridgedEntityManagerFactoryProvider.class),
            null
        )
    );
  }

}