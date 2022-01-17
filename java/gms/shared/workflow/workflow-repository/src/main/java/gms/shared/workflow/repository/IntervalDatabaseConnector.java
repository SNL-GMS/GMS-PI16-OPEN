package gms.shared.workflow.repository;

import gms.shared.utilities.bridge.database.DatabaseConnector;
import gms.shared.workflow.dao.IntervalDao;
import org.apache.commons.lang3.Validate;
import org.apache.commons.lang3.tuple.Pair;

import javax.persistence.EntityManagerFactory;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import java.time.Instant;
import java.util.List;
import java.util.Set;

public class IntervalDatabaseConnector extends DatabaseConnector {

  static final String MISSING_START_TIME_ERROR = "Received a null value for start time.  findIntervalsByTimeRange must be given a non null start time";
  static final String MISSING_END_TIME_ERROR = "Received a null value for end time.  findIntervalsByTimeRange must be given a non null end time";
  static final String MISSING_INTERVAL_CLASS_AND_NAMES_ERROR = "Request for Interval by time range must be given an interval name";
  static final String START_NOT_BEFORE_END_TIME_ERROR = "Start time, {}, must be before end time {}";

  // names of the tables in the Interval database
  private static final String TIME = "time";
  private static final String END_TIME = "endTime";
  public static final String CLASS_END_TIME_NAME_TIME_KEY = "classEndTimeNameTimeKey";

  protected IntervalDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public static IntervalDatabaseConnector create(EntityManagerFactory entityManagerFactory) {
    return new IntervalDatabaseConnector(entityManagerFactory);
  }

  public List<IntervalDao> findIntervalsByTimeRange(Instant seedDataStartTime, Instant seedDataEndTime) {

    Validate.notNull(seedDataStartTime, MISSING_START_TIME_ERROR);
    Validate.notNull(seedDataEndTime, MISSING_END_TIME_ERROR);
    Validate.isTrue(seedDataStartTime.isBefore(seedDataEndTime), START_NOT_BEFORE_END_TIME_ERROR,
        seedDataStartTime, seedDataEndTime);

    return runWithEntityManager(entityManager -> {

      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<IntervalDao> query = cb.createQuery(IntervalDao.class);
      Root<IntervalDao> fromInterval = query.from(IntervalDao.class);

      query.select(fromInterval);
      query.where(cb.and(
        cb.greaterThan(fromInterval.get(CLASS_END_TIME_NAME_TIME_KEY).get(END_TIME),
          seedDataStartTime.getEpochSecond()),
        cb.lessThanOrEqualTo(fromInterval.get(CLASS_END_TIME_NAME_TIME_KEY).get(END_TIME),
          seedDataEndTime.getEpochSecond())
      ));

      return entityManager.createQuery(query).getResultList();
    });
  }

  public List<IntervalDao> findIntervalsByNameAndTimeRange(Set<Pair<String, String>> intervalClassAndNames,
    Instant startTime, Instant endTime) {

    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);
    Validate.notNull(intervalClassAndNames, MISSING_INTERVAL_CLASS_AND_NAMES_ERROR);
    Validate.isTrue(startTime.isBefore(endTime), START_NOT_BEFORE_END_TIME_ERROR);

    return runWithEntityManager(entityManager -> {

      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<IntervalDao> query = cb.createQuery(IntervalDao.class);
      Root<IntervalDao> intervalDaoRoot = query.from(IntervalDao.class);

      query.select(intervalDaoRoot);
      query.where(
        cb.and(
          cb.greaterThan(intervalDaoRoot.get(CLASS_END_TIME_NAME_TIME_KEY).get(END_TIME),
            startTime.getEpochSecond()),
          cb.lessThan(intervalDaoRoot.get(CLASS_END_TIME_NAME_TIME_KEY).get(TIME),
            endTime.getEpochSecond()),
          cb.or(
            intervalClassAndNames.stream().map(classAndName ->
              cb.and(
                cb.equal(intervalDaoRoot.get(CLASS_END_TIME_NAME_TIME_KEY).get("type"),
                  classAndName.getLeft()),
                cb.equal(intervalDaoRoot.get(CLASS_END_TIME_NAME_TIME_KEY).get("name"),
                  classAndName.getRight())
              )
            ).toArray(Predicate[]::new)
          )
        )
      );

      return entityManager.createQuery(query).getResultList();
    });
  }

  public List<IntervalDao> findIntervalsByNameAndTimeRangeAfterModDate(Set<Pair<String, String>> intervalClassAndNames,
    Instant startTime, Instant endTime, Instant modDate) {
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);
    Validate.notNull(intervalClassAndNames, MISSING_INTERVAL_CLASS_AND_NAMES_ERROR);
    Validate.isTrue(startTime.isBefore(endTime), START_NOT_BEFORE_END_TIME_ERROR);

    return runWithEntityManager(entityManager -> {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<IntervalDao> query = cb.createQuery(IntervalDao.class);
      Root<IntervalDao> intervalDaoRoot = query.from(IntervalDao.class);

      query.select(intervalDaoRoot)
        .where(
          cb.and(
            cb.greaterThan(intervalDaoRoot.get(CLASS_END_TIME_NAME_TIME_KEY).get(END_TIME),
              startTime.getEpochSecond()),
            cb.lessThan(intervalDaoRoot.get(CLASS_END_TIME_NAME_TIME_KEY).get(TIME),
              endTime.getEpochSecond()),
            cb.or(
              intervalClassAndNames.stream().map(classAndName ->
                cb.and(
                  cb.equal(intervalDaoRoot.get(CLASS_END_TIME_NAME_TIME_KEY).get("type"),
                    classAndName.getLeft()),
                  cb.equal(intervalDaoRoot.get(CLASS_END_TIME_NAME_TIME_KEY).get("name"),
                    classAndName.getRight())
                )
              ).toArray(Predicate[]::new)
            ),
            cb.greaterThan(intervalDaoRoot.get("lastModificationDate"), modDate)
          )
        );

      return entityManager.createQuery(query).getResultList();
    });
  }
}
