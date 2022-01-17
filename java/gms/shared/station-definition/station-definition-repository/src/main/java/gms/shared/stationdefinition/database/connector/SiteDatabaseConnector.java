package gms.shared.stationdefinition.database.connector;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.utilities.bridge.database.DatabaseConnector;
import org.apache.commons.lang3.Validate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.EntityManagerFactory;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;

import static com.google.common.base.Preconditions.checkNotNull;

public class SiteDatabaseConnector extends DatabaseConnector {

  private static final String ID = "id";
  private static final String STATION_CODE = "stationCode";
  private static final String REF_STATION = "referenceStation";
  private static final String ON_DATE = "onDate";
  private static final String OFF_DATE = "offDate";

  private static final Logger logger = LoggerFactory.getLogger(SiteDatabaseConnector.class);

  private static final String MISSING_STATION_NAME_LIST_ERROR = "Request for Site given empty list of station names.";
  private static final String MISSING_START_TIME_ERROR = "Request for Site given empty start time.";
  private static final String MISSING_END_TIME_ERROR = "Request for Site given empty end time.";

  private SiteDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  /**
   * Factory method for creating SiteRepositoryJpa
   *
   * @param entityManagerFactory EntityManagerFactory
   * @return SiteRepositoryJpa
   */
  public static SiteDatabaseConnector create(EntityManagerFactory entityManagerFactory) {
    checkNotNull(entityManagerFactory,
      "Cannot create SiteRepositoryJpa with null EntityManagerFactory.");

    return new SiteDatabaseConnector(entityManagerFactory);
  }

  public List<SiteDao> findSitesByStationCodes(Collection<String> stationNames) {

    Validate.notNull(stationNames, MISSING_STATION_NAME_LIST_ERROR);

    if (stationNames.isEmpty()) {
      logger.debug(MISSING_STATION_NAME_LIST_ERROR);
      return new ArrayList<>();
    } else {
      return runWithEntityManager(entityManager ->
        runPartitionedQuery(stationNames, 950, partition -> {

          CriteriaBuilder cb = entityManager.getCriteriaBuilder();
          CriteriaQuery<SiteDao> query = cb.createQuery(SiteDao.class);
          Root<SiteDao> fromSite = query.from(SiteDao.class);
          query.select(fromSite);

          query.where(fromSite.get(ID).get(STATION_CODE).in(partition));
          return entityManager.createQuery(query).getResultList();
        })
      );
    }
  }

  public List<SiteDao> findSitesByRefStation(Collection<String> refStationNames) {

    Validate.notNull(refStationNames, MISSING_STATION_NAME_LIST_ERROR);

    if (refStationNames.isEmpty()) {
      logger.debug(MISSING_STATION_NAME_LIST_ERROR);
      return new ArrayList<>();
    } else {
      return runWithEntityManager(entityManager ->
        runPartitionedQuery(refStationNames, 950, partition -> {

          CriteriaBuilder cb = entityManager.getCriteriaBuilder();
          CriteriaQuery<SiteDao> query = cb.createQuery(SiteDao.class);
          Root<SiteDao> fromSite = query.from(SiteDao.class);
          query.select(fromSite);

          query.where(fromSite.get(REF_STATION).in(partition));
          return entityManager.createQuery(query).getResultList();
        })
      );
    }
  }

  public List<SiteDao> findSitesByStationCodesAndStartTime(Collection<String> stationNames,
    Instant start) {

    Validate.notNull(stationNames, MISSING_STATION_NAME_LIST_ERROR);
    Validate.notNull(start, MISSING_START_TIME_ERROR);

    if (stationNames.isEmpty()) {
      logger.debug(MISSING_STATION_NAME_LIST_ERROR);
      return new ArrayList<>();
    } else {
      return runWithEntityManager(entityManager ->
        runPartitionedQuery(stationNames, 950, partition -> {

          CriteriaBuilder cb = entityManager.getCriteriaBuilder();
          CriteriaQuery<SiteDao> query = cb.createQuery(SiteDao.class);
          Root<SiteDao> fromSite = query.from(SiteDao.class);
          query.select(fromSite);

          query.where(cb.and(
            fromSite.get(ID).get(STATION_CODE).in(partition),
            cb.lessThanOrEqualTo(fromSite.get(ID).get(ON_DATE), start),
            cb.greaterThanOrEqualTo(fromSite.get(OFF_DATE), start)));
          return entityManager.createQuery(query).getResultList();
        })
      );
    }
  }

  public List<SiteDao> findSitesByRefStationAndStartTime(Collection<String> stationNames,
    Instant start) {

    Validate.notNull(stationNames, MISSING_STATION_NAME_LIST_ERROR);
    Validate.notNull(start, MISSING_START_TIME_ERROR);

    if (stationNames.isEmpty()) {
      logger.debug(MISSING_STATION_NAME_LIST_ERROR);
      return new ArrayList<>();
    } else {
      return runWithEntityManager(entityManager ->
        runPartitionedQuery(stationNames, 200, partition -> {

          CriteriaBuilder cb = entityManager.getCriteriaBuilder();
          CriteriaQuery<SiteDao> query = cb.createQuery(SiteDao.class);
          Root<SiteDao> fromSite = query.from(SiteDao.class);
          query.select(fromSite);

          query.where(cb.and(
            fromSite.get(REF_STATION).in(partition),
            cb.lessThanOrEqualTo(fromSite.get(ID).get(ON_DATE), start),
            cb.greaterThanOrEqualTo(fromSite.get(OFF_DATE), start)
          ));
          return entityManager.createQuery(query).getResultList();
        })
      );
    }

  }

  public List<SiteDao> findMainSitesByRefStaAndTime(Collection<String> stationNames, Instant start) {
    Objects.requireNonNull(stationNames);
    Objects.requireNonNull(start);

    if (stationNames.isEmpty()) {
      logger.debug(MISSING_STATION_NAME_LIST_ERROR);
      return List.of();
    } else {
      return runWithEntityManager(entityManager ->
        runPartitionedQuery(stationNames, 200, partition -> {

          CriteriaBuilder cb = entityManager.getCriteriaBuilder();
          CriteriaQuery<SiteDao> query = cb.createQuery(SiteDao.class);
          Root<SiteDao> fromSite = query.from(SiteDao.class);
          query.select(fromSite);

          query.where(cb.and(
            fromSite.get(REF_STATION).in(partition),
            fromSite.get(ID).get(STATION_CODE).in(partition),
            cb.lessThanOrEqualTo(fromSite.get(ID).get(ON_DATE), start),
            cb.greaterThanOrEqualTo(fromSite.get(OFF_DATE), start)
          ));
          return entityManager.createQuery(query).getResultList();
        }));
    }
  }

  public List<SiteDao> findSitesByReferenceStationAndTimeRange(List<String> referenceStations,
    Instant startTime,
    Instant endTime) {

    Validate.notNull(referenceStations, MISSING_STATION_NAME_LIST_ERROR);
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);
    Preconditions.checkState(startTime.isBefore(endTime), "Start time cannot be after end time");

    if (referenceStations.isEmpty()) {
      logger.debug(MISSING_STATION_NAME_LIST_ERROR);
      return List.of();
    } else {
      return runWithEntityManager(entityManager ->
        runPartitionedQuery(referenceStations, 900, referenceStationsSubList -> {
          CriteriaBuilder builder = entityManager.getCriteriaBuilder();
          CriteriaQuery<SiteDao> query = builder.createQuery(SiteDao.class);
          Root<SiteDao> fromSite = query.from(SiteDao.class);

          query.select(fromSite)
            .where(builder.and(fromSite.get(REF_STATION).in(referenceStationsSubList),
              builder.lessThanOrEqualTo(fromSite.get(ID).get(ON_DATE), endTime),
              builder.greaterThanOrEqualTo(fromSite.get(OFF_DATE), startTime)));

          return entityManager.createQuery(query).getResultList();
        }));
    }
  }

  public List<SiteDao> findSitesByNamesAndTimeRange(Collection<String> stationNames,
    Instant startTime, Instant endTime) {

    Validate.notNull(stationNames, MISSING_STATION_NAME_LIST_ERROR);
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);

    if (stationNames.isEmpty()) {
      logger.debug(MISSING_STATION_NAME_LIST_ERROR);
      return new ArrayList<>();
    } else {
      return runWithEntityManager(entityManager ->
        runPartitionedQuery(stationNames, 950, partition -> {

          CriteriaBuilder cb = entityManager.getCriteriaBuilder();
          CriteriaQuery<SiteDao> query = cb.createQuery(SiteDao.class);
          Root<SiteDao> fromSite = query.from(SiteDao.class);
          query.select(fromSite);

          query.where(cb.and(
            fromSite.get(ID).get(STATION_CODE).in(partition),
            cb.greaterThanOrEqualTo(fromSite.get(OFF_DATE), startTime),
            cb.lessThanOrEqualTo(fromSite.get(ID).get(ON_DATE), endTime)
          ));
          return entityManager.createQuery(query).getResultList();
        })
      );
    }

  }

  public List<SiteDao> findSitesByTimeRange(Instant startTime, Instant endTime) {
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);

    return runWithEntityManager(entityManager -> {

          CriteriaBuilder cb = entityManager.getCriteriaBuilder();
          CriteriaQuery<SiteDao> query = cb.createQuery(SiteDao.class);
          Root<SiteDao> fromSite = query.from(SiteDao.class);
          query.select(fromSite);

          query.where(cb.and(
              cb.greaterThanOrEqualTo(fromSite.get(OFF_DATE), startTime),
              cb.lessThanOrEqualTo(fromSite.get(ID).get(ON_DATE), endTime)
          ));
          return entityManager.createQuery(query).getResultList();
        });

  }

}
