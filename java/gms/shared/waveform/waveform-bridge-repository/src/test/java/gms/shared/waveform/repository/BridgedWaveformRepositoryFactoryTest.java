package gms.shared.waveform.repository;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.mock;

import gms.shared.stationdefinition.api.StationDefinitionManagerInterface;
import java.util.stream.Stream;
import javax.persistence.EntityManagerFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BridgedWaveformRepositoryFactoryTest {

  @Mock
  private EntityManagerFactory emf;

  @Mock
  private BridgedWaveformRepository bridgedWaveformRepository;

  @Mock
  private StationDefinitionManagerInterface StationDefinitionManagerInterface;

  @Test
  void create() {
    assertNotNull(BridgedWaveformRepositoryFactory.create(emf, StationDefinitionManagerInterface));
  }

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(Class<? extends Exception> expectedException,
      EntityManagerFactory emf,
      StationDefinitionManagerInterface sda) {
    assertThrows(expectedException,
        () -> BridgedWaveformRepositoryFactory.create(emf, sda));
  }
  static Stream<Arguments> getCreateArguments() {
    return Stream.of(
        arguments(NullPointerException.class, null, mock(StationDefinitionManagerInterface.class)),
        arguments(NullPointerException.class, mock(EntityManagerFactory.class), null));
  }

  @Test
  void getBridgedWaveformRepositoryInstance() {
    BridgedWaveformRepositoryFactory factory =
        BridgedWaveformRepositoryFactory.create(emf, StationDefinitionManagerInterface);

    assertNotNull(factory.getBridgedWaveformRepositoryInstance());
  }
  @Test
  void getBridgedWaveformRepositoryInstance_alreadyInitialized() {
    BridgedWaveformRepositoryFactory factory =
        BridgedWaveformRepositoryFactory.create(emf, StationDefinitionManagerInterface);

    var instance = factory.getBridgedWaveformRepositoryInstance();
    var instance2 = factory.getBridgedWaveformRepositoryInstance();
    assertEquals(instance, instance2);
  }
}
