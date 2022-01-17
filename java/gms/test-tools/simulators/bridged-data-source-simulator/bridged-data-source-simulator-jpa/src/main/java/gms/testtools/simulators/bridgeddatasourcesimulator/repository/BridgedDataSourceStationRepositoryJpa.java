package gms.testtools.simulators.bridgeddatasourcesimulator.repository;

import org.apache.commons.lang3.Validate;

import javax.persistence.EntityManagerFactory;


public class BridgedDataSourceStationRepositoryJpa extends BridgedDataSourceRepositoryJpa
  implements BridgedDataSourceRepository {

  public static final String HIBERNATE_DEFAULT_SCHEMA_KEY = "hibernate.default_schema";

  protected BridgedDataSourceStationRepositoryJpa(EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public static BridgedDataSourceStationRepositoryJpa create(
    EntityManagerFactory entityManagerFactory) {
    Validate.notNull(entityManagerFactory);
    return new BridgedDataSourceStationRepositoryJpa(entityManagerFactory);
  }

  @Override
  public void cleanupData() {
    runWithEntityManager(entityManager -> {

      try {
        entityManager.getTransaction().begin();

        final String schema = (String) entityManager.getEntityManagerFactory()
          .getProperties()
          .get(HIBERNATE_DEFAULT_SCHEMA_KEY);
        Validate.notBlank(schema, "Schema was not found");

        cleanupTable(schema, "AFFILIATION", entityManager);
        cleanupTable(schema, "INSTRUMENT", entityManager);
        cleanupTable(schema, "NETWORK", entityManager);
        cleanupTable(schema, "SENSOR", entityManager);
        cleanupTable(schema, "SITE", entityManager);
        cleanupTable(schema, "SITECHAN", entityManager);
        entityManager.getTransaction().commit();
      } catch (Exception e) {
        entityManager.getTransaction().rollback();
        throw e;
      }
      return true;
    });
  }

}
