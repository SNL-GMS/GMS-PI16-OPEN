package gms.core.dataacquisition.reactor;

import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLIPPED_2_4;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLIPPED_4_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_0_2;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_0_4;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_0_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_2_4;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_2_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_4_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_4_6_F;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_5_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_DURATION_OUTAGE_0_4;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_DURATION_OUTAGE_4_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.BADGER_CLOCKLOCK_4_6;
import static java.util.Collections.singleton;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.frameworks.osd.api.rawstationdataframe.AceiUpdates;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue.AcquiredChannelEnvironmentIssueType;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueAnalog;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AceiUpdatesMergerTests {

  @Test
  void testMergeAnalogsNoMerging() {
    AcquiredChannelEnvironmentIssueAnalog insert1 = AcquiredChannelEnvironmentIssueAnalog
        .from("test", AcquiredChannelEnvironmentIssueType.DURATION_OUTAGE,
            Instant.EPOCH.plusSeconds(1), Instant.EPOCH.plusSeconds(2), 1.0);
    AcquiredChannelEnvironmentIssueAnalog insert2 = AcquiredChannelEnvironmentIssueAnalog
        .from("test", AcquiredChannelEnvironmentIssueType.DURATION_OUTAGE,
            Instant.EPOCH.plusSeconds(3), Instant.EPOCH.plusSeconds(4), 1.0);
    AcquiredChannelEnvironmentIssueAnalog delete1 = AcquiredChannelEnvironmentIssueAnalog
        .from("test", AcquiredChannelEnvironmentIssueType.DURATION_OUTAGE, Instant.EPOCH,
            Instant.EPOCH.plusSeconds(1), 1.0);
    AcquiredChannelEnvironmentIssueAnalog delete2 = AcquiredChannelEnvironmentIssueAnalog
        .from("test", AcquiredChannelEnvironmentIssueType.DURATION_OUTAGE,
            Instant.EPOCH.plusSeconds(2),
            Instant.EPOCH.plusSeconds(3), 1.0);

    AceiUpdates updateSets1 = AceiUpdates.builder()
        .setAnalogInserts(List.of(insert1))
        .setAnalogDeletes(List.of(delete1))
        .build();

    AceiUpdates updateSets2 = AceiUpdates.builder()
        .setAnalogInserts(List.of(insert2))
        .setAnalogDeletes(List.of(delete2))
        .build();

    AceiUpdatesMerger merger = AceiUpdatesMerger.create((a1, a2) -> true);
    AceiUpdates result = merger.merge(updateSets1, updateSets2);

    assertEquals(Set.of(insert1, insert2), result.getAnalogInserts());
    assertEquals(Set.of(delete1, delete2), result.getAnalogDeletes());
  }

  @ParameterizedTest
  @MethodSource("testMergeArguments")
  void testMerge(Duration mergeTolerance, AceiUpdates updates1, AceiUpdates updates2,
      AceiUpdates expectedUpdates) {
    AceiUpdatesMerger merger = AceiUpdatesMerger.create(channel -> mergeTolerance);
    assertEquals(expectedUpdates, merger.merge(updates1, updates2));
    assertEquals(expectedUpdates, merger.merge(updates2, updates1));
    assertEquals(expectedUpdates, merger.mergeAll(Set.of(updates2, updates1)));
  }

  private static Stream<Arguments> testMergeArguments() {
    Duration oneSecond = Duration.ofSeconds(1);

    return Stream.of(
        arguments(oneSecond,
            justDeletes(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_2_4),
            justDeletes(AARDVARK_CLOCKLOCK_4_6),
            justDeletes(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_4_6)),
        arguments(oneSecond,
            justInserts(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_2_4),
            justInserts(AARDVARK_CLOCKLOCK_4_6),
            justInserts(AARDVARK_CLOCKLOCK_0_6)),
        arguments(oneSecond,
            justInserts(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_2_4),
            justInserts(AARDVARK_CLOCKLOCK_5_6),
            justInserts(AARDVARK_CLOCKLOCK_0_4, AARDVARK_CLOCKLOCK_5_6)),
        arguments(oneSecond.plusMillis(25),
            justInserts(AARDVARK_CLOCKLOCK_2_4),
            justInserts(AARDVARK_CLOCKLOCK_5_6),
            justInserts(AARDVARK_CLOCKLOCK_2_6)),
        arguments(oneSecond,
            justInserts(AARDVARK_CLOCKLOCK_2_4, BADGER_CLOCKLOCK_4_6),
            justInserts(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLIPPED_4_6),
            justInserts(AARDVARK_CLOCKLOCK_0_4, BADGER_CLOCKLOCK_4_6, AARDVARK_CLIPPED_4_6))
    );
  }

  private static AceiUpdates justInserts(AcquiredChannelEnvironmentIssueBoolean... booleanInserts) {
    return AceiUpdates.builder()
        .setBooleanInserts(Set.of(booleanInserts))
        .build();
  }

  private static AceiUpdates justDeletes(AcquiredChannelEnvironmentIssueBoolean... booleanInserts) {
    return AceiUpdates.builder()
        .setBooleanDeletes(Set.of(booleanInserts))
        .build();
  }

  @Test
  void testMergeWithin() {
    AceiUpdates updatesToMerge = AceiUpdates.builder()
        .setBooleanInserts(Set.of(AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_4_6))
        .setBooleanDeletes(Set.of(AARDVARK_CLOCKLOCK_0_2))
        .build();

    AceiUpdatesMerger merger = AceiUpdatesMerger.create(channel -> Duration.ofSeconds(1));
    AceiUpdates result = merger.mergeWithin(updatesToMerge);

    assertEquals(singleton(AARDVARK_CLOCKLOCK_2_6), result.getBooleanInserts());
  }

  @ParameterizedTest
  @MethodSource("testFilterUpdateCollisionsArguments")
  void testFilterUpdateCollisions(AceiUpdates inputUpdates, AceiUpdates expectedUpdates) {
    AceiUpdatesMerger merger = AceiUpdatesMerger.create(channel -> Duration.ofSeconds(1));
    assertEquals(expectedUpdates, merger.filterUpdateCollisions(inputUpdates));
  }

  private static Stream<Arguments> testFilterUpdateCollisionsArguments() {
    return Stream.of(
        Arguments.arguments(
            AceiUpdates.builder()
                .setAnalogInserts(List.of(AARDVARK_DURATION_OUTAGE_0_4))
                .setAnalogDeletes(List.of(AARDVARK_DURATION_OUTAGE_0_4))
                .build(),
            AceiUpdates.emptyUpdates()
        ),
        Arguments.arguments(
            AceiUpdates.builder()
                .setBooleanInserts(List.of(AARDVARK_CLOCKLOCK_0_2))
                .setBooleanDeletes(List.of(AARDVARK_CLOCKLOCK_0_2))
                .build(),
            AceiUpdates.emptyUpdates()
        ),
        Arguments.arguments(
            AceiUpdates.builder()
                .setAnalogInserts(
                    List.of(AARDVARK_DURATION_OUTAGE_0_4, AARDVARK_DURATION_OUTAGE_4_6))
                .setAnalogDeletes(List.of(AARDVARK_DURATION_OUTAGE_4_6))
                .setBooleanInserts(List.of(AARDVARK_CLOCKLOCK_0_2))
                .setBooleanDeletes(List.of(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_4_6))
                .build(),
            AceiUpdates.builder()
                .setAnalogInserts(List.of(AARDVARK_DURATION_OUTAGE_0_4))
                .setBooleanDeletes(List.of(AARDVARK_CLOCKLOCK_4_6))
                .build()
        ),
        Arguments.arguments(
            AceiUpdates.builder()
                .setBooleanInserts(List.of(AARDVARK_CLOCKLOCK_2_4))
                .setBooleanDeletes(List.of(AARDVARK_CLIPPED_2_4))
                .build(),
            AceiUpdates.builder()
                .setBooleanInserts(List.of(AARDVARK_CLOCKLOCK_2_4))
                .setBooleanDeletes(List.of(AARDVARK_CLIPPED_2_4))
                .build()
        ),
        Arguments.arguments(
            AceiUpdates.builder()
                .setBooleanInserts(List.of(AARDVARK_CLOCKLOCK_4_6))
                .setBooleanDeletes(List.of(AARDVARK_CLOCKLOCK_4_6_F))
                .build(),
            AceiUpdates.builder()
                .setBooleanInserts(List.of(AARDVARK_CLOCKLOCK_4_6))
                .setBooleanDeletes(List.of(AARDVARK_CLOCKLOCK_4_6_F))
                .build()
        ),
        Arguments.arguments(
            AceiUpdates.builder()
                .setBooleanInserts(List.of(BADGER_CLOCKLOCK_4_6))
                .setBooleanDeletes(List.of(AARDVARK_CLOCKLOCK_4_6))
                .build(),
            AceiUpdates.builder()
                .setBooleanInserts(List.of(BADGER_CLOCKLOCK_4_6))
                .setBooleanDeletes(List.of(AARDVARK_CLOCKLOCK_4_6))
                .build()
        )
    );
  }
}