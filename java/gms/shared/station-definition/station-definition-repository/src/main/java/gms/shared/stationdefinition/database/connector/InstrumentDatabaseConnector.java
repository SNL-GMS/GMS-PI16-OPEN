package gms.shared.stationdefinition.database.connector;

import static com.google.common.base.Preconditions.checkNotNull;

import gms.shared.stationdefinition.dao.css.InstrumentDao;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import javax.persistence.EntityManagerFactory;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;

import gms.shared.utilities.bridge.database.DatabaseConnector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class InstrumentDatabaseConnector extends DatabaseConnector {

  private static final String INSTRUMENT_ID = "instrumentId";

  private static final Logger logger = LoggerFactory.getLogger(InstrumentDatabaseConnector.class);

  private InstrumentDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  /**
   * Factory method for creating InstrumentRepositoryJpa
   * @param entityManagerFactory EntityManagerFactory
   * @return InstrumentRepositoryJpa
   */
  public static InstrumentDatabaseConnector create(EntityManagerFactory entityManagerFactory) {
    checkNotNull(entityManagerFactory,
            "Cannot create InstrumentRepositoryJpa with null EntityManagerFactory");

    return new InstrumentDatabaseConnector(entityManagerFactory);
  }

  public List<InstrumentDao> findInstruments(Collection<Long> instrumentIds) {

    if (instrumentIds == null || instrumentIds.isEmpty()) {
      logger.debug("Request for Sensor by name was given an empty list of instrument ids");
      return new ArrayList<>();
    } else {
      return runWithEntityManager(entityManager ->
          runPartitionedQuery(instrumentIds, 950, partition -> {
            CriteriaBuilder cb = entityManager.getCriteriaBuilder();
            CriteriaQuery<InstrumentDao> query = cb.createQuery(InstrumentDao.class);
            Root<InstrumentDao> fromSensor = query.from(InstrumentDao.class);

            query.select(fromSensor);

            query.where(fromSensor.get(INSTRUMENT_ID).in(partition));

            return entityManager.createQuery(query).getResultList();
          })
      );
    }
  }
}
