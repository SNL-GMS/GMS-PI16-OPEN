package gms.core.dataacquisition;

import gms.core.dataacquisition.reactor.AceiKeyBuilder;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue.AcquiredChannelEnvironmentIssueType;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueAnalog;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;
import java.time.Instant;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

public class TestFixture {

  public static final Instant EPOCH = Instant.EPOCH;


  public static class AcquiredChannelEnvironmentalIssuesSets {

    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLOCKLOCK_0_2 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED,
            EPOCH,
            EPOCH.plusSeconds(2).minusMillis(25),
            true
        );
    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLOCKLOCK_0_4 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED,
            EPOCH,
            EPOCH.plusSeconds(4).minusMillis(25),
            true
        );
    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLOCKLOCK_0_6 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED,
            EPOCH,
            EPOCH.plusSeconds(6).minusMillis(25),
            true
        );
    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLOCKLOCK_1_2 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED,
            EPOCH.plusSeconds(1),
            EPOCH.plusSeconds(2).minusMillis(25),
            true
        );
    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLOCKLOCK_2_4 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED,
            EPOCH.plusSeconds(2),
            EPOCH.plusSeconds(4).minusMillis(25),
            true
        );
    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLOCKLOCK_3_4 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED,
            EPOCH.plusSeconds(3),
            EPOCH.plusSeconds(4).minusMillis(25),
            true
        );
    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLOCKLOCK_2_6 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED,
            EPOCH.plusSeconds(2),
            EPOCH.plusSeconds(6).minusMillis(25),
            true
        );
    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLOCKLOCK_4_6 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED,
            EPOCH.plusSeconds(4),
            EPOCH.plusSeconds(6).minusMillis(25),
            true
        );
    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLOCKLOCK_4_6_F = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED,
            EPOCH.plusSeconds(4),
            EPOCH.plusSeconds(6).minusMillis(25),
            false
        );

    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLOCKLOCK_5_6 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED,
            EPOCH.plusSeconds(5),
            EPOCH.plusSeconds(6).minusMillis(25),
            true
        );

    public static final AcquiredChannelEnvironmentIssueBoolean BADGER_CLOCKLOCK_2_4 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "badger",
            AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED,
            EPOCH.plusSeconds(2),
            EPOCH.plusSeconds(4).minusMillis(25),
            true
        );

    public static final AcquiredChannelEnvironmentIssueBoolean BADGER_CLOCKLOCK_2_6 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "badger",
            AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED,
            EPOCH.plusSeconds(2),
            EPOCH.plusSeconds(6).minusMillis(25),
            true
        );

    public static final AcquiredChannelEnvironmentIssueBoolean BADGER_CLOCKLOCK_4_6 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "badger",
            AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED,
            EPOCH.plusSeconds(4),
            EPOCH.plusSeconds(6).minusMillis(25),
            true
        );

    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLIPPED_0_2 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLIPPED,
            EPOCH,
            EPOCH.plusSeconds(2).minusMillis(25),
            true
        );

    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLIPPED_0_4 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLIPPED,
            EPOCH,
            EPOCH.plusSeconds(4).minusMillis(25),
            true
        );

    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLIPPED_0_6 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLIPPED,
            EPOCH,
            EPOCH.plusSeconds(6).minusMillis(25),
            true
        );

    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLIPPED_2_4 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLIPPED,
            EPOCH.plusSeconds(2),
            EPOCH.plusSeconds(4).minusMillis(25),
            true
        );

    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLIPPED_2_6 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLIPPED,
            EPOCH.plusSeconds(2),
            EPOCH.plusSeconds(6).minusMillis(25),
            true
        );

    public static final AcquiredChannelEnvironmentIssueBoolean AARDVARK_CLIPPED_4_6 = AcquiredChannelEnvironmentIssueBoolean
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.CLIPPED,
            EPOCH.plusSeconds(4),
            EPOCH.plusSeconds(6).minusMillis(25),
            true
        );

    public static final AcquiredChannelEnvironmentIssueAnalog AARDVARK_DURATION_OUTAGE_0_4 = AcquiredChannelEnvironmentIssueAnalog
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.DURATION_OUTAGE,
            EPOCH,
            EPOCH.plusSeconds(4).minusMillis(25),
            0
        );

    public static final AcquiredChannelEnvironmentIssueAnalog AARDVARK_DURATION_OUTAGE_4_6 = AcquiredChannelEnvironmentIssueAnalog
        .from(
            "aardvark",
            AcquiredChannelEnvironmentIssueType.DURATION_OUTAGE,
            EPOCH.plusSeconds(4),
            EPOCH.plusSeconds(6).minusMillis(25),
            1
        );
  }

  public static class AceiMaps {

    /**
     * Given a set of {@link AcquiredChannelEnvironmentIssueBoolean}s, builds a map to be used to
     * emulate caches by a top-level string and a navigable map within by start time.
     *
     * NOTE: Due to the need to avoid collisions for the internal navigable map, any Aceis that
     * share a key and start time will only have one of these represented in the final map, from
     * {@link java.util.SortedSet} constraints.
     *
     * @param topKeyFunction Function used to extract the top-level key for the map (e.g. Acei Key,
     * Channel name)
     * @param aceiBooleans Aceis to be mapped
     * @return A map by ACEI key (from {@link AceiKeyBuilder}) with a navigable map by start time in
     * each entry
     */
    public static Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> buildAceiMap(
        Function<AcquiredChannelEnvironmentIssueBoolean, String> topKeyFunction,
        AcquiredChannelEnvironmentIssueBoolean... aceiBooleans) {

      var aceiSet = Set.of(aceiBooleans);

      return aceiSet.stream()
          .collect(Collectors.groupingBy(topKeyFunction,
              Collectors.toMap(
                  AcquiredChannelEnvironmentIssue::getEndTime,
                  Function.identity(),
                  (acei1, acei2) -> acei1.getEndTime().isAfter(acei2.getEndTime()) ? acei1 : acei2,
                  TreeMap::new)));
    }

    /**
     * Given a set of {@link AcquiredChannelEnvironmentIssueBoolean}s, builds a cache map keyed by
     * the string generated via {@link AceiKeyBuilder#buildKey(AcquiredChannelEnvironmentIssueBoolean)}
     *
     * Utilizes {@link #buildAceiMap(Function, AcquiredChannelEnvironmentIssueBoolean...)} to
     * construct the map
     *
     * @param aceiBooleans Aceis to be mapped
     */
    public static Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> buildRepositoryCache(
        AcquiredChannelEnvironmentIssueBoolean... aceiBooleans) {
      return buildAceiMap(AceiKeyBuilder::buildKey, aceiBooleans);
    }

    /**
     * Given a set of {@link AcquiredChannelEnvironmentIssueBoolean}s, builds a repository result
     * map keyed by {@link AcquiredChannelEnvironmentIssue#getChannelName()}
     *
     * Utilizes {@link #buildAceiMap(Function, AcquiredChannelEnvironmentIssueBoolean...)} to
     * construct the map
     *
     * @param aceiBooleans Aceis to be mapped
     */
    public static Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> buildRepositoryResults(
        AcquiredChannelEnvironmentIssueBoolean... aceiBooleans) {
      return buildAceiMap(AcquiredChannelEnvironmentIssue::getChannelName,
          aceiBooleans);
    }

  }
}
