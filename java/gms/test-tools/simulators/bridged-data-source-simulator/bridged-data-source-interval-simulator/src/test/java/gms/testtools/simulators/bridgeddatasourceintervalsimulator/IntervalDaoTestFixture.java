package gms.testtools.simulators.bridgeddatasourceintervalsimulator;

import gms.shared.workflow.dao.IntervalDao;

import java.time.Duration;
import java.time.Instant;

public class IntervalDaoTestFixture {

  public static final IntervalDao INTERVAL_DAO_NET_NETS1_DONE;
  public static final IntervalDao INTERVAL_DAO_NET_NETS1_ACTIVE;
  public static final IntervalDao INTERVAL_DAO_ARS_AL1_DONE;
  public static final IntervalDao INTERVAL_DAO_ARS_AL1_ACTIVE;
  public static final IntervalDao INTERVAL_DAO_AUTO_AL1_DONE;
  public static final IntervalDao INTERVAL_DAO_AUTO_AL1_ACTIVE;
  public static final IntervalDao INTERVAL_DAO_ARS_AL2_DONE;
  public static final IntervalDao INTERVAL_DAO_ARS_AL2_ACTIVE;
  public static final IntervalDao INTERVAL_DAO_ARS_AL1_SKIPPED;

  public static final IntervalDao INTERVAL_DAO_FOR_SIMULATOR0;
  public static final IntervalDao INTERVAL_DAO_FOR_SIMULATOR1;
  public static final IntervalDao INTERVAL_DAO_FOR_SIMULATOR2;
  public static final IntervalDao INTERVAL_DAO_SHIFTED0;
  public static final IntervalDao INTERVAL_DAO_SHIFTED1;
  public static final IntervalDao INTERVAL_DAO_SHIFTED2;
  public static final IntervalDao INTERVAL_DAO_SHIFTED0A;
  public static final IntervalDao INTERVAL_DAO_SHIFTED1A;
  public static final IntervalDao INTERVAL_DAO_SHIFTED2A;
  public static final IntervalDao INTERVAL_DAO_SHIFTED0B;

  public static final Duration OFF_HOUR_OFFSET;
  public static final IntervalDao INTERVAL_DAO_FOR_SIMULATOR_OFF_HOUR0;
  public static final IntervalDao INTERVAL_DAO_FOR_SIMULATOR_OFF_HOUR1;
  public static final IntervalDao INTERVAL_DAO_FOR_SIMULATOR_OFF_HOUR2;
  public static final IntervalDao INTERVAL_DAO_SHIFTED_OFF_HOUR0;
  public static final IntervalDao INTERVAL_DAO_SHIFTED_OFF_HOUR1;
  public static final IntervalDao INTERVAL_DAO_SHIFTED_OFF_HOUR2;


  static {
    INTERVAL_DAO_NET_NETS1_DONE = new IntervalDao.Builder()
      .intervalIdentifier(1002533784416L)
      .type("NET")
      .name("NETS1")
      .time(1619720400.00000)
      .endTime(1619722800.00000)
      .state("network-done")
      .author("-")
      .percentAvailable(1.00000)
      .processStartDate(IntervalDao.convertTableDate("29-APR-2021 19:05:14"))
      .processEndDate(IntervalDao.convertTableDate("29-APR-2021 19:05:55"))
      .lastModificationDate(IntervalDao.convertTableDate("29-APR-2021 19:05:55"))
      .loadDate(IntervalDao.convertTableDate("29-APR-2021 19:05:01"))
      .build();

    INTERVAL_DAO_NET_NETS1_ACTIVE = null;

    INTERVAL_DAO_AUTO_AL1_DONE = new IntervalDao.Builder()
      .intervalIdentifier(1002521971180L)
      .type("AUTO")
      .name("AL1")
      .time(1618884000.00000)
      .endTime(1618887600.00000)
      .state("done")
      .author("analyst")
      .percentAvailable(1.00000)
      .processStartDate(IntervalDao.convertTableDate("20-APR-2021 04:58:41"))
      .processEndDate(IntervalDao.convertTableDate("20-APR-2021 05:08:44"))
      .lastModificationDate(IntervalDao.convertTableDate("20-APR-2021 05:08:44"))
      .loadDate(IntervalDao.convertTableDate("20-APR-2021 04:57:04"))
      .build();

    INTERVAL_DAO_AUTO_AL1_ACTIVE = null;

    INTERVAL_DAO_ARS_AL1_DONE = new IntervalDao.Builder()
      .intervalIdentifier(1002526012274L)
      .type("ARS")
      .name("AL1")
      .time(1619172000.00000)
      .endTime(1619175600.00000)
      .state("done")
      .author("analyst5")
      .percentAvailable(.00000)
      .processStartDate(IntervalDao.convertTableDate("23-APR-2021 12:57:49"))
      .processEndDate(IntervalDao.convertTableDate("23-APR-2021 13:49:00"))
      .lastModificationDate(IntervalDao.convertTableDate("23-APR-2021 13:49:00"))
      .loadDate(IntervalDao.convertTableDate("23-APR-2021 10:05:04"))
      .build();

    INTERVAL_DAO_ARS_AL1_ACTIVE = new IntervalDao.Builder()
      .intervalIdentifier(1002526052456L)
      .type("ARS")
      .name("AL1")
      .time(1619175600.00000)
      .endTime(1619179200.00000)
      .state("active")
      .author("analyst6")
      .percentAvailable(.00000)
      .processStartDate(IntervalDao.convertTableDate("23-APR-2021 13:48:04"))
      .processEndDate(IntervalDao.convertTableDate("23-APR-2021 12:36:28"))
      .lastModificationDate(IntervalDao.convertTableDate("23-APR-2021 13:48:19"))
      .loadDate(IntervalDao.convertTableDate("23-APR-2021 11:05:04"))
      .build();

    INTERVAL_DAO_ARS_AL2_DONE = null;
    INTERVAL_DAO_ARS_AL2_ACTIVE = null;

    INTERVAL_DAO_ARS_AL1_SKIPPED = new IntervalDao.Builder()
      .intervalIdentifier(1002526262084L)
      .type("ARS")
      .name("AL1")
      .time(1619190000.00000)
      .endTime(1619193600.00000)
      .state("skipped")
      .author("-")
      .percentAvailable(.00000)
      .processStartDate(IntervalDao.convertTableDate("23-APR-2021 15:05:04"))
      .processEndDate(IntervalDao.convertTableDate("23-APR-2021 15:05:04"))
      .lastModificationDate(IntervalDao.convertTableDate("23-APR-2021 15:05:04"))
      .loadDate(IntervalDao.convertTableDate("23-APR-2021 15:05:04"))
      .build();

    INTERVAL_DAO_FOR_SIMULATOR0 = new IntervalDao.Builder()
      .intervalIdentifier(1002526262086L)
      .type("ARS")
      .name("ALL1")
      .time(0)
      .endTime(0)
      .state("done")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond(0))
      .processEndDate(Instant.ofEpochSecond(0))
      .lastModificationDate(Instant.ofEpochSecond(-60 * 60))
      .loadDate(Instant.ofEpochSecond(0))
      .build();

    INTERVAL_DAO_FOR_SIMULATOR1 = new IntervalDao.Builder()
      .intervalIdentifier(1002526262084L)
      .type("ARS")
      .name("ALL1")
      .time(0)
      .endTime(60 * 60)
      .state("done")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond(0))
      .processEndDate(Instant.ofEpochSecond(60 * 60))
      .lastModificationDate(Instant.ofEpochSecond(60 * 60))
      .loadDate(Instant.ofEpochSecond(0))
      .build();

    INTERVAL_DAO_FOR_SIMULATOR2 = new IntervalDao.Builder()
      .intervalIdentifier(1002526262085L)
      .type("ARS")
      .name("ALL1")
      .time(60 * 60)
      .endTime(2 * 60 * 60)
      .state("done")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond(1))
      .processEndDate(Instant.ofEpochSecond(2 * 60 * 60))
      .lastModificationDate(Instant.ofEpochSecond(2 * 60 * 60))
      .loadDate(Instant.ofEpochSecond(0))
      .build();

    INTERVAL_DAO_SHIFTED0 = new IntervalDao.Builder()
      .intervalIdentifier(1L)
      .type("ARS")
      .name("ALL1")
      .time(21 * 60 * 60)
      .endTime(21 * 60 * 60)
      .state("pending")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond(21 * 60 * 60))
      .processEndDate(Instant.ofEpochSecond(21 * 60 * 60))
      .lastModificationDate(Instant.ofEpochSecond(20 * 60 * 60))
      .loadDate(Instant.ofEpochSecond(21 * 60 * 60))
      .build();

    INTERVAL_DAO_SHIFTED1 = new IntervalDao.Builder()
      .intervalIdentifier(2L)
      .type("ARS")
      .name("ALL1")
      .time(21 * 60 * 60)
      .endTime((21 + 1) * 60 * 60)
      .state("pending")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond(21 * 60 * 60))
      .processEndDate(Instant.ofEpochSecond((21 + 1) * 60 * 60))
      .lastModificationDate(Instant.ofEpochSecond((21 + 1) * 60 * 60))
      .loadDate(Instant.ofEpochSecond(21 * 60 * 60))
      .build();

    INTERVAL_DAO_SHIFTED2 = new IntervalDao.Builder()
      .intervalIdentifier(3L)
      .type("ARS")
      .name("ALL1")
      .time((21 + 1) * 60 * 60)
      .endTime((21 + 2) * 60 * 60)
      .state("pending")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond(1 + 21 * 60 * 60))
      .processEndDate(Instant.ofEpochSecond((21 + 2) * 60 * 60))
      .lastModificationDate(Instant.ofEpochSecond((21 + 2) * 60 * 60))
      .loadDate(Instant.ofEpochSecond(21 * 60 * 60))
      .build();

    INTERVAL_DAO_SHIFTED0A = new IntervalDao.Builder()
      .intervalIdentifier(4L)
      .type("ARS")
      .name("ALL1")
      .time((21 + 3) * 60 * 60)
      .endTime((21 + 3) * 60 * 60)
      .state("pending")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond((21 + 3) * 60 * 60))
      .processEndDate(Instant.ofEpochSecond((21 + 3) * 60 * 60))
      .lastModificationDate(Instant.ofEpochSecond((20 + 3) * 60 * 60))
      .loadDate(Instant.ofEpochSecond((21 + 3) * 60 * 60))
      .build();

    INTERVAL_DAO_SHIFTED1A = new IntervalDao.Builder()
      .intervalIdentifier(5L)
      .type("ARS")
      .name("ALL1")
      .time((21 + 3) * 60 * 60)
      .endTime((21 + 4) * 60 * 60)
      .state("pending")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond((21 + 3) * 60 * 60))
      .processEndDate(Instant.ofEpochSecond((21 + 4) * 60 * 60))
      .lastModificationDate(Instant.ofEpochSecond((21 + 4) * 60 * 60))
      .loadDate(Instant.ofEpochSecond((21 + 3) * 60 * 60))
      .build();

    INTERVAL_DAO_SHIFTED2A = new IntervalDao.Builder()
      .intervalIdentifier(6L)
      .type("ARS")
      .name("ALL1")
      .time((21 + 4) * 60 * 60)
      .endTime((21 + 5) * 60 * 60)
      .state("pending")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond(1 + (21 + 3) * 60 * 60))
      .processEndDate(Instant.ofEpochSecond((21 + 5) * 60 * 60))
      .lastModificationDate(Instant.ofEpochSecond((21 + 5) * 60 * 60))
      .loadDate(Instant.ofEpochSecond((21 + 3) * 60 * 60))
      .build();

    INTERVAL_DAO_SHIFTED0B = new IntervalDao.Builder()
      .intervalIdentifier(7L)
      .type("ARS")
      .name("ALL1")
      .time((21 + 6) * 60 * 60)
      .endTime((21 + 6) * 60 * 60)
      .state("pending")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond((21 + 6) * 60 * 60))
      .processEndDate(Instant.ofEpochSecond((21 + 6) * 60 * 60))
      .lastModificationDate(Instant.ofEpochSecond((20 + 6) * 60 * 60))
      .loadDate(Instant.ofEpochSecond((21 + 6) * 60 * 60))
      .build();

    OFF_HOUR_OFFSET = Duration.ofMinutes(21);

    INTERVAL_DAO_FOR_SIMULATOR_OFF_HOUR0 = new IntervalDao.Builder()
      .intervalIdentifier(1002526262086L)
      .type("ARS")
      .name("ALL1")
      .time(OFF_HOUR_OFFSET.toSeconds())
      .endTime(OFF_HOUR_OFFSET.toSeconds())
      .state("done")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond(0).plus(OFF_HOUR_OFFSET))
      .processEndDate(Instant.ofEpochSecond(0).plus(OFF_HOUR_OFFSET))
      .lastModificationDate(Instant.ofEpochSecond(-60 * 60).plus(OFF_HOUR_OFFSET))
      .loadDate(Instant.ofEpochSecond(0).plus(OFF_HOUR_OFFSET))
      .build();

    INTERVAL_DAO_FOR_SIMULATOR_OFF_HOUR1 = new IntervalDao.Builder()
      .intervalIdentifier(1002526262084L)
      .type("ARS")
      .name("ALL1")
      .time(OFF_HOUR_OFFSET.toSeconds())
      .endTime(60 * 60 + OFF_HOUR_OFFSET.toSeconds())
      .state("done")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond(0).plus(OFF_HOUR_OFFSET))
      .processEndDate(Instant.ofEpochSecond(60 * 60).plus(OFF_HOUR_OFFSET))
      .lastModificationDate(Instant.ofEpochSecond(60 * 60).plus(OFF_HOUR_OFFSET))
      .loadDate(Instant.ofEpochSecond(0).plus(OFF_HOUR_OFFSET))
      .build();

    INTERVAL_DAO_FOR_SIMULATOR_OFF_HOUR2 = new IntervalDao.Builder()
      .intervalIdentifier(1002526262085L)
      .type("ARS")
      .name("ALL1")
      .time(60 * 60 + OFF_HOUR_OFFSET.toSeconds())
      .endTime(2 * 60 * 60 + OFF_HOUR_OFFSET.toSeconds())
      .state("done")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond(1).plus(OFF_HOUR_OFFSET))
      .processEndDate(Instant.ofEpochSecond(2 * 60 * 60).plus(OFF_HOUR_OFFSET))
      .lastModificationDate(Instant.ofEpochSecond(2 * 60 * 60).plus(OFF_HOUR_OFFSET))
      .loadDate(Instant.ofEpochSecond(0).plus(OFF_HOUR_OFFSET))
      .build();

    INTERVAL_DAO_SHIFTED_OFF_HOUR0 = new IntervalDao.Builder()
      .intervalIdentifier(1L)
      .type("ARS")
      .name("ALL1")
      .time(21 * 60 * 60 + OFF_HOUR_OFFSET.toSeconds())
      .endTime(21 * 60 * 60 + OFF_HOUR_OFFSET.toSeconds())
      .state("pending")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond(21 * 60 * 60).plus(OFF_HOUR_OFFSET))
      .processEndDate(Instant.ofEpochSecond(21 * 60 * 60).plus(OFF_HOUR_OFFSET))
      .lastModificationDate(Instant.ofEpochSecond(20 * 60 * 60).plus(OFF_HOUR_OFFSET))
      .loadDate(Instant.ofEpochSecond(21 * 60 * 60).plus(OFF_HOUR_OFFSET))
      .build();

    INTERVAL_DAO_SHIFTED_OFF_HOUR1 = new IntervalDao.Builder()
      .intervalIdentifier(2L)
      .type("ARS")
      .name("ALL1")
      .time(21 * 60 * 60 + OFF_HOUR_OFFSET.toSeconds())
      .endTime((21 + 1) * 60 * 60 + OFF_HOUR_OFFSET.toSeconds())
      .state("pending")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond(21 * 60 * 60).plus(OFF_HOUR_OFFSET))
      .processEndDate(Instant.ofEpochSecond((21 + 1) * 60 * 60).plus(OFF_HOUR_OFFSET))
      .lastModificationDate(Instant.ofEpochSecond((21 + 1) * 60 * 60).plus(OFF_HOUR_OFFSET))
      .loadDate(Instant.ofEpochSecond(21 * 60 * 60).plus(OFF_HOUR_OFFSET))
      .build();

    INTERVAL_DAO_SHIFTED_OFF_HOUR2 = new IntervalDao.Builder()
      .intervalIdentifier(3L)
      .type("ARS")
      .name("ALL1")
      .time((21 + 1) * 60 * 60 + OFF_HOUR_OFFSET.toSeconds())
      .endTime((21 + 2) * 60 * 60 + OFF_HOUR_OFFSET.toSeconds())
      .state("pending")
      .author("yours-truly")
      .percentAvailable(100.0)
      .processStartDate(Instant.ofEpochSecond(1 + 21 * 60 * 60).plus(OFF_HOUR_OFFSET))
      .processEndDate(Instant.ofEpochSecond((21 + 2) * 60 * 60).plus(OFF_HOUR_OFFSET))
      .lastModificationDate(Instant.ofEpochSecond((21 + 2) * 60 * 60).plus(OFF_HOUR_OFFSET))
      .loadDate(Instant.ofEpochSecond(21 * 60 * 60).plus(OFF_HOUR_OFFSET))
      .build();
  }
}
