package gms.shared.signaldetection.testfixtures;

import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.dao.css.enums.SignalType;
import gms.shared.stationdefinition.dao.css.StationChannelTimeKey;
import gms.shared.stationdefinition.dao.css.WfTagDao;
import gms.shared.stationdefinition.dao.css.WfTagKey;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import gms.shared.utilities.bridge.database.enums.ClipFlag;

import java.time.Instant;

import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.WFID_1;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.WFID_3;

public class SignalDetectionDaoTestFixtures {
  public static final ArrivalDao ARRIVAL_1;
  public static final ArrivalDao ARRIVAL_2;
  public static final ArrivalDao ARRIVAL_3;
  public static final ArrivalDao ARRIVAL_4;

  public static final WfTagDao WFTAG_1;
  public static final WfTagDao WFTAG_3;

  public static final String STAGE_1 = "Stage 1";
  public static final String STAGE_2 = "Stage 2";
  public static final String STAGE_3 = "Stage 3";

  public static final String STAGE_1_ACCT = "Acc1";
  public static final String STAGE_2_ACCT = "Acc2";
  public static final String STAGE_3_ACCT = "Acc3";

  public static final String CHAN = "CHAN";
  public static final String CHANNEL_CODE = "BHZ";

  public static final String TEST_USERS = "test users";

  static {
    ARRIVAL_1 = new ArrivalDao();
    StationChannelTimeKey arrivalKey1 = new StationChannelTimeKey();
    arrivalKey1.setStationCode(CHAN);
    arrivalKey1.setChannelCode(CHANNEL_CODE);
    arrivalKey1.setTime(Instant.EPOCH);
    ARRIVAL_1.setArrivalKey(arrivalKey1);
    ARRIVAL_1.setId(1);
    ARRIVAL_1.setjDate(Instant.EPOCH);
    ARRIVAL_1.setSingleStationOriginId(2);
    ARRIVAL_1.setChannelId(2);
    ARRIVAL_1.setPhase("P");
    ARRIVAL_1.setSignalType(SignalType.LOCAL_EVENT);
    ARRIVAL_1.setCommid(2);
    ARRIVAL_1.setTimeUncertainty(0.001);
    ARRIVAL_1.setAzimuth(180);
    ARRIVAL_1.setAzimuthUncertainty(0.5);
    ARRIVAL_1.setSlowness(32.1);
    ARRIVAL_1.setSlownessUncertainty(0.23);
    ARRIVAL_1.setEmergenceAngle(37);
    ARRIVAL_1.setRectilinearity(0.23);
    ARRIVAL_1.setAmplitude(45.03);
    ARRIVAL_1.setPeriod(0.234);
    ARRIVAL_1.setLogAmpliterPeriod(76.23);
    ARRIVAL_1.setClipped(ClipFlag.CLIPPED);
    ARRIVAL_1.setFirstMotion("c");
    ARRIVAL_1.setSnr(23.41);
    ARRIVAL_1.setSignalOnsetQuality("test");
    ARRIVAL_1.setAuthor(TEST_USERS);
    ARRIVAL_1.setLoadDate(Instant.EPOCH.plusSeconds(300));

    WFTAG_1 = new WfTagDao();
    WfTagKey wftag1Key = new WfTagKey();
    wftag1Key.setId(ARRIVAL_1.getId());
    wftag1Key.setTagName(TagName.ARID);
    wftag1Key.setWfId(WFID_1);
    WFTAG_1.setWfTagKey(wftag1Key);
    WFTAG_1.setLoadDate(Instant.EPOCH);

    ARRIVAL_2 = new ArrivalDao();
    StationChannelTimeKey arrivalKey2 = new StationChannelTimeKey();
    arrivalKey2.setStationCode(CHAN);
    arrivalKey2.setChannelCode(CHANNEL_CODE);
    arrivalKey2.setTime(Instant.EPOCH.plusSeconds(1));
    ARRIVAL_2.setArrivalKey(arrivalKey2);
    ARRIVAL_2.setId(1);
    ARRIVAL_2.setjDate(Instant.EPOCH);
    ARRIVAL_2.setSingleStationOriginId(2);
    ARRIVAL_2.setChannelId(2);
    ARRIVAL_2.setPhase("P");
    ARRIVAL_2.setSignalType(SignalType.LOCAL_EVENT);
    ARRIVAL_2.setCommid(2);
    ARRIVAL_2.setTimeUncertainty(0.01);
    ARRIVAL_2.setAzimuth(180);
    ARRIVAL_2.setAzimuthUncertainty(0.5);
    ARRIVAL_2.setSlowness(32.1);
    ARRIVAL_2.setSlownessUncertainty(0.23);
    ARRIVAL_2.setEmergenceAngle(37);
    ARRIVAL_2.setRectilinearity(0.23);
    ARRIVAL_2.setAmplitude(45.03);
    ARRIVAL_2.setPeriod(0.234);
    ARRIVAL_2.setLogAmpliterPeriod(76.23);
    ARRIVAL_2.setClipped(ClipFlag.CLIPPED);
    ARRIVAL_2.setFirstMotion("cr");
    ARRIVAL_2.setSnr(23.41);
    ARRIVAL_2.setSignalOnsetQuality("test");
    ARRIVAL_2.setAuthor(TEST_USERS);
    ARRIVAL_2.setLoadDate(Instant.EPOCH.plusSeconds(300));

    ARRIVAL_3 = new ArrivalDao();
    StationChannelTimeKey arrivalKey3 = new StationChannelTimeKey();
    arrivalKey3.setStationCode(CHAN);
    arrivalKey3.setChannelCode(CHANNEL_CODE);
    arrivalKey3.setTime(Instant.EPOCH);
    ARRIVAL_3.setArrivalKey(arrivalKey3);
    ARRIVAL_3.setId(2);
    ARRIVAL_3.setjDate(Instant.EPOCH);
    ARRIVAL_3.setSingleStationOriginId(2);
    ARRIVAL_3.setChannelId(2);
    ARRIVAL_3.setPhase("P");
    ARRIVAL_3.setSignalType(SignalType.LOCAL_EVENT);
    ARRIVAL_3.setCommid(2);
    ARRIVAL_3.setTimeUncertainty(0.01);
    ARRIVAL_3.setAzimuth(180);
    ARRIVAL_3.setAzimuthUncertainty(0.5);
    ARRIVAL_3.setSlowness(32.1);
    ARRIVAL_3.setSlownessUncertainty(0.23);
    ARRIVAL_3.setEmergenceAngle(37);
    ARRIVAL_3.setRectilinearity(0.23);
    ARRIVAL_3.setAmplitude(45.03);
    ARRIVAL_3.setPeriod(0.234);
    ARRIVAL_3.setLogAmpliterPeriod(76.23);
    ARRIVAL_3.setClipped(ClipFlag.CLIPPED);
    ARRIVAL_3.setFirstMotion("r");
    ARRIVAL_3.setSnr(23.41);
    ARRIVAL_3.setSignalOnsetQuality("test");
    ARRIVAL_3.setAuthor(TEST_USERS);
    ARRIVAL_3.setLoadDate(Instant.EPOCH.plusSeconds(300));

    WFTAG_3 = new WfTagDao();
    WfTagKey wftag3Key = new WfTagKey();
    wftag3Key.setId(ARRIVAL_3.getId());
    wftag3Key.setTagName(TagName.ARID);
    wftag3Key.setWfId(WFID_3);
    WFTAG_3.setWfTagKey(wftag3Key);
    WFTAG_3.setLoadDate(Instant.EPOCH);

    ARRIVAL_4 = new ArrivalDao();
    StationChannelTimeKey arrivalKey4 = new StationChannelTimeKey();
    arrivalKey4.setStationCode(CHAN);
    arrivalKey4.setChannelCode(CHANNEL_CODE);
    arrivalKey4.setTime(Instant.EPOCH.plusSeconds(100));
    ARRIVAL_4.setArrivalKey(arrivalKey4);
    ARRIVAL_4.setId(2);
    ARRIVAL_4.setjDate(Instant.EPOCH);
    ARRIVAL_4.setSingleStationOriginId(2);
    ARRIVAL_4.setChannelId(2);
    ARRIVAL_4.setPhase("I");
    ARRIVAL_4.setSignalType(SignalType.LOCAL_EVENT);
    ARRIVAL_4.setCommid(2);
    ARRIVAL_4.setTimeUncertainty(0.01);
    ARRIVAL_4.setAzimuth(180);
    ARRIVAL_4.setAzimuthUncertainty(0.5);
    ARRIVAL_4.setSlowness(32.1);
    ARRIVAL_4.setSlownessUncertainty(0.23);
    ARRIVAL_4.setEmergenceAngle(37);
    ARRIVAL_4.setRectilinearity(0.23);
    ARRIVAL_4.setAmplitude(45.03);
    ARRIVAL_4.setPeriod(0.234);
    ARRIVAL_4.setLogAmpliterPeriod(76.23);
    ARRIVAL_4.setClipped(ClipFlag.CLIPPED);
    ARRIVAL_4.setFirstMotion("-");
    ARRIVAL_4.setSnr(23.41);
    ARRIVAL_4.setSignalOnsetQuality("test");
    ARRIVAL_4.setAuthor(TEST_USERS);
    ARRIVAL_4.setLoadDate(Instant.EPOCH.plusSeconds(100));
  }

  private SignalDetectionDaoTestFixtures() {
    // prevent instantiation
  }
}
