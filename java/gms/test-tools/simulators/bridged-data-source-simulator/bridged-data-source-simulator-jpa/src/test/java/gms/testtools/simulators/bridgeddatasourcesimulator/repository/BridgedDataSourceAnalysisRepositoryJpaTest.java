package gms.testtools.simulators.bridgeddatasourcesimulator.repository;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.utilities.bridge.database.converter.InstantToDoubleConverterNegativeNa;

import java.time.Instant;
import java.util.List;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class BridgedDataSourceAnalysisRepositoryJpaTest extends CssDbTest<BridgedDataSourceAnalysisRepositoryJpa> {

  private WfdiscDatabaseConnector wfdiscRepositoryJpa;
  private WfdiscDatabaseConnector simWfdiscRepositoryJpa;

  @Override
  @BeforeEach
  public void testSetup() {
    super.testSetup();
    wfdiscRepositoryJpa = WfdiscDatabaseConnector.create(CssDbTest.entityManagerFactory);
    simWfdiscRepositoryJpa = WfdiscDatabaseConnector.create(CssDbTest.simEntityManagerFactory);
  }

  @Override
  protected BridgedDataSourceAnalysisRepositoryJpa getRepository(EntityManagerFactory entityManagerFactory) {
    return BridgedDataSourceAnalysisRepositoryJpa
      .create(entityManagerFactory);
  }

  @Override
  protected BridgedDataSourceAnalysisRepositoryJpa getSimRepository(EntityManagerFactory entityManagerFactory) {
    return BridgedDataSourceAnalysisRepositoryJpa
      .create(entityManagerFactory);
  }

  @Test
  void testCleanupAnalysisData_simulationSchema() {

    final long JOE = 3145L;
    final long JIM = 99L;
    final InstantToDoubleConverterNegativeNa instantConverter = new InstantToDoubleConverterNegativeNa();
    final Instant time = instantConverter.convertToEntityAttribute(1608149376.000000);
    List<WfdiscDao> simWfdiscs = simWfdiscRepositoryJpa
      .findWfdiscsByWfids(List.of(JOE));

    assertNotNull(simWfdiscs);
    assertFalse(simWfdiscs.isEmpty());

    assertDoesNotThrow(() -> simRepository.cleanupData());

    final List<WfdiscDao> wfdiscs = wfdiscRepositoryJpa
      .findWfdiscsByWfids(List.of(JIM));

    assertNotNull(wfdiscs);
    assertFalse(wfdiscs.isEmpty());
    assertTrue(wfdiscs.stream()
      .allMatch(a -> a.getChannelId() == 1 && a.getId() == 99));

    simWfdiscs = simWfdiscRepositoryJpa
      .findWfdiscsByWfids(List.of(JOE));

    assertNotNull(simWfdiscs);
    assertTrue(simWfdiscs.isEmpty());
  }

  @Test
  void testCleanupAnalysisData_seedSchema_error() {
    final PersistenceException persistenceException = assertThrows(PersistenceException.class,
      () -> repository.cleanupData());

    assertEquals("Function \"SIMULATION_CLEANUP\" not found; SQL statement:\n"
      + " call GMS_GLOBAL.SIMULATION_CLEANUP(?)  [90022-200]", persistenceException.getCause().getCause().getMessage());
  }
}
