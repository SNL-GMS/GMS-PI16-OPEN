package gms.core.dataacquisition.reactor;

import static com.google.common.base.Preconditions.checkNotNull;
import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.toSet;

import com.google.common.collect.Sets;
import gms.core.dataacquisition.reactor.util.AceiMergeChecker;
import gms.core.dataacquisition.reactor.util.MergeChecker;
import gms.core.dataacquisition.reactor.util.ToleranceResolver;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.osd.api.rawstationdataframe.AceiUpdates;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueAnalog;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Helper class for managing the merging of {@link AceiUpdates}
 */
public class AceiUpdatesMerger {

  private final MergeChecker<AcquiredChannelEnvironmentIssueBoolean> aceiMergeChecker;

  AceiUpdatesMerger(MergeChecker<AcquiredChannelEnvironmentIssueBoolean> aceiMergeChecker) {
    this.aceiMergeChecker = aceiMergeChecker;
  }

  public static AceiUpdatesMerger create(
      MergeChecker<AcquiredChannelEnvironmentIssueBoolean> aceiMergeChecker) {
    return new AceiUpdatesMerger(checkNotNull(aceiMergeChecker));
  }

  public static AceiUpdatesMerger create(ConfigurationConsumerUtility config) {
    return new AceiUpdatesMerger(AceiMergeChecker.create(checkNotNull(config)));
  }

  public static AceiUpdatesMerger create(ToleranceResolver toleranceResolver) {
    return new AceiUpdatesMerger(AceiMergeChecker.create(checkNotNull(toleranceResolver)));
  }

  /**
   * Reduces a collection of AceiUpdates down to a single AceiUpdates class, merging all inserts and
   * deletes as part of the process.
   *
   * @param updates Collection of AceiUpdates to be merged
   * @return The resulting merged AceiUpdates
   */
  public AceiUpdates mergeAll(Collection<AceiUpdates> updates) {
    return updates.stream()
        .map(this::mergeWithin)
        .reduce(this::merge)
        .orElseGet(AceiUpdates::emptyUpdates);
  }

  /**
   * Manages collisions between insertions and deletes, such that if the same ACEI is in both the
   * insertion and delete sections, it is declared a No-Op and removed from both sections.
   *
   * @param updates Updates to filter out collisions for.
   * @return Collision-free AceiUpdates
   */
  public AceiUpdates filterUpdateCollisions(AceiUpdates updates) {
    return updates.toBuilder()
        .setAnalogDeletes(Sets.difference(updates.getAnalogDeletes(), updates.getAnalogInserts()))
        .setAnalogInserts(Sets.difference(updates.getAnalogInserts(), updates.getAnalogDeletes()))
        .setBooleanDeletes(
            Sets.difference(updates.getBooleanDeletes(), updates.getBooleanInserts()))
        .setBooleanInserts(
            Sets.difference(updates.getBooleanInserts(), updates.getBooleanDeletes()))
        .build();
  }

  /**
   * Merges {@link AcquiredChannelEnvironmentIssue}s internal to this AceiUpdates where possible.
   *
   * @param updates AceiUpdates to attempt an internal merge
   * @return The resulting AceiUpdates that has merged all aceis where possible.
   */
  public AceiUpdates mergeWithin(AceiUpdates updates) {
    return updates.toBuilder()
        .setBooleanInserts(mergeAllBooleanAceis(updates.getBooleanInserts()))
        .build();
  }

  /**
   * US1, US2 try to merge into USM
   * <ul>
   * <li>go through analog inserts/deletes, operation is simply US1.analog U US2.analog</li>
   * <li>booleans, go through insert sets (likely converting them into maps by chanId and type, for each grouping</li>
   * <li>sort each set by start time</li>
   * <li>for each ACEI in US1's update set
   * <ul>
   *   <li>check for merge tolerance between itself and every ACEI "near" in time (either closely before startTime, or shortly after endTime)</li>
   * </ul></li>
   * <li>after looping through and candidate for merge found, add to merged inserts list</li>
   * <li>after looping through US1's set, add both US1 and US2's update sets to USM</li>
   * <li>Finally, go through boolean inserts in USM and merge ACEIs within tolerance</li>
   * </ul>
   *
   * @param set1 First Updates to merge
   * @param set2 Second Updates to merge
   * @return The result of merging set1 and set2
   */
  public AceiUpdates merge(AceiUpdates set1, AceiUpdates set2) {
    Set<AcquiredChannelEnvironmentIssueAnalog> mergedAnalogDeletes = Sets
        .union(set1.getAnalogDeletes(), set2.getAnalogDeletes()).immutableCopy();
    Set<AcquiredChannelEnvironmentIssueAnalog> mergedAnalogInserts = Sets
        .union(set1.getAnalogInserts(), set2.getAnalogInserts()).immutableCopy();

    Set<AcquiredChannelEnvironmentIssueBoolean> mergedBooleanDeletes = new HashSet<>(
        set1.getBooleanDeletes());
    mergedBooleanDeletes.addAll(set2.getBooleanDeletes());

    Set<AcquiredChannelEnvironmentIssueBoolean> mergedBooleanInserts = mergeBooleanAceis(
        set1.getBooleanInserts(), set2.getBooleanInserts());

    return AceiUpdates.builder()
        .setAnalogInserts(mergedAnalogInserts)
        .setAnalogDeletes(mergedAnalogDeletes)
        .setBooleanDeletes(mergedBooleanDeletes)
        .setBooleanInserts(mergedBooleanInserts).build();
  }

  /**
   * Merges two sets of {@link AcquiredChannelEnvironmentIssueBoolean}s together. Merging logic
   * here allows us to replace connected Acei booleans with a single Acei boolean encompassing the entire span of time
   * @param set1 First Set of Acei booleans to merge
   * @param set2 Second Set of Acei booleans to merge
   * @return Resulting set where all Acei booleans are merged where possible
   */
  public Set<AcquiredChannelEnvironmentIssueBoolean> mergeBooleanAceis(
      Set<AcquiredChannelEnvironmentIssueBoolean> set1,
      Set<AcquiredChannelEnvironmentIssueBoolean> set2) {
    return mergeAllBooleanAceis(Sets.union(set1, set2));
  }

  /**
   * Merges all {@link AcquiredChannelEnvironmentIssueBoolean}s together, where possible. Merging logic
   * here allows us to replace connected Acei booleans with a single Acei boolean encompassing the entire span of time
   * @param aceis Set of Acei booleans to merge
   * @return Resulting set where all Acei booleans are merged where possible
   */
  public Set<AcquiredChannelEnvironmentIssueBoolean> mergeAllBooleanAceis(
      Set<AcquiredChannelEnvironmentIssueBoolean> aceis) {

    Map<String, List<AcquiredChannelEnvironmentIssueBoolean>> aceisByChannelAndType = aceis.stream()
        .collect(groupingBy(AceiKeyBuilder::buildKey));

    return aceisByChannelAndType.values().stream()
        .map(this::mergeRelatedAceis)
        .flatMap(List::stream)
        .collect(toSet());
  }

  private List<AcquiredChannelEnvironmentIssueBoolean> mergeRelatedAceis(
      List<AcquiredChannelEnvironmentIssueBoolean> toBeMerged) {
    if (toBeMerged.size() < 2) {
      return toBeMerged;
    }

    List<AcquiredChannelEnvironmentIssueBoolean> merged = new ArrayList<>();
    var mergeIterator = toBeMerged.stream()
        .sorted(Comparator.comparing(AcquiredChannelEnvironmentIssue::getStartTime)).iterator();
    AcquiredChannelEnvironmentIssueBoolean current = mergeIterator.next();
    while (mergeIterator.hasNext()) {
      AcquiredChannelEnvironmentIssueBoolean next = mergeIterator.next();
      if (canMerge(current, next)) {
        current = mergeAceis(current, next);
      } else {
        merged.add(current);
        current = next;
      }
    }
    merged.add(current);

    return merged;
  }

  /**
   * Convenience method for checking if two Acei booleans can merge.
   * @param first First Acei boolean to check
   * @param second Second Acei to compare with the First
   * @return Flag indicating if the two Acei can be safely merged
   */
  public boolean canMerge(AcquiredChannelEnvironmentIssueBoolean first,
      AcquiredChannelEnvironmentIssueBoolean second) {
    return aceiMergeChecker.canMerge(first, second);
  }

  public AcquiredChannelEnvironmentIssueBoolean mergeAceis(
      AcquiredChannelEnvironmentIssueBoolean left,
      AcquiredChannelEnvironmentIssueBoolean right) {
    if (left.equals(right)) {
      return left;
    }

    return AcquiredChannelEnvironmentIssueBoolean
        .from(left.getChannelName(),
            left.getType(),
            left.getStartTime().isBefore(right.getStartTime()) ? left.getStartTime()
                : right.getStartTime(),
            right.getEndTime().isAfter(left.getEndTime()) ? right.getEndTime() : left.getEndTime(),
            left.getStatus());
  }

  public AcquiredChannelEnvironmentIssueBoolean mergeAceis(
          AcquiredChannelEnvironmentIssueBoolean left,
          AcquiredChannelEnvironmentIssueBoolean middle,
          AcquiredChannelEnvironmentIssueBoolean right) {
    return mergeAceis(mergeAceis(left, middle), right);
  }

  MergeChecker<AcquiredChannelEnvironmentIssueBoolean> getAceiMergeChecker() {
    return aceiMergeChecker;
  }
}