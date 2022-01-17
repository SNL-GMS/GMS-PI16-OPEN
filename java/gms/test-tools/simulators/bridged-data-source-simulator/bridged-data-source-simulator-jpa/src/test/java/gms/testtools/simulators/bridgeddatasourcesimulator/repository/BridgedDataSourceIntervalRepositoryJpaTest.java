package gms.testtools.simulators.bridgeddatasourcesimulator.repository;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gms.shared.workflow.dao.IntervalDao;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.EntityTransaction;
import javax.persistence.StoredProcedureQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;


@ExtendWith(MockitoExtension.class)
class BridgedDataSourceIntervalRepositoryJpaTest {

  @Mock
  private EntityManagerFactory entityManagerFactory;
  @Mock
  private EntityManager entityManager;
  @Mock
  private EntityTransaction entityTransaction;
  @Mock
  Map<String, Object> propertyMap;
  @Mock
  StoredProcedureQuery storedProcedure;

  private BridgedDataSourceIntervalRepositoryJpa bridgedDataSourceIntervalRepositoryJpa;
  private IntervalDao source;
  private IntervalDao found;


  @BeforeEach
  public void testSetup() {

    bridgedDataSourceIntervalRepositoryJpa =
        new BridgedDataSourceIntervalRepositoryJpa(entityManagerFactory);
    source = new IntervalDao.Builder()
      .intervalIdentifier(12345L)
      .type("foo")
      .name("name")
      .time(0.0)
      .endTime(1.0)
      .state("bar")
      .author("Clem Kadiddlehopper")
      .percentAvailable(0.5)
      .processStartDate(Instant.ofEpochSecond(100L))
      .processEndDate(Instant.ofEpochSecond(200L))
      .lastModificationDate(Instant.ofEpochSecond(300L))
      .loadDate(Instant.ofEpochSecond(400L))
      .build();
    found = new IntervalDao.Builder()
      .intervalIdentifier(12345L)
      .type("foo found")
      .name("name found")
      .time(1.0)
      .endTime(2.0)
      .state("bar found")
      .author("Clem Kadiddlehopper found")
      .percentAvailable(1.5)
      .processStartDate(Instant.ofEpochSecond(101L))
      .processEndDate(Instant.ofEpochSecond(201L))
      .lastModificationDate(Instant.ofEpochSecond(301L))
      .loadDate(Instant.ofEpochSecond(401L))
      .build();
  }


  @Test
  void testCleanupData() {

    when(entityManager.getEntityManagerFactory()).thenReturn(entityManagerFactory);
    when(entityManagerFactory.createEntityManager()).thenReturn(entityManager);
    when(entityManager.getTransaction()).thenReturn(entityTransaction);
    when(entityManagerFactory.getProperties()).thenReturn(propertyMap);
    when(propertyMap.get("hibernate.default_schema")).thenReturn("my fake schema");
    when(entityManager.createStoredProcedureQuery(any())).thenReturn(storedProcedure);

    assertDoesNotThrow(() -> bridgedDataSourceIntervalRepositoryJpa.cleanupData());

    verify(storedProcedure, times(1))
        .registerStoredProcedureParameter(any(), any(), any());
    verify(storedProcedure, times(1))
        .setParameter(anyString(), anyString());
    verify(storedProcedure, times(1)).execute();
    verify(entityTransaction, times(1)).commit();
    verify(entityTransaction, times(0)).rollback();
  }


  @Test
  void testStoreOrUpdate_store() {

    when(entityManagerFactory.createEntityManager()).thenReturn(entityManager);
    when(entityManager.getTransaction()).thenReturn(entityTransaction);

    assertDoesNotThrow(() -> bridgedDataSourceIntervalRepositoryJpa.storeOrUpdate(List.of(source)));

    verify(entityManager, times(1)).persist(any());
    verify(entityTransaction, times(1)).commit();
    verify(entityTransaction, times(0)).rollback();
  }


  @Test
  void testStoreOrUpdate_update() {

    when(entityManagerFactory.createEntityManager()).thenReturn(entityManager);
    when(entityManager.getTransaction()).thenReturn(entityTransaction);
    when(entityManager.find(any(), any())).thenReturn(found);

    assertDoesNotThrow(() ->
        bridgedDataSourceIntervalRepositoryJpa.storeOrUpdate(List.of(source))
    );

    var sourceKey = source.getClassEndTimeNameTimeKey();
    var foundKey = found.getClassEndTimeNameTimeKey();

    assertEquals(foundKey.getType(), sourceKey.getType());
    assertEquals(foundKey.getName(), sourceKey.getName());
    assertEquals(foundKey.getTime(), sourceKey.getTime());
    assertEquals(foundKey.getEndTime(), sourceKey.getEndTime());
    assertEquals(found.getState(), source.getState());
    assertEquals(found.getAuthor(), source.getAuthor());
    assertEquals(found.getPercentAvailable(), source.getPercentAvailable());
    assertEquals(found.getProcessStartDate(), source.getProcessStartDate());
    assertEquals(found.getProcessEndDate(), source.getProcessEndDate());
    assertEquals(found.getLastModificationDate(), source.getLastModificationDate());
    assertEquals(found.getLoadDate(), source.getLoadDate());
    verify(entityManager, times(0)).persist(any());
    verify(entityTransaction, times(1)).commit();
    verify(entityTransaction, times(0)).rollback();
  }

  @Test
  void testStoreOrUpdate_IntervalIdentifierException() {

    when(entityManagerFactory.createEntityManager()).thenReturn(entityManager);
    when(entityManager.getTransaction()).thenReturn(entityTransaction);
    found.setIntervalIdentifier(source.getIntervalIdentifier() + 1);
    when(entityManager.find(any(), any())).thenReturn(found);
    var list = List.of(source);

    assertThrows(DatabaseUniqueIntervalIdentifierException.class,
        () -> bridgedDataSourceIntervalRepositoryJpa.storeOrUpdate(list)
    );

  }


  @Test
  void testCopySourceToFound() {

    bridgedDataSourceIntervalRepositoryJpa.copySourceToFound(source, found);
    assertEqualAndNotNull(source, found);
  }


  @Test
  void testCopySourceToFound_nullFoundKey() {

    found.setClassEndTimeNameTimeKey(null);
    bridgedDataSourceIntervalRepositoryJpa.copySourceToFound(source, found);
    assertEqualAndNotNull(source, found);
  }

  private void assertEqualAndNotNull(IntervalDao intervalDao1, IntervalDao intervalDao2) {

    assertNotNull(intervalDao1);
    assertNotNull(intervalDao2);

    var key1 = intervalDao1.getClassEndTimeNameTimeKey();
    var key2 = intervalDao2.getClassEndTimeNameTimeKey();

    assertNotNull(key1);
    assertNotNull(key2);

    assertEquals(intervalDao2.getIntervalIdentifier(), intervalDao1.getIntervalIdentifier());
    assertEquals(key2.getType(), key1.getType());
    assertEquals(key2.getName(), key1.getName());
    assertEquals(key2.getTime(), key1.getTime());
    assertEquals(key2.getEndTime(), key1.getEndTime());
    assertEquals(intervalDao2.getState(), intervalDao1.getState());
    assertEquals(intervalDao2.getAuthor(), intervalDao1.getAuthor());
    assertEquals(intervalDao2.getPercentAvailable(), intervalDao1.getPercentAvailable());
    assertEquals(intervalDao2.getProcessStartDate(), intervalDao1.getProcessStartDate());
    assertEquals(intervalDao2.getProcessEndDate(), intervalDao1.getProcessEndDate());
    assertEquals(intervalDao2.getLastModificationDate(), intervalDao1.getLastModificationDate());
    assertEquals(intervalDao2.getLoadDate(), intervalDao1.getLoadDate());
  }

}
