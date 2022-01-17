package gms.shared.stationdefinition.converter.util.assemblers;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType;
import gms.shared.stationdefinition.converter.DaoCalibrationConverter;
import gms.shared.stationdefinition.converter.DaoChannelConverter;
import gms.shared.stationdefinition.converter.DaoResponseConverter;
import gms.shared.stationdefinition.converter.FileFrequencyAmplitudePhaseConverter;
import gms.shared.stationdefinition.converter.interfaces.ChannelConverter;
import gms.shared.stationdefinition.converter.interfaces.ResponseConverter;
import gms.shared.stationdefinition.converter.interfaces.ResponseConverterTransform;
import gms.shared.stationdefinition.dao.css.BeamDao;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.SiteKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.dao.css.enums.StaType;
import gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.INSTRUMENT_DAO_1_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SENSOR_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_CHAN_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_1;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChannelAssemblerTest {

  private static final BeamDao beamDao = CSSDaoTestFixtures.createBeamDao(WFDISC_TEST_DAO_1.getId());
  private static final SiteDao siteDao = SITE_DAO_1;
  private static final SiteChanDao siteChanDao = SITE_CHAN_DAO_1;
  private static final SensorDao sensorDao = SENSOR_DAO_1;
  private static final InstrumentDao instrumentDao = INSTRUMENT_DAO_1_1;
  private static final WfdiscDao wfdiscDao = WFDISC_DAO_1;

  private final DaoResponseConverter responseConverter = DaoResponseConverter.create();
  private final DaoCalibrationConverter calibrationConverter = DaoCalibrationConverter
    .create();
  private final FileFrequencyAmplitudePhaseConverter fapConverter = FileFrequencyAmplitudePhaseConverter
    .create();
  private final DaoChannelConverter channelConverter = DaoChannelConverter
    .create(calibrationConverter, fapConverter);

  @Mock
  private ChannelConverter mockChannelConverter;

  @Mock
  private ResponseConverter mockResponseConverter;

  private ChannelAssembler channelAssembler;

  @BeforeEach
  void setup() {
    channelAssembler = ChannelAssembler.create(mockChannelConverter, mockResponseConverter);
  }

  @Test
  void testGetListOfCssDaosPerChannelGroup() {
    List<SiteDao> siteDaos = CSSDaoTestFixtures.getTestSiteDaos();
    List<SiteChanDao> siteChanDaos = CSSDaoTestFixtures.getTestSiteChanDaos();
    List<SensorDao> sensorDaos = CSSDaoTestFixtures.getTestSensorDaos();
    List<WfdiscDao> wfdiscDaos = CSSDaoTestFixtures.getTestWfdiscDaos();

    ChannelAssembler channelAssembler = ChannelAssembler.create(channelConverter, responseConverter);
    List<Channel> channels = channelAssembler.buildAllForTime(Instant.now(), siteDaos, siteChanDaos, sensorDaos, wfdiscDaos);
    Set<Channel> channelSet = new HashSet<>(channels);

    Set<Channel> compareChannel = new HashSet<>(UtilsTestFixtures.getListOfChannelsWithResponse());

    assertEquals(channelSet, compareChannel);

  }

  @Test
  void testGetListOfCssDaosPerChannelGroupSensorAtStartime() {
    List<SiteDao> siteDaos = CSSDaoTestFixtures.getTestSiteDaos();
    List<SiteChanDao> siteChanDaos = CSSDaoTestFixtures.getTestSiteChanDaos();
    List<SensorDao> sensorDaos = CSSDaoTestFixtures.getTestSensorDaosWithSiteChanOnDate();
    List<InstrumentDao> instrumentDaos = CSSDaoTestFixtures.getTestInstrumentDaos();
    List<WfdiscDao> wfdiscDaos = CSSDaoTestFixtures.getTestWfdiscDaos();


    ChannelAssembler channelAssembler = ChannelAssembler.create(channelConverter, responseConverter);
    List<Channel> channels = channelAssembler.buildAllForTime(Instant.now(), siteDaos, siteChanDaos, sensorDaos, wfdiscDaos);

    channels.sort(Channel::compareTo);
    List<Channel> compareChannel = UtilsTestFixtures.getListOfChannelsWithResponse();

    assertEquals(channels, compareChannel);
  }

  @Test
  void testGetListOfCssDaosPerChannelGroupMissingSensorDao() {
    List<SiteDao> siteDaos = CSSDaoTestFixtures.getTestSiteDaos();
    List<SiteChanDao> siteChanDaos = CSSDaoTestFixtures.getTestSiteChanDaos();
    List<SensorDao> sensorDaos = UtilsTestFixtures.getIncompleteSensorDaoList();
    List<WfdiscDao> wfdiscDaos = List.of();

    ChannelAssembler channelAssembler = ChannelAssembler.create(channelConverter, responseConverter);
    List<Channel> channels = channelAssembler.buildAllForTime(Instant.now(),
      siteDaos, siteChanDaos, sensorDaos, wfdiscDaos);
    Set<Channel> channelSet = new HashSet<>(channels);

    Set<Channel> compareChannel = new HashSet<>(UtilsTestFixtures.getListOfChannelsForIncompleteDaos());

    assertEquals(channelSet, compareChannel);
  }

  @Test
  void testGetListOfCssDaosPerChannelGroupMissingSiteChanDao() {
    List<SiteDao> siteDaos = CSSDaoTestFixtures.getTestSiteDaos();
    List<SiteChanDao> siteChanDaos = UtilsTestFixtures.getIncompleteSiteChanDaoList();
    List<SensorDao> sensorDaos = CSSDaoTestFixtures.getTestSensorDaos();
    List<WfdiscDao> wfdiscDaos = List.of();

    ChannelAssembler channelAssembler = ChannelAssembler.create(channelConverter, responseConverter);
    List<Channel> channels = channelAssembler.buildAllForTime(Instant.now(), siteDaos,
      siteChanDaos, sensorDaos, wfdiscDaos);
    Set<Channel> channelSet = new HashSet<>(channels);

    Set<Channel> compareChannel = new HashSet<>(UtilsTestFixtures.getListOfChannelsForIncompleteDaos());

    assertEquals(channelSet, compareChannel);
  }

  @Test
  void testGetListOfCssDaosPerChannelGroupMissingSiteDao() {
    List<SiteDao> siteDaos = UtilsTestFixtures.getIncompleteSiteDao();
    List<SiteChanDao> siteChanDaos = CSSDaoTestFixtures.getTestSiteChanDaos();
    List<SensorDao> sensorDaos = CSSDaoTestFixtures.getTestSensorDaos();
    List<WfdiscDao> wfdiscDaos = List.of();

    ChannelAssembler channelAssembler = ChannelAssembler.create(channelConverter, responseConverter);
    List<Channel> channels = channelAssembler.buildAllForTime(Instant.now(), siteDaos, siteChanDaos, sensorDaos,
      wfdiscDaos);
    Set<Channel> channelSet = new HashSet<>(channels);

    Set<Channel> compareChannel = new HashSet<>(UtilsTestFixtures.getListOfChannelsForIncompleteDaos());

    assertEquals(channelSet, compareChannel);
  }

  @Test
  void testBuildForAllTimeRangeReponseReferece() {
    List<SiteDao> siteDaos = CSSDaoTestFixtures.getTestSiteDaos();
    List<SiteChanDao> siteChanDaos = CSSDaoTestFixtures.getTestSiteChanDaos();
    List<SensorDao> sensorDaos = CSSDaoTestFixtures.getTestSensorDaos();
    List<WfdiscDao> wfdiscDaos = CSSDaoTestFixtures.getTestWfdiscDaos();

    ChannelAssembler channelAssembler = ChannelAssembler.create(channelConverter, responseConverter);
    List<Channel> channels = channelAssembler.buildAllForTimeRange(Instant.now(), siteDaos, siteChanDaos, sensorDaos,
      wfdiscDaos);
    Set<Channel> channelSet = new HashSet<>(channels);

    channelSet.stream()
      .map(Channel::getResponse)
      .filter(Optional::isPresent)
      .map(Optional::get)
      .forEach(response -> {
        assertNotNull(response.getId());
        assertTrue(response.getData().isEmpty());
      });
  }

  @ParameterizedTest
  @MethodSource("getAssemblerArguments")
  void testBuildFromAssociatedRecordValidation(Map<ChannelProcessingMetadataType, Object> processingMetadataMap,
    Optional<BeamDao> beam,
    SiteDao site,
    WfdiscDao wfdisc,
    SiteChanDao siteChan,
    Optional<SensorDao> sensorDao,
    Instant channelEffectiveTime,
    Instant channelEndTime) {

    ChannelAssembler channelAssembler = ChannelAssembler.create(channelConverter, responseConverter);

    assertThrows(NullPointerException.class,
      () -> channelAssembler.buildFromAssociatedRecord(processingMetadataMap,
        beam,
        site,
        wfdisc,
        siteChan,
        sensorDao,
        channelEffectiveTime,
        channelEndTime));
  }

  static Stream<Arguments> getAssemblerArguments() {
    return Stream.of(
      arguments(null,
        Optional.of(beamDao),
        mock(SiteDao.class),
        mock(WfdiscDao.class),
        mock(SiteChanDao.class),
        Optional.of(SENSOR_DAO_1),
        Instant.EPOCH,
        Instant.MAX),
      arguments(mock(Map.class),
        null,
        mock(SiteDao.class),
        mock(WfdiscDao.class),
        mock(SiteChanDao.class),
        Optional.of(SENSOR_DAO_1),
        Instant.EPOCH,
        Instant.MAX),
      arguments(mock(Map.class),
        Optional.of(beamDao),
        null,
        mock(WfdiscDao.class),
        mock(SiteChanDao.class),
        Optional.of(SENSOR_DAO_1),
        Instant.EPOCH,
        Instant.MAX),
      arguments(mock(Map.class),
        Optional.of(beamDao),
        mock(SiteDao.class),
        null,
        mock(SiteChanDao.class),
        Optional.of(SENSOR_DAO_1),
        Instant.EPOCH,
        Instant.MAX),
      arguments(mock(Map.class),
        Optional.of(beamDao),
        mock(SiteDao.class),
        mock(WfdiscDao.class),
        null,
        Optional.of(SENSOR_DAO_1),
        Instant.EPOCH,
        Instant.MAX),
      arguments(mock(Map.class),
        Optional.of(beamDao),
        mock(SiteDao.class),
        mock(WfdiscDao.class),
        mock(SiteChanDao.class),
        null,
        Instant.EPOCH,
        Instant.MAX),
      arguments(mock(Map.class),
        Optional.of(beamDao),
        mock(SiteDao.class),
        mock(WfdiscDao.class),
        mock(SiteChanDao.class),
        Optional.of(SENSOR_DAO_1),
        null,
        Instant.MAX),
      arguments(mock(Map.class),
        Optional.of(beamDao),
        mock(SiteDao.class),
        mock(WfdiscDao.class),
        mock(SiteChanDao.class),
        Optional.of(SENSOR_DAO_1),
        Instant.EPOCH,
        null)
    );
  }

  @ParameterizedTest
  @MethodSource("getBuildFromAssociatedRecordArguments")
  void testBuildFromAssociatedRecord(Consumer<ChannelConverter> channelSetup,
    Map<ChannelProcessingMetadataType, Object> processingMetadataMap,
    Optional<BeamDao> beamDao,
    SiteDao siteDao,
    WfdiscDao wfdiscDao,
    SiteChanDao siteChanDao,
    Optional<SensorDao> possibleSensor,
    Instant channelEffectiveTime,
    Instant channelEndTime,
    Channel expected,
    Consumer<ChannelConverter> channelVerification) {

    channelSetup.accept(mockChannelConverter);

    Channel actual = channelAssembler.buildFromAssociatedRecord(processingMetadataMap,
      beamDao,
      siteDao,
      wfdiscDao,
      siteChanDao,
      possibleSensor,
      channelEffectiveTime,
      channelEndTime);
    assertEquals(expected, actual);

    channelVerification.accept(mockChannelConverter);
    verifyNoMoreInteractions(mockChannelConverter, mockResponseConverter);
  }

  static Stream<Arguments> getBuildFromAssociatedRecordArguments() {
    Consumer<ChannelConverter> rawSetup = channelConverter -> {
      doReturn(CHANNEL).when(channelConverter).convert(any(SiteChanDao.class),
        any(SiteDao.class),
        any(SensorDao.class),
        any(InstrumentDao.class),
        any(WfdiscDao.class),
        any(ResponseConverterTransform.class));
    };

    Consumer<ChannelConverter> rawVerification = channelConverter -> {
      verify(channelConverter).convert(any(SiteChanDao.class),
        any(SiteDao.class),
        any(SensorDao.class),
        any(InstrumentDao.class),
        any(WfdiscDao.class),
        any(ResponseConverterTransform.class));
    };

    SiteDao arraySite = new SiteDao();
    arraySite.setReferenceStation("refSta");
    SiteKey siteKey = new SiteKey();
    siteKey.setStationCode("refSta");
    siteKey.setOnDate(Instant.EPOCH);
    arraySite.setId(siteKey);
    arraySite.setStaType(StaType.ARRAY_STATION);

    SiteChanDao arraySiteChan = new SiteChanDao();
    SiteChanKey siteChanKey = new SiteChanKey();
    siteChanKey.setStationCode("refSta");
    siteChanKey.setChannelCode("bhz");
    siteChanKey.setOnDate(Instant.EPOCH);
    arraySiteChan.setId(siteChanKey);

    Consumer<ChannelConverter> beamSetup = channelConverter -> {
      when(channelConverter.convertToBeamDerived(eq(arraySite),
        eq(arraySiteChan),
        eq(WFDISC_DAO_1),
        eq(Instant.EPOCH),
        eq(Instant.MAX),
        eq(Optional.of(beamDao)),
        anyMap()))
        .thenReturn(CHANNEL);
    };

    Consumer<ChannelConverter> beamVerification = channelConverter -> {
      verify(channelConverter).convertToBeamDerived(eq(arraySite),
        eq(arraySiteChan),
        eq(WFDISC_DAO_1),
        eq(Instant.EPOCH),
        eq(Instant.MAX),
        eq(Optional.of(beamDao)),
        anyMap());
    };

    return Stream.of(
      arguments(rawSetup,
        Map.of(),
        Optional.empty(),
        siteDao,
        wfdiscDao,
        siteChanDao,
        Optional.of(sensorDao),
        Instant.EPOCH,
        Instant.MAX,
        CHANNEL,
        rawVerification),
      arguments(beamSetup,
        Map.of(),
        Optional.of(beamDao),
        arraySite,
        wfdiscDao,
        arraySiteChan,
        Optional.empty(),
        Instant.EPOCH,
        Instant.MAX,
        CHANNEL,
        beamVerification));
  }

}
