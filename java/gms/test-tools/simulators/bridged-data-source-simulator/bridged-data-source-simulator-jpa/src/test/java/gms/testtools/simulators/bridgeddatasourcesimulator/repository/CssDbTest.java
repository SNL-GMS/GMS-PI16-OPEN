package gms.testtools.simulators.bridgeddatasourcesimulator.repository;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URL;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Persistence;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.function.Executable;

@Tag("component")
abstract class CssDbTest<T extends BridgedDataSourceRepository> {
  private static final ClassLoader classLoader = CssDbTest.class.getClassLoader();
  private static final URL CSS_DDL = getResource("css/css_gms_ddl.sql");
  private static final URL CSS_INSTRUMENT_DATA = getResource("css/data/css_gms_instrument.sql");
  private static final URL CSS_NETWORK_DATA = getResource("css/data/css_gms_network.sql");
  private static final URL CSS_SENSOR_DATA = getResource("css/data/css_gms_sensor.sql");
  private static final URL CSS_SITECHAN_DATA = getResource("css/data/css_gms_sitechan.sql");
  private static final URL CSS_SITE_DATA = getResource("css/data/css_gms_site.sql");
  private static final URL CSS_AFFILIATION_DATA = getResource("css/data/css_gms_affiliation.sql");
  public static final URL CSS_WFDISC_DATA = getResource("css/data/css_gms_wfdisc.sql");

  protected static EntityManagerFactory entityManagerFactory;

  protected static EntityManagerFactory simEntityManagerFactory;

  protected T repository;
  protected T simRepository;

  @BeforeAll
  protected static void setUp() {

    final List<URL> cssSqlScripts = List.of(
      CSS_DDL,
      CSS_AFFILIATION_DATA,
      CSS_INSTRUMENT_DATA,
      CSS_NETWORK_DATA,
      CSS_SITECHAN_DATA,
      CSS_SITE_DATA,
      CSS_SENSOR_DATA,
      CSS_WFDISC_DATA);

    final String jdbcUrl = "jdbc:h2:mem:css_test;USER=GMS_GLOBAL;MODE=Oracle";
    final String initJdbcUrl = String.format("%s;INIT=%s", jdbcUrl, getInitScriptRunCommand(cssSqlScripts));

    /*
      if debugging is needed add the properties:
       * "hibernate.generate_statistics"
       * "hibernate.show_sql"
       each with a value of "true"
     */
    Map<String, String> props = Map.ofEntries(
      Map.entry("hibernate.connection.driver_class", "org.h2.Driver"),
      Map.entry("hibernate.connection.url", initJdbcUrl),
      Map.entry("hibernate.dialect", "org.hibernate.dialect.H2Dialect"),
      Map.entry("hibernate.default_schema", "GMS_GLOBAL"),
      Map.entry("hibernate.hbm2ddl.auto", "none"),
      Map.entry("hibernate.flushMode", "FLUSH_AUTO"),
      Map.entry("hibernate.jdbc.batch_size", "50"),
      Map.entry("hibernate.order_inserts", "true"),
      Map.entry("hibernate.order_updates", "true"),
      Map.entry("hibernate.jdbc.batch_versioned_data", "true")
    );
    entityManagerFactory = Persistence.createEntityManagerFactory("gms_station_definition", props);
    assertNotNull(entityManagerFactory);
    assertTrue(entityManagerFactory.isOpen());

    /*
      if debugging is needed add the properties:
       * "hibernate.generate_statistics"
       * "hibernate.show_sql"
       each with a value of "true"
     */
    Map<String, String> simProps = Map.ofEntries(
      Map.entry("hibernate.connection.driver_class", "org.h2.Driver"),
      Map.entry("hibernate.connection.url", jdbcUrl),
      Map.entry("hibernate.dialect", "org.hibernate.dialect.H2Dialect"),
      Map.entry("hibernate.default_schema", "GMS_SIMULATION_GLOBAL"),
      Map.entry("hibernate.hbm2ddl.auto", "none"),
      Map.entry("hibernate.flushMode", "FLUSH_AUTO"),
      Map.entry("hibernate.jdbc.batch_size", "50"),
      Map.entry("hibernate.order_inserts", "true"),
      Map.entry("hibernate.order_updates", "true"),
      Map.entry("hibernate.jdbc.batch_versioned_data", "true")
    );
    simEntityManagerFactory = Persistence.createEntityManagerFactory("gms_simulation", simProps);
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
    simRepository = getSimRepository(simEntityManagerFactory);
  }

  protected abstract T getRepository(EntityManagerFactory entityManagerFactory);

  protected abstract T getSimRepository(EntityManagerFactory entityManagerFactory);

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
