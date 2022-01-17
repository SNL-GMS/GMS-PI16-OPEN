package gms.testtools.simulators.bridgeddatasourcesimulator.repository;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.EntityTransaction;
import javax.persistence.ParameterMode;
import javax.persistence.StoredProcedureQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BridgedDataSourceStationRepositoryJpaMockTest {

  @Mock
  private EntityManagerFactory entityManagerFactory;
  @Mock
  private EntityManager entityManager;
  @Mock
  private EntityTransaction entityTransaction;
  @Mock
  private StoredProcedureQuery storedProcedure1;
  @Mock
  private StoredProcedureQuery storedProcedure2;
  @Mock
  private StoredProcedureQuery storedProcedure3;
  @Mock
  private StoredProcedureQuery storedProcedure4;
  @Mock
  private StoredProcedureQuery storedProcedure5;
  @Mock
  private StoredProcedureQuery storedProcedure6;

  private static final String HIBERNATE_DEFAULT_SCHEMA = "hibernate.default_schema";
  private BridgedDataSourceRepository bridgedDataSourceStationRepositoryJpa;

  @BeforeEach
  public void testSetup() {
    bridgedDataSourceStationRepositoryJpa = BridgedDataSourceStationRepositoryJpa
      .create(entityManagerFactory);
  }

  @ParameterizedTest
  @MethodSource("constructorValidationCases")
  void testConstructorValidation(EntityManagerFactory entityManagerFactory) {
    assertThrows(NullPointerException.class,
      () -> BridgedDataSourceRepositoryJpa.create(entityManagerFactory));
  }

  private static Stream<Arguments> constructorValidationCases() {
    EntityManagerFactory nullEntityManagerFactory = null;
    return Stream.of(
      Arguments.arguments(nullEntityManagerFactory)
    );
  }

  @Test
  void testCleanupStationData() {
    final String schema_name = "SCHEMA_NAME";
    when(entityManagerFactory.createEntityManager()).thenReturn(entityManager);
    when(entityManagerFactory.getProperties()).thenReturn(Map.of(HIBERNATE_DEFAULT_SCHEMA,
      schema_name));
    when(entityManager.getEntityManagerFactory()).thenReturn(entityManagerFactory);
    when(entityManager.getTransaction()).thenReturn(entityTransaction);
    when(entityManager.createStoredProcedureQuery(
      schema_name + "." + BridgedDataSourceRepositoryJpa.SIMULATION_CLEANUP))
      .thenReturn(storedProcedure1, storedProcedure2, storedProcedure3, storedProcedure4,
        storedProcedure5, storedProcedure6);

    assertDoesNotThrow(() -> bridgedDataSourceStationRepositoryJpa.cleanupData());

    verify(entityManagerFactory, times(1)).createEntityManager();
    final Map<String, StoredProcedureQuery> storedProcedures = Map
      .of("AFFILIATION", storedProcedure1,
        "INSTRUMENT", storedProcedure2,
        "NETWORK", storedProcedure3,
        "SENSOR", storedProcedure4,
        "SITE", storedProcedure5,
        "SITECHAN", storedProcedure6);
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
      this.storedProcedure1, storedProcedure2, storedProcedure3,
      storedProcedure4, storedProcedure5, storedProcedure6);
  }

  @Test
  void testCleanupStationData_missingSchema_error() {
    when(entityManagerFactory.createEntityManager()).thenReturn(entityManager);
    when(entityManagerFactory.getProperties()).thenReturn(new HashMap<>());
    when(entityManager.getEntityManagerFactory()).thenReturn(entityManagerFactory);
    when(entityManager.getTransaction()).thenReturn(entityTransaction);

    assertThrows(NullPointerException.class, () -> bridgedDataSourceStationRepositoryJpa.cleanupData());
  }

  @Test
  void testCleanupStationData_nullSchema() {
    final String schema_name = null;
    when(entityManagerFactory.createEntityManager()).thenReturn(entityManager);
    final HashMap<String, Object> properties = new HashMap<>();
    properties.put(HIBERNATE_DEFAULT_SCHEMA, schema_name);

    assertThrows(NullPointerException.class, () -> bridgedDataSourceStationRepositoryJpa.cleanupData());
  }

  @Test
  void testCleanupStationData_emptySchema_error() {
    final String schema_name = "";
    when(entityManagerFactory.createEntityManager()).thenReturn(entityManager);
    when(entityManagerFactory.getProperties()).thenReturn(Map.of(HIBERNATE_DEFAULT_SCHEMA,
      schema_name));
    when(entityManager.getEntityManagerFactory()).thenReturn(entityManagerFactory);
    when(entityManager.getTransaction()).thenReturn(entityTransaction);

    assertThrows(IllegalArgumentException.class, () -> bridgedDataSourceStationRepositoryJpa.cleanupData());
  }

  @Test
  void testCleanupStationData_blankSchema_error() {
    final String schema_name = " ";
    when(entityManagerFactory.createEntityManager()).thenReturn(entityManager);
    when(entityManagerFactory.getProperties()).thenReturn(Map.of(HIBERNATE_DEFAULT_SCHEMA,
      schema_name));
    when(entityManager.getEntityManagerFactory()).thenReturn(entityManagerFactory);
    when(entityManager.getTransaction()).thenReturn(entityTransaction);

    assertThrows(IllegalArgumentException.class, () -> bridgedDataSourceStationRepositoryJpa.cleanupData());
  }
}
