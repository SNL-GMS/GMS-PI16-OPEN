package gms.shared.stationdefinition.database.connector;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.utilities.bridge.database.DatabaseConnector;
import gms.shared.utilities.bridge.database.DatabaseConnectorException;
import org.apache.commons.lang3.Validate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.EntityManagerFactory;
import javax.persistence.NoResultException;
import javax.persistence.NonUniqueResultException;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Path;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static com.google.common.base.Preconditions.checkNotNull;

public class SiteChanDatabaseConnector extends DatabaseConnector {

  private static final String ID = "id";
  private static final String STATION_CODE = "stationCode";
  private static final String CHANNEL_CODE = "channelCode";
  private static final String ON_DATE = "onDate";
  private static final String OFF_DATE = "offDate";

  private static final Logger logger = LoggerFactory.getLogger(SiteChanDatabaseConnector.class);

  private static final String MISSING_KEY_SET_ERROR = "Request for SiteChan by SiteChanKey was must be given a list of keys";
  private static final String MISSING_START_TIME_ERROR = "Request for SiteChan by time range was must be given a start time";
  private static final String MISSING_END_TIME_ERROR = "Request for SiteChan by time range was must be given a end time";
  private static final String MISSING_STATION_CODES_ERROR = "Request for SiteChan by station codes was must be given a list of station codes";

  private SiteChanDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  /**
   * Factory method for creating SiteChanRepositoryJpa
   *
   * @param entityManagerFactory EntityManagerFactory
   * @return SiteChanRepositoryJpa
   */
  public static SiteChanDatabaseConnector create(EntityManagerFactory entityManagerFactory) {
    checkNotNull(entityManagerFactory,
      "Cannot create SiteChanRepositoryJpa with null EntityManagerFactory");

    return new SiteChanDatabaseConnector(entityManagerFactory);
  }

  public Optional<SiteChanDao> findSiteChan(SiteChanKey siteChanKey) {
    Validate.notNull(siteChanKey, "Request for SiteChan by SiteChanKey was must be given a key");

    final var stationCode = siteChanKey.getStationCode();
    final var channelCode = siteChanKey.getChannelCode();
    final var onDate = siteChanKey.getOnDate();

    return runWithEntityManager(entityManager -> {

      CriteriaBuilder cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<SiteChanDao> query = cb.createQuery(SiteChanDao.class);
      Root<SiteChanDao> fromSiteChan = query.from(SiteChanDao.class);

      query.select(fromSiteChan);

      final Path<Object> channelId = fromSiteChan.get(ID);
      query.where(cb.and(
        cb.equal(channelId.get(STATION_CODE), stationCode),
        cb.equal(channelId.get(CHANNEL_CODE), channelCode),
        cb.equal(channelId.get(ON_DATE), onDate)
      ));

      try {
        return Optional.of(entityManager.createQuery(query).getSingleResult());
      } catch (NoResultException e) {
        final String message = String
          .format("No SiteChan Found for '%s, %s, %s'", stationCode, channelCode, onDate);
        logger.warn(message, e);
        return Optional.empty();
      } catch (NonUniqueResultException e) {
        final String message = String
          .format("No Unique SiteChan Found for '%s, %s, %s'", stationCode, channelCode,
            onDate);
        logger.warn(message, e);
        return Optional.empty();
      } catch (Exception e) {
        final String message = String
          .format("Error Retrieving SiteChan For '%s, %s, %s'", stationCode, channelCode,
            onDate);
        throw new DatabaseConnectorException(message, e);
      }
    });
  }

  public List<SiteChanDao> findSiteChansByStationCodeAndTime(Collection<String> stationCodes, Instant effectiveTime) {
    Objects.requireNonNull(stationCodes);
    Objects.requireNonNull(effectiveTime);

    if (stationCodes.isEmpty()) {
      logger.debug("Request for SiteChan by name was given an empty list of station codes");
      return new ArrayList<>();
    } else {
      return runWithEntityManager(entityManager ->
        runPartitionedQuery(stationCodes, 950, partition -> {
          CriteriaBuilder builder = entityManager.getCriteriaBuilder();
          CriteriaQuery<SiteChanDao> query = builder.createQuery(SiteChanDao.class);
          Root<SiteChanDao> fromSiteChan = query.from(SiteChanDao.class);
          query.select(fromSiteChan)
            .where(builder.and(fromSiteChan.get(ID).get(STATION_CODE).in(partition),
              builder.lessThanOrEqualTo(fromSiteChan.get(ID).get(ON_DATE), effectiveTime),
              builder.greaterThanOrEqualTo(fromSiteChan.get(OFF_DATE), effectiveTime)));

          return entityManager.createQuery(query).getResultList();
        })
      );
    }
  }

  public List<SiteChanDao> findSiteChansByStationCodeAndTimeRange(Collection<String> stationCodes,
    Instant startTime,
    Instant endTime) {

    Objects.requireNonNull(stationCodes, MISSING_STATION_CODES_ERROR);
    Objects.requireNonNull(startTime);
    Objects.requireNonNull(endTime);
    Preconditions.checkState(endTime.isAfter(startTime));

    if (stationCodes.isEmpty()) {
      logger.debug(MISSING_STATION_CODES_ERROR);
      return new ArrayList<>();
    } else {
      return runWithEntityManager(entityManager ->
        runPartitionedQuery(stationCodes, 400, partition -> {

          CriteriaBuilder cb = entityManager.getCriteriaBuilder();
          CriteriaQuery<SiteChanDao> query = cb.createQuery(SiteChanDao.class);
          Root<SiteChanDao> fromSiteChan = query.from(SiteChanDao.class);

          final Path<Object> idPath = fromSiteChan.get(ID);
          query.select(fromSiteChan);
          query.where(cb.and(idPath.get(STATION_CODE).in(partition),
            cb.greaterThanOrEqualTo(fromSiteChan.get(OFF_DATE), startTime),
            cb.lessThanOrEqualTo(idPath.get(ON_DATE), endTime)));

          return entityManager.createQuery(query).getResultList();
        }));
    }
  }

  public List<SiteChanDao> findSiteChansByNameAndTimeRange(Collection<SiteChanKey> siteChanKeys,
    Instant startTime, Instant endTime) {

    Validate.notNull(siteChanKeys, MISSING_KEY_SET_ERROR);
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);

    if (siteChanKeys.isEmpty()) {
      logger.debug(MISSING_KEY_SET_ERROR);
      return new ArrayList<>();
    } else {
      return runWithEntityManager(entityManager ->
        runPartitionedQuery(siteChanKeys, 250, keySubList -> {

          CriteriaBuilder cb = entityManager.getCriteriaBuilder();
          CriteriaQuery<SiteChanDao> query = cb.createQuery(SiteChanDao.class);
          Root<SiteChanDao> fromSiteChan = query.from(SiteChanDao.class);

          final Path<Object> idPath = fromSiteChan.get(ID);
          query.select(fromSiteChan);
          query.where(
            cb.or(
              keySubList.stream()
                .map(k -> cb.and(
                  cb.equal(idPath.get(STATION_CODE), k.getStationCode()),
                  cb.equal(idPath.get(CHANNEL_CODE), k.getChannelCode()),
                  cb.greaterThanOrEqualTo(fromSiteChan.get(OFF_DATE), startTime),
                  cb.lessThanOrEqualTo(idPath.get(ON_DATE), endTime)
                ))
                .toArray(Predicate[]::new)
            ));

          return entityManager.createQuery(query).getResultList();
        }));
    }
  }

  public List<SiteChanDao> findSiteChansByTimeRange(Instant startTime, Instant endTime) {

    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);

    return runWithEntityManager(entityManager -> {

      CriteriaBuilder cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<SiteChanDao> query = cb.createQuery(SiteChanDao.class);
      Root<SiteChanDao> fromSiteChan = query.from(SiteChanDao.class);

      final Path<Object> idPath = fromSiteChan.get(ID);
      query.select(fromSiteChan);
      query.where(cb.and(
        cb.greaterThanOrEqualTo(fromSiteChan.get(OFF_DATE), startTime),
        cb.lessThanOrEqualTo(idPath.get(ON_DATE), endTime)
      ));

      return entityManager.createQuery(query).getResultList();
    });
  }

  public List<SiteChanDao> findSiteChansByKeyAndTime(List<SiteChanKey> siteChanKeys, Instant effectiveAt) {
    Validate.notNull(siteChanKeys);
    Validate.notNull(effectiveAt);

    if (siteChanKeys.isEmpty()) {
      logger.debug(MISSING_KEY_SET_ERROR);
      return List.of();
    }

    return runWithEntityManager(entityManager ->
      runPartitionedQuery(siteChanKeys, 500, keySublist -> {
        CriteriaBuilder builder = entityManager.getCriteriaBuilder();
        CriteriaQuery<SiteChanDao> siteChanQuery = builder.createQuery(SiteChanDao.class);
        Root<SiteChanDao> fromSiteChan = siteChanQuery.from(SiteChanDao.class);
        Path<SiteChanKey> id = fromSiteChan.get(ID);
        siteChanQuery.select(fromSiteChan)
          .where(builder.and(
            builder.or(keySublist.stream()
              .map(key -> builder.and(builder.equal(id.get(STATION_CODE), key.getStationCode()),
                builder.equal(id.get(CHANNEL_CODE), key.getChannelCode())))
              .toArray(Predicate[]::new))),
            builder.lessThanOrEqualTo(id.get(ON_DATE), effectiveAt),
            builder.greaterThanOrEqualTo(fromSiteChan.get(OFF_DATE), effectiveAt));

        return entityManager.createQuery(siteChanQuery).getResultList();
      })
    );
  }
}
