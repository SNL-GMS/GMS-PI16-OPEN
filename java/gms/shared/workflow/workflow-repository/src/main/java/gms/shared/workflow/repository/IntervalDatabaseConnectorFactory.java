package gms.shared.workflow.repository;

import javax.persistence.EntityManagerFactory;
import org.apache.commons.lang3.Validate;

public class IntervalDatabaseConnectorFactory {

  EntityManagerFactory entityManagerFactory;
  IntervalDatabaseConnector intervalDatabaseConnectorInstance;

  public IntervalDatabaseConnectorFactory(EntityManagerFactory entityManagerFactory) {

    this.entityManagerFactory = entityManagerFactory;
  }

  public static IntervalDatabaseConnectorFactory create(EntityManagerFactory entityManagerFactory) {
    Validate.notNull(entityManagerFactory);
    return new IntervalDatabaseConnectorFactory(entityManagerFactory);
  }

  public IntervalDatabaseConnector getIntervalDatabaseConnectorInstance() {
    if (intervalDatabaseConnectorInstance == null) {
      intervalDatabaseConnectorInstance = IntervalDatabaseConnector.create(
          entityManagerFactory
      );
    }
    return intervalDatabaseConnectorInstance;
  }
}
