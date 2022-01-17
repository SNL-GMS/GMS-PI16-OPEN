package gms.shared.user.preferences.repository.util;

import gms.shared.user.preferences.dao.util.CoiEntityManagerFactory;
import java.util.Map;
import javax.persistence.EntityManagerFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.images.PullPolicy;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
@Tag("component")
public class DbTest {

  protected static final int POSTGRES_PORT = 5432;
  protected static final String CI_DOCKER_REGISTRY_ENV_VAR_NAME = "CI_DOCKER_REGISTRY";
  protected static final String DOCKER_IMAGE_TAG_ENV_VAR_NAME = "DOCKER_IMAGE_TAG";
  protected static final String GMS_DB_USER = "gms_test";
  protected static final String GMS_DB_PW = "test";
  protected static final String POSTGRES_DB = "gms";
  protected static Map<String, String> props;
  protected static EntityManagerFactory entityManagerFactory;

  protected static final String IMAGE_NAME = String.format("%s/gms-common/postgres:%s",
      System.getenv(CI_DOCKER_REGISTRY_ENV_VAR_NAME),
      System.getenv(DOCKER_IMAGE_TAG_ENV_VAR_NAME));

  protected static final DockerImageName dockerImageName = DockerImageName.parse(IMAGE_NAME)
      .asCompatibleSubstituteFor("postgres");

  @Container
  protected static PostgreSQLContainer<?> container = new PostgreSQLContainer<>(dockerImageName)
      .withDatabaseName(POSTGRES_DB)
      .withUsername(GMS_DB_USER)
      .withPassword(GMS_DB_PW);

  @BeforeAll
  protected static void setUp() {

    container
        .withEnv(Map.of(
            "POSTGRES_INITDB_ARGS",
            "--data-checksums -A --auth=scram-sha-256 --auth-host=scram-sha-256 --auth-local=scram-sha-256",
            "POSTGRES_HOST_AUTH_METHOD", "scram-sha-256"
        ))
        .withImagePullPolicy(PullPolicy.defaultPolicy())
        .addExposedPort(POSTGRES_PORT);
    container.start();
    final var jdbcUrl = container.getJdbcUrl() + "&reWriteBatchedInserts=true";
    props = Map.ofEntries(
        Map.entry("hibernate.connection.driver_class", "org.postgresql.Driver"),
        Map.entry("hibernate.connection.url", jdbcUrl),
        Map.entry("hibernate.connection.username", GMS_DB_USER),
        Map.entry("hibernate.connection.password", GMS_DB_PW),
        Map.entry("hibernate.default_schema", "gms_soh"),
        Map.entry("hibernate.dialect", "org.hibernate.dialect.PostgreSQL95Dialect"),
        Map.entry("hibernate.hbm2ddl.auto", "validate"),
        Map.entry("hibernate.flushMode", "FLUSH_AUTO"),
        Map.entry("hibernate.jdbc.batch_size", "50"),
        Map.entry("hibernate.order_inserts", "true"),
        Map.entry("hibernate.order_updates", "true"),
        Map.entry("hibernate.jdbc.batch_versioned_data", "true")
    );
    entityManagerFactory = CoiEntityManagerFactory.create(props);
  }

  @AfterAll
  static void tearDown() {
    entityManagerFactory.close();
  }
}
