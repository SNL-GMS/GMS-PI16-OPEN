package gms.shared.frameworks.osd.repository.performancemonitoring;

import com.google.common.base.Preconditions;
import com.google.common.collect.Lists;
import gms.shared.frameworks.osd.api.performancemonitoring.PerformanceMonitoringRepositoryInterface;
import gms.shared.frameworks.osd.api.util.HistoricalStationSohRequest;
import gms.shared.frameworks.osd.api.util.RepositoryExceptionUtils;
import gms.shared.frameworks.osd.api.util.StationsTimeRangeRequest;
import gms.shared.frameworks.osd.coi.soh.SohMonitorType;
import gms.shared.frameworks.osd.coi.soh.StationSoh;
import gms.shared.frameworks.osd.dao.channel.StationDao;
import gms.shared.frameworks.osd.dao.soh.StationSohDao;
import gms.shared.frameworks.osd.dto.soh.HistoricalStationSoh;
import gms.shared.frameworks.osd.repository.performancemonitoring.converter.StationSohDaoConverter;
import gms.shared.frameworks.osd.repository.performancemonitoring.transform.StationSohObjectArrayTransformer;
import gms.shared.metrics.CustomMetric;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.slf4j.LoggerFactory;

import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceException;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Expression;
import javax.persistence.criteria.Join;
import javax.persistence.criteria.Root;
import javax.persistence.criteria.Subquery;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

public class PerformanceMonitoringRepositoryJpa implements
    PerformanceMonitoringRepositoryInterface {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper.create(LoggerFactory
      .getLogger(PerformanceMonitoringRepositoryJpa.class));
  public static final String STATION_ATTRIBUTE = "station";
  public static final String CHANNEL_SOH_ATTRIBUTE = "station";
  public static final String STATION_NAME_ATTRIBUTE = "stationName";
  public static final String CREATION_TIME_ATTRIBUTE = "creationTime";
  public static final String NAME_ATTRIBUTE = "name";

  private final EntityManagerFactory entityManagerFactory;

  private static final CustomMetric<PerformanceMonitoringRepositoryJpa, Long> performanceMonitoringRetrieveStationId =
      CustomMetric.create(CustomMetric::incrementer,
          "performance_monitoring_retrieve_station_id_hits:type=Counter", 0L);

  private static final CustomMetric<PerformanceMonitoringRepositoryJpa, Long> performanceMonitoringRetrieveStationTime =
      CustomMetric.create(CustomMetric::incrementer,
          "performanceMonitoringRetrieveStationTime:type=Counter", 0L);

  private static final CustomMetric<PerformanceMonitoringRepositoryJpa, Long> performanceMonitoringStoreStationSOH =
      CustomMetric.create(CustomMetric::incrementer,
          "performance_monitoring_store_station_soh_hits:type=Counter", 0L);

  private static final CustomMetric<Long, Long> performanceMonitoringRetrieveStationIdDuration =
      CustomMetric.create(CustomMetric::updateTimingData,
          "performance_monitoring_retrieve_station_id_duration:type=Value", 0L);

  private static final CustomMetric<Long, Long> performanceMonitoringRetrieveStationTimeDuration =
      CustomMetric.create(CustomMetric::updateTimingData,
          "performance_monitoring_retrieve_station_time_duration:type=Value", 0L);

  private static final CustomMetric<Long, Long> performanceMonitoringStoreStationSOHDuration =
      CustomMetric.create(CustomMetric::updateTimingData,
          "performance_monitoring_store_station_soh_duration:type=Value", 0L);

  /**
   * Constructor taking in the EntityManagerFactory
   *
   * @param entityManagerFactory {@link EntityManagerFactory}
   */
  public PerformanceMonitoringRepositoryJpa(EntityManagerFactory entityManagerFactory) {
    Objects.requireNonNull(entityManagerFactory,
        "Cannot instantiate PerformanceMonitoringRepositoryJpa with null EntityManager");
    this.entityManagerFactory = entityManagerFactory;
  }

  /**
   * Retrieve the latest {@link StationSoh} by station group ids. There are multiple {@link
   * StationSoh} objects per station group id; this method returns the "latest" {@link StationSoh}
   * object for a given station group id where "latest" equals the {@link StationSoh} object for
   * that station group id with the max end time.
   *
   * @return a List of {@link StationSoh}, or an empty list if none found.
   */

  @Override
  public List<StationSoh> retrieveByStationId(List<String> stationNames) {
    Objects.requireNonNull(stationNames);
    Preconditions.checkState(!stationNames.isEmpty());
    var em = entityManagerFactory.createEntityManager();

    performanceMonitoringRetrieveStationId.updateMetric(this);
    var start = Instant.now();

    try {
      var builder = em.getCriteriaBuilder();
      CriteriaQuery<StationSohDao> stationSohQuery = builder.createQuery(StationSohDao.class);
      Root<StationSohDao> fromStationSoh = stationSohQuery.from(StationSohDao.class);
      stationSohQuery.select(fromStationSoh);

      Join<StationSohDao, StationDao> stationJoin = fromStationSoh.join(STATION_ATTRIBUTE);
      Expression<String> stationName = stationJoin.get(NAME_ATTRIBUTE);

      Expression<Instant> creationTime = fromStationSoh.get(CREATION_TIME_ATTRIBUTE);

      Subquery<Instant> subquery = stationSohQuery.subquery(Instant.class);
      Root<StationSohDao> subRoot = subquery.from(StationSohDao.class);

      Join<StationSohDao, StationDao> subStationJoin = subRoot.join(STATION_ATTRIBUTE);
      Expression<String> subStationName = subStationJoin.get(NAME_ATTRIBUTE);
      Expression<Instant> subCreationTime = subRoot.get(CREATION_TIME_ATTRIBUTE);

      subquery
          .where(
              subStationName.in(stationNames),
              builder.equal(subStationName, stationName)
          )
          .groupBy(subStationName)
          .select(builder.greatest(subCreationTime));

      stationSohQuery.where(builder.equal(creationTime, subquery));

      var converter = new StationSohDaoConverter();
      return em.createQuery(stationSohQuery)
          .getResultStream()
          .map(converter::toCoi)
          .collect(Collectors.toList());
    } catch (Exception ex) {
      throw new IllegalStateException("Error retrieving station group SOH status: {}", ex);
    } finally {
      em.close();

      var finish = Instant.now();
      long timeElapsed = Duration.between(start, finish).toMillis();
      performanceMonitoringRetrieveStationIdDuration.updateMetric(timeElapsed);
    }
  }

  /**
   * Retrieve the {@link StationSoh}(s) within a time range (inclusive) that are currently stored in
   * the database. If a start and end time is not provided, retrieve the most recently stored {@link
   * StationSoh}.
   *
   * @param request Request containing station names and a time range
   * @return a List of {@link StationSoh}(s)
   */
  @Override
  public List<StationSoh> retrieveByStationsAndTimeRange(StationsTimeRangeRequest request) {
    Objects.requireNonNull(request);

    performanceMonitoringRetrieveStationTime.updateMetric(this);
    var start = Instant.now();

    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var builder = entityManager.getCriteriaBuilder();
      CriteriaQuery<StationSohDao> stationSohQuery =
        builder.createQuery(StationSohDao.class);
      Root<StationSohDao> fromStationSoh = stationSohQuery.from(StationSohDao.class);

      Join<StationSohDao, StationDao> stationJoin = fromStationSoh.join(STATION_ATTRIBUTE);
      Expression<String> stationName = stationJoin.get(NAME_ATTRIBUTE);

      stationSohQuery.select(fromStationSoh)
          .where(builder.and(builder.greaterThanOrEqualTo(fromStationSoh.get(
              CREATION_TIME_ATTRIBUTE), request.getTimeRange().getStartTime()),
              builder.lessThanOrEqualTo(fromStationSoh.get(CREATION_TIME_ATTRIBUTE),
                  request.getTimeRange().getEndTime()),
              stationName.in(request.getStationNames())));

      return entityManager.createQuery(stationSohQuery)
          .getResultStream()
          .map(new StationSohDaoConverter()::toCoi)
          .collect(Collectors.toList());
    } finally {
      entityManager.close();

      var finish = Instant.now();
      long timeElapsed = Duration.between(start, finish).toMillis();
      performanceMonitoringRetrieveStationTimeDuration.updateMetric(timeElapsed);
    }
  }

  /**
   * Store the provided {@link StationSoh}(s).
   *
   * @param stationSohs The {@link StationSoh}(s) to store
   * @return A list of UUIDs that correspond to the {@link StationSoh}(s) that were successfully
   * stored.
   */
  @Override
  public List<UUID> storeStationSoh(Collection<StationSoh> stationSohs) {
    Objects.requireNonNull(stationSohs);
    List<UUID> uuids = new ArrayList<>();
    var entityManager = entityManagerFactory.createEntityManager();

    //TODO - may look into dynamically setting this to a lower number, but batch size is shared across persistence context
    var batchSizeProp = entityManagerFactory.getProperties()
      .getOrDefault("hibernate.jdbc.batch_size", "50").toString();
    var batchSize = Integer.parseInt(batchSizeProp);

    performanceMonitoringStoreStationSOH.updateMetric(this);
    var start = Instant.now();
    var converter = new StationSohDaoConverter();
    entityManager.getTransaction().begin();
    try {
      for (List<StationSoh> batch : Lists.partition(List.copyOf(stationSohs), batchSize)) {
        for (StationSoh stationSoh : batch) {
          StationSohDao dao = converter.fromCoi(stationSoh, entityManager);
          entityManager.persist(dao);
          uuids.add(stationSoh.getId());
        }
        entityManager.flush();
        entityManager.clear();
      }
      entityManager.getTransaction().commit();
    } catch (PersistenceException e) {
      entityManager.getTransaction().rollback();
      throw RepositoryExceptionUtils.wrap(e);
    } finally {
      entityManager.close();

      var finish = Instant.now();
      long timeElapsed = Duration.between(start, finish).toMillis();
      performanceMonitoringStoreStationSOHDuration.updateMetric(timeElapsed);
    }

    return uuids;
  }

  /**
   * Retrieves a HistoricalStationSoh DTO object corresponding to the provided Station ID and
   * collection of SohMonitorTypes provided in the request body.
   * <p>
   * The returned HistoricalStationSoh object contains SOH monitor values from StationSoh objects
   * with calculation time attributes in the time range provided (both start and end times are
   * inclusive), and aggregates the HistoricalSohMonitorValue objects by value and all associations
   * to Station and Channel are by identifier.
   *
   * @return A {@link HistoricalStationSoh} object that conforms to the provided parameters
   */
  @Override
  public HistoricalStationSoh retrieveHistoricalStationSoh(HistoricalStationSohRequest request) {
    Preconditions.checkNotNull(request, "Request cannot be null");

    var sohMonitorType = request.getSohMonitorType();

    if (!SohMonitorType.validTypes().contains(sohMonitorType)) {
      logger.warn(
          "Unsupported monitor type provided. No SOH will be provided for {}. "
              + "Supported types are {}.",
          sohMonitorType, SohMonitorType.validTypes());

      return HistoricalStationSoh.create(request.getStationName(), new long[]{}, List.of());
    }

    return queryHistoricalStationSoh(request);
  }

  /**
   * Performs query to DB.  We are using nativeQuery to select only specific columns we need. I
   * wasn't able to do it with CriteriaQuery or JPQL due to inheritance table on SMVS
   *
   * @param request contains request with values to pass into query
   * @return HistoricalStationSoh contains processed results of query
   */
  private HistoricalStationSoh queryHistoricalStationSoh(HistoricalStationSohRequest request) {
    HistoricalStationSoh historicalStationSoh;
    var em = entityManagerFactory.createEntityManager();

    try {
      var stationNameParameterPrefix = "station_name_param_";
      var queryString = new StringBuilder();

      var stationNameConstraintQuery = em
        .createNativeQuery("select name from gms_soh.station " +
          "where name != :station_name");

      stationNameConstraintQuery.setParameter("station_name", request.getStationName());

      var stationNameConstraintQueryResultList = stationNameConstraintQuery.getResultList();

      queryString.append(
          "SELECT stationSoh.station_name, stationSoh.creation_time, channelSoh.channel_name, " +
              "smvs.monitor_type, smvs.duration, smvs.percent, smvs.status " +
              "FROM gms_soh.station_soh stationSoh " +
              "INNER JOIN gms_soh.channel_soh channelSoh " +
              "ON stationSoh.id = channelSoh.station_soh_id and " +
              "stationSoh.station_name = channelSoh.station_soh_station_name " +
              "INNER JOIN gms_soh.soh_monitor_value_status smvs " +
              "ON channelSoh.id = smvs.channel_soh_id " +
              "WHERE stationSoh.station_name like :station_name ");

      for (int i = 0,
          stationNameConstraintQueryResultListSize = stationNameConstraintQueryResultList.size();
          i < stationNameConstraintQueryResultListSize; i++) {
        queryString.append("AND stationSoh.station_name != :");
        queryString.append(stationNameParameterPrefix);
        queryString.append(i);
        queryString.append(" ");
      }

      queryString.append("AND stationSoh.creation_time >= :start_time " +
          "AND stationSoh.creation_time <= :end_time " +
          "AND smvs.monitor_type = :monitorTypeId " +
          "ORDER BY creation_time ASC");

      var query = em.createNativeQuery(queryString.toString());

      //Postgres enums are not supported, so need to convert to id
      short monitorTypeDbId = request.getSohMonitorType().getDbId();

      for (int i = 0,
          stationNameConstraintQueryResultListSize = stationNameConstraintQueryResultList.size();
          i < stationNameConstraintQueryResultListSize; i++) {
        query.setParameter(stationNameParameterPrefix + i,
            stationNameConstraintQueryResultList.get(i));
      }

      query.setParameter("station_name", request.getStationName());
      query.setParameter("start_time", Instant.ofEpochMilli(request.getStartTime()));
      query.setParameter("end_time", Instant.ofEpochMilli(request.getEndTime()));
      query.setParameter("monitorTypeId", monitorTypeDbId);

      historicalStationSoh = StationSohObjectArrayTransformer
          .createHistoricalStationSoh(request.getStationName(), query.getResultList());

    } catch (Exception ex) {
      throw new IllegalStateException("Error retrieving historical SOH: {}", ex);
    } finally {
      em.close();
    }

    return historicalStationSoh;
  }
}
