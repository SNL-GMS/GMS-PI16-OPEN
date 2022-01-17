package gms.shared.stationdefinition.database.connector;

import gms.shared.stationdefinition.dao.css.BeamDao;
import gms.shared.utilities.bridge.database.DatabaseConnector;

import javax.persistence.EntityManagerFactory;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;
import java.util.List;
import java.util.Optional;

import static com.google.common.base.Preconditions.checkNotNull;

public class BeamDatabaseConnector extends DatabaseConnector {

  private static final String WF_ID = "wfId";

  private BeamDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  /**
   * Factory method for creating BeamDatabaseConnectorJpa
   *
   * @param entityManagerFactory EntityManagerFactory
   * @return BeamDatabaseConnector
   */
  public static BeamDatabaseConnector create(EntityManagerFactory entityManagerFactory) {
    checkNotNull(entityManagerFactory,
      "Cannot create WfdiscRepositoryJpa with null EntityManagerFactory");

    return new BeamDatabaseConnector(entityManagerFactory);
  }

  public Optional<BeamDao> findBeamForWfid(long wfid) {
    return runWithEntityManager(entityManager -> Optional.ofNullable(entityManager.find(BeamDao.class, wfid)));
  }

  /**
   * Uses the provided primary key representation for a {@link BeamDao} and uses it to search the
   * database for a match.
   *
   * @param wfids List of wfdisc ids to search for (also the pk in the Beam table)
   * @return a {@link List<BeamDao>} of all matching records.  The list is empty if no match is found.
   */
  public List<BeamDao> findBeamsByWfid(List<Long> wfids) {

    return runWithEntityManager(entityManager ->
      runPartitionedQuery(wfids, 500, channelIdSublist -> {
        var cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<BeamDao> query = cb.createQuery(BeamDao.class);
        Root<BeamDao> fromBeam = query.from(BeamDao.class);

        query.select(fromBeam)
          .where(fromBeam.get(WF_ID)
            .in(channelIdSublist));

        return entityManager.createQuery(query).getResultList();
      }));
  }
}
