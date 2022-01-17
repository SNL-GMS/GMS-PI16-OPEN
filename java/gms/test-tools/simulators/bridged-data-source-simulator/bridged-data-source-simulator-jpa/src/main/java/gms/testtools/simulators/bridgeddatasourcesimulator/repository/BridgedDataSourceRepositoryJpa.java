package gms.testtools.simulators.bridgeddatasourcesimulator.repository;

import com.google.common.collect.HashMultimap;
import com.google.common.collect.SetMultimap;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.SiteKey;
import gms.shared.utilities.bridge.database.DatabaseConnector;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.ParameterMode;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Path;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.apache.commons.lang3.Validate;
import org.slf4j.LoggerFactory;

public class BridgedDataSourceRepositoryJpa extends DatabaseConnector {

  private static final StructuredLoggingWrapper logger =
    StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(BridgedDataSourceStationRepositoryJpa.class));

  protected static final String SIMULATION_CLEANUP = "SIMULATION_CLEANUP";
  private static final int BATCH_SIZE = 1000;
  protected static final String I_TABLE_NAME = "i_table_name";

  private static final String ID = "id";
  private static final String STATION_CODE = "stationCode";
  private static final String CHANNEL_CODE = "channelCode";
  private static final String REF_STA = "referenceStation";

  protected BridgedDataSourceRepositoryJpa(
    EntityManagerFactory entityManagerFactory) {

    super(entityManagerFactory);
  }

  /**
   * Initializes a {@link BridgedDataSourceRepositoryJpa} to be used against the simulation schema.
   *
   * @param entityManagerFactory - An {@link EntityManagerFactory} that is configured to connect to
   * the simulation schema.
   * @return a {@link BridgedDataSourceRepositoryJpa} to be used against the simulation schema.
   */
  public static BridgedDataSourceRepositoryJpa create(
    EntityManagerFactory entityManagerFactory) {
    Validate.notNull(entityManagerFactory);
    return new BridgedDataSourceRepositoryJpa(entityManagerFactory);
  }

  /**
   * Truncates the specified table qualified by schema and table name
   *
   * @param schema the schema in which the table exists
   * @param tableName the name of the table to be truncated
   * @param entityManager the entity manager connected to a specific persistence unit
   */
  public void cleanupTable(String schema, String tableName, EntityManager entityManager) {

    var storedProcedure = entityManager
      .createStoredProcedureQuery(schema + "." + SIMULATION_CLEANUP);
    storedProcedure
      .registerStoredProcedureParameter(I_TABLE_NAME, String.class, ParameterMode.IN);
    storedProcedure.setParameter(I_TABLE_NAME, tableName);
    storedProcedure.execute();
  }

  /**
   * Store the provided data in the simulation schema
   *
   * @param simulationData - A collection of data of type {@link T} to be stored in the simulation
   * schema.
   * @param <T> the type of simulation data to store
   */
  public <T> void store(List<T> simulationData) {
    runWithEntityManager(entityManager -> {

      entityManager.getTransaction().begin();

      try {
        int count = 0;
        for (T data : simulationData) {
          entityManager.persist(data);
          count += 1;
          if (count % BATCH_SIZE == 0) {
            entityManager.flush();
            entityManager.clear();
            entityManager.getTransaction().commit();
            entityManager.getTransaction().begin();
          }
        }
        entityManager.getTransaction().commit();
      } catch (Exception e) {
        entityManager.getTransaction().rollback();
        throw e;
      }

      return true;
    });
  }

  /**
   * Store the collection of SiteChanDaos in the database, update the end dates of all relevant
   * SiteChanDaos in DB.
   *
   * @param siteChanDaos - list of SiteChanDaos to add to database
   */
  public void updateAndStoreSiteChans(Collection<SiteChanDao> siteChanDaos) {

    SetMultimap<String, SiteChanDao> staChanToSiteChanMap = HashMultimap.create();

    runWithEntityManager(entityManager ->
    {
      CriteriaBuilder builder = entityManager.getCriteriaBuilder();
      CriteriaQuery<SiteChanDao> siteChanQuery = builder.createQuery(SiteChanDao.class);
      Root<SiteChanDao> fromSiteChan = siteChanQuery.from(SiteChanDao.class);
      Path<SiteChanKey> id = fromSiteChan.get(ID);

      siteChanQuery.select(fromSiteChan)
        .where(builder.and(
          builder.or(siteChanDaos.stream()
            .map(key -> builder
              .and(builder.equal(id.get(STATION_CODE), key.getId().getStationCode()),
                builder.equal(id.get(CHANNEL_CODE), key.getId().getChannelCode())
              ))
            .toArray(Predicate[]::new))));

      List<SiteChanDao> siteChansToUpdate = entityManager.createQuery(siteChanQuery)
        .getResultList();

      //map sta,chan pair to list of corresponding sitechans from db
      siteChansToUpdate.forEach(siteChan ->
        staChanToSiteChanMap.put(mapSiteChanDaoToString(siteChan), siteChan));

      List<SiteChanDao> siteChansToStore = siteChanDaos.stream()
        .map(siteChanDao -> {
          Set<SiteChanDao> correspondingSiteChans = staChanToSiteChanMap
            .get(mapSiteChanDaoToString(siteChanDao));
          SiteChanKey siteChanKey = siteChanDao.getId();

          if (correspondingSiteChans.isEmpty()) {
            logger.warn("SiteChan with sta {} and chan {} " +
                "is not currently in simulation data, so new sitechan cannot be added.",
              siteChanKey.getStationCode(), siteChanKey.getChannelCode());
            return Optional.<SiteChanDao>empty();
          }

          List<SiteChanDao> sameOnDates = correspondingSiteChans.stream()
            .filter(correspondingSiteChan -> correspondingSiteChan.getId().getOnDate()
              .truncatedTo(ChronoUnit.DAYS)
              .equals(siteChanKey.getOnDate().truncatedTo(ChronoUnit.DAYS)))
            .collect(Collectors.toList());

          if (!sameOnDates.isEmpty()) {
            logger.warn(
              "SiteChan with sta {} and chan {}  and ondate {} has same ondate as sitechan in simulation data,"
                +
                " so it cannot be added.",
              siteChanKey.getStationCode(), siteChanKey.getChannelCode(),
              siteChanKey.getOnDate());
            return Optional.<SiteChanDao>empty();
          }

          //update appropriate sitechans in db with new offdate
          correspondingSiteChans.forEach(correspondingSiteChan -> {
            if (updateOffDate(correspondingSiteChan, siteChanKey.getOnDate())) {
              correspondingSiteChan.setOffDate(siteChanKey.getOnDate());
            }
          });

          return Optional.of(siteChanDao);
        }).filter(Optional::isPresent)
        .map(Optional::get)
        .collect(Collectors.toList());

      try {
        entityManager.getTransaction().begin();

        siteChansToUpdate.forEach(entityManager::persist);
        siteChansToStore.forEach(entityManager::persist);
        entityManager.getTransaction().commit();
      } catch (Exception e) {
        entityManager.getTransaction().rollback();
        throw e;
      }
      return true;
    });
  }

  /**
   * Store the collection of SiteDaos in the database, update the end dates of all relevant SiteDaos
   * in DB.
   *
   * @param siteDaos - list of SiteDaos to add to database
   */
  public void updateAndStoreSites(Collection<SiteDao> siteDaos) {

    SetMultimap<String, SiteDao> staRefStaToSiteMap = HashMultimap.create();

    runWithEntityManager(entityManager ->
    {
      CriteriaBuilder builder = entityManager.getCriteriaBuilder();
      CriteriaQuery<SiteDao> siteQuery = builder.createQuery(SiteDao.class);
      Root<SiteDao> fromSite = siteQuery.from(SiteDao.class);
      Path<SiteKey> id = fromSite.get(ID);

      siteQuery.select(fromSite)
        .where(builder.and(
          builder.or(siteDaos.stream()
            .map(key -> builder
              .and(builder.equal(id.get(STATION_CODE), key.getId().getStationCode()),
                builder
                  .and(builder.equal(fromSite.get(REF_STA), key.getReferenceStation()))
              ))
            .toArray(Predicate[]::new))));

      List<SiteDao> sitesToUpdate = entityManager.createQuery(siteQuery).getResultList();

      sitesToUpdate
        .forEach(siteDao -> staRefStaToSiteMap.put(mapSiteDaoToString(siteDao), siteDao));

      List<SiteDao> sitesToStore = siteDaos.stream()
        .map(siteDao -> {
          Set<SiteDao> correspondingSites = staRefStaToSiteMap.get(mapSiteDaoToString(siteDao));
          SiteKey siteKey = siteDao.getId();
          if (correspondingSites.isEmpty()) {
            logger.warn(
              "Site with sta {} and refsta {} is not currently in simulation data, so new site cannot be added.",
              siteKey.getStationCode(), siteDao.getReferenceStation());
            return Optional.<SiteDao>empty();
          }

          List<SiteDao> sameOndates = correspondingSites.stream()
            .filter(correspondingSite -> correspondingSite.getId().getOnDate()
              .truncatedTo(ChronoUnit.DAYS)
              .equals(siteKey.getOnDate().truncatedTo(ChronoUnit.DAYS)))
            .collect(Collectors.toList());

          if (!sameOndates.isEmpty()) {
            logger.warn(
              "Site with sta {} and refsta {} has same ondate as site in simulation data," +
                " so site cannot be added.",
              siteKey.getStationCode(), siteDao.getReferenceStation());
            return Optional.<SiteDao>empty();
          }

          //update appropriate sitechans in db with new offdate
          correspondingSites.forEach(correspondingSite -> {
            if (updateOffDate(correspondingSite, siteKey.getOnDate())) {
              correspondingSite.setOffDate(siteKey.getOnDate());
            }
          });

          return Optional.of(siteDao);
        }).filter(Optional::isPresent)
        .map(Optional::get)
        .collect(Collectors.toList());

      try {
        entityManager.getTransaction().begin();

        sitesToUpdate.forEach(entityManager::persist);
        sitesToStore.forEach(entityManager::persist);
        entityManager.getTransaction().commit();
      } catch (Exception e) {
        entityManager.getTransaction().rollback();
        throw e;
      }

      return true;
    });
  }

  private String mapSiteChanDaoToString(SiteChanDao siteChanDao) {
    SiteChanKey siteChanKey = siteChanDao.getId();
    return siteChanKey.getStationCode() + siteChanKey.getChannelCode();
  }

  private String mapSiteDaoToString(SiteDao siteDao) {

    return siteDao.getId().getStationCode() + siteDao.getReferenceStation();
  }

  private boolean updateOffDate(SiteChanDao siteChanDao, Instant onDate) {

    onDate = onDate.truncatedTo(ChronoUnit.DAYS);

    return siteChanDao.getId().getOnDate().truncatedTo(ChronoUnit.DAYS).isBefore(onDate) &&
      siteChanDao.getOffDate().truncatedTo(ChronoUnit.DAYS).isAfter(onDate);
  }

  private boolean updateOffDate(SiteDao siteDao, Instant onDate) {

    onDate = onDate.truncatedTo(ChronoUnit.DAYS);

    return siteDao.getId().getOnDate().truncatedTo(ChronoUnit.DAYS).isBefore(onDate) &&
      siteDao.getOffDate().truncatedTo(ChronoUnit.DAYS).isAfter(onDate);
  }
}
