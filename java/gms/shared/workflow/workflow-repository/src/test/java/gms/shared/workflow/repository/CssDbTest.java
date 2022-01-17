package gms.shared.workflow.repository;

import gms.shared.utilities.bridge.database.DatabaseConnector;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.function.Executable;

import javax.persistence.EntityManagerFactory;
import javax.persistence.Persistence;
import java.net.URL;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Tag("component")
abstract class CssDbTest<T extends DatabaseConnector> {
  private static final ClassLoader classLoader = CssDbTest.class.getClassLoader();
  private static final URL CSS_DDL = getResource("css/css_gms_ddl.sql");
  private static final URL CSS_INTERVAL_DATA = getResource("css/data/css_gms_interval.sql");

  private static EntityManagerFactory entityManagerFactory;

  private static EntityManagerFactory simEntityManagerFactory;

  protected T repository;
  protected T simRepository;

  @BeforeAll
  protected static void setUp() {

    final List<URL> cssSqlScripts = List.of(
        CSS_DDL,
        CSS_INTERVAL_DATA);

    final String jdbcUrl = "jdbc:h2:mem:css_test;USER=GNEM_GMS;MODE=Oracle";
    final String initJdbcUrl = String.format("%s;INIT=%s", jdbcUrl, getInitScriptRunCommand(cssSqlScripts));

    Map<String, String> props = Map.ofEntries(
        Map.entry("hibernate.connection.driver_class", "org.h2.Driver"),
        Map.entry("hibernate.connection.url", initJdbcUrl),
        Map.entry("hibernate.dialect", "org.hibernate.dialect.H2Dialect"),
        Map.entry("hibernate.default_schema", "GNEM_GMS"),
        Map.entry("hibernate.hbm2ddl.auto", "none"),
        Map.entry("hibernate.flushMode", "FLUSH_AUTO"),
        Map.entry("hibernate.jdbc.batch_size", "50"),
        Map.entry("hibernate.order_inserts", "true"),
        Map.entry("hibernate.order_updates", "true"),
        Map.entry("hibernate.jdbc.batch_versioned_data", "true")
//        Map.entry("hibernate.generate_statistics", "true"),
//        Map.entry("hibernate.show_sql", "true")
    );
    entityManagerFactory = Persistence.createEntityManagerFactory("workflow-dao", props);
    assertNotNull(entityManagerFactory);
    assertTrue(entityManagerFactory.isOpen());

    Map<String, String> simProps = Map.ofEntries(
        Map.entry("hibernate.connection.driver_class", "org.h2.Driver"),
        Map.entry("hibernate.connection.url", jdbcUrl),
        Map.entry("hibernate.dialect", "org.hibernate.dialect.H2Dialect"),
        Map.entry("hibernate.default_schema", "GNEM_GMS_SIMULATION"),
        Map.entry("hibernate.hbm2ddl.auto", "none"),
        Map.entry("hibernate.flushMode", "FLUSH_AUTO"),
        Map.entry("hibernate.jdbc.batch_size", "50"),
        Map.entry("hibernate.order_inserts", "true"),
        Map.entry("hibernate.order_updates", "true"),
        Map.entry("hibernate.jdbc.batch_versioned_data", "true"),
//        Map.entry("hibernate.generate_statistics", "true"),
        Map.entry("hibernate.show_sql", "true")
    );
    simEntityManagerFactory = Persistence.createEntityManagerFactory("workflow-dao", simProps);
    assertNotNull(simEntityManagerFactory);
    assertTrue(simEntityManagerFactory.isOpen());
  }

  @AfterAll
  protected static void tearDown() {
    entityManagerFactory.close();
    simEntityManagerFactory.close();
    assertAll(
        () -> assertFalse(entityManagerFactory.isOpen()),
        () -> assertFalse(simEntityManagerFactory.isOpen())
    );

    entityManagerFactory = null;
    simEntityManagerFactory = null;
    assertAll(
        () -> assertNull(entityManagerFactory),
        () -> assertNull(simEntityManagerFactory)
    );
  }

  @BeforeEach
  public void testSetup() {
    repository = getRepository(entityManagerFactory);
    simRepository = getRepository(simEntityManagerFactory);
  }

  protected abstract T getRepository(EntityManagerFactory entityManagerFactory);

  private static URL getResource(String resourceName) {
    final URL resource = classLoader.getResource(resourceName);
    if (resource == null) {
      throw new IllegalArgumentException(
          String.format("Requested resource was not found: '%s'", resourceName));
    }
    return resource;
  }

  private static String getInitScriptRunCommand(List<URL> cssSqlScripts) {
    return cssSqlScripts.stream()
        .map(s -> String.format("runscript from '%s'", s))
        .collect(Collectors.joining("\\;"));
  }

  protected void assertErrorThrown(Class<NullPointerException> expectedType,
      String expectedErrorMessage, Executable executable) {
    final NullPointerException exception = assertThrows(expectedType,
        executable);

    assertNotNull(exception);
    assertEquals(expectedErrorMessage, exception.getMessage());
  }
}
