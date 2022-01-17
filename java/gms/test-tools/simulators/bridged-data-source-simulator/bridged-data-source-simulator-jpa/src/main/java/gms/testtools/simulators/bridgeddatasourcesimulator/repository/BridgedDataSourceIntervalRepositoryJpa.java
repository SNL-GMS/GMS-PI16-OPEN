package gms.testtools.simulators.bridgeddatasourcesimulator.repository;

import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.shared.workflow.dao.ClassEndTimeNameTimeKey;
import gms.shared.workflow.dao.IntervalDao;
import org.apache.commons.lang3.Validate;

import javax.persistence.EntityManagerFactory;
import java.util.List;

import org.slf4j.LoggerFactory;

public class BridgedDataSourceIntervalRepositoryJpa extends BridgedDataSourceRepositoryJpa
  implements BridgedDataSourceRepository {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(BridgedDataSourceStationRepositoryJpa.class));

  protected BridgedDataSourceIntervalRepositoryJpa(EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public static BridgedDataSourceIntervalRepositoryJpa create(
    EntityManagerFactory entityManagerFactory
  ) {
    Validate.notNull(entityManagerFactory);
    return new BridgedDataSourceIntervalRepositoryJpa(entityManagerFactory);
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
        cleanupTable(schema, "INTERVAL", entityManager);
        entityManager.getTransaction().commit();
      } catch (Exception e) {
        entityManager.getTransaction().rollback();
        throw e;
      }
      return true;
    });
  }


  /**
   * For each of the given {@link IntervalDao}s, if a record with a matching {@link
   * ClassEndTimeNameTimeKey} exists, update it with the values from the {@code simulationData}.
   * Otherwise, insert the {@code simulationData} into the database.
   *
   * @param simulationData a list of {@link IntervalDao}s to update or insert into the database
   */
  public void storeOrUpdate(List<IntervalDao> simulationData) {

    runWithEntityManager(entityManager -> {

      try {
        entityManager.getTransaction().begin();

        simulationData.forEach(sd -> {
          var found = entityManager.find(IntervalDao.class, sd.getClassEndTimeNameTimeKey());
          if (found == null) {
            entityManager.persist(sd);
          } else if (sd.getIntervalIdentifier() != found.getIntervalIdentifier()) {
            var errorMessage = String.format(
              "Found INTERVAL database entry with primary key matching source simulation data, "
                + "but interval identifiers differ. source id = %d.  found id = %d",
              sd.getIntervalIdentifier(), found.getIntervalIdentifier());
            logger.error(errorMessage);
            throw new DatabaseUniqueIntervalIdentifierException(errorMessage);
          } else {
            copySourceToFound(sd, found);
          }
        });

        entityManager.getTransaction().commit();
      } catch (Exception e) {
        entityManager.getTransaction().rollback();
        throw e;
      }

      return true;
    });

  }


  /* Copy the members of a source IntervalDao to the corresponding IntervalDao
   * found in the database */
  void copySourceToFound(IntervalDao source, IntervalDao found) {

    if (found.getClassEndTimeNameTimeKey() == null) {
      found.setClassEndTimeNameTimeKey(source.getClassEndTimeNameTimeKey());
    } else {
      found.getClassEndTimeNameTimeKey().setType(source.getClassEndTimeNameTimeKey().getType());
      found.getClassEndTimeNameTimeKey().setName(source.getClassEndTimeNameTimeKey().getName());
      found.getClassEndTimeNameTimeKey().setTime(source.getClassEndTimeNameTimeKey().getTime());
      found.getClassEndTimeNameTimeKey()
        .setEndTime(source.getClassEndTimeNameTimeKey().getEndTime());
    }

    found.setState(source.getState());
    found.setAuthor(source.getAuthor());
    found.setPercentAvailable(source.getPercentAvailable());
    found.setProcessStartDate(source.getProcessStartDate());
    found.setProcessEndDate(source.getProcessEndDate());
    found.setLastModificationDate(source.getLastModificationDate());
    found.setLoadDate((source.getLoadDate()));
  }

}
