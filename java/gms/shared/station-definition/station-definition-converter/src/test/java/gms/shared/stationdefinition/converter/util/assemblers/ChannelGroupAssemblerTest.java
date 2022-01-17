package gms.shared.stationdefinition.converter.util.assemblers;

import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_CHAN_DAO_REF_11;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_REF_11;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.ONDATE;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.mock;

import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.converter.DaoCalibrationConverter;
import gms.shared.stationdefinition.converter.DaoChannelConverter;
import gms.shared.stationdefinition.converter.DaoChannelGroupConverter;
import gms.shared.stationdefinition.converter.DaoResponseConverter;
import gms.shared.stationdefinition.converter.FileFrequencyAmplitudePhaseConverter;
import gms.shared.stationdefinition.converter.interfaces.ChannelConverter;
import gms.shared.stationdefinition.converter.interfaces.ChannelGroupConverter;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;

import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class ChannelGroupAssemblerTest {
  private static final DaoCalibrationConverter calibrationConverter = DaoCalibrationConverter
    .create();
  private static final FileFrequencyAmplitudePhaseConverter fapConverter = FileFrequencyAmplitudePhaseConverter
    .create();
  private static final DaoChannelConverter channelConverter = DaoChannelConverter
    .create(calibrationConverter, fapConverter);
  private static final DaoChannelGroupConverter channelGroupConverter = DaoChannelGroupConverter
    .create(channelConverter);
  private ChannelGroupAssembler channelGroupAssembler;

  @BeforeEach
  void setUp() {
    channelGroupAssembler = ChannelGroupAssembler.create(channelGroupConverter, channelConverter);
  }

  private final Instant now = Instant.now();

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(ChannelGroupConverter channelGroupConverter, ChannelConverter channelConverter) {
    assertThrows(NullPointerException.class,
      () -> ChannelGroupAssembler.create(channelGroupConverter, channelConverter));
  }

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(arguments(null, mock(ChannelConverter.class)),
      arguments(mock(ChannelGroupConverter.class), null));
  }

  @ParameterizedTest
  @MethodSource("getBuildAllValidationArguments")
  void testBuildAllValidation(List<SiteDao> sites, List<SiteChanDao> siteChans, Instant effectiveAt) {
    assertThrows(NullPointerException.class, () -> channelGroupAssembler.buildAll(sites, siteChans, effectiveAt));
  }

  static Stream<Arguments> getBuildAllValidationArguments() {
    return Stream.of(arguments(null, List.of(), Instant.EPOCH),
      arguments(List.of(), null, Instant.EPOCH),
      arguments(List.of(), List.of(), null));
  }

  @ParameterizedTest
  @MethodSource("getBuildAllArguments")
  void testBuildAll(List<ChannelGroup> expected,
    List<SiteDao> sites,
    List<SiteChanDao> siteChans) {

    List<ChannelGroup> actual = channelGroupAssembler.buildAll(sites, siteChans, now);

    assertEquals(expected.size(), actual.size());
    assertTrue(expected.containsAll(actual));
  }

  static Stream<Arguments> getBuildAllArguments() {
    return Stream.of(arguments(List.of(), List.of(), List.of(SITE_CHAN_DAO_REF_11)),
      arguments(List.of(), List.of(SITE_DAO_1), List.of()),
      arguments(List.of(channelGroupConverter.convert(SITE_DAO_REF_11, List.of(SITE_CHAN_DAO_REF_11))),
        List.of(SITE_DAO_REF_11),
        List.of(SITE_CHAN_DAO_REF_11)));
  }

  @ParameterizedTest
  @MethodSource("getBuildAllForTimeRangeValidationArguments")
  void testBuildAllForTimeRangeValidation(List<SiteDao> sites, List<SiteChanDao> siteChans,
    Instant startTime, Instant endTime) {
    assertThrows(NullPointerException.class,
      () -> channelGroupAssembler.buildAllForTimeRange(sites, siteChans, startTime, endTime));
  }

  static Stream<Arguments> getBuildAllForTimeRangeValidationArguments() {
    return Stream.of(arguments(null, List.of(), Instant.EPOCH, Instant.EPOCH.plusSeconds(10)),
      arguments(List.of(), null, Instant.EPOCH, Instant.EPOCH.plusSeconds(10)),
      arguments(List.of(), List.of(), null, Instant.EPOCH.plusSeconds(10)),
      arguments(List.of(), List.of(), Instant.EPOCH, null));
  }

  @Test
  void testBuildAllForTimeRange() {
    List<ChannelGroup> expected = List.of(channelGroupConverter.convert(SITE_DAO_REF_11,
      List.of(SITE_CHAN_DAO_REF_11),
      channelConverter::convertToEntityReference));
    List<ChannelGroup> actual = channelGroupAssembler.buildAllForTimeRange(List.of(SITE_DAO_REF_11),
      List.of(SITE_CHAN_DAO_REF_11),
      ONDATE, ONDATE.plusSeconds(10));
    assertEquals(expected.size(), actual.size());
    assertTrue(expected.containsAll(actual));
  }

}
