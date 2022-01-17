package gms.shared.workflow.repository;

import gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures;
import gms.shared.utilities.bridge.database.converter.InstantToDoubleConverterPositiveNa;
import gms.shared.workflow.dao.IntervalDao;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import javax.persistence.EntityManagerFactory;
import javax.persistence.Table;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class IntervalDatabaseConnectorTest extends CssDbTest<IntervalDatabaseConnector> {

  private final InstantToDoubleConverterPositiveNa instantToDoubleConverter = new InstantToDoubleConverterPositiveNa();

  @BeforeAll
  static void adjustAnnotation() {
    CssDbTest.tearDown();

    var tableAnnotation = IntervalDao.class.getAnnotation(Table.class);

    InvocationHandler invocationHandler = Proxy.getInvocationHandler(tableAnnotation);
    // Get the private memberValues ​​property
    Field f;
    try {
      f = invocationHandler.getClass().getDeclaredField("memberValues");
      f.setAccessible(true);
      // Get the attribute map of the instance
      Map<String, Object> memberValues = (Map<String, Object>) f.get(invocationHandler);
      // Modify the attribute value
      memberValues.put("name", "interval_table");
    } catch (NoSuchFieldException | IllegalAccessException e) {
      throw new RuntimeException(e);
    }

    CssDbTest.setUp();
  }

  @Override
  protected IntervalDatabaseConnector getRepository(EntityManagerFactory entityManagerFactory) {

    return IntervalDatabaseConnector.create(entityManagerFactory);
  }

  @Test
  void findInterval() {

    // look for the INTERVAL_DAO_ARS_AL1_DONE interval

    final List<IntervalDao> intervalDaoList = repository.findIntervalsByTimeRange(
        instantToDoubleConverter
            .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_ARS_AL1_DONE.getTime()),
        instantToDoubleConverter
            .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_ARS_AL1_DONE.getEndTime())
    );

    assertEquals(1, intervalDaoList.size());
  }

  @Test
  void findIntervalSpanStart() {
    //shift the query forward 100 seconds so that the start isn't in the query window
    // but the end time still is, should be found

    final List<IntervalDao> intervalDaoList = repository.findIntervalsByTimeRange(
        instantToDoubleConverter
            .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_AUTO_AL1_DONE.getTime()+100),
        instantToDoubleConverter
            .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_AUTO_AL1_DONE.getEndTime()+100)
    );

    assertEquals(1, intervalDaoList.size());
  }

  @Test
  void findIntervalSpanEnd() {

    //shift the query backwards 100 seconds so that the start is in the query window
    // but the end time isn't, shouldn't be found

    final List<IntervalDao> intervalDaoList = repository.findIntervalsByTimeRange(
        instantToDoubleConverter
            .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_AUTO_AL1_DONE.getTime()-100),
        instantToDoubleConverter
            .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_AUTO_AL1_DONE.getEndTime()-100)
    );

    assertEquals(0, intervalDaoList.size());
  }

  @Test
  void noIntervalFound() {

    //as all the intervals are WAY in the past, just use some time close to now,
    // nothing should be returned as no end times fall withing the span

    final List<IntervalDao> intervalDaoList = repository.findIntervalsByTimeRange(
        Instant.now().minusSeconds(100),Instant.now().minusSeconds(50));

    assertEquals(0, intervalDaoList.size());
  }

  @Test
  void findIntervalByNameAndTimeRange() {

    List<IntervalDao> intervalDaoList = repository.findIntervalsByNameAndTimeRange(
        Set.of(Pair.of("ARS", "AL1")),
        instantToDoubleConverter
            .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_ARS_AL1_DONE.getTime()),
        instantToDoubleConverter
            .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_ARS_AL1_DONE.getEndTime())
    );

    assertEquals(2, intervalDaoList.size());

    intervalDaoList = repository.findIntervalsByNameAndTimeRange(
        Set.of(Pair.of("BadClass", "AL1")),
        instantToDoubleConverter
            .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_ARS_AL1_DONE.getTime()),
        instantToDoubleConverter
            .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_ARS_AL1_DONE.getEndTime())
    );

    assertEquals(0, intervalDaoList.size());

    intervalDaoList = repository.findIntervalsByNameAndTimeRange(
        Set.of(Pair.of("ARS", "BadName")),
        instantToDoubleConverter
            .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_ARS_AL1_DONE.getTime()),
        instantToDoubleConverter
            .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_ARS_AL1_DONE.getEndTime())
    );

    assertEquals(0, intervalDaoList.size());

    intervalDaoList = repository.findIntervalsByNameAndTimeRange(
        Set.of(
            Pair.of("ARS", "AL1"),
          Pair.of("AUTO", "AL1")
        ),
      instantToDoubleConverter
        .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_AUTO_AL1_DONE.getTime()),
      instantToDoubleConverter
        .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_ARS_AL1_DONE.getEndTime())
    );

    assertEquals(3, intervalDaoList.size());
  }

  @Test
  void findIntervalsByNameAndTimeRangeAfterModDate() {

    List<IntervalDao> intervalDaoList = repository.findIntervalsByNameAndTimeRangeAfterModDate(
      Set.of(
        Pair.of("ARS", "AL1"),
        Pair.of("AUTO", "AL1")
      ),
      instantToDoubleConverter
        .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_AUTO_AL1_DONE.getTime()),
      instantToDoubleConverter
        .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_ARS_AL1_DONE.getEndTime()),
      CSSDaoTestFixtures.INTERVAL_DAO_AUTO_AL1_DONE.getLastModificationDate().minusSeconds(1));

    assertEquals(3, intervalDaoList.size());

    intervalDaoList = repository.findIntervalsByNameAndTimeRangeAfterModDate(
      Set.of(
        Pair.of("ARS", "AL1"),
        Pair.of("AUTO", "AL1")
      ),
      instantToDoubleConverter
        .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_AUTO_AL1_DONE.getTime()),
      instantToDoubleConverter
        .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_ARS_AL1_DONE.getEndTime()),
      CSSDaoTestFixtures.INTERVAL_DAO_AUTO_AL1_DONE.getLastModificationDate());

    assertEquals(2, intervalDaoList.size());

    intervalDaoList = repository.findIntervalsByNameAndTimeRangeAfterModDate(
      Set.of(
        Pair.of("ARS", "AL1"),
        Pair.of("AUTO", "AL1")
      ),
      instantToDoubleConverter
        .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_AUTO_AL1_DONE.getTime()),
      instantToDoubleConverter
        .convertToEntityAttribute(CSSDaoTestFixtures.INTERVAL_DAO_ARS_AL1_DONE.getEndTime()),
      CSSDaoTestFixtures.INTERVAL_DAO_ARS_AL1_DONE.getLastModificationDate());

    assertEquals(0, intervalDaoList.size());
  }
}
