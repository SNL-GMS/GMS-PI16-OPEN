package gms.shared.workflow.cache;

import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.workflow.cache.util.WorkflowCacheFactory;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.StageInterval;
import org.apache.ignite.IgniteCache;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.concurrent.locks.Lock;
import java.util.function.Predicate;

import static com.google.common.base.Preconditions.checkArgument;
import static java.lang.String.format;
import static java.util.function.Function.identity;
import static java.util.stream.Collectors.toMap;

/**
 * Cache that delegates to an Apache Ignite {@link IgniteCache} for CRUD operations on {@link StageInterval}s. Ignite is configured
 * to contain key-value pairs of Stage names to {@link NavigableMap}s of StageIntervals by start time. The combination
 * of stage name and start time define uniqueness for StageInterval, allowing this caching structure to contain all
 * relevant intervals without concerns of conflicting keys.
 */
public class IntervalCache {

  private final IgniteCache<String, NavigableMap<Instant, StageInterval>> stageIntervalsByNameAndStartTime;

  private IntervalCache(IgniteCache<String, NavigableMap<Instant, StageInterval>> stageIntervalsByNameAndStartTime) {
    this.stageIntervalsByNameAndStartTime = stageIntervalsByNameAndStartTime;
  }

  /**
   * Factory method for instantiating the cache.
   *
   * @return The cache
   */
  public static IntervalCache create() {
    IgniteCache<String, NavigableMap<Instant, StageInterval>> stageIntervalsByNameAndTime = IgniteConnectionManager
      .getOrCreateCache(WorkflowCacheFactory.INTERVAL_CACHE);
    return new IntervalCache(stageIntervalsByNameAndTime);
  }

  //For Test Purposes Only
  static IntervalCache create(IgniteCache<String, NavigableMap<Instant, StageInterval>> stageIntervalsByNameAndTime) {
    return new IntervalCache(stageIntervalsByNameAndTime);
  }

  /**
   * Single-value retrieval via the two necessary keys to identify a {@link StageInterval}: the stage name and the start time
   *
   * @param stageName First retrieval key
   * @param startTime Second retrieval key
   * @return An Optional containing the StageInterval if it exists, or {@link Optional#empty()} if no data was found for
   * the key-pair
   */
  public Optional<StageInterval> get(String stageName, Instant startTime) {
    return getIntervalsForStage(stageName).map(stageIntervals -> stageIntervals.get(startTime));
  }

  /**
   * Retrieves a Optional StageInterval from the cache
   * @param intervalId intervalId
   * @return The stage interval for the interval id, or {@link Optional#empty()} if no interval was found
   */
  public Optional<StageInterval> get(IntervalId intervalId) {
    return get(intervalId.getDefinitionId().getName(), intervalId.getStartTime());
  }

  /**
   * Range retrieval via the stage name and a range of times.
   *
   * @param stageName First retrieval key
   * @param startTime Start of the span of second retrieval keys, inclusive
   * @param endTime   End of the span of second retrieval keys, exclusive
   * @return All {@link StageInterval}s with the provided stage name, whose start times fall within the provided time range
   */
  public List<StageInterval> get(String stageName, Instant startTime, Instant endTime) {
    return getIntervalsForStage(stageName)
      .map(stageIntervals -> rangeList(stageIntervals, startTime, endTime))
      .orElseGet(Collections::emptyList);
  }

  /**
   * Batch retrieval of all stage intervals with stage names in the input collection within the input time range.
   *
   * @param stageNames First retrieval keys
   * @param startTime  Start of the span of second retrieval keys, inclusive
   * @param endTime    End of the span of second retrieval keys, exclusive
   * @return All {@link StageInterval}s with one of the provided stage names, whose start times fall within the provided time range
   */
  public Map<String, List<StageInterval>> getAll(Collection<String> stageNames, Instant startTime, Instant endTime) {
    return stageIntervalsByNameAndStartTime.getAll(Set.copyOf(stageNames)).entrySet().stream()
      .collect(toMap(Map.Entry::getKey, entry -> rangeList(entry.getValue(), startTime, endTime)));
  }

  private static List<StageInterval> rangeList(NavigableMap<Instant, StageInterval> stageIntervals, Instant startTime, Instant endTime) {
    return new ArrayList<>(stageIntervals.subMap(startTime, endTime).values());
  }

  private Optional<NavigableMap<Instant, StageInterval>> getIntervalsForStage(String stageName) {
    return Optional.ofNullable(stageIntervalsByNameAndStartTime.get(stageName));
  }

  /**
   * Create or overwrite a new cache entry for the given stage name with the given stage intervals.
   * Note that the input stage intervals will replace any previously cached values under this stage name key.
   *
   * @param stageName      Caching key
   * @param stageIntervals NavigableMap of stage intervals keyed by start time.
   */
  public void cache(String stageName, Collection<StageInterval> stageIntervals) {
    checkArgument(stageIntervals.stream().map(StageInterval::getName).allMatch(Predicate.isEqual(stageName)),
      "Attempting to cache stage intervals under mismatched key %s", stageName);
    stageIntervalsByNameAndStartTime.put(stageName, intervalsByTime(stageIntervals));
  }

  private static TreeMap<Instant, StageInterval> intervalsByTime(Collection<StageInterval> stageIntervals) {
    return stageIntervals.stream().collect(toMap(
      StageInterval::getStartTime,
      identity(),
      (i1, i2) -> {
        throw new IllegalStateException(format("Stage Intervals with Duplicate ids detected, stage:%s time:%s",
          i1.getName(), i1.getStartTime()));
      },
      TreeMap::new));
  }

  /**
   * Inserts or updates a single StageInterval
   * @param stageInterval StageInterval
   */
  public void put(StageInterval stageInterval){

    var navigableMap = getIntervalsForStage(stageInterval.getName()).orElse(new TreeMap<>());
    navigableMap.put(stageInterval.getStartTime(), stageInterval);
    stageIntervalsByNameAndStartTime.put(stageInterval.getName(), navigableMap);
  }

  /**
   * Clears all values within the cache
   */
  public void clear() {
    stageIntervalsByNameAndStartTime.clear();
  }

  /**
   * Prunes all values strictly older than the input time
   *
   * @param olderThan Expiration time
   */
  public void prune(Instant olderThan) {
    Map<String, NavigableMap<Instant, StageInterval>> prunedCache = new HashMap<>();
    stageIntervalsByNameAndStartTime.forEach(entry -> prunedCache.put(
      entry.getKey(),
      new TreeMap<>(entry.getValue().tailMap(olderThan, true))));
    stageIntervalsByNameAndStartTime.putAll(prunedCache);
  }

  public Lock acquireLock(String key){
    return stageIntervalsByNameAndStartTime.lock(key);
  }

}
