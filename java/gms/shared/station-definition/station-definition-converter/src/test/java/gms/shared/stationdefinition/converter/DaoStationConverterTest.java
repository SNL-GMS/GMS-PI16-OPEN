package gms.shared.stationdefinition.converter;


import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collection;
import java.util.List;
import java.util.function.BiFunction;
import java.util.stream.Stream;

import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_CHAN_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_CHAN_DAO_2;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_CHAN_DAO_3;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_2;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_3;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_GROUP;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.getListOfChannelGroupsForDaosWithResponses;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.getListOfChannelsWithResponse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;

@ExtendWith(MockitoExtension.class)
class DaoStationConverterTest {

  private final DaoResponseConverter responseConverter = DaoResponseConverter.create();
  private final DaoCalibrationConverter calibrationConverter = DaoCalibrationConverter
      .create();
  private final FileFrequencyAmplitudePhaseConverter fapConverter = FileFrequencyAmplitudePhaseConverter
      .create();
  private final DaoChannelConverter channelConverter = DaoChannelConverter
      .create(calibrationConverter, fapConverter);
  private final DaoStationConverter stationConverter = DaoStationConverter.create();

  static final List<SiteDao> SITE_DAOS = List.of(SITE_DAO_1,
      SITE_DAO_2, SITE_DAO_3);

  static final List<SiteChanDao> SITE_CHAN_DAOS = List.of(CSSDaoTestFixtures.SITE_CHAN_DAO_1,
      CSSDaoTestFixtures.SITE_CHAN_DAO_2, CSSDaoTestFixtures.SITE_CHAN_DAO_3);

  static final List<SensorDao> SENSOR_DAOS = List.of(CSSDaoTestFixtures.SENSOR_DAO_1,
      CSSDaoTestFixtures.SENSOR_DAO_2, CSSDaoTestFixtures.SENSOR_DAO_3);

  static final List<InstrumentDao> INSTRUMENT_DAOS = List.of(CSSDaoTestFixtures.INSTRUMENT_DAO_1,
      CSSDaoTestFixtures.INSTRUMENT_DAO_2, CSSDaoTestFixtures.INSTRUMENT_DAO_3);

  static final List<WfdiscDao> WFDISC_DAOS = List.of(CSSDaoTestFixtures.WFDISC_DAO_1,
      CSSDaoTestFixtures.WFDISC_DAO_2, CSSDaoTestFixtures.WFDISC_DAO_3);

  private static final BiFunction<SiteDao, SiteChanDao, Channel> channelBiFunction = (siteDao, siteChanDao) -> CHANNEL;

  private static final BiFunction<SiteDao, List<SiteChanDao>, ChannelGroup> channelGroupBiFunction = (siteDao, siteChanDaos) -> CHANNEL_GROUP;

  @Mock
  BiFunction<SiteDao, SiteChanDao, Channel> channelBiFunctionMock;

  @Mock
  BiFunction<SiteDao, List<SiteChanDao>, ChannelGroup> channelGroupBiFunctionMock;

  @Test
  void testConvertBiFunction() {
    List<SiteDao> siteList = List.of(SITE_DAO_1, SITE_DAO_2, SITE_DAO_3);
    List<SiteChanDao> siteChanList = List.of(SITE_CHAN_DAO_1, SITE_CHAN_DAO_2, SITE_CHAN_DAO_3);
    List<Channel> channels = getListOfChannelsWithResponse();
    List<ChannelGroup> channelGroups = getListOfChannelGroupsForDaosWithResponses();
    doReturn(channels.get(0), channels.get(1), channels.get(2)).when(channelBiFunctionMock).apply(any(), any());
    doReturn(channelGroups.get(0), channelGroups.get(1)).when(channelGroupBiFunctionMock).apply(any(), any());
    final Station result = stationConverter.convert(siteList, siteChanList, channelBiFunctionMock, channelGroupBiFunctionMock);

    assertNotNull(result);
    assertNotNull(result.getName());
    assertNotNull(result.getEffectiveAt());
    assertTrue(result.isPresent());
  }

  @Test
  void testConvertToVersionReference_mainSiteDao() {
    // tests a single main SiteDao
    SiteDao mainSiteDao = SITE_DAO_1;
    Station testStation = stationConverter.convertToVersionReference(mainSiteDao);

    assertNotNull(testStation);
    assertNotNull(testStation.getName());
    assertEquals(mainSiteDao.getReferenceStation(), testStation.getName());
    assertNotNull(testStation.getEffectiveAt());
    assertEquals(mainSiteDao.getId().getOnDate(), testStation.getEffectiveAt().orElseThrow());
    assertFalse(testStation.isPresent());
  }

  @ParameterizedTest
  @MethodSource("convertValidationParameterBiFunctionSource")
  void testConvertFromDaosBiFunction_validationErrors(Class<Exception> errorType, Collection<SiteDao> siteDaos,
                                                      Collection<SiteChanDao> siteChanDaos,
                                                      BiFunction<SiteDao, SiteChanDao, Channel> channelBiFunction,
                                                      BiFunction<SiteDao, List<SiteChanDao>, ChannelGroup> channelGroupBiFunction) {
    assertThrows(errorType,
            () -> stationConverter.convert(siteDaos, siteChanDaos, channelBiFunction, channelGroupBiFunction));
  }

  private static Stream<Arguments> convertValidationParameterBiFunctionSource() {
    return Stream.of(
            arguments(NullPointerException.class, null, List.of(CSSDaoTestFixtures.SITE_CHAN_DAO_1),
                    channelBiFunction, channelGroupBiFunction),
            arguments(NullPointerException.class, List.of(SITE_DAO_1), null, channelBiFunction, channelGroupBiFunction),
            arguments(NullPointerException.class, List.of(SITE_DAO_1), List.of(CSSDaoTestFixtures.SITE_CHAN_DAO_1), null,
                    channelGroupBiFunction),
            arguments(NullPointerException.class, List.of(SITE_DAO_1), List.of(CSSDaoTestFixtures.SITE_CHAN_DAO_1), channelBiFunction,
                    null),
            arguments(IllegalStateException.class, List.of(SITE_DAO_1), List.of(),
                    channelBiFunction, channelGroupBiFunction),
            arguments(IllegalStateException.class, List.of(),
                    List.of(CSSDaoTestFixtures.SITE_CHAN_DAO_1), channelBiFunction, channelGroupBiFunction)
    );
  }

  @Test
  void testConvertToVersionReference_nullSiteDao() {
    assertThrows(NullPointerException.class,
            () -> stationConverter.convertToVersionReference(null));
  }
}
