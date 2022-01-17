package gms.shared.stationdefinition.cache;

import com.google.common.collect.Range;
import com.google.common.collect.RangeMap;
import com.google.common.collect.TreeRangeMap;
import gms.shared.frameworks.test.utils.containers.ZooTestContainer;
import org.junit.Ignore;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.NavigableSet;
import java.util.TreeSet;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertFalse;
@Disabled //zookeeper has been removed 8.5.2021
public class VersionCacheTest extends ZooTestContainer {
  private static final Logger logger = LoggerFactory.getLogger(VersionCacheTest.class);

  public static final String TEST_KEY = "Test key";
  public static final String TEST_NULL_KEY = "Test null key";
  public static final Range<Instant> testRange = Range.open(Instant.EPOCH, Instant.EPOCH.plusSeconds(30));
  public static final NavigableSet<Instant> rangeSet = new TreeSet<>();
  public static final RangeMap<Instant, Object> rangeMap = TreeRangeMap.create();

  @BeforeAll
  static void setup() {
    // set the test ranges for cache queries
    rangeSet.addAll(List.of(Instant.EPOCH, Instant.EPOCH.plusSeconds(30)));
    rangeMap.put( Range.closed(Instant.EPOCH, Instant.EPOCH.plusSeconds(30)), CHANNEL);

    try {
      CacheTestInitialization.setup(systemConfig);
    } catch(IllegalStateException e) {
      logger.info("IgniteCache already initialized.");
    }
  }

  @Test
  void testCache() {
    VersionCache versionCache = VersionCache.create();
    initializeVersionCache(versionCache);
    assertTrue(versionCache.versionEffectiveTimesByEntityIdHasKey(TEST_KEY));
    assertTrue(versionCache.versionsByEntityIdAndTimeHasKey(TEST_KEY));
    NavigableSet<Instant> rangeSetCache = versionCache.retrieveVersionEffectiveTimesByEntityId(TEST_KEY);
    Object entityTimeCache = versionCache.retrieveVersionsByEntityIdAndTime(TEST_KEY, Instant.EPOCH.plusSeconds(15));
    Collection<Object> entitiesTimeRangeCache = versionCache.retrieveVersionsByEntityIdAndTimeRange(TEST_KEY, testRange);
    assertEquals(rangeSet, rangeSetCache);
    assertEquals(CHANNEL, entityTimeCache);
    assertEquals(CHANNEL, entitiesTimeRangeCache.iterator().next());
  }
  @Test
  void testClear() {
    VersionCache versionCache = VersionCache.create();
    initializeVersionCache(versionCache);
    versionCache.clear();
    assertFalse(versionCache.versionEffectiveTimesByEntityIdHasKey(TEST_KEY));
    assertFalse(versionCache.versionsByEntityIdAndTimeHasKey(TEST_KEY));
  }
  @Test
  void testCache_timeRangeNull() {
    VersionCache versionCache = VersionCache.create();
    initializeVersionCache(versionCache);
    assertTrue(versionCache.versionEffectiveTimesByEntityIdHasKey(TEST_KEY));
    assertTrue(versionCache.versionsByEntityIdAndTimeHasKey(TEST_KEY));
    NavigableSet<Instant> rangeSetCache = versionCache.retrieveVersionEffectiveTimesByEntityId(TEST_KEY);
    Object entityTimeCache = versionCache.retrieveVersionsByEntityIdAndTime(TEST_KEY, Instant.EPOCH.plusSeconds(15));
    Collection<Object> entitiesTimeRangeCache = versionCache.retrieveVersionsByEntityIdAndTimeRange(TEST_KEY, null);
    assertTrue(entitiesTimeRangeCache.isEmpty());
    assertEquals(rangeSet, rangeSetCache);
    assertEquals(CHANNEL, entityTimeCache);
  }

  @Test
  void testCache_rangeMapNull() {
    VersionCache versionCache = VersionCache.create();
    initializeVersionCache(versionCache);
    assertTrue(versionCache.versionEffectiveTimesByEntityIdHasKey(TEST_NULL_KEY));
    NavigableSet<Instant> rangeSetCache = versionCache.retrieveVersionEffectiveTimesByEntityId(TEST_NULL_KEY);
    Object entityTimeCache = versionCache.retrieveVersionsByEntityIdAndTime(TEST_NULL_KEY, Instant.EPOCH.plusSeconds(15));
    Collection<Object> entitiesTimeRangeCache = versionCache.retrieveVersionsByEntityIdAndTimeRange(TEST_NULL_KEY, testRange);
    assertTrue(entitiesTimeRangeCache.isEmpty());
    assertEquals(rangeSet, rangeSetCache);
    assertNull(entityTimeCache);
  }

  @Test
  void testRetrieveByEntityIdAndTimeRange() {
    VersionCache versionCache = VersionCache.create();
    Instant effectiveTime = CHANNEL.getEffectiveAt().orElseThrow();
    Instant effectiveUntil = CHANNEL.getEffectiveUntil().orElseThrow();
    RangeMap<Instant, Object> singleChannelMap = TreeRangeMap.create();
    singleChannelMap.put(Range.closed(effectiveTime, effectiveUntil), CHANNEL);
    singleChannelMap.put(Range.closed(effectiveTime.minusSeconds(10), effectiveUntil), CHANNEL);
    versionCache.cacheVersionsByEntityIdAndTime("test", singleChannelMap);
    Range<Instant> timeRange = Range.closed(effectiveTime.minusMillis(1), effectiveTime.plusMillis(1));
    Collection<Object> retrieved = versionCache.retrieveVersionsByEntityIdAndTimeRange("test", timeRange);
    assertEquals(1, retrieved.size());
    assertTrue(retrieved.contains(CHANNEL));
  }

  private void initializeVersionCache(VersionCache versionCache) {
    // populate the cache with test data
    versionCache.cacheVersionEffectiveTimesByEntityId(TEST_KEY, rangeSet);
    versionCache.cacheVersionsByEntityIdAndTime(TEST_KEY, rangeMap);
    versionCache.cacheVersionEffectiveTimesByEntityId(TEST_NULL_KEY, rangeSet);
  }
}
