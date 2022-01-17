package gms.shared.signaldetection.database.connector;

import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.stationdefinition.dao.css.WfTagDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WftagDatabaseConnector;

import javax.persistence.EntityManagerFactory;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Objects;

import static com.google.common.base.Preconditions.checkNotNull;

/**
 * Signal detection database connector that queries the particular
 * ARRIVAL and ASSOC legacy tables according to Stage
 */
public class SignalDetectionDatabaseConnector {

  private final ArrivalDatabaseConnector arrivalDatabaseConnector;
  private final WfdiscDatabaseConnector wfdiscDatabaseConnector;
  private final WftagDatabaseConnector wftagDatabaseConnector;

  private SignalDetectionDatabaseConnector(ArrivalDatabaseConnector arrivalDatabaseConnector,
    WfdiscDatabaseConnector wfdiscDatabaseConnector,
    WftagDatabaseConnector wftagDatabaseConnector) {
    this.arrivalDatabaseConnector = arrivalDatabaseConnector;
    this.wfdiscDatabaseConnector = wfdiscDatabaseConnector;
    this.wftagDatabaseConnector = wftagDatabaseConnector;
  }

  /***
   * Testing creator
   * @param arrivalDatabaseConnector
   * @param wfdiscDatabaseConnector
   * @param wftagDatabaseConnector
   * @return
   */
  static SignalDetectionDatabaseConnector create(ArrivalDatabaseConnector arrivalDatabaseConnector,
    WfdiscDatabaseConnector wfdiscDatabaseConnector,
    WftagDatabaseConnector wftagDatabaseConnector) {

    Objects.requireNonNull(arrivalDatabaseConnector);
    Objects.requireNonNull(wfdiscDatabaseConnector);
    Objects.requireNonNull(wftagDatabaseConnector);

    return new SignalDetectionDatabaseConnector(arrivalDatabaseConnector,
      wfdiscDatabaseConnector,
      wftagDatabaseConnector);
  }

  /**
   * Factory method for creating SignalDetectionDatabaseConnector
   *
   * @param entityManagerFactory EntityManagerFactory
   * @return SignalDetectionDatabaseConnector
   */
  public static SignalDetectionDatabaseConnector create(EntityManagerFactory entityManagerFactory) {
    checkNotNull(entityManagerFactory,
      "Cannot create ArrivalDatabaseConnector with null EntityManagerFactory");

    return new SignalDetectionDatabaseConnector(ArrivalDatabaseConnector.create(entityManagerFactory),
      WfdiscDatabaseConnector.create(entityManagerFactory),
      WftagDatabaseConnector.create(entityManagerFactory));
  }

  /**
   * Find arrivals using the given entity manager factory corresponding
   * to the correct stage defined in the bridged repository
   *
   * @param stationNames Collections of station names
   * @param excludedArids Arrival ids to exclude
   * @param startTime Instant start time for time range
   * @param endTime Instant end time for time range
   * @param leadDelta Time delta for the start time
   * @param lagDelta Time delta for the end time
   * @return List of {@link ArrivalDao}s
   */
  public List<ArrivalDao> findArrivals(Collection<String> stationNames,
    Collection<Long> excludedArids, Instant startTime, Instant endTime,
    Duration leadDelta, Duration lagDelta) {

    return arrivalDatabaseConnector.findArrivals(stationNames, excludedArids,
      startTime, endTime, leadDelta, lagDelta);
  }

  /**
   * Find arrivals by arids using the given entity manager factory corresponding
   * to the correct stage defined in the bridged repository
   *
   * @param arids List of arids to query
   * @return List of {@link ArrivalDao}s
   */
  public List<ArrivalDao> findArrivals(Collection<Long> arids) {
    return arrivalDatabaseConnector.findArrivalsByArids(arids);
  }

  /**
   * Find {@link WfdiscDao}s using collections of wfids
   *
   * @param wfids list of wfids
   * @return list of {@link WfdiscDao}s
   */
  public List<WfdiscDao> findWfdiscs(Collection<Long> wfids) {
    return wfdiscDatabaseConnector.findWfdiscsByWfids(wfids);
  }

  /**
   * Find {@link WfTagDao}s using collections of tagIds
   *
   * @param tagIds list of tag ids
   * @return list of {@link WfTagDao}s
   */
  public List<WfTagDao> findWftags(Collection<Long> tagIds) {
    return wftagDatabaseConnector.findWftagsByTagIds(tagIds);
  }
}
