package gms.testtools.simulators.bridgeddatasourcesimulator.repository;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.SiteKey;
import gms.shared.stationdefinition.dao.css.enums.StaType;
import gms.shared.stationdefinition.database.connector.SiteChanDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;
import gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class BridgedDataSourceStationRepositoryJpaTest extends CssDbTest<BridgedDataSourceStationRepositoryJpa> {

  private static final String SIM1 = "SIM1";
  private static final String REF1 = "STA1";
  private static final String REF2 = "2STA";
  private SiteDatabaseConnector siteRepository;
  private SiteDatabaseConnector simSiteRepository;
  private SiteChanDatabaseConnector simSiteChanRepository;

  @Override
  @BeforeEach
  public void testSetup() {
    super.testSetup();
    siteRepository = SiteDatabaseConnector.create(CssDbTest.entityManagerFactory);
    simSiteRepository = SiteDatabaseConnector.create(CssDbTest.simEntityManagerFactory);
    simSiteChanRepository = SiteChanDatabaseConnector.create(simEntityManagerFactory);
  }

  @Override
  protected BridgedDataSourceStationRepositoryJpa getRepository(EntityManagerFactory entityManagerFactory) {
    return BridgedDataSourceStationRepositoryJpa
      .create(entityManagerFactory);
  }

  @Override
  protected BridgedDataSourceStationRepositoryJpa getSimRepository(
    EntityManagerFactory entityManagerFactory) {
    return BridgedDataSourceStationRepositoryJpa
      .create(entityManagerFactory);
  }

  @ParameterizedTest
  @MethodSource("constructorValidationCases")
  void testConstructorValidation(EntityManagerFactory entityManagerFactory) {
    assertThrows(NullPointerException.class,
      () -> BridgedDataSourceRepositoryJpa.create(entityManagerFactory));
  }

  private static Stream<Arguments> constructorValidationCases() {
    EntityManagerFactory nullEntityManagerFactory = null;
    return Stream.of(
      Arguments.arguments(nullEntityManagerFactory)
    );
  }

  @Test
  void testStore() {
    final Instant now = Instant.now().truncatedTo(ChronoUnit.DAYS);
    final Instant tomorrow = now.plus(1, ChronoUnit.DAYS);
    final Instant foreverAndEver = Instant.MAX;
    final String stationCode = "STRTST";

    final SiteKey id1 = new SiteKey();
    id1.setOnDate(now);
    id1.setStationCode(stationCode);
    final SiteDao newSite1 = new SiteDao();
    newSite1.setId(id1);
    newSite1.setOffDate(tomorrow);
    newSite1.setLatitude(0);
    newSite1.setLongitude(0);
    newSite1.setDegreesEast(0);
    newSite1.setDegreesNorth(0);
    newSite1.setElevation(0);
    newSite1.setLoadDate(id1.getOnDate());
    newSite1.setReferenceStation(stationCode);
    newSite1.setStationName("site used to test storing data - version 1");
    newSite1.setStaType(StaType.SINGLE_STATION);

    final SiteKey id2 = new SiteKey();
    id2.setOnDate(tomorrow);
    id2.setStationCode(stationCode);
    final SiteDao newSite2 = new SiteDao();
    newSite2.setId(id2);
    newSite2.setOffDate(foreverAndEver);
    newSite2.setLatitude(0);
    newSite2.setLongitude(0);
    newSite2.setDegreesEast(0);
    newSite2.setDegreesNorth(0);
    newSite2.setElevation(0);
    newSite2.setLoadDate(id2.getOnDate());
    newSite2.setReferenceStation(stationCode);
    newSite2.setStationName("site used to test storing data - version 2");
    newSite2.setStaType(StaType.SINGLE_STATION);
    final List<SiteDao> simulationData = List.of(newSite1, newSite2);

    simRepository.store(simulationData);

    final List<SiteDao> storedSites = simSiteRepository
      .findSitesByNamesAndTimeRange(List.of(stationCode), now, tomorrow);
    assertNotNull(storedSites);
    assertTrue(0 < storedSites.size());
    assertEquals(simulationData.size(), storedSites.size());
    simulationData.forEach(site ->
      assertAll(
        () -> assertTrue(storedSites.stream().anyMatch(stored ->
          stored.getId().getOnDate().equals(site.getId().getOnDate()) &&
            stored.getId().getStationCode().equals(site.getId().getStationCode())))
      ));

  }

  @Test
  void testStore_errorRollback() {
    final Instant now = Instant.now().truncatedTo(ChronoUnit.DAYS);
    final Instant tomorrow = now.plus(1, ChronoUnit.DAYS);
    final Instant foreverAndEver = Instant.MAX;
    final String stationCode = "STRTST";

    final SiteKey id1 = new SiteKey();
    id1.setOnDate(now);
    id1.setStationCode(stationCode);
    final SiteDao newSite1 = new SiteDao();
    newSite1.setId(id1);
    newSite1.setOffDate(null);
    newSite1.setLatitude(0);
    newSite1.setLongitude(0);
    newSite1.setDegreesEast(0);
    newSite1.setDegreesNorth(0);
    newSite1.setElevation(0);
    newSite1.setLoadDate(id1.getOnDate());
    newSite1.setReferenceStation(stationCode);
    newSite1.setStationName("site used to test storing data - version 1");
    newSite1.setStaType(StaType.SINGLE_STATION);

    final List<SiteDao> simulationData = List.of(newSite1);

    assertThrows(PersistenceException.class, () -> simRepository.store(simulationData));

    final List<SiteDao> storedSites = simSiteRepository
      .findSitesByNamesAndTimeRange(List.of(stationCode), now, tomorrow);
    assertNotNull(storedSites);
    assertEquals(0, storedSites.size());

  }

  @Test
  void testUpdateAndStoreSiteChans() {


    SiteChanDao siteChanDao1 = copySiteChanDao(CSSDaoTestFixtures.SITE_CHAN_DAO_1);
    SiteChanDao siteChanDao2 = copySiteChanDao(CSSDaoTestFixtures.SITE_CHAN_DAO_3);
    Instant offDate = Instant.parse("2080-05-28T21:16:58.959355Z");
    //our test database ondate has only day precision
    final Instant newOnDate = Instant.parse("2021-05-28T00:00:00Z");

    Instant oldOnDate = siteChanDao1.getId().getOnDate();
    siteChanDao2.getId().setOnDate(oldOnDate);
    siteChanDao1.setOffDate(offDate);
    siteChanDao2.setOffDate(offDate);

    List<SiteChanDao> siteChanDaos = new ArrayList<>();
    siteChanDaos.addAll(List.of(siteChanDao1, siteChanDao2));
    simRepository.store(siteChanDaos);

    SiteChanDao siteChanDao3 = copySiteChanDao(siteChanDao1);
    SiteChanDao siteChanDao4 = copySiteChanDao(siteChanDao1);
    siteChanDao4.getId().setStationCode("BAD");
    SiteChanDao siteChanDao5 = copySiteChanDao(siteChanDao1);
    siteChanDao5.getId().setChannelCode("BAD");
    siteChanDao1.getId().setOnDate(newOnDate);
    siteChanDao2.getId().setOnDate(newOnDate);
    siteChanDaos.addAll(List.of(siteChanDao3, siteChanDao4, siteChanDao5));

    simRepository.updateAndStoreSiteChans(siteChanDaos);

    final List<SiteChanDao> storedSiteChans = simSiteChanRepository.findSiteChansByTimeRange(oldOnDate, newOnDate.plusSeconds(3600));
    assertNotNull(storedSiteChans);
    assertEquals(4, storedSiteChans.size());
    assertEquals(2, storedSiteChans.stream()
      .filter(siteChan -> siteChan.getOffDate().equals(newOnDate))
      .collect(Collectors.toList()).size());
  }

  @Test
  void testUpdateAndStoreSites() {



    SiteDao siteDao1 = copySiteDao(CSSDaoTestFixtures.SITE_DAO_REF_11);
    SiteDao siteDao2 = copySiteDao(CSSDaoTestFixtures.SITE_DAO_REF_21);
    Instant offDate = Instant.parse("2080-05-28T21:16:58.959355Z");
    //our test database ondate has only day precision
    final Instant newOnDate = Instant.parse("2021-05-28T00:00:00Z");

    Instant oldOnDate = siteDao1.getId().getOnDate();
    siteDao2.getId().setOnDate(oldOnDate);
    siteDao1.setOffDate(offDate);
    siteDao2.setOffDate(offDate);

    List<SiteDao> siteDaos = new ArrayList<>();
    siteDaos.addAll(List.of(siteDao1, siteDao2));
    simRepository.store(siteDaos);

    SiteDao siteDao3 = copySiteDao(siteDao1);
    SiteDao siteDao4 = copySiteDao(siteDao1);
    siteDao4.getId().setStationCode("BAD");
    SiteDao siteDao5 = copySiteDao(siteDao1);
    siteDao5.setReferenceStation("BAD");
    siteDao1.getId().setOnDate(newOnDate);
    siteDao2.getId().setOnDate(newOnDate);
    siteDaos.addAll(List.of(siteDao3, siteDao4, siteDao5));

    simRepository.updateAndStoreSites(siteDaos);

    final List<SiteDao> storedSites = simSiteRepository.findSitesByTimeRange(oldOnDate, newOnDate.plusSeconds(3600));
    assertNotNull(storedSites);
    List<SiteDao> relevantSites = storedSites.stream()
      .filter(storedSite -> !storedSite.getId().getStationCode().equals(SIM1))
      .collect(Collectors.toList());
    assertEquals(4, relevantSites.size());
    assertEquals(2, relevantSites.stream()
      .filter(siteChan -> siteChan.getOffDate().equals(newOnDate))
      .collect(Collectors.toList()).size());
  }

  @Test
  void testCleanupStationData_simulationSchema() {

    final List<String> simSiteNames = List.of(SIM1);
    List<SiteDao> simSitesByName = simSiteRepository
      .findSitesByStationCodes(simSiteNames);

    assertNotNull(simSitesByName);
    assertFalse(simSitesByName.isEmpty());
    assertEquals(1, simSitesByName.size());

    assertDoesNotThrow(() -> simRepository.cleanupData());

    final List<String> siteNames = List.of(REF1, REF2);

    final List<SiteDao> sitesByName = siteRepository
      .findSitesByRefStation(siteNames);

    assertNotNull(sitesByName);
    assertFalse(sitesByName.isEmpty());
    assertEquals(3, sitesByName.size());
    assertTrue(sitesByName.stream()
      .allMatch(a -> siteNames.contains(a.getReferenceStation())));

    simSitesByName = simSiteRepository
      .findSitesByStationCodes(simSiteNames);

    assertNotNull(simSitesByName);
    assertTrue(simSitesByName.isEmpty());
  }

  @Test
  void testCleanupStationData_seedSchema_error() {
    final PersistenceException persistenceException = assertThrows(PersistenceException.class,
      () -> repository.cleanupData());

    assertEquals("Function \"SIMULATION_CLEANUP\" not found; SQL statement:\n"
      + " call GMS_GLOBAL.SIMULATION_CLEANUP(?)  [90022-200]", persistenceException.getCause().getCause().getMessage());
  }

  private SiteChanDao copySiteChanDao(SiteChanDao siteChan) {

    SiteChanKey siteChanKey =
      new SiteChanKey(siteChan.getId().getStationCode(), siteChan.getId().getChannelCode(), siteChan.getId().getOnDate());
    SiteChanDao siteChanDao = new SiteChanDao();
    siteChanDao.setId(siteChanKey);
    siteChanDao.setChannelId(siteChan.getChannelId());
    siteChanDao.setOffDate(siteChan.getOffDate());
    siteChanDao.setLoadDate(siteChan.getLoadDate());
    siteChanDao.setChannelDescription(siteChan.getChannelDescription());
    siteChanDao.setChannelType(siteChan.getChannelType());
    siteChanDao.setEmplacementDepth(siteChan.getEmplacementDepth());
    siteChanDao.setVerticalAngle(siteChan.getVerticalAngle());
    siteChanDao.setHorizontalAngle(siteChan.getHorizontalAngle());

    return siteChanDao;
  }

  private SiteDao copySiteDao(SiteDao site) {

    SiteKey siteKey = new SiteKey(site.getId().getStationCode(), site.getId().getOnDate());
    SiteDao siteDao = new SiteDao();
    siteDao.setId(siteKey);
    siteDao.setOffDate(site.getOffDate());
    siteDao.setLatitude(site.getLatitude());
    siteDao.setLongitude(site.getLongitude());
    siteDao.setElevation(site.getElevation());
    siteDao.setStationName(site.getStationName());
    siteDao.setStaType(site.getStaType());
    siteDao.setReferenceStation(site.getReferenceStation());
    siteDao.setDegreesNorth(site.getDegreesNorth());
    siteDao.setDegreesEast(site.getDegreesEast());
    siteDao.setLoadDate(Instant.now());

    return siteDao;
  }
}