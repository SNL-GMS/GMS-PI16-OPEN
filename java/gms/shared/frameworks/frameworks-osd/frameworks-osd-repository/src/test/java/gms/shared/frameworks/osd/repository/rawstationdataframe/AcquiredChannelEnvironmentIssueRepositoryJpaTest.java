package gms.shared.frameworks.osd.repository.rawstationdataframe;

import gms.shared.frameworks.osd.api.rawstationdataframe.AceiUpdates;
import gms.shared.frameworks.osd.api.util.ChannelTimeAceiTypeRequest;
import gms.shared.frameworks.osd.api.util.ChannelTimeRangeRequest;
import gms.shared.frameworks.osd.api.util.ChannelTimeRangeSohTypeRequest;
import gms.shared.frameworks.osd.api.util.ChannelsTimeRangeRequest;
import gms.shared.frameworks.osd.api.util.TimeRangeRequest;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue.AcquiredChannelEnvironmentIssueType;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueAnalog;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueId;
import gms.shared.frameworks.osd.coi.test.utils.UtilsTestFixtures;
import gms.shared.frameworks.osd.dao.channelsoh.AcquiredChannelEnvironmentIssueAnalogDao;
import gms.shared.frameworks.osd.dao.channelsoh.AcquiredChannelEnvironmentIssueBooleanDao;
import gms.shared.utilities.db.test.utils.SohDbTest;
import org.apache.kafka.common.utils.Utils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Optional;
import java.util.Set;

import static gms.shared.frameworks.osd.coi.dataacquisitionstatus.DataAcquisitionStatusTestFixtures.ACQUIRED_CHANNEL_ENVIRONMENT_ISSUES_BATCH_TEST;
import static gms.shared.frameworks.osd.coi.dataacquisitionstatus.DataAcquisitionStatusTestFixtures.ACQUIRED_CHANNEL_SOH_ANALOG;
import static gms.shared.frameworks.osd.coi.dataacquisitionstatus.DataAcquisitionStatusTestFixtures.ACQUIRED_CHANNEL_SOH_ANALOG_TWO;
import static gms.shared.frameworks.osd.coi.dataacquisitionstatus.DataAcquisitionStatusTestFixtures.ACQUIRED_CHANNEL_SOH_BOOLEAN;
import static gms.shared.frameworks.osd.coi.dataacquisitionstatus.DataAcquisitionStatusTestFixtures.ACQUIRED_CHANNEL_SOH_BOOLEAN_ISSUES;
import static gms.shared.frameworks.osd.coi.dataacquisitionstatus.DataAcquisitionStatusTestFixtures.ACQUIRED_CHANNEL_SOH_BOOLEAN_TWO;
import static gms.shared.frameworks.osd.coi.dataacquisitionstatus.DataAcquisitionStatusTestFixtures.NOW;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
class AcquiredChannelEnvironmentIssueRepositoryJpaTest extends SohDbTest {

  private AcquiredChannelEnvironmentIssueRepositoryJpa aceiRepository;

  @BeforeEach
  void setUp() {
    aceiRepository = new AcquiredChannelEnvironmentIssueRepositoryJpa(entityManagerFactory);
  }

  @AfterEach
  void testCaseTeardown() {
    EntityManager entityManager = entityManagerFactory.createEntityManager();
    try {
      entityManager.getTransaction().begin();
      Query query = entityManager.createNativeQuery("delete from gms_soh.channel_env_issue_analog");
      query.executeUpdate();
      query = entityManager.createNativeQuery("delete from gms_soh.channel_env_issue_boolean");
      query.executeUpdate();
      entityManager.getTransaction().commit();
    } finally {
      entityManager.close();
    }
  }

  @Test
  void testSyncAceiUpdatesValidation() {
    assertThrows(NullPointerException.class, () -> aceiRepository.syncAceiUpdates(null));
  }

  @Test
  void testFindBooleanAceiLatestBeforeValidation() {
    assertThrows(NullPointerException.class, () -> aceiRepository.findBooleanAceiLatestBefore(null));
  }

  @Test
  void testFindAnalogAceiByChannelAndTimeRangeValidation() {
    assertThrows(NullPointerException.class, () -> aceiRepository.findAnalogAceiByChannelAndTimeRange(null));
  }

  @Test
  void testFindBooleanAceiEarliestAfterValidation() {
    assertThrows(NullPointerException.class, () -> aceiRepository.findBooleanAceiEarliestAfter(null));
  }

  @Test
  void testFindBooleanByChannelAndTimeRangeValidation() {
    assertThrows(NullPointerException.class, () -> aceiRepository.findBooleanAceiByChannelAndTimeRange(null));
  }

  @Test
  void testRetrieveAcquiredChannelSohAnalogByChannelTimeRangeAndTypeValidation() {
    assertThrows(NullPointerException.class, () -> aceiRepository.findAnalogAceiByChannelTimeRangeAndType(null));
  }

  @Test
  void testRetrieveAcquiredChannelSohBooleanByChannelTimeRangeAndTypeValidation() {
    assertThrows(NullPointerException.class, () -> aceiRepository.findBooleanAceiByChannelTimeRangeAndType(null));
  }

  @Test
  void testRetrieveAcquiredChannelEnvironmentalIssueAnalogByTimeValidation() {
    assertThrows(NullPointerException.class, () -> aceiRepository.findAnalogAceiByTime(null));
  }

  @Test
  void testRetrieveAcquiredChannelEnvironmentalIssueBooleanByTimeValidation() {
    assertThrows(NullPointerException.class, () -> aceiRepository.findBooleanAceiByTime(null));
  }

  @Test
  void testFindBooleanAceiLatestBefore() {
    aceiRepository.syncAceiUpdates(ACQUIRED_CHANNEL_ENVIRONMENT_ISSUES_BATCH_TEST);

    Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> actual = aceiRepository
      .findBooleanAceiLatestBefore(
        ChannelTimeAceiTypeRequest
          .create(AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED,
            Map.of(UtilsTestFixtures.CHANNEL.getName(),
              Set.of(Instant.EPOCH.plus(4, ChronoUnit.SECONDS))))
      );

    assertNotNull(actual);
    assertEquals(1, actual.size());
    assertTrue(actual.containsKey(UtilsTestFixtures.CHANNEL.getName()));

    assertEquals(1, actual.get(UtilsTestFixtures.CHANNEL.getName()).size());
    assertTrue(actual.get(UtilsTestFixtures.CHANNEL.getName()).containsKey(Instant.EPOCH));
    AcquiredChannelEnvironmentIssueBoolean value = actual.get(UtilsTestFixtures.CHANNEL.getName())
      .get(Instant.EPOCH);

    assertNotNull(value);
    assertEquals(AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED, value.getType());
    assertEquals(Instant.EPOCH, value.getStartTime());
    assertEquals(Instant.EPOCH.plus(1, ChronoUnit.SECONDS), value.getEndTime());
  }

  @Test
  void testFindBooleanAceiEarliestAfter() {
    aceiRepository.syncAceiUpdates(ACQUIRED_CHANNEL_ENVIRONMENT_ISSUES_BATCH_TEST);

    Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> actual = aceiRepository
      .findBooleanAceiEarliestAfter(
        ChannelTimeAceiTypeRequest
          .create(AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED,
            Map.of(UtilsTestFixtures.CHANNEL.getName(),
              Set.of(Instant.EPOCH.plus(4, ChronoUnit.SECONDS))))
      );

    assertNotNull(actual);
    assertEquals(1, actual.size());
    assertTrue(actual.containsKey(UtilsTestFixtures.CHANNEL.getName()));
    assertEquals(1, actual.get(UtilsTestFixtures.CHANNEL.getName()).size());
    assertTrue(actual.get(UtilsTestFixtures.CHANNEL.getName())
      .containsKey(Instant.EPOCH.plus(6, ChronoUnit.SECONDS)));

    AcquiredChannelEnvironmentIssueBoolean value = actual.get(UtilsTestFixtures.CHANNEL.getName())
      .get(Instant.EPOCH.plus(6, ChronoUnit.SECONDS));

    assertNotNull(value);
    assertEquals(AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED, value.getType());
    assertEquals(Instant.EPOCH.plus(6, ChronoUnit.SECONDS), value.getStartTime());
    assertEquals(Instant.EPOCH.plus(7, ChronoUnit.SECONDS), value.getEndTime());
  }

  @Test
  void testFindAnalogAceiByChannelAndTimeRange() {
    aceiRepository.syncAceiUpdates(AceiUpdates.from(ACQUIRED_CHANNEL_SOH_ANALOG));

    ChannelTimeRangeRequest request =
      ChannelTimeRangeRequest.create(UtilsTestFixtures.CHANNEL.getName(),
        NOW.minusSeconds(700),
        NOW);
    List<AcquiredChannelEnvironmentIssueAnalog> result = aceiRepository
      .findAnalogAceiByChannelAndTimeRange(request);
    assertEquals(1, result.size());
    assertTrue(result.contains(ACQUIRED_CHANNEL_SOH_ANALOG));
  }

  @Test
  void testRetrieveLatestAcquiredChannelEnvironmentIssueAnalog() {
    var allAnalogs = Utils.concatListsUnmodifiable(UtilsTestFixtures.latestAnalogs,
      UtilsTestFixtures.earlierAnalogs);
    aceiRepository.syncAceiUpdates(
      AceiUpdates.builder()
        .setAnalogInserts(allAnalogs)
        .build());

    List<AcquiredChannelEnvironmentIssueAnalog> result = aceiRepository
      .findLatestAnalogAcei("anystring");
    assertEquals(2, result.size());
    assertTrue(result.contains(UtilsTestFixtures.latestAnalogs.get(0)));
    assertTrue(result.contains(UtilsTestFixtures.latestAnalogs.get(1)));
  }

  @Test
  void testFindLatestBooleanAcei() {
    var allBooleans = Utils.concatListsUnmodifiable(UtilsTestFixtures.latestBooleans,
      UtilsTestFixtures.earlierBoolean);
    aceiRepository.syncAceiUpdates(
      AceiUpdates.builder()
        .setBooleanInserts(allBooleans)
        .build());

    List<AcquiredChannelEnvironmentIssueBoolean> result = aceiRepository.findLatestBooleanAcei("anystring");
    assertEquals(2, result.size());
    assertTrue(result.contains(UtilsTestFixtures.latestBooleans.get(0)));
    assertTrue(result.contains(UtilsTestFixtures.latestBooleans.get(1)));
  }

  @Test
  void testFindLatestBooleanAceiMultipleTypes() {
    List<AcquiredChannelEnvironmentIssueBoolean> allBooleans = UtilsTestFixtures.latestBooleansMultipleTypes;
    aceiRepository.syncAceiUpdates(AceiUpdates.builder().setBooleanInserts(allBooleans).build());

    List<AcquiredChannelEnvironmentIssueBoolean> result = aceiRepository.findLatestBooleanAcei("anystring");
    assertEquals(allBooleans.size(), result.size());
    allBooleans.forEach(acei -> assertTrue(result.contains(acei)));
    result.forEach(acei -> assertTrue(allBooleans.contains(acei)));
  }

  @Test
  void testFindBooleanAceiByChannelAndTimeRange() {
    aceiRepository.syncAceiUpdates(AceiUpdates.from(ACQUIRED_CHANNEL_SOH_BOOLEAN));
    ChannelTimeRangeRequest request = ChannelTimeRangeRequest.create(UtilsTestFixtures.CHANNEL.getName(),
      NOW.minusSeconds(700), NOW);
    List<AcquiredChannelEnvironmentIssueBoolean> result = aceiRepository.findBooleanAceiByChannelAndTimeRange(request);
    assertEquals(1, result.size());
    assertTrue(result.contains(ACQUIRED_CHANNEL_SOH_BOOLEAN));
  }

  @Test
  void testFindBooleanAceiByChannelsAndTimeRange() {
    aceiRepository.syncAceiUpdates(AceiUpdates.builder().setBooleanInserts(ACQUIRED_CHANNEL_SOH_BOOLEAN_ISSUES).build());

    ChannelsTimeRangeRequest request = ChannelsTimeRangeRequest.create(
      List.of(UtilsTestFixtures.CHANNEL.getName(), UtilsTestFixtures.CHANNEL_TWO.getName()),
      NOW.minusSeconds(700), NOW);
    List<AcquiredChannelEnvironmentIssueBoolean> result = aceiRepository
      .findBooleanAceiByChannelsAndTimeRange(request);
    assertEquals(2, result.size());
    assertTrue(result.contains(ACQUIRED_CHANNEL_SOH_BOOLEAN));
    assertTrue(result.contains(ACQUIRED_CHANNEL_SOH_BOOLEAN_TWO));
  }

  @Test
  void testFindAnalogAceiByIdEmpty() {
    Optional<AcquiredChannelEnvironmentIssueAnalog> result = aceiRepository
      .findAnalogAceiById(AcquiredChannelEnvironmentIssueId.create("bad channel name",
        AcquiredChannelEnvironmentIssueType.MEAN_AMPLITUDE, Instant.EPOCH));

    assertTrue(result.isEmpty());
  }

  @Test
  void testFindAnalogAceiByIdPresent() {
    aceiRepository.syncAceiUpdates(AceiUpdates.from(ACQUIRED_CHANNEL_SOH_ANALOG));

    Optional<AcquiredChannelEnvironmentIssueAnalog> result = aceiRepository
      .findAnalogAceiById(ACQUIRED_CHANNEL_SOH_ANALOG.getId());

    assertTrue(result.isPresent());
    assertEquals(ACQUIRED_CHANNEL_SOH_ANALOG, result.get());
  }

  @Test
  void testFindBooleanAceiByIdEmpty() {
    Optional<AcquiredChannelEnvironmentIssueBoolean> result = aceiRepository.findBooleanAceiById(
      AcquiredChannelEnvironmentIssueId.create("bad channel name",
        AcquiredChannelEnvironmentIssueType.MEAN_AMPLITUDE, Instant.EPOCH));

    assertTrue(result.isEmpty());
  }

  @Test
  void testFindBooleanAceiByIdPresent() {
    aceiRepository.syncAceiUpdates(AceiUpdates.from(ACQUIRED_CHANNEL_SOH_BOOLEAN));

    Optional<AcquiredChannelEnvironmentIssueBoolean> result = aceiRepository
      .findBooleanAceiById(ACQUIRED_CHANNEL_SOH_BOOLEAN.getId());

    assertTrue(result.isPresent());
    assertEquals(ACQUIRED_CHANNEL_SOH_BOOLEAN, result.get());
  }

  @Test
  void testFindAnalogAceiByChannelTimeRangeAndType() {
    aceiRepository.syncAceiUpdates(AceiUpdates.from(ACQUIRED_CHANNEL_SOH_ANALOG));

    ChannelTimeRangeSohTypeRequest request = ChannelTimeRangeSohTypeRequest.create(
      UtilsTestFixtures.CHANNEL.getName(),
      NOW.minusSeconds(700), NOW,
      AcquiredChannelEnvironmentIssueType.CLIPPED);

    List<AcquiredChannelEnvironmentIssueAnalog> result = aceiRepository.findAnalogAceiByChannelTimeRangeAndType(request);

    assertEquals(1, result.size());
    assertTrue(result.contains(ACQUIRED_CHANNEL_SOH_ANALOG));
  }

  @Test
  void testFindBooleanAceiByChannelTimeRangeAndType() {
    aceiRepository.syncAceiUpdates(AceiUpdates.from(ACQUIRED_CHANNEL_SOH_BOOLEAN));

    ChannelTimeRangeSohTypeRequest request = ChannelTimeRangeSohTypeRequest.create(
      UtilsTestFixtures.CHANNEL.getName(),
      NOW.minusSeconds(700),
      NOW,
      AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED);

    List<AcquiredChannelEnvironmentIssueBoolean> result =
      aceiRepository.findBooleanAceiByChannelTimeRangeAndType(request);

    assertEquals(1, result.size());
    assertTrue(result.contains(ACQUIRED_CHANNEL_SOH_BOOLEAN));
  }

  @Test
  void testFindAnalogAceiByTime() {
    aceiRepository.syncAceiUpdates(AceiUpdates.from(ACQUIRED_CHANNEL_SOH_ANALOG));

    TimeRangeRequest request = TimeRangeRequest.create(NOW.minusSeconds(700), NOW);
    List<AcquiredChannelEnvironmentIssueAnalog> result = aceiRepository.findAnalogAceiByTime(request);

    assertEquals(1, result.size());
    assertTrue(result.contains(ACQUIRED_CHANNEL_SOH_ANALOG));
  }

  @Test
  void testFindBooleanAceiByTime() {
    aceiRepository.syncAceiUpdates(AceiUpdates.from(ACQUIRED_CHANNEL_SOH_BOOLEAN));

    TimeRangeRequest request = TimeRangeRequest.create(NOW.minusSeconds(700), NOW);
    List<AcquiredChannelEnvironmentIssueBoolean> result = aceiRepository.findBooleanAceiByTime(request);

    assertEquals(1, result.size());
    assertTrue(result.contains(ACQUIRED_CHANNEL_SOH_BOOLEAN));
  }

  @Test
  void testSyncAceiUpdates() {
    EntityManager entityManager;

    var analogIdOne = getCompositeId(ACQUIRED_CHANNEL_SOH_ANALOG);
    var analogIdTwo = getCompositeId(ACQUIRED_CHANNEL_SOH_ANALOG_TWO);
    var booleanIdOne = getCompositeId(ACQUIRED_CHANNEL_SOH_BOOLEAN);
    var booleanIdTwo = getCompositeId(ACQUIRED_CHANNEL_SOH_BOOLEAN_TWO);

    entityManager = entityManagerFactory.createEntityManager();
    assertNull(entityManager.find(AcquiredChannelEnvironmentIssueAnalogDao.class, analogIdOne));
    assertNull(entityManager.find(AcquiredChannelEnvironmentIssueBooleanDao.class, booleanIdOne));
    entityManager.close();

    AceiUpdates justInsert = AceiUpdates.builder()
      .addAnalogInsert(ACQUIRED_CHANNEL_SOH_ANALOG)
      .addBooleanInsert(ACQUIRED_CHANNEL_SOH_BOOLEAN)
      .build();
    aceiRepository.syncAceiUpdates(justInsert);

    entityManager = entityManagerFactory.createEntityManager();
    var actualAnalogDao = entityManager.find(AcquiredChannelEnvironmentIssueAnalogDao.class, analogIdOne);
    assertNotNull(actualAnalogDao);
    assertEquivalent(ACQUIRED_CHANNEL_SOH_ANALOG, actualAnalogDao);

    var actualBooleanDao = entityManager.find(AcquiredChannelEnvironmentIssueBooleanDao.class, booleanIdOne);
    assertNotNull(actualBooleanDao);
    assertEquivalent(ACQUIRED_CHANNEL_SOH_BOOLEAN, actualBooleanDao);
    entityManager.close();

    AceiUpdates removeAndInsert = AceiUpdates.builder()
      .addAnalogInsert(ACQUIRED_CHANNEL_SOH_ANALOG_TWO)
      .addAnalogDelete(ACQUIRED_CHANNEL_SOH_ANALOG)
      .addBooleanInsert(ACQUIRED_CHANNEL_SOH_BOOLEAN_TWO)
      .addBooleanDelete(ACQUIRED_CHANNEL_SOH_BOOLEAN)
      .build();
    aceiRepository.syncAceiUpdates(removeAndInsert);

    entityManager = entityManagerFactory.createEntityManager();
    assertNull(entityManager.find(AcquiredChannelEnvironmentIssueAnalogDao.class, analogIdOne));
    assertNull(entityManager.find(AcquiredChannelEnvironmentIssueBooleanDao.class, booleanIdOne));

    actualAnalogDao = entityManager.find(AcquiredChannelEnvironmentIssueAnalogDao.class, analogIdTwo);
    assertNotNull(actualAnalogDao);
    assertEquivalent(ACQUIRED_CHANNEL_SOH_ANALOG_TWO, actualAnalogDao);

    actualBooleanDao = entityManager.find(AcquiredChannelEnvironmentIssueBooleanDao.class,
      booleanIdTwo);
    assertNotNull(actualBooleanDao);
    assertEquivalent(ACQUIRED_CHANNEL_SOH_BOOLEAN_TWO, actualBooleanDao);
    entityManager.close();
  }

  private void assertEquivalent(AcquiredChannelEnvironmentIssueAnalog expectedCoi, AcquiredChannelEnvironmentIssueAnalogDao actualDao) {
    assertEquals(expectedCoi.getChannelName(), actualDao.getId().getChannelName());
    assertEquals(expectedCoi.getType(), actualDao.getId().getType());
    assertEquals(expectedCoi.getStartTime(), actualDao.getId().getStartTime());
    assertEquals(expectedCoi.getEndTime(), actualDao.getEndTime());
    assertEquals(expectedCoi.getStatus(), actualDao.getStatus(), 0.0001);
  }

  private void assertEquivalent(AcquiredChannelEnvironmentIssueBoolean expectedCoi, AcquiredChannelEnvironmentIssueBooleanDao actualDao) {
    assertEquals(expectedCoi.getChannelName(), actualDao.getId().getChannelName());
    assertEquals(expectedCoi.getType(), actualDao.getId().getType());
    assertEquals(expectedCoi.getStartTime(), actualDao.getId().getStartTime());
    assertEquals(expectedCoi.getEndTime(), actualDao.getEndTime());
    assertEquals(expectedCoi.getStatus(), actualDao.isStatus());
  }

  private gms.shared.frameworks.osd.dao.channelsoh.AcquiredChannelEnvironmentIssueId getCompositeId(
    AcquiredChannelEnvironmentIssue<?> issue) {

    return new gms.shared.frameworks.osd.dao.channelsoh.AcquiredChannelEnvironmentIssueId(issue.getChannelName(), issue.getType(),
      issue.getStartTime());
  }

}
