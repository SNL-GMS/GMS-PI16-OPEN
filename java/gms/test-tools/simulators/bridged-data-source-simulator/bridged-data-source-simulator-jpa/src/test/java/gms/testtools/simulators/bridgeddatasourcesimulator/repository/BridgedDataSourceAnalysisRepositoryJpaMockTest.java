package gms.testtools.simulators.bridgeddatasourcesimulator.repository;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Map;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.EntityTransaction;
import javax.persistence.ParameterMode;
import javax.persistence.StoredProcedureQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BridgedDataSourceAnalysisRepositoryJpaMockTest {

  @Mock
  private EntityManagerFactory entityManagerFactory;
  @Mock
  private EntityManager entityManager;
  @Mock
  private EntityTransaction entityTransaction;
  @Mock
  private StoredProcedureQuery storedProcedure7;
  @Mock
  private StoredProcedureQuery storedProcedure8;
  @Mock
  private StoredProcedureQuery storedProcedure9;

  private static final String HIBERNATE_DEFAULT_SCHEMA = "hibernate.default_schema";
  private BridgedDataSourceRepository bridgedDataSourceAnalysisRepositoryJpa;

  @BeforeEach
  public void testSetup() {
    bridgedDataSourceAnalysisRepositoryJpa = BridgedDataSourceAnalysisRepositoryJpa
      .create(entityManagerFactory);
  }

  @Test
  void testCleanupAnalysisData() {
    final String schema_name = "SCHEMA_NAME";
    when(entityManagerFactory.createEntityManager()).thenReturn(entityManager);
    when(entityManagerFactory.getProperties()).thenReturn(Map.of(HIBERNATE_DEFAULT_SCHEMA,
      schema_name));
    when(entityManager.getEntityManagerFactory()).thenReturn(entityManagerFactory);
    when(entityManager.getTransaction()).thenReturn(entityTransaction);
    when(entityManager.createStoredProcedureQuery(
      schema_name + "." + BridgedDataSourceRepositoryJpa.SIMULATION_CLEANUP))
      .thenReturn(storedProcedure7, storedProcedure8, storedProcedure9);

    assertDoesNotThrow(() -> bridgedDataSourceAnalysisRepositoryJpa.cleanupData());

    verify(entityManagerFactory, times(1)).createEntityManager();
    final Map<String, StoredProcedureQuery> storedProcedures = Map
      .of("WFDISC", storedProcedure7,
        "ARRIVAL", storedProcedure8,
        "ORIGIN", storedProcedure9);
    verify(entityManager, times(storedProcedures.size()))
      .createStoredProcedureQuery(
        schema_name + "." + BridgedDataSourceRepositoryJpa.SIMULATION_CLEANUP);
    storedProcedures.forEach((tableName, storedProcedureQuery) -> {
      verify(storedProcedureQuery, times(1))
        .registerStoredProcedureParameter(BridgedDataSourceRepositoryJpa.I_TABLE_NAME,
          String.class, ParameterMode.IN);
      verify(storedProcedureQuery, times(1))
        .setParameter(BridgedDataSourceRepositoryJpa.I_TABLE_NAME, tableName);
      verify(storedProcedureQuery, times(1)).execute();
    });
    verify(entityManager, times(1)).close();
    verifyNoMoreInteractions(entityManagerFactory, entityManager,
      storedProcedure7, storedProcedure8, storedProcedure9);
  }

  @Test
  void testCleanupAnalysisData_missingSchema_error() {
    when(entityManagerFactory.createEntityManager()).thenReturn(entityManager);
    when(entityManagerFactory.getProperties()).thenReturn(new HashMap<>());
    when(entityManager.getEntityManagerFactory()).thenReturn(entityManagerFactory);
    when(entityManager.getTransaction()).thenReturn(entityTransaction);

    assertThrows(NullPointerException.class, () -> bridgedDataSourceAnalysisRepositoryJpa.cleanupData());
  }

  @Test
  void testCleanupAnalysisData_nullSchema() {
    final String schema_name = null;
    when(entityManagerFactory.createEntityManager()).thenReturn(entityManager);
    final HashMap<String, Object> properties = new HashMap<>();
    properties.put(HIBERNATE_DEFAULT_SCHEMA, schema_name);
    when(entityManagerFactory.getProperties()).thenReturn(properties);
    when(entityManager.getEntityManagerFactory()).thenReturn(entityManagerFactory);
    when(entityManager.getTransaction()).thenReturn(entityTransaction);

    assertThrows(NullPointerException.class, () -> bridgedDataSourceAnalysisRepositoryJpa.cleanupData());
  }

  @Test
  void testCleanupAnalysisData_emptySchema_error() {
    final String schema_name = "";
    when(entityManagerFactory.createEntityManager()).thenReturn(entityManager);
    when(entityManagerFactory.getProperties()).thenReturn(Map.of(HIBERNATE_DEFAULT_SCHEMA,
      schema_name));
    when(entityManager.getEntityManagerFactory()).thenReturn(entityManagerFactory);
    when(entityManager.getTransaction()).thenReturn(entityTransaction);

    assertThrows(IllegalArgumentException.class, () -> bridgedDataSourceAnalysisRepositoryJpa.cleanupData());
  }

  @Test
  void testCleanupAnalysisData_blankSchema_error() {
    final String schema_name = " ";
    when(entityManagerFactory.createEntityManager()).thenReturn(entityManager);
    when(entityManagerFactory.getProperties()).thenReturn(Map.of(HIBERNATE_DEFAULT_SCHEMA,
      schema_name));
    when(entityManager.getEntityManagerFactory()).thenReturn(entityManagerFactory);
    when(entityManager.getTransaction()).thenReturn(entityTransaction);

    assertThrows(IllegalArgumentException.class, () -> bridgedDataSourceAnalysisRepositoryJpa.cleanupData());
  }
}
