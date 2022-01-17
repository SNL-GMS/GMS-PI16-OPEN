package gms.shared.frameworks.osd.repository.rawstationdataframe;

import com.google.common.annotations.VisibleForTesting;
import com.google.common.collect.Lists;
import gms.shared.frameworks.osd.api.rawstationdataframe.AceiUpdates;
import gms.shared.frameworks.osd.api.rawstationdataframe.AcquiredChannelEnvironmentIssueRepositoryInterface;
import gms.shared.frameworks.osd.api.util.ChannelTimeAceiTypeRequest;
import gms.shared.frameworks.osd.api.util.ChannelTimeRangeRequest;
import gms.shared.frameworks.osd.api.util.ChannelTimeRangeSohTypeRequest;
import gms.shared.frameworks.osd.api.util.ChannelsTimeRangeRequest;
import gms.shared.frameworks.osd.api.util.RepositoryExceptionUtils;
import gms.shared.frameworks.osd.api.util.TimeRangeRequest;
import gms.shared.frameworks.osd.coi.ParameterValidation;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue.AcquiredChannelEnvironmentIssueType;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueAnalog;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueId;
import gms.shared.frameworks.osd.dao.channelsoh.AcquiredChannelEnvironmentIssueAnalogDao;
import gms.shared.frameworks.osd.dao.channelsoh.AcquiredChannelEnvironmentIssueBooleanDao;
import gms.shared.frameworks.osd.dao.channelsoh.AcquiredChannelEnvironmentIssueDao;
import gms.shared.frameworks.osd.repository.rawstationdataframe.converter.AcquiredChannelEnvironmentIssueAnalogDaoConverter;
import gms.shared.frameworks.osd.repository.rawstationdataframe.converter.AcquiredChannelEnvironmentIssueBooleanDaoConverter;
import gms.shared.frameworks.utilities.jpa.EntityConverter;
import gms.shared.metrics.CustomMetric;
import org.apache.commons.lang3.Validate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceException;
import javax.persistence.Tuple;
import javax.persistence.TypedQuery;
import javax.persistence.criteria.CriteriaDelete;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Expression;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import javax.persistence.criteria.Subquery;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;

/**
 * Implement interface for storing and retrieving objects related to State of Health (SOH) from the
 * relational database.
 */
public class AcquiredChannelEnvironmentIssueRepositoryJpa implements AcquiredChannelEnvironmentIssueRepositoryInterface {

  private static final Logger logger = LoggerFactory
    .getLogger(AcquiredChannelEnvironmentIssueRepositoryJpa.class);
  private static final String CHANNEL_NAME = "channelName";
  private static final String START_TIME = "startTime";
  private static final String END_TIME = "endTime";
  private static final String COMPOSITE_ID = "id";
  private static final String TYPE = "type";

  private final EntityManagerFactory entityManagerFactory;
  private final int batchSize;

  /**
   * Default constructor.
   */
  public AcquiredChannelEnvironmentIssueRepositoryJpa(EntityManagerFactory entityManagerFactory) {
    this.entityManagerFactory = entityManagerFactory;
    var batchSizeProp = entityManagerFactory.getProperties()
      .getOrDefault("hibernate.jdbc.batch_size", "50")
      .toString();
    this.batchSize = Integer.parseInt(batchSizeProp);
  }

  /**
   * Stores a collection of {@link AcquiredChannelEnvironmentIssue} state of health objects.
   *
   * @param aceiUpdates a Map of ACEIs.
   */
  @Override
  public void syncAceiUpdates(AceiUpdates aceiUpdates) {
    Validate.notNull(aceiUpdates, "param aceis may not be null");

    deleteAnalogs(aceiUpdates.getAnalogDeletes());
    deleteBooleans(aceiUpdates.getBooleanDeletes());
    storeBooleanAceis(aceiUpdates.getBooleanInserts());
    storeAnalogAceis(aceiUpdates.getAnalogInserts());
  }

  /**
   * Stores a collection of {@link AcquiredChannelEnvironmentIssueAnalog} state of health objects
   * containing analog values.
   *
   * @param analogAceis The analog SOH object.
   */
  //TODO: remove from interface and make private
  @Override
  public void storeAnalogAceis(Collection<AcquiredChannelEnvironmentIssueAnalog> analogAceis) {
    logger.debug("Inserting analog ACEIs ...");
    if (!analogAceis.isEmpty()) {
      measureRunnable(() -> storeInternal(analogAceis, new AcquiredChannelEnvironmentIssueAnalogDaoConverter()),
        AceiRepositoryMetrics.sohStoreACEIAnalog,
        AceiRepositoryMetrics.sohStoreACEIAnalogDuration)
        .run();
    }
  }

  /**
   * Stores a collection of {@link AcquiredChannelEnvironmentIssueBoolean} state of health objects
   * containing boolean values.
   *
   * @param booleanAceis The boolean SOH objects to store.
   */
  //TODO: remove from interface and make private
  @Override
  public void storeBooleanAceis(Collection<AcquiredChannelEnvironmentIssueBoolean> booleanAceis) {
    logger.debug("Storing boolean ACEIs ...");
    if (!booleanAceis.isEmpty()) {
      measureRunnable(() -> storeInternal(booleanAceis, new AcquiredChannelEnvironmentIssueBooleanDaoConverter()),
        AceiRepositoryMetrics.sohStoreACEIBoolean,
        AceiRepositoryMetrics.sohStoreACEIBooleanDuration)
        .run();
    }
  }

  private <T extends AcquiredChannelEnvironmentIssue<?>, D extends AcquiredChannelEnvironmentIssueDao>
  void storeInternal(Collection<T> aceis, EntityConverter<D, T> aceiConverter) {
    Validate.notNull(aceis, "Cannot store null ACEI collection");
    var entityManager = entityManagerFactory.createEntityManager();

    try {
      var channelNames = getChannelNames(entityManager);
      //remove aceis with invalid channel FK and convert to our daos
      var aceiDaos = aceis.stream()
        .filter(acei -> channelNames.contains(acei.getChannelName()))
        .map(acei -> aceiConverter.fromCoi(acei, entityManager))
        .collect(Collectors.toList());

      entityManager.getTransaction().begin();
      for (List<D> batch : Lists.partition(aceiDaos, batchSize)) {
        for (D aceiDao : batch) {
          entityManager.merge(aceiDao);
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
    }
  }

  /**
   * Removes a collection of {@link AcquiredChannelEnvironmentIssueBoolean} state of health objects
   *
   * @param aceiAnalogs the collection of boolean SOH objects to remove.
   */
  private void deleteAnalogs(Collection<AcquiredChannelEnvironmentIssueAnalog> aceiAnalogs) {
    if (!aceiAnalogs.isEmpty()) {
      logger.debug("Deleting boolean ACEIs ...");
      measureRunnable(() -> deleteInternal(aceiAnalogs, AcquiredChannelEnvironmentIssueAnalogDao.class),
        AceiRepositoryMetrics.sohRemoveACEIAnalog,
        AceiRepositoryMetrics.sohRemoveACEIAnalogDuration)
        .run();
    }
  }

  /**
   * Removes a collection of {@link AcquiredChannelEnvironmentIssueBoolean} state of health objects
   *
   * @param aceiBooleans the collection of boolean SOH objects to remove.
   */
  private void deleteBooleans(Collection<AcquiredChannelEnvironmentIssueBoolean> aceiBooleans) {
    if (!aceiBooleans.isEmpty()) {
      logger.debug("Deleting boolean ACEIs ...");
      measureRunnable(() -> deleteInternal(aceiBooleans, AcquiredChannelEnvironmentIssueBooleanDao.class),
        AceiRepositoryMetrics.sohRemoveACEIBoolean,
        AceiRepositoryMetrics.sohRemoveACEIBooleanDuration)
        .run();
    }
  }

  /**
   * Removes a collection of {@link AcquiredChannelEnvironmentIssueBoolean} state of health objects
   * based on compositeId (channel_name, start_time, type)
   *
   * @param aceis the collection of aceiBooleans to remove.
   * @throws gms.shared.frameworks.coi.exceptions.RepositoryException if there was an issue interacting with the repository
   */
  @VisibleForTesting
  <T extends AcquiredChannelEnvironmentIssue<?>, D extends AcquiredChannelEnvironmentIssueDao>
  void deleteInternal(Collection<T> aceis, Class<D> entityType) {

    var entityManager = entityManagerFactory.createEntityManager();
    entityManager.getTransaction().begin();
    try {
      //get UUIDs for aceis
      List<gms.shared.frameworks.osd.dao.channelsoh.AcquiredChannelEnvironmentIssueId> compositeIds = aceis.stream()
        .map(acei -> new gms.shared.frameworks.osd.dao.channelsoh.AcquiredChannelEnvironmentIssueId(
            acei.getChannelName(),
            acei.getType(),
            acei.getStartTime()
          )
        )
        .collect(Collectors.toList());

      var builder = entityManager.getCriteriaBuilder();
      CriteriaDelete<D> delete = builder.createCriteriaDelete(entityType);
      Root<D> fromEntity = delete.from(entityType);
      delete.where(fromEntity.get(COMPOSITE_ID).in(compositeIds));

      entityManager.createQuery(delete).executeUpdate();
      entityManager.getTransaction().commit();
    } catch (PersistenceException ex) {
      entityManager.getTransaction().rollback();
      throw RepositoryExceptionUtils.wrap(ex);
    } finally {
      entityManager.close();
    }
  }

  private Runnable measureRunnable(Runnable runnable,
    CustomMetric<AcquiredChannelEnvironmentIssueRepositoryJpa, Long> metric,
    CustomMetric<Long, Long> duration) {
    return () -> {
      metric.updateMetric(this);
      var start = Instant.now();
      runnable.run();
      var finish = Instant.now();
      long timeElapsed = Duration.between(start, finish).toMillis();
      duration.updateMetric(timeElapsed);
    };
  }

  /**
   * If an ACEI references an invalid channel, it can't be stored to the DB and should be removed
   *
   * @return filtered list with aceis that have invalid channel removed
   */
  private List<String> getChannelNames(EntityManager entityManager) {

    TypedQuery<String> query = entityManager
      .createNamedQuery("Channel.getChannelNames", String.class)
      .setHint("org.hibernate.cacheable", true);
    return query.getResultList();
  }

  /**
   * Retrieves all {@link AcquiredChannelEnvironmentIssueAnalog} objects for the provided channel
   * created within the provided time range.
   *
   * @param request The collection of channel names and time range that will bound the {@link
   *                AcquiredChannelEnvironmentIssueAnalog}s retrieved.
   * @return All SOH analog objects that meet the query criteria.
   */
  @Override
  public List<AcquiredChannelEnvironmentIssueAnalog> findAnalogAceiByChannelAndTimeRange(ChannelTimeRangeRequest request) {
    Objects.requireNonNull(request);
    return measureSupplier(() -> findByChannelsAndTimeRangeInternal(AcquiredChannelEnvironmentIssueAnalogDao.class,
      AcquiredChannelEnvironmentIssueAnalogDao::toCoi, Set.of(request.getChannelName()),
      request.getTimeRange().getStartTime(), request.getTimeRange().getEndTime()),
      AceiRepositoryMetrics.sohRetrieveAnalog,
      AceiRepositoryMetrics.sohRetrieveAnalogDuration)
      .get();
  }

  /**
   * Retrieves all {@link AcquiredChannelEnvironmentIssueBoolean} objects for the provided channel
   * created within the provided time range.
   *
   * @param request The channel name and time range that will bound the {@link
   *                AcquiredChannelEnvironmentIssueBoolean}s retrieved.
   * @return All SOH boolean objects that meet the query criteria.
   */
  @Override
  public List<AcquiredChannelEnvironmentIssueBoolean> findBooleanAceiByChannelAndTimeRange(
    ChannelTimeRangeRequest request) {
    Objects.requireNonNull(request);

    return measureSupplier(() -> findByChannelsAndTimeRangeInternal(AcquiredChannelEnvironmentIssueBooleanDao.class,
      AcquiredChannelEnvironmentIssueBooleanDao::toCoi, Set.of(request.getChannelName()),
      request.getTimeRange().getStartTime(), request.getTimeRange().getEndTime()),
      AceiRepositoryMetrics.sohRetrieveBoolean,
      AceiRepositoryMetrics.sohRetrieveBooleanDuration)
      .get();
  }

  /**
   * Retrieves all {@link AcquiredChannelEnvironmentIssueBoolean} objects for the provided channel
   * created within the provided time range.
   *
   * @param request The collection of channel names and time range that will bound the {@link
   *                AcquiredChannelEnvironmentIssueBoolean}s retrieved.
   * @return All SOH boolean objects that meet the query criteria.
   */
  @Override
  public List<AcquiredChannelEnvironmentIssueBoolean> findBooleanAceiByChannelsAndTimeRange(
    ChannelsTimeRangeRequest request) {
    Objects.requireNonNull(request);
    return measureSupplier(() -> findByChannelsAndTimeRangeInternal(AcquiredChannelEnvironmentIssueBooleanDao.class,
      AcquiredChannelEnvironmentIssueBooleanDao::toCoi, new HashSet<>(request.getChannelNames()),
      request.getTimeRange().getStartTime(), request.getTimeRange().getEndTime()),
      AceiRepositoryMetrics.sohRetrieveBoolean,
      AceiRepositoryMetrics.sohRetrieveBooleanDuration)
      .get();
  }

  /**
   * Queries for JPA entities of type J from a particular channel within a time interval
   *
   * @param entityType  JPA entity type (e.g. Class J), not null
   * @param converter   converts from a JPA entity type J to the business object type B
   * @param channelNames channel names the SOH was measured on.
   * @param startTime   Inclusive start from time range for the query.
   * @param endTime     Inclusive end from time range for the query.
   * @param <E>         type of acquired channel SOH JPA entity (either {@link
   *                    AcquiredChannelEnvironmentIssueBooleanDao} or {@link
   *                    AcquiredChannelEnvironmentIssueAnalogDao})
   * @param <C>         type of acquired channel SOH business object (either {@link
   *                    AcquiredChannelEnvironmentIssueBoolean} or {@link AcquiredChannelEnvironmentIssueAnalog})
   * @return All SOH objects that meet the query criteria.
   */
  private <E extends AcquiredChannelEnvironmentIssueDao, C extends AcquiredChannelEnvironmentIssue<?>> List<C>
  findByChannelsAndTimeRangeInternal(Class<E> entityType, EntityConverter<E, C> converter, Set<String> channelNames,
    Instant startTime, Instant endTime) {
    Objects.requireNonNull(channelNames, "Cannot run query with null channel name set");
    Objects.requireNonNull(startTime, "Cannot run query with null start time");
    Objects.requireNonNull(endTime, "Cannot run query with null end time");

    //this allows startTime == endTime
    ParameterValidation.requireFalse(Instant::isAfter, startTime, endTime,
      "Cannot run query with start time greater than end time");
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var builder = entityManager.getCriteriaBuilder();
      CriteriaQuery<E> query = builder.createQuery(entityType);
      Root<E> fromEntity = query.from(entityType);
      query.select(fromEntity);

      query.where(builder.and(
        builder.lessThanOrEqualTo(fromEntity.get(COMPOSITE_ID).get(START_TIME), endTime),
        builder.greaterThanOrEqualTo(fromEntity.get(END_TIME), startTime),
        fromEntity.get(COMPOSITE_ID).get(CHANNEL_NAME).in(channelNames)))
        .orderBy(
          builder.asc(fromEntity.get(COMPOSITE_ID).get(CHANNEL_NAME)),
          builder.asc(fromEntity.get(COMPOSITE_ID).get(START_TIME)));

      TypedQuery<E> findDaos = entityManager.createQuery(query);

      return findDaos.getResultList()
        .stream()
        .map(converter::toCoi)
        .collect(Collectors.toList());
    } catch (Exception ex) {
      throw new IllegalStateException("Error retrieving frames, ", ex);
    } finally {
      entityManager.close();
    }
  }

  /**
   * Retrieve the {@link AcquiredChannelEnvironmentIssueAnalog} with the provided id.  Returns an
   * empty {@link Optional} if no AcquiredChannelSohAnalog has that id.
   *
   * @param id defining the id for the AcquiredChannelSohAnalog, not null
   * @return Optional AcquiredChannelSohAnalog object with the provided id, not null
   */
  @Override
  public Optional<AcquiredChannelEnvironmentIssueAnalog> findAnalogAceiById(AcquiredChannelEnvironmentIssueId id) {
    return measureSupplier(() -> findByIdInternal(AcquiredChannelEnvironmentIssueAnalogDao.class,
      AcquiredChannelEnvironmentIssueAnalogDao::toCoi, id),
      AceiRepositoryMetrics.sohRetrieveACEIAnalogId,
      AceiRepositoryMetrics.sohRetrieveACEIAnalogIdDuration)
      .get();
  }

  /**
   * Retrieve the {@link AcquiredChannelEnvironmentIssueBoolean} with the provided id.  Returns an
   * empty {@link Optional} if no AcquiredChannelSohBoolean has that id.
   *
   * @param id defining the id for the AcquiredChannelSohBoolean, not null
   * @return Optional AcquiredChannelSohBoolean object with the provided id, not null
   */
  @Override
  public Optional<AcquiredChannelEnvironmentIssueBoolean> findBooleanAceiById(AcquiredChannelEnvironmentIssueId id) {
    return measureSupplier(() -> findByIdInternal(AcquiredChannelEnvironmentIssueBooleanDao.class,
      AcquiredChannelEnvironmentIssueBooleanDao::toCoi, id),
      AceiRepositoryMetrics.sohRetrieveACEIBooleanId,
      AceiRepositoryMetrics.sohRetrieveACEIBooleanIdDuration)
      .get();
  }

  @Override
  public List<AcquiredChannelEnvironmentIssueAnalog> findAnalogAceiByChannelTimeRangeAndType(
    ChannelTimeRangeSohTypeRequest request) {
    Objects.requireNonNull(request);

    return measureSupplier(() -> findByChannelTimeRangeAndTypeInternal(AcquiredChannelEnvironmentIssueAnalogDao.class,
      new AcquiredChannelEnvironmentIssueAnalogDaoConverter(), request.getChannelName(),
      request.getTimeRange().getStartTime(), request.getTimeRange().getEndTime(), request.getType()),
      AceiRepositoryMetrics.sohRetrieveACEIAnalogTimeType,
      AceiRepositoryMetrics.sohRetrieveACEIAnalogTimeTypeDuration)
      .get();
  }

  @Override
  public List<AcquiredChannelEnvironmentIssueBoolean> findBooleanAceiByChannelTimeRangeAndType(
    ChannelTimeRangeSohTypeRequest request) {
    Objects.requireNonNull(request);

    return measureSupplier(() -> findByChannelTimeRangeAndTypeInternal(AcquiredChannelEnvironmentIssueBooleanDao.class,
      new AcquiredChannelEnvironmentIssueBooleanDaoConverter(), request.getChannelName(),
      request.getTimeRange().getStartTime(), request.getTimeRange().getEndTime(), request.getType()),
      AceiRepositoryMetrics.sohRetrieveACEIBooleanTimeType,
      AceiRepositoryMetrics.sohRetrieveACEIBooleanTimeTypeDuration)
      .get();
  }

  private <E extends AcquiredChannelEnvironmentIssueDao, C> List<C> findByChannelTimeRangeAndTypeInternal(
    Class<E> entityType,
    EntityConverter<E, C> converter,
    String channelName,
    Instant startTime,
    Instant endTime,
    AcquiredChannelEnvironmentIssueType type) {

    Objects.requireNonNull(entityType);
    Objects.requireNonNull(converter);
    Objects.requireNonNull(channelName);
    Objects.requireNonNull(startTime);
    Objects.requireNonNull(endTime);
    Objects.requireNonNull(type);

    ParameterValidation.requireFalse(Instant::isAfter, startTime, endTime,
      "Cannot run query when start time is after end time");

    var entityManager = entityManagerFactory.createEntityManager();

    try {
      var builder = entityManager.getCriteriaBuilder();
      CriteriaQuery<E> sohQuery = builder.createQuery(entityType);
      Root<E> fromSoh = sohQuery.from(entityType);
      sohQuery.select(fromSoh);

      List<Predicate> conjunctions = new ArrayList<>();

      conjunctions.add(builder.equal(fromSoh.get(COMPOSITE_ID).get(CHANNEL_NAME), channelName));
      conjunctions
          .add(builder.greaterThanOrEqualTo(fromSoh.get(COMPOSITE_ID).get(START_TIME), startTime));
      conjunctions.add(builder.lessThanOrEqualTo(fromSoh.get(END_TIME), endTime));
      conjunctions.add(builder.equal(fromSoh.get(COMPOSITE_ID).get(TYPE), type));

      sohQuery.where(builder.and(conjunctions.toArray(new Predicate[0])));

      return entityManager.createQuery(sohQuery)
          .getResultStream()
          .map(converter::toCoi)
          .collect(Collectors.toList());
    } finally {
      entityManager.close();
    }
  }

  /**
   * Queries the JPA entity of type J for an {@link AcquiredChannelEnvironmentIssue} object with the
   * provided identity. Uses the converter to convert from an instance of J to an
   * AcquiredChannelSoh. Output {@link Optional} is empty when the query does not find an entity.
   *
   * @param <E>        JPA entity type
   * @param entityType JPA entity type (e.g. {@link AcquiredChannelEnvironmentIssueBooleanDao}, not
   *                   null
   * @param converter  converts from an entityType object to an AcquiredChannelSoh, not null
   * @param id         {@link gms.shared.frameworks.osd.dao.channelsoh.AcquiredChannelEnvironmentIssueId} of the desired AcquiredChannelSoh,
   *                   not null
   * @return Optional AcquiredChannelSoh, not null
   */
  private <E extends AcquiredChannelEnvironmentIssueDao, C> Optional<C> findByIdInternal(Class<E> entityType,
    EntityConverter<E, C> converter, AcquiredChannelEnvironmentIssueId id) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var daoId = new gms.shared.frameworks.osd.dao.channelsoh.AcquiredChannelEnvironmentIssueId(
        id.getChannelName(), id.getType(), id.getStartTime());
      return Optional.ofNullable(entityManager.find(entityType, daoId)).map(converter::toCoi);
    } finally {
      entityManager.close();
    }
  }

  /**
   * Queries the JPA entity of type E for an {@link AcquiredChannelEnvironmentIssue} object with the
   * latest entry for a given channel name. Uses the converter to convert from an instance of E to
   * type C. Output is empty list when the query does not find an entity.
   *
   * @param entityType JPA entity type (e.g. {@link AcquiredChannelEnvironmentIssueBooleanDao}, not
   *                   null
   * @param converter  converts from an entityType object to an Type C, not null
   * @return List type C, not null
   */
  private <E, C> List<C> findLatestByChannelsInternal(Class<E> entityType, EntityConverter<E, C> converter) {

    var entityManager = entityManagerFactory.createEntityManager();
    try {
      List<Tuple> latestAceiInfo;
      var builder = entityManager.getCriteriaBuilder();
      CriteriaQuery<Tuple> sohMultiQuery = builder.createTupleQuery();
      Root<E> sohTuple = sohMultiQuery.from(entityType);
      Expression<String> channelName = sohTuple.get(COMPOSITE_ID).get(CHANNEL_NAME);

      Expression<Instant> endTime = sohTuple.get(END_TIME);
      Expression<AcquiredChannelEnvironmentIssueType> type = sohTuple.get(COMPOSITE_ID).get(TYPE);
      sohMultiQuery.multiselect(channelName, type, builder.greatest(endTime))
          .groupBy(channelName, type);

      latestAceiInfo = entityManager.createQuery(sohMultiQuery)
        .getResultList();

      return Lists.partition(latestAceiInfo, 50).stream()
        .map(infoPartition -> {
            CriteriaQuery<E> sohQuery = builder.createQuery(entityType);
            Root<E> fromSoh = sohQuery.from(entityType);
            sohQuery.select(fromSoh);

            Expression<String> subChannelName = fromSoh.get(COMPOSITE_ID).get(CHANNEL_NAME);
            Expression<AcquiredChannelEnvironmentIssueType> subType = fromSoh.get(COMPOSITE_ID)
                .get(TYPE);
            Expression<Instant> subEndTime = fromSoh.get(END_TIME);
          sohQuery.where(builder.or(infoPartition.stream()
                .map(infoTuple -> builder.and(builder.equal(subChannelName, infoTuple.get(0)),
                    builder.equal(subType, infoTuple.get(1)),
                    builder.equal(subEndTime, infoTuple.get(2))))
                .toArray(Predicate[]::new)));

            return entityManager.createQuery(sohQuery)
              .getResultList().stream()
                .map(converter::toCoi)
                .collect(Collectors.toList());
          })
          .flatMap(List::stream)
          .collect(Collectors.toList());
    } finally {
      entityManager.close();
    }
  }

  /**
   * Retrieve the {@link AcquiredChannelEnvironmentIssueAnalog} with the provided id.  Returns an
   * empty {@link Optional} if no AcquiredChannelSohAnalog has that id.
   *
   * @param request time range request to find AcquiredChannelEnvironmentIssueAnalogs by, not null
   * @return Optional AcquiredChannelSohAnalog object with the provided id, not null
   */
  @Override
  public List<AcquiredChannelEnvironmentIssueAnalog> findAnalogAceiByTime(TimeRangeRequest request) {
    Objects.requireNonNull(request);
    return measureSupplier(() -> findByTimeRangeInternal(AcquiredChannelEnvironmentIssueAnalogDao.class,
      new AcquiredChannelEnvironmentIssueAnalogDaoConverter(), request.getStartTime(), request.getEndTime()),
      AceiRepositoryMetrics.sohRetrieveACEIAnalogTime,
      AceiRepositoryMetrics.sohRetrieveACEIAnalogTimeDuration)
      .get();
  }

  /**
   * Retrieve the {@link AcquiredChannelEnvironmentIssueBoolean} with the provided id.  Returns an
   * empty {@link Optional} if no AcquiredChannelSohBoolean has that id.
   *
   * @param request time range for the AcquiredChannelSohBoolean, not null
   * @return Optional AcquiredChannelSohBoolean object with the provided id, not null
   */
  @Override
  public List<AcquiredChannelEnvironmentIssueBoolean> findBooleanAceiByTime(TimeRangeRequest request) {
    Objects.requireNonNull(request);
    return measureSupplier(() -> findByTimeRangeInternal(AcquiredChannelEnvironmentIssueBooleanDao.class,
      new AcquiredChannelEnvironmentIssueBooleanDaoConverter(), request.getStartTime(), request.getEndTime()),
      AceiRepositoryMetrics.sohRetrieveACEIBooleanTime,
      AceiRepositoryMetrics.sohRetrieveACEIBooleanTimeDuration
    ).get();
  }

  /**
   * Retrieve the list of {@link AcquiredChannelEnvironmentIssueAnalog} with the latest end time for
   * a given channel. Returns an empty {@link List} if no AcquiredChannelSohAnalog for query.
   *
   * @param placeholder time range for the AcquiredChannelSohAnalog, not null
   * @return List AcquiredChannelSohAnalog object with latest end times for given channel
   */
  @Override
  public List<AcquiredChannelEnvironmentIssueAnalog> findLatestAnalogAcei(String placeholder) {
    return measureSupplier(() -> findLatestByChannelsInternal(AcquiredChannelEnvironmentIssueAnalogDao.class,
      new AcquiredChannelEnvironmentIssueAnalogDaoConverter()),
      AceiRepositoryMetrics.sohRetrieveLatestACEIAnalog,
      AceiRepositoryMetrics.sohRetrieveLatestACEIAnalogDuration)
      .get();
  }


  /**
   * Retrieve a set of boolean ACEI, if they exists, that has the latest end time before the given
   * date, for a given channel and ACEI type.
   *
   * @param request ChannelTimeAceiTypeRequest object that contains the date, ACEI type and a Map of
   *                channel names to Instants to search for.
   * @return the Map of channel names to boolean ACEIs.
   */
  @Override
  public Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> findBooleanAceiLatestBefore
  (ChannelTimeAceiTypeRequest request) {
    return findLatestBeforeInternal(AcquiredChannelEnvironmentIssueBooleanDao.class,
      new AcquiredChannelEnvironmentIssueBooleanDaoConverter(), request.getType(), request.getChannelNamesToTime());
  }

  /**
   * select <whatever> from ACEI where or (channel_name = fines and end_time = (select max(end_time)
   * from acei where channel_name = fines)) over channel names
   *
   * @param entityType the DAO to find.
   * @param converter  the converter for the DAO.
   * @param type       the issue type.
   * @param channels   a Map of channel names to instants.
   * @return a Map of channel names to ACEIs.
   */
  private <E, C extends AcquiredChannelEnvironmentIssue<?>>
  Map<String, NavigableMap<Instant, C>> findLatestBeforeInternal(Class<E> entityType, EntityConverter<E, C> converter,
    AcquiredChannelEnvironmentIssueType type, Map<String, Set<Instant>> channels) {
    Objects.requireNonNull(entityType);
    Objects.requireNonNull(converter);
    Objects.requireNonNull(type);
    Objects.requireNonNull(channels);

    var entityManager = entityManagerFactory.createEntityManager();
    var builder = entityManager.getCriteriaBuilder();

    try {
      // Create parent query
      CriteriaQuery<E> aceiQuery = builder.createQuery(entityType);
      Root<E> fromAcei = aceiQuery.from(entityType);

      aceiQuery.where(builder.or(
        channels.entrySet().stream()
          .flatMap(channelAndTime -> channelAndTime.getValue().stream()
              .map(time -> {
                    Subquery<Instant> latestBeforeQuery = aceiQuery.subquery(Instant.class);
                    Root<E> subFromAcei = latestBeforeQuery.from(entityType);

                    Expression<Instant> endTime = subFromAcei.get(END_TIME);

                    latestBeforeQuery.select(builder.least(endTime));

                    return builder.and(
                        builder.equal(fromAcei.get(COMPOSITE_ID).get(CHANNEL_NAME),
                            channelAndTime.getKey()),
                        builder.equal(fromAcei.get(COMPOSITE_ID).get(TYPE), type),
                        builder.equal(fromAcei.get(END_TIME), latestBeforeQuery.where(builder.and(
                            builder.equal(subFromAcei.get(COMPOSITE_ID).get(CHANNEL_NAME),
                                channelAndTime.getKey()),
                            builder.lessThanOrEqualTo(endTime, time)))));
                  })
              ).toArray(Predicate[]::new)));

      return entityManager.createQuery(aceiQuery).getResultStream()
        .map(converter::toCoi)
        .collect(Collectors.groupingBy(AcquiredChannelEnvironmentIssue::getChannelName,
          Collectors.toMap(AcquiredChannelEnvironmentIssue::getStartTime,
            Function.identity(),
            (acei1, acei2) -> acei1,
            TreeMap::new)));
    } finally {
      entityManager.close();
    }
  }

  /**
   * Retrieve a set of boolean ACEI, if they exists, that has the earliest start time after the
   * given date, for a given channel and ACEI type.
   *
   * @param request ChannelTimeAceiTypeRequest object that contains the date, ACEI type and a Map of
   *                channel names to Instants to search for.
   * @return the Map of channel names to boolean ACEIs.
   */
  @Override
  public Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> findBooleanAceiEarliestAfter(
    ChannelTimeAceiTypeRequest request) {
    return findEarliestAfterInternal(AcquiredChannelEnvironmentIssueBooleanDao.class,
      new AcquiredChannelEnvironmentIssueBooleanDaoConverter(), request.getType(), request.getChannelNamesToTime());
  }

  /**
   * select <whatever> from ACEI where or (channel_name = fines and end_time = (select max(end_time)
   * from acei where channel_name = fines)) over channel names
   *
   * @param entityType the DAO to find.
   * @param converter  the converter for the DAO.
   * @param type       the issue type.
   * @param channels   a Map of channel names to instants.
   * @return a Map of channel names to ACEIs.
   */
  private <E extends AcquiredChannelEnvironmentIssueDao, C extends AcquiredChannelEnvironmentIssue<?>>
  Map<String, NavigableMap<Instant, C>> findEarliestAfterInternal(Class<E> entityType, EntityConverter<E, C> converter,
    AcquiredChannelEnvironmentIssueType type, Map<String, Set<Instant>> channels) {

    Objects.requireNonNull(entityType);
    Objects.requireNonNull(converter);
    Objects.requireNonNull(type);
    Objects.requireNonNull(channels);

    var entityManager = entityManagerFactory.createEntityManager();

    var builder = entityManager.getCriteriaBuilder();

    try {
      // Create parent query
      CriteriaQuery<E> aceiQuery = builder.createQuery(entityType);
      Root<E> fromAcei = aceiQuery.from(entityType);

      aceiQuery.where(builder.or(
          channels.entrySet().stream()
              .flatMap(channelAndTime ->
                  channelAndTime.getValue().stream()
                      .map(time -> {
                        Subquery<Instant> earliestAfterQuery = aceiQuery.subquery(Instant.class);
                        Root<E> subFromAcei = earliestAfterQuery.from(entityType);

                        Expression<Instant> startTime = subFromAcei.get(COMPOSITE_ID)
                            .get(START_TIME);

                        earliestAfterQuery.select(builder.least(startTime));

                        return builder.and(
                            builder.equal(fromAcei.get(COMPOSITE_ID).get(CHANNEL_NAME),
                                channelAndTime.getKey()),
                            builder.equal(fromAcei.get(COMPOSITE_ID).get(TYPE), type),
                            builder.equal(fromAcei.get(COMPOSITE_ID).get(START_TIME),
                                earliestAfterQuery.where(builder.and(
                                    builder.equal(subFromAcei.get(COMPOSITE_ID).get(CHANNEL_NAME),
                                        channelAndTime.getKey()),
                                    builder.greaterThanOrEqualTo(startTime, time)))));
                      })
              ).toArray(Predicate[]::new)));

      return entityManager.createQuery(aceiQuery).getResultStream()
        .map(converter::toCoi)
        .collect(Collectors.groupingBy(AcquiredChannelEnvironmentIssue::getChannelName,
          Collectors.toMap(AcquiredChannelEnvironmentIssue::getStartTime,
            Function.identity(),
            (acei1, acei2) -> acei1,
            TreeMap::new)));
    } finally {
      entityManager.close();
    }
  }

  /**
   * Retrieve the list of {@link AcquiredChannelEnvironmentIssueBoolean} with the latest end time
   * for a given channel. Returns an empty {@link List} if no AcquiredChannelSohBoolean for query.
   *
   * @param placeholder time range for the AcquiredChannelSohBoolean, not null
   * @return List AcquiredChannelSohBoolean object with latest end times for given channel
   */
  @Override
  public List<AcquiredChannelEnvironmentIssueBoolean> findLatestBooleanAcei(String placeholder) {
    return measureSupplier(() -> findLatestByChannelsInternal(AcquiredChannelEnvironmentIssueBooleanDao.class,
      new AcquiredChannelEnvironmentIssueBooleanDaoConverter()),
      AceiRepositoryMetrics.sohRetrieveLatestACEIBoolean,
      AceiRepositoryMetrics.sohRetrieveLatestACEIBooleanDuration)
      .get();
  }

  private <E, C> List<C> findByTimeRangeInternal(Class<E> entityType, EntityConverter<E, C> converter,
    Instant startTime, Instant endTime) {
    Objects.requireNonNull(entityType);
    Objects.requireNonNull(converter);
    Objects.requireNonNull(startTime);
    Objects.requireNonNull(endTime);

    ParameterValidation.requireFalse(Instant::isAfter, startTime, endTime,
      "Cannot run query when start time is after end time");

    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var builder = entityManager.getCriteriaBuilder();
      CriteriaQuery<E> sohQuery = builder.createQuery(entityType);
      Root<E> fromSoh = sohQuery.from(entityType);
      sohQuery.select(fromSoh);

      List<Predicate> conjunctions = new ArrayList<>();
      conjunctions
          .add(builder.greaterThanOrEqualTo(fromSoh.get(COMPOSITE_ID).get(START_TIME), startTime));
      conjunctions.add(builder.lessThanOrEqualTo(fromSoh.get(END_TIME), endTime));

      sohQuery.where(builder.and(conjunctions.toArray(new Predicate[0])));

      return entityManager.createQuery(sohQuery)
        .getResultStream()
        .map(converter::toCoi)
        .collect(Collectors.toList());
    } finally {
      entityManager.close();
    }
  }

  private <V> Supplier<V> measureSupplier(Supplier<V> supplier,
    CustomMetric<AcquiredChannelEnvironmentIssueRepositoryJpa, Long> metric,
    CustomMetric<Long, Long> duration) {
    return () -> {
      metric.updateMetric(this);
      var start = Instant.now();
      var value = supplier.get();
      var finish = Instant.now();
      long timeElapsed = Duration.between(start, finish).toMillis();
      duration.updateMetric(timeElapsed);

      return value;
    };
  }
}

