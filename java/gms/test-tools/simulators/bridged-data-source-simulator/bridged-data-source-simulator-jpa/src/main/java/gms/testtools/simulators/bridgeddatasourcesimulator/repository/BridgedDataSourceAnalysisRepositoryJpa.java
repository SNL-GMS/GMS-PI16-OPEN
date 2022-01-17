package gms.testtools.simulators.bridgeddatasourcesimulator.repository;

import org.apache.commons.lang3.Validate;

import javax.persistence.EntityManagerFactory;

public class BridgedDataSourceAnalysisRepositoryJpa extends BridgedDataSourceRepositoryJpa
  implements BridgedDataSourceRepository {

  protected BridgedDataSourceAnalysisRepositoryJpa(EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public static BridgedDataSourceAnalysisRepositoryJpa create(
    EntityManagerFactory entityManagerFactory) {
    Validate.notNull(entityManagerFactory);
    return new BridgedDataSourceAnalysisRepositoryJpa(entityManagerFactory);
  }

  @Override
  public void cleanupData() {
    runWithEntityManager(entityManager -> {

      try {
        entityManager.getTransaction().begin();
        final String schema = (String) entityManager.getEntityManagerFactory()
          .getProperties()
          .get("hibernate.default_schema");
        Validate.notBlank(schema, "Schema was not found");
        cleanupTable(schema, "WFDISC", entityManager);
        cleanupTable(schema, "ARRIVAL", entityManager);
        cleanupTable(schema, "ORIGIN", entityManager);
        entityManager.getTransaction().commit();
      } catch (Exception e) {
        entityManager.getTransaction().rollback();
        throw e;
      }
      return true;
    });
  }
}
