package gms.shared.utilities.db.test.utils;

import gms.shared.frameworks.osd.coi.station.StationTestFixtures;
import gms.shared.frameworks.osd.coi.test.utils.UtilsTestFixtures;
import gms.shared.frameworks.osd.repository.station.StationGroupRepositoryJpa;
import gms.shared.frameworks.osd.repository.station.StationRepositoryJpa;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.persistence.EntityManagerFactory;
import javax.persistence.Persistence;
import javax.persistence.PersistenceException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Testcontainers
@Tag("component")
public abstract class SohDbTest extends DbTest {

  protected static EntityManagerFactory entityManagerFactory;

  @BeforeAll
  protected static void setUpPersistence() {

    final var jdbcUrl = container.getJdbcUrl() + "&reWriteBatchedInserts=true";
    Map<String, String> props = new HashMap<>(
      Map.ofEntries(
        Map.entry("hibernate.connection.driver_class", "org.postgresql.Driver"),
        Map.entry("hibernate.connection.url", jdbcUrl),
        Map.entry("hibernate.connection.username", GMS_DB_USER),
        Map.entry("hibernate.connection.password", GMS_DB_PASSFAKE),
        Map.entry("hibernate.default_schema", "gms_soh"),
        Map.entry("hibernate.dialect", "org.hibernate.dialect.PostgreSQL95Dialect"),
        Map.entry("hibernate.hbm2ddl.auto", "validate"),
        Map.entry("hibernate.flushMode", "FLUSH_AUTO"),
        Map.entry("hibernate.jdbc.batch_size", "50"),
        Map.entry("hibernate.order_inserts", "true"),
        Map.entry("hibernate.order_updates", "true"),
        Map.entry("hibernate.jdbc.batch_versioned_data", "true")
    ));

    try {
      entityManagerFactory=  Persistence.createEntityManagerFactory("gms", props);
    } catch (PersistenceException e) {
      throw new IllegalArgumentException("Could not create persistence unit " + "gms", e);
    }

    new StationRepositoryJpa(entityManagerFactory)
      .storeStations(List.of(UtilsTestFixtures.STATION, TestFixtures.station));
    new StationGroupRepositoryJpa(entityManagerFactory)
      .storeStationGroups(List.of(UtilsTestFixtures.STATION_GROUP,
        StationTestFixtures.getStationGroup()));
  }

  @AfterAll
  protected static void tearDownPersistence() {
    entityManagerFactory.close();
  }

}
