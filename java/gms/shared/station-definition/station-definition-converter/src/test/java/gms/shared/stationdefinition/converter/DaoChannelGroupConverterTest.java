package gms.shared.stationdefinition.converter;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;
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
import java.util.Collection;
import java.util.List;
import java.util.NavigableSet;
import java.util.Optional;
import java.util.TreeSet;
import java.util.function.BiFunction;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_TWO;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;

@ExtendWith(MockitoExtension.class)
class DaoChannelGroupConverterTest {
  private final DaoResponseConverter responseConverter = DaoResponseConverter.create();
  private final DaoCalibrationConverter calibrationConverter = DaoCalibrationConverter
    .create();
  private final FileFrequencyAmplitudePhaseConverter fapConverter = FileFrequencyAmplitudePhaseConverter
    .create();
  private final DaoChannelConverter channelConverter = DaoChannelConverter
     .create(calibrationConverter, fapConverter);

  private DaoChannelGroupConverter daoChannelGroupConverter;
  private NavigableSet<Channel> channels;
  private NavigableSet<Channel> invalidChannels;

  private ChannelGroup channelGroup;

  private SiteDao siteDao1;
  private SiteDao invalidSiteDao;

  public static BiFunction<SiteDao, SiteChanDao, Channel> channelBiFunction = (siteDao, siteChanDao) -> CHANNEL;

  @Mock
  private BiFunction<SiteDao, SiteChanDao, Channel> channelBiFunctionMock;

  @BeforeEach
  void setUp() {
    daoChannelGroupConverter = DaoChannelGroupConverter.create(channelConverter);
  }


  @BeforeEach
  void createReferencedObjects() {
    channels = new TreeSet<>();
    channels.add(CHANNEL);

    invalidChannels = new TreeSet<>();
    invalidSiteDao = new SiteDao();

    channelGroup = UtilsTestFixtures.CHANNEL_GROUP1;

    siteDao1 = CSSDaoTestFixtures.SITE_DAO_1;
  }

  @Test
  void testConvertBiFunction() {
    final SiteDao mainSiteDao = CSSDaoTestFixtures.SITE_DAO_1;
    final List<SiteChanDao> siteChanDaos = List
      .of(CSSDaoTestFixtures.SITE_CHAN_DAO_1, CSSDaoTestFixtures.SITE_CHAN_DAO_2);
    doReturn(CHANNEL, CHANNEL_TWO).when(channelBiFunctionMock).apply(any(), any());
    final ChannelGroup result = daoChannelGroupConverter.convert(mainSiteDao, siteChanDaos, channelBiFunctionMock);

    assertNotNull(result);

    assertEquals(mainSiteDao.getId().getStationCode(), result.getName());
    assertEquals(mainSiteDao.getId().getOnDate(), result.getEffectiveAt().get());
    assertEquals(mainSiteDao.getStationName(), result.getDescription());
    assertTrue(result.getLocation().isPresent());
    assertEquals(
      Location.from(mainSiteDao.getLatitude(), mainSiteDao.getLongitude(), 0,
        mainSiteDao.getElevation()),
      result.getLocation().get());
    assertEquals(ChannelGroup.ChannelGroupType.PHYSICAL_SITE, result.getType());
    assertNotNull(result.getChannels());
    assertTrue(result.getChannels().stream().allMatch(c -> c.isPresent() && c.getName() != null));
  }

  @Test
  void testConvertToVersionReference() {
    SiteDao mainSiteDao = CSSDaoTestFixtures.getMainSiteForFirstChannelGroup();

    final ChannelGroup channelGroup = daoChannelGroupConverter
      .convertToVersionReference(mainSiteDao);

    assertNotNull(channelGroup);
    assertNotNull(channelGroup.getName());
    assertEquals(mainSiteDao.getId().getStationCode(), channelGroup.getName());
    assertNotNull(channelGroup.getEffectiveAt());
    assertEquals(mainSiteDao.getId().getOnDate(), channelGroup.getEffectiveAt().orElseThrow());
    assertFalse(channelGroup.isPresent());
  }

  @Test
  void testConvertToVersionReference_nullSite() {
    assertThrows(NullPointerException.class,
      () -> daoChannelGroupConverter.convertToVersionReference(null));
  }

  @Test
  void testConvertFromDaos() {
    final SiteDao mainSiteDao = CSSDaoTestFixtures.SITE_DAO_1;
    final List<SiteChanDao> siteChanDaos = List
      .of(CSSDaoTestFixtures.SITE_CHAN_DAO_1, CSSDaoTestFixtures.SITE_CHAN_DAO_2);
    final List<Channel> channels = siteChanDaos.stream()
      .map(siteChanDao -> channelConverter.convertToVersionReference(mainSiteDao, siteChanDao)).collect(
        Collectors.toList());

    final ChannelGroup result = daoChannelGroupConverter.convert(mainSiteDao, siteChanDaos);

    assertNotNull(result);
    assertTrue(result.isPresent());
    assertNotNull(result.getName());
    assertEquals(mainSiteDao.getId().getStationCode(), result.getName());
    assertNotNull(result.getEffectiveAt());
    assertTrue(result.getEffectiveAt().isPresent());
    assertEquals(mainSiteDao.getId().getOnDate(), result.getEffectiveAt().orElseThrow());
    assertEquals(siteChanDaos.size(), result.getChannels().size());
    assertEquals(result.getEffectiveUntil(), Optional.of(mainSiteDao.getOffDate()));
    result.getChannels().forEach(channel -> {
      assertNotNull(channel);
      assertFalse(channel.isPresent());
      assertNotNull(channel.getName());
      assertNotNull(channel.getEffectiveAt());
      assertTrue(channel.getEffectiveAt().isPresent());
      assertTrue(channels.stream().anyMatch(c -> c.equals(channel)));
    });
  }

  @Test
  void testConvertWithMaxEffectiveTime() {
    SiteDao site = CSSDaoTestFixtures.SITE_DAO_1;
    final SiteDao mainSiteDao = new SiteDao(site.getId(), Instant.MAX, site.getLatitude(), site.getLongitude(),
        site.getElevation(), site.getStationName(), site.getStaType(), site.getReferenceStation(),
        site.getDegreesNorth(), site.getDegreesEast(), site.getLoadDate());

    final ChannelGroup result = daoChannelGroupConverter.convert(mainSiteDao,
        List.of(CSSDaoTestFixtures.SITE_CHAN_DAO_1));

    assertEquals(result.getEffectiveUntil(), Optional.empty());
  }

  @ParameterizedTest
  @MethodSource("convertValidationParameterBiFunctionSource")
  void testConvertFromDaosBiFunction_validationErrors(Class<Exception> errorType, SiteDao siteDao,
    Collection<SiteChanDao> siteChanDaos,
    BiFunction<SiteDao, SiteChanDao, Channel> channelBiFunction) {

    assertThrows(errorType,
      () -> daoChannelGroupConverter.convert(siteDao, siteChanDaos, channelBiFunction));
  }

  public static Stream<Arguments> convertValidationParameterBiFunctionSource() {
    return Stream.of(
      arguments(NullPointerException.class, null, List.of(CSSDaoTestFixtures.SITE_CHAN_DAO_1), channelBiFunction),
      arguments(NullPointerException.class, CSSDaoTestFixtures.SITE_DAO_1, null, channelBiFunction),
      arguments(NullPointerException.class, CSSDaoTestFixtures.SITE_DAO_1, List.of(CSSDaoTestFixtures.SITE_CHAN_DAO_1), null),
      arguments(IllegalStateException.class, CSSDaoTestFixtures.SITE_DAO_1, List.of(), channelBiFunction)
    );
  }

  @ParameterizedTest
  @MethodSource("convertValidationParameterSource")
  void testConvertFromDaos_validationErrors(Class<Exception> errorType, SiteDao siteDao,
    Collection<SiteChanDao> siteChanDaos) {
    assertThrows(errorType,
      () -> daoChannelGroupConverter.convert(siteDao, siteChanDaos));
  }

  private static Stream<Arguments> convertValidationParameterSource() {
    return Stream.of(
      arguments(NullPointerException.class, null, List.of(CSSDaoTestFixtures.SITE_CHAN_DAO_1)),
      arguments(NullPointerException.class, CSSDaoTestFixtures.SITE_DAO_1, null),
      arguments(IllegalStateException.class, CSSDaoTestFixtures.SITE_DAO_1, List.of())
    );
  }
}