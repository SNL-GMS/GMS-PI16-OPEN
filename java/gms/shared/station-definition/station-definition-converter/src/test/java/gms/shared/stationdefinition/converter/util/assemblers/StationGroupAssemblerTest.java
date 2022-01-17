package gms.shared.stationdefinition.converter.util.assemblers;

import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.AFFILIATION_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.AFFILIATION_DAO_2;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.NETWORK_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.NEXT_AFFILIATION_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.ONDATE;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.ONDATE2;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.mock;

import com.google.common.collect.Range;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.converter.DaoStationConverter;
import gms.shared.stationdefinition.converter.DaoStationGroupConverter;
import gms.shared.stationdefinition.converter.interfaces.StationConverter;
import gms.shared.stationdefinition.converter.interfaces.StationGroupConverter;
import gms.shared.stationdefinition.dao.css.AffiliationDao;
import gms.shared.stationdefinition.dao.css.NetworkDao;
import gms.shared.stationdefinition.dao.css.SiteDao;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class StationGroupAssemblerTest {
  
  private static final Object NULL_OBJECT = null;

  private static final StationConverter stationConverter = DaoStationConverter.create();
  private final DaoStationGroupConverter stationGroupConverter = DaoStationGroupConverter.create();
  private StationGroupAssembler stationGroupAssembler;

  @BeforeEach
  void setUp() {
    stationGroupAssembler = StationGroupAssembler.create(stationGroupConverter, stationConverter);
  }

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(StationGroupConverter stationGroupConverter, StationConverter stationConverter) {
    assertThrows(NullPointerException.class,
      () -> StationGroupAssembler.create(stationGroupConverter, stationConverter));
  }

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(arguments(null, mock(StationConverter.class)),
      arguments(mock(StationGroupConverter.class), null));
  }

  @ParameterizedTest
  @MethodSource("getBuildAllForTimeValidationArguments")
  void testBuildAllForTimeValidation(Instant effectiveAt,
    List<NetworkDao> networks,
    List<AffiliationDao> affiliations,
    List<AffiliationDao> nextAffiliations,
    List<SiteDao> sites) {
    assertThrows(NullPointerException.class,
      () -> stationGroupAssembler.buildAllForTime(effectiveAt, networks, affiliations, nextAffiliations, sites));
  }

  static Stream<Arguments> getBuildAllForTimeValidationArguments() {
    return Stream.of(arguments(NULL_OBJECT, List.of(NETWORK_DAO_1), List.of(AFFILIATION_DAO_1),
      List.of(AFFILIATION_DAO_2), List.of(SITE_DAO_1)),
      arguments(ONDATE, NULL_OBJECT, List.of(AFFILIATION_DAO_1), List.of(AFFILIATION_DAO_2), List.of(SITE_DAO_1)),
      arguments(ONDATE, List.of(NETWORK_DAO_1), NULL_OBJECT, List.of(AFFILIATION_DAO_2), List.of(SITE_DAO_1)),
      arguments(ONDATE, List.of(NETWORK_DAO_1), List.of(AFFILIATION_DAO_1), List.of(AFFILIATION_DAO_2), NULL_OBJECT));
  }

  @ParameterizedTest
  @MethodSource("getBuildAllForTimeArguments")
  void testBuildAllForTime(List<StationGroup> expected,
    Instant effectiveAt,
    List<NetworkDao> networks,
    List<AffiliationDao> affiliations,
    List<AffiliationDao> nextAffiliations,
    List<SiteDao> sites) {
    List<StationGroup> actual = assertDoesNotThrow(() -> stationGroupAssembler.buildAllForTime(effectiveAt,
      networks,
      affiliations,
      nextAffiliations,
      sites));

    assertNotNull(actual);
    assertEquals(expected.size(), actual.size());
    if (!actual.isEmpty()) {
      assertTrue(expected.containsAll(actual));
    }
  }

  static Stream<Arguments> getBuildAllForTimeArguments() {
    StationGroup expected = StationGroup.builder()
      .setName(NETWORK_DAO_1.getNet())
      .setEffectiveAt(AFFILIATION_DAO_1.getNetworkStationTimeKey().getTime())
      .setEffectiveUntil(Optional.of(NEXT_AFFILIATION_DAO_1.getNetworkStationTimeKey().getTime()))
      .setData(StationGroup.Data.builder()
        .setDescription(NETWORK_DAO_1.getDescription())
        .setStations(List.of(stationConverter.convertToVersionReference(SITE_DAO_1)))
        .build())
      .build();
    StationGroup expectedNoEffectiveUntil = StationGroup.builder()
      .setName(NETWORK_DAO_1.getNet())
      .setEffectiveAt(AFFILIATION_DAO_1.getNetworkStationTimeKey().getTime())
      .setData(StationGroup.Data.builder()
        .setDescription(NETWORK_DAO_1.getDescription())
        .setStations(List.of(stationConverter.convertToVersionReference(SITE_DAO_1)))
        .build())
      .build();
    return Stream.of(
      arguments(List.of(expected),
        ONDATE2,
        List.of(NETWORK_DAO_1),
        List.of(AFFILIATION_DAO_1),
        List.of(NEXT_AFFILIATION_DAO_1),
        List.of(SITE_DAO_1)),
      arguments(List.of(expected),
        ONDATE2.plus(1, ChronoUnit.DAYS),
        List.of(NETWORK_DAO_1),
        List.of(AFFILIATION_DAO_1),
        List.of(NEXT_AFFILIATION_DAO_1),
        List.of(SITE_DAO_1)),
      arguments(List.of(),
        ONDATE,
        List.of(NETWORK_DAO_1),
        List.of(AFFILIATION_DAO_1),
        List.of(NEXT_AFFILIATION_DAO_1),
        List.of(SITE_DAO_1)),
      arguments(List.of(),
        ONDATE2,
        List.of(),
        List.of(AFFILIATION_DAO_1),
        List.of(NEXT_AFFILIATION_DAO_1),
        List.of(SITE_DAO_1)),
      arguments(List.of(),
        ONDATE2,
        List.of(NETWORK_DAO_1),
        List.of(),
        List.of(NEXT_AFFILIATION_DAO_1),
        List.of(SITE_DAO_1)),
      arguments(List.of(expectedNoEffectiveUntil),
        ONDATE2,
        List.of(NETWORK_DAO_1),
        List.of(AFFILIATION_DAO_1),
        List.of(),
        List.of(SITE_DAO_1)),
      arguments(List.of(),
        ONDATE2,
        List.of(NETWORK_DAO_1),
        List.of(AFFILIATION_DAO_1),
        List.of(NEXT_AFFILIATION_DAO_1),
        List.of())
    );
  }

  @ParameterizedTest
  @MethodSource("getBuildAllForTimeRangeArguments")
  void testBuildAllForTimeRange(List<StationGroup> expected,
    Range<Instant> range,
    List<NetworkDao> networks,
    List<AffiliationDao> affiliations,
    List<AffiliationDao> nextAffiliations,
    List<SiteDao> sites) {
    List<StationGroup> actual = assertDoesNotThrow(() -> stationGroupAssembler.buildAllForTimeRange(range,
      networks,
      affiliations,
      nextAffiliations,
      sites));

    assertNotNull(actual);
    assertEquals(expected.size(), actual.size());
    if (!actual.isEmpty()) {
      assertTrue(expected.containsAll(actual));
    }
  }

  static Stream<Arguments> getBuildAllForTimeRangeArguments() {
    StationGroup expected = StationGroup.builder()
      .setName(NETWORK_DAO_1.getNet())
      .setEffectiveAt(AFFILIATION_DAO_1.getNetworkStationTimeKey().getTime())
      .setEffectiveUntil(Optional.of(NEXT_AFFILIATION_DAO_1.getNetworkStationTimeKey().getTime()))
      .setData(StationGroup.Data.builder()
        .setDescription(NETWORK_DAO_1.getDescription())
        .setStations(List.of(stationConverter.convertToEntityReference(SITE_DAO_1)))
        .build())
      .build();
    StationGroup expectedNoEffectiveUntil = StationGroup.builder()
      .setName(NETWORK_DAO_1.getNet())
      .setEffectiveAt(AFFILIATION_DAO_1.getNetworkStationTimeKey().getTime())
      .setData(StationGroup.Data.builder()
        .setDescription(NETWORK_DAO_1.getDescription())
        .setStations(List.of(stationConverter.convertToEntityReference(SITE_DAO_1)))
        .build())
      .build();
    return Stream.of(
//      arguments(List.of(expected),
//        Range.closed(ONDATE2, ONDATE3),
//        List.of(NETWORK_DAO_1),
//        List.of(AFFILIATION_DAO_1),
//        List.of(NEXT_AFFILIATION_DAO_1),
//        List.of(SITE_DAO_1)),
//      arguments(List.of(expected),
//        Range.closed(ONDATE, ONDATE2),
//        List.of(NETWORK_DAO_1),
//        List.of(AFFILIATION_DAO_1),
//        List.of(NEXT_AFFILIATION_DAO_1),
//        List.of(SITE_DAO_1)),
//      arguments(List.of(expected),
//        Range.closed(OFFDATE, OFFDATE2),
//        List.of(NETWORK_DAO_1),
//        List.of(AFFILIATION_DAO_1),
//        List.of(NEXT_AFFILIATION_DAO_1),
//        List.of(SITE_DAO_1)),
//      arguments(List.of(),
//        Range.closed(ONDATE, ONDATE2),
//        List.of(),
//        List.of(AFFILIATION_DAO_1),
//        List.of(NEXT_AFFILIATION_DAO_1),
//        List.of(SITE_DAO_1)),
//      arguments(List.of(),
//        Range.closed(ONDATE, ONDATE2),
//        List.of(NETWORK_DAO_1),
//        List.of(),
//        List.of(NEXT_AFFILIATION_DAO_1),
//        List.of(SITE_DAO_1)),
      arguments(List.of(expectedNoEffectiveUntil),
        Range.closed(ONDATE, ONDATE2),
        List.of(NETWORK_DAO_1),
        List.of(AFFILIATION_DAO_1),
        List.of(),
        List.of(SITE_DAO_1))
//      arguments(List.of(),
//        Range.closed(ONDATE, ONDATE2),
//        List.of(NETWORK_DAO_1),
//        List.of(AFFILIATION_DAO_1),
//        List.of(NEXT_AFFILIATION_DAO_1),
//        List.of())
    );
  }
}
