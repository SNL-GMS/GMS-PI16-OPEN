package gms.shared.signaldetection.database.connector.factory;

import gms.shared.signaldetection.database.connector.ArrivalDatabaseConnector;
import org.apache.commons.lang3.Validate;

import javax.persistence.EntityManagerFactory;

/**
 * Signal detection database connector factory for creating signal detectin connector instances
 */
public class SignalDetectionDatabaseConnectorFactory {
  private final EntityManagerFactory signalDetectionEntityManagerFactory;

  private ArrivalDatabaseConnector arrivalDatabaseConnectorInstance;

  private SignalDetectionDatabaseConnectorFactory(EntityManagerFactory entityManagerFactory) {
    signalDetectionEntityManagerFactory = entityManagerFactory;
  }

  /**
   * Creates an IOC factory to build the station definition jpa repositories
   *
   * @param entityManagerFactory the entity manager that supplies the connections to be used by the db connectors
   * @return stationDefinitionDatabaseConnectorFactory object
   */
  public static SignalDetectionDatabaseConnectorFactory create(
    EntityManagerFactory entityManagerFactory) {
    Validate.notNull(entityManagerFactory, "An EntityManagerFactory must be provided.");
    return new SignalDetectionDatabaseConnectorFactory(entityManagerFactory);
  }

  /**
   * Get singleton ArrivalDatabaseConnector Instance
   *
   * @return {@link ArrivalDatabaseConnector}
   */
  public ArrivalDatabaseConnector getArrivalDatabaseConnectorInstance() {
    if (arrivalDatabaseConnectorInstance == null) {
      arrivalDatabaseConnectorInstance = ArrivalDatabaseConnector
        .create(signalDetectionEntityManagerFactory);
    }

    return arrivalDatabaseConnectorInstance;
  }
}
