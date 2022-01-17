package gms.shared.stationdefinition.database.connector.factory;

import gms.shared.stationdefinition.database.connector.AffiliationDatabaseConnector;
import gms.shared.stationdefinition.database.connector.BeamDatabaseConnector;
import gms.shared.stationdefinition.database.connector.InstrumentDatabaseConnector;
import gms.shared.stationdefinition.database.connector.NetworkDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SensorDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteChanDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WftagDatabaseConnector;
import org.apache.commons.lang3.Validate;

import javax.persistence.EntityManagerFactory;

public class StationDefinitionDatabaseConnectorFactory {

  private NetworkDatabaseConnector networkDatabaseConnectorInstance;
  private AffiliationDatabaseConnector affiliationDatabaseConnectorInstance;
  private SiteDatabaseConnector siteDatabaseConnectorInstance;
  private SiteChanDatabaseConnector siteChanDatabaseConnectorInstance;
  private SensorDatabaseConnector sensorDatabaseConnectorInstance;
  private InstrumentDatabaseConnector instrumentDatabaseConnectorInstance;
  private WfdiscDatabaseConnector wfdiscDatabaseConnectorInstance;
  private WftagDatabaseConnector wftagDatabaseConnectorInstance;
  private BeamDatabaseConnector beamDatabaseConnectorInstance;

  private final EntityManagerFactory stationDefinitionEntityManagerFactory;

  private StationDefinitionDatabaseConnectorFactory(EntityManagerFactory entityManagerFactory) {
    stationDefinitionEntityManagerFactory = entityManagerFactory;
  }

  /**
   * Creates an IOC factory to build the station definition jpa repositories
   *
   * @param entityManagerFactory the entity manager that supplies the connections to be used by the db connectors
   * @return stationDefinitionDatabaseConnectorFactory object
   */
  public static StationDefinitionDatabaseConnectorFactory create(
      EntityManagerFactory entityManagerFactory) {
    Validate.notNull(entityManagerFactory, "An EntityManagerFactory must be provided.");
    return new StationDefinitionDatabaseConnectorFactory(entityManagerFactory);
  }

  public NetworkDatabaseConnector getNetworkDatabaseConnectorInstance() {
    if (networkDatabaseConnectorInstance == null) {
      networkDatabaseConnectorInstance = NetworkDatabaseConnector
          .create(stationDefinitionEntityManagerFactory);
    }
    return networkDatabaseConnectorInstance;
  }

  public AffiliationDatabaseConnector getAffiliationDatabaseConnectorInstance() {
    if (affiliationDatabaseConnectorInstance == null) {
      affiliationDatabaseConnectorInstance = AffiliationDatabaseConnector
          .create(stationDefinitionEntityManagerFactory);
    }
    return affiliationDatabaseConnectorInstance;
  }

  public SiteDatabaseConnector getSiteDatabaseConnectorInstance() {
    if (siteDatabaseConnectorInstance == null) {
      siteDatabaseConnectorInstance = SiteDatabaseConnector.create(stationDefinitionEntityManagerFactory);
    }
    return siteDatabaseConnectorInstance;
  }

  public SiteChanDatabaseConnector getSiteChanDatabaseConnectorInstance() {
    if (siteChanDatabaseConnectorInstance == null) {
      siteChanDatabaseConnectorInstance = SiteChanDatabaseConnector
          .create(stationDefinitionEntityManagerFactory);
    }
    return siteChanDatabaseConnectorInstance;
  }

  public InstrumentDatabaseConnector getInstrumentDatabaseConnectorInstance() {
    if (instrumentDatabaseConnectorInstance == null) {
      instrumentDatabaseConnectorInstance = InstrumentDatabaseConnector
          .create(stationDefinitionEntityManagerFactory);
    }
    return instrumentDatabaseConnectorInstance;
  }

  public SensorDatabaseConnector getSensorDatabaseConnectorInstance() {
    if (sensorDatabaseConnectorInstance == null) {
      sensorDatabaseConnectorInstance = SensorDatabaseConnector
          .create(stationDefinitionEntityManagerFactory);
    }
    return sensorDatabaseConnectorInstance;
  }

  public WfdiscDatabaseConnector getWfdiscDatabaseConnectorInstance() {
    if (wfdiscDatabaseConnectorInstance == null) {
      wfdiscDatabaseConnectorInstance = WfdiscDatabaseConnector
          .create(stationDefinitionEntityManagerFactory);
    }
    return wfdiscDatabaseConnectorInstance;
  }

  /**
   * Get singleton WftagDatabaseConnector Instance
   *
   * @return WftagDatabaseConnector
   */
  public WftagDatabaseConnector getWftagfDatabaseConnectorInstance() {
    if (wftagDatabaseConnectorInstance == null) {
      wftagDatabaseConnectorInstance = WftagDatabaseConnector
        .create(stationDefinitionEntityManagerFactory);
    }
    return wftagDatabaseConnectorInstance;
  }

  /**
   * Get singleton BeamDatabaseConnector Instance
   *
   * @return BeamDatabaseConnector
   */
  public BeamDatabaseConnector getBeamDatabaseConnectorInstance() {
    if (beamDatabaseConnectorInstance == null) {
      beamDatabaseConnectorInstance = BeamDatabaseConnector
        .create(stationDefinitionEntityManagerFactory);
    }
    return beamDatabaseConnectorInstance;
  }

}
