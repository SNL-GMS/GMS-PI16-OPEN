package gms.testtools.simulators.bridgeddatasourcesimulator.repository;

import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;

import java.util.Collection;
import java.util.List;

public interface BridgedDataSourceRepository {

  /**
   * Cleans up simulation data in the tables for a specific simulator using a stored procedure
   */
  void cleanupData();

  /**
   * Store the provided data in the simulation schema
   *
   * @param simulationData - A collection of data of type {@link T} to be stored in the simulation schema.
   * @param <T> the type of data to store
   */
  <T> void store(List<T> simulationData);


  /**
   * Store the provided siteChanDaos and update relevant siteChanDaos with new endtime
   *
   * @param siteChanDaos - a list of SiteChanDaos to load into the databasep
   */
  void updateAndStoreSiteChans(Collection<SiteChanDao> siteChanDaos);

  /**
   * Store the provided siteChanDaos and update relevant siteChanDaos with new endtime
   *
   * @param siteDaos - a list of SiteChanDaos to load into the databasep
   */
  void updateAndStoreSites(Collection<SiteDao> siteDaos);

}
