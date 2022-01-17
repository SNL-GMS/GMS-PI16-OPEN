package gms.shared.frameworks.osd.api.rawstationdataframe;

import static java.time.Instant.EPOCH;
import static java.util.Collections.singleton;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue.AcquiredChannelEnvironmentIssueType;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueAnalog;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class AceiUpdatesTests {

  @Test
  void testBuild() {
    AcquiredChannelEnvironmentIssueAnalog aAnalogAdd = buildAceiAnalog(0, 5);
    AcquiredChannelEnvironmentIssueAnalog aAnalogDelete = buildAceiAnalog(5, 10);

    AcquiredChannelEnvironmentIssueBoolean aBooleanAdd = buildAceiBoolean(0, 5);
    AcquiredChannelEnvironmentIssueBoolean aBooleanDelete = buildAceiBoolean(5, 10);

    AceiUpdates actualUpdateSets = AceiUpdates.builder()
        .setBooleanInserts(singleton(aBooleanAdd))
        .setBooleanDeletes(singleton(aBooleanDelete))
        .setAnalogInserts(singleton(aAnalogAdd))
        .setAnalogDeletes(singleton(aAnalogDelete))
        .build();

    assertAll(
        () -> assertEquals(1, actualUpdateSets.getAnalogInserts().size()),
        () -> assertEquals(1, actualUpdateSets.getAnalogDeletes().size()),
        () -> assertEquals(1, actualUpdateSets.getBooleanInserts().size()),
        () -> assertEquals(1, actualUpdateSets.getBooleanDeletes().size()));

    assertTrue(actualUpdateSets.getAnalogInserts().contains(aAnalogAdd));
    assertTrue(actualUpdateSets.getAnalogDeletes().contains(aAnalogDelete));
    assertTrue(actualUpdateSets.getBooleanInserts().contains(aBooleanAdd));
    assertTrue(actualUpdateSets.getBooleanDeletes().contains(aBooleanDelete));
  }

  @Test
  void testEmptyBuild() {
    AceiUpdates actualUpdateSets = AceiUpdates.builder().build();
    assertAll(
        () -> assertTrue(actualUpdateSets.getAnalogInserts().isEmpty()),
        () -> assertTrue(actualUpdateSets.getAnalogDeletes().isEmpty()),
        () -> assertTrue(actualUpdateSets.getBooleanInserts().isEmpty()),
        () -> assertTrue(actualUpdateSets.getBooleanDeletes().isEmpty()));
  }

  @Test
  void testBuildDuplicateRemoval() {

    AcquiredChannelEnvironmentIssueAnalog aAnalogAdd = buildAceiAnalog(0, 5);
    AcquiredChannelEnvironmentIssueAnalog aAnalogDelete = buildAceiAnalog(5, 10);
    AcquiredChannelEnvironmentIssueBoolean aBooleanAdd = buildAceiBoolean(0, 5);
    AcquiredChannelEnvironmentIssueBoolean aBooleanDelete = buildAceiBoolean(5, 10);

    AceiUpdates actualUpdateSets = AceiUpdates.builder()
        .setBooleanInserts(List.of(aBooleanAdd, aBooleanAdd))
        .setBooleanDeletes(List.of(aBooleanDelete, aBooleanDelete))
        .setAnalogInserts(List.of(aAnalogAdd, aAnalogAdd))
        .setAnalogDeletes(List.of(aAnalogDelete, aAnalogDelete))
        .build();

    assertAll(
        () -> assertEquals(singleton(aAnalogAdd), actualUpdateSets.getAnalogInserts()),
        () -> assertEquals(singleton(aAnalogDelete), actualUpdateSets.getAnalogDeletes()),
        () -> assertEquals(singleton(aBooleanAdd), actualUpdateSets.getBooleanInserts()),
        () -> assertEquals(singleton(aBooleanDelete), actualUpdateSets.getBooleanDeletes()));
  }

  @Test
  void testBuildAcceptAddDeleteCollisionsWithoutRemoval() {
    AcquiredChannelEnvironmentIssueBoolean aBooleanIgnore = buildAceiBoolean(0, 5);
    AcquiredChannelEnvironmentIssueBoolean aBooleanAdd = buildAceiBoolean(0, 10);
    AcquiredChannelEnvironmentIssueBoolean aBooleanDelete = buildAceiBoolean(5, 10);

    AcquiredChannelEnvironmentIssueAnalog aAnalogIgnore = buildAceiAnalog(0, 5);
    AcquiredChannelEnvironmentIssueAnalog aAnalogAdd = buildAceiAnalog(0, 10);
    AcquiredChannelEnvironmentIssueAnalog aAnalogDelete = buildAceiAnalog(5, 10);

    var booleanInserts = Set.of(aBooleanIgnore, aBooleanAdd);
    var booleanDeletes = Set.of(aBooleanIgnore, aBooleanDelete);
    var analogInserts = Set.of(aAnalogIgnore, aAnalogAdd);
    var analogDeletes = Set.of(aAnalogIgnore, aAnalogDelete);

    AceiUpdates actualUpdateSets = AceiUpdates.builder()
        .setBooleanInserts(booleanInserts)
        .setBooleanDeletes(booleanDeletes)
        .setAnalogInserts(analogInserts)
        .setAnalogDeletes(analogDeletes)
        .build();

    assertAll(
        () -> assertEquals(analogInserts, actualUpdateSets.getAnalogInserts()),
        () -> assertEquals(analogDeletes, actualUpdateSets.getAnalogDeletes()),
        () -> assertEquals(booleanInserts, actualUpdateSets.getBooleanInserts()),
        () -> assertEquals(booleanDeletes, actualUpdateSets.getBooleanDeletes()));
  }

  private static AcquiredChannelEnvironmentIssueAnalog buildAceiAnalog(long startFromEpoch,
      long endFromEpoch) {
    return AcquiredChannelEnvironmentIssueAnalog
        .from("channel1", AcquiredChannelEnvironmentIssueType.DURATION_OUTAGE,
            EPOCH.plusSeconds(startFromEpoch), EPOCH.plusSeconds(endFromEpoch), 1000);
  }

  private AcquiredChannelEnvironmentIssueBoolean buildAceiBoolean(long startFromEpoch,
      long endFromEpoch) {
    return AcquiredChannelEnvironmentIssueBoolean
        .from("channel1", AcquiredChannelEnvironmentIssueType.CLIPPED,
            EPOCH.plusSeconds(startFromEpoch),
            EPOCH.plusSeconds(endFromEpoch), true);
  }
}