package gms.core.dataacquisition.reactor;

import gms.core.dataacquisition.TestFixture.AceiMaps;
import gms.core.dataacquisition.reactor.AceiNeighborMerger.Results;
import gms.core.dataacquisition.reactor.util.AceiMergeChecker;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.osd.api.OsdRepositoryInterface;
import gms.shared.frameworks.osd.api.rawstationdataframe.AceiUpdates;
import gms.shared.frameworks.osd.api.util.ChannelTimeAceiTypeRequest;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue.AcquiredChannelEnvironmentIssueType;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Set;
import java.util.stream.Stream;

import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLIPPED_0_2;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLIPPED_0_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLIPPED_2_4;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLIPPED_2_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLIPPED_4_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_0_2;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_0_4;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_0_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_1_2;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_2_4;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_2_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_3_4;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_4_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_5_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.BADGER_CLOCKLOCK_2_6;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.anyList;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AceiNeighborMergerTests {

  @Mock
  private ConfigurationConsumerUtility mockConfig;

  @Mock
  private AceiUpdatesMerger mockMerger;

  @Mock
  private OsdRepositoryInterface mockRepository;

  @Mock
  private Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> mockCache;

  AceiNeighborMerger aceiNeighborMerger;

  @Captor
  ArgumentCaptor<ChannelTimeAceiTypeRequest> earliestAfterCapture;

  @Captor
  ArgumentCaptor<ChannelTimeAceiTypeRequest> latestBeforeCapture;

  @ParameterizedTest
  @MethodSource("cachedNeighborUpdateProvider")
  void testCachedNeighborUpdate(
      Set<AcquiredChannelEnvironmentIssueBoolean> inserts,
      Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> cache,
      Duration mergeTolerance,
      Results expected,
      boolean shouldAttemptMerge) {

    AceiMergeChecker mergeChecker = AceiMergeChecker.create(mockConfig);

    if (shouldAttemptMerge) {
      when(mockConfig.resolve(anyString(), anyList()))
          .thenReturn(Map.of("merge-tolerance", mergeTolerance.toString()));
    }

    AceiUpdatesMerger merger = AceiUpdatesMerger.create(mergeChecker);
    aceiNeighborMerger = AceiNeighborMerger.create(merger, mockRepository, cache);
    var results = aceiNeighborMerger.findCachedNeighbors(inserts);

    assertEquals(expected, results);
  }

  static Stream<Arguments> cachedNeighborUpdateProvider() {
    return Stream.of(
      //recent merge with no repo requests
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_4_6),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_2_4),
        Duration.ofMillis(500),
        Results.builder()
          .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_4_6))
          .setAceiToDelete(Set.of(AARDVARK_CLOCKLOCK_2_4))
          .build(),
        true
      ),
      //backfill no merge triggers prev and next repo requests
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_0_2),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_4_6),
        Duration.ofMillis(500),
        Results.builder()
          .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_0_2))
          .addPreviousToRequest(AARDVARK_CLOCKLOCK_0_2)
          .addNextToRequest(AARDVARK_CLOCKLOCK_0_2)
          .build(),
        true
      ),
      //backfill merge with latest from cache triggers repo previous request
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_2_4),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_4_6),
        Duration.ofMillis(500),
        Results.builder()
          .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_4_6))
          .setAceiToDelete(Set.of(AARDVARK_CLOCKLOCK_4_6))
          .addPreviousToRequest(AARDVARK_CLOCKLOCK_2_4)
          .build(),
        true
      ),
      //backfill merge overlap with cache
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_0_4),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_2_6),
        Duration.ofMillis(500),
        Results.builder()
          .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_0_4, AARDVARK_CLOCKLOCK_2_6))
          .setAceiToDelete(Set.of(AARDVARK_CLOCKLOCK_2_6))
          .addPreviousToRequest(AARDVARK_CLOCKLOCK_0_4)
          .build(),
        true
      ),
      //recent overlap with cache
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_2_6),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_0_4),
        Duration.ofMillis(500),
        Results.builder()
          .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_0_4, AARDVARK_CLOCKLOCK_2_6))
          .setAceiToDelete(Set.of(AARDVARK_CLOCKLOCK_0_4))
          .build(),
        true
      ),
      //new data never seen, no repo requests
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_2_4),
        new HashMap<>(),
        Duration.ofMillis(500),
        Results.builder()
          .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_2_4))
          .build(),
        false
      ),
      //recent data not within tolerance of previous, no repo request
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_4_6),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_2_4),
        Duration.ofMillis(5),
        Results.builder()
          .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_4_6))
          .build(),
        true
      ),
      //backfill not within tolerance of latest, previous and next repo requests
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_2_4),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_4_6),
        Duration.ofMillis(5),
        Results.builder()
          .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_2_4))
          .addPreviousToRequest(AARDVARK_CLOCKLOCK_2_4)
          .addNextToRequest(AARDVARK_CLOCKLOCK_2_4)
          .build(),
        true
      ),
      //fully enclosed data is ignored, still insert unenclosed data
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_5_6),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_4_6),
        Duration.ofMillis(5),
        Results.builder()
          .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_0_2))
          .addPreviousToRequest(AARDVARK_CLOCKLOCK_0_2)
          .addNextToRequest(AARDVARK_CLOCKLOCK_0_2)
          .build(),
        true
      ),
      //fully enclosed data is not merged or requested
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_2_4),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_0_6),
        Duration.ofMillis(500),
        Results.emptyResults(),
        true
      )
    );
  }

  @ParameterizedTest
  @MethodSource("findRepositoryNeighborsArguments")
  void testFindRepositoryNeighbors(Results cacheResults,
    Duration mergeTolerance,
    boolean queryBefore,
    Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> latestBefore,
    boolean queryAfter,
    Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> earliestAfter,
    Set<AcquiredChannelEnvironmentIssueBoolean> expectedUpdates,
    Set<AcquiredChannelEnvironmentIssueBoolean> expectedDeletes) {

    AceiMergeChecker mergeChecker = AceiMergeChecker.create(mockConfig);

    when(mockConfig.resolve(anyString(), anyList()))
      .thenReturn(Map.of("merge-tolerance", mergeTolerance.toString()));

    AceiUpdatesMerger merger = AceiUpdatesMerger.create(mergeChecker);

    aceiNeighborMerger = AceiNeighborMerger.create(merger, mockRepository, mockCache);

    if (queryBefore) {
      when(mockRepository.findBooleanAceiLatestBefore(any()))
          .thenReturn(latestBefore);
    }
    if (queryAfter) {
      when(mockRepository.findBooleanAceiEarliestAfter(any()))
          .thenReturn(earliestAfter);
    }

    Results results = aceiNeighborMerger.findRepositoryNeighbors(cacheResults);

    assertEquals(expectedUpdates, results.getUpdatedInserts());
    assertEquals(expectedDeletes, results.getAceiToDelete());
  }

  static Stream<Arguments> findRepositoryNeighborsArguments() {
    return Stream.of(
      //full backfill scenario with both neighbors in repository
      arguments(
        Results.builder()
          .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_2_4))
          .addPreviousToRequest(AARDVARK_CLOCKLOCK_2_4)
          .addNextToRequest(AARDVARK_CLOCKLOCK_2_4).build(),
        Duration.ofMillis(500),
        true,
        AceiMaps.buildRepositoryResults(AARDVARK_CLOCKLOCK_0_2),
        true,
        AceiMaps.buildRepositoryResults(AARDVARK_CLOCKLOCK_4_6),
        Set.of(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_4_6),
        Set.of(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_4_6)),
      //backfill scenario with no previous neighbor
      arguments(
        Results.builder()
          .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_2_4))
          .addPreviousToRequest(AARDVARK_CLOCKLOCK_2_4)
          .addNextToRequest(AARDVARK_CLOCKLOCK_2_4).build(),
        Duration.ofMillis(500),
        true,
        Collections.emptyMap(),
        true,
        AceiMaps.buildRepositoryResults(AARDVARK_CLOCKLOCK_4_6),
        Set.of(AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_4_6),
        Set.of(AARDVARK_CLOCKLOCK_4_6)),
      //backfill scenario with no next neighbor
      arguments(
        Results.builder()
          .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_2_4))
          .addPreviousToRequest(AARDVARK_CLOCKLOCK_2_4)
          .addNextToRequest(AARDVARK_CLOCKLOCK_2_4).build(),
        Duration.ofMillis(500),
        true,
        AceiMaps.buildRepositoryResults(AARDVARK_CLOCKLOCK_0_2),
        true,
        Collections.emptyMap(),
        Set.of(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_2_4),
        Set.of(AARDVARK_CLOCKLOCK_0_2)),
      //no previous requested, next neighbor in repo
      arguments(
        Results.builder()
          .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_2_4))
          .addNextToRequest(AARDVARK_CLOCKLOCK_2_4).build(),
        Duration.ofMillis(500),
        false,
        null,
        true,
        AceiMaps.buildRepositoryResults(AARDVARK_CLOCKLOCK_4_6),
        Set.of(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_4_6),
        Set.of(AARDVARK_CLOCKLOCK_4_6)),
      //overlap with next neighbor in repo
      arguments(
        Results.builder()
          .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_0_4))
          .addNextToRequest(AARDVARK_CLOCKLOCK_0_4).build(),
        Duration.ofMillis(500),
        false,
        null,
        true,
        AceiMaps.buildRepositoryResults(AARDVARK_CLOCKLOCK_2_6),
        Set.of(AARDVARK_CLOCKLOCK_0_4, AARDVARK_CLOCKLOCK_2_6),
        Set.of(AARDVARK_CLOCKLOCK_2_6)),
      //overlap with previous neighbor in repo
      arguments(
        Results.builder()
          .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_2_6))
          .addPreviousToRequest(AARDVARK_CLOCKLOCK_2_6).build(),
        Duration.ofMillis(500),
        true,
        AceiMaps.buildRepositoryResults(AARDVARK_CLOCKLOCK_0_4),
        false,
        null,
        Set.of(AARDVARK_CLOCKLOCK_0_4, AARDVARK_CLOCKLOCK_2_6),
        Set.of(AARDVARK_CLOCKLOCK_0_4))
    );
  }

  @ParameterizedTest
  @MethodSource("cacheUpdateArguments")
  void testUpdateCache(Set<AcquiredChannelEnvironmentIssueBoolean> inserts,
    Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> cache,
    Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> expectedCache) {

    aceiNeighborMerger = AceiNeighborMerger.create(mockMerger, mockRepository, cache);
    aceiNeighborMerger.updateCache(inserts);
    assertEquals(expectedCache, cache);
  }

  private static Stream<Arguments> cacheUpdateArguments() {
    return Stream.of(
      //partial overlap overwites old cache
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_0_4),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_0_2),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_0_4)
      ),
      //partial overlap overwites old cache
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_0_4),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_2_4),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_0_4)
      ),
      //full overlap overwrites old cache
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_0_6),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_3_4),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_0_6)
      ),
      //new non-overlapping insert added to cache
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_4_6),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_0_2),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_4_6)
      ),
      //full overlap overwrites relevant value in cache
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_0_2),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_1_2, AARDVARK_CLOCKLOCK_3_4),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_3_4)
      ),
      //full overlap overwrites all relevant values in cache
      arguments(
        Set.of(AARDVARK_CLOCKLOCK_0_6),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_1_2, AARDVARK_CLOCKLOCK_3_4),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_0_6)
      ),
      //different channels do not overwrite
      arguments(
        Set.of(BADGER_CLOCKLOCK_2_6),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_3_4),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_3_4, BADGER_CLOCKLOCK_2_6)
      ),
      //different types do not overwrite
      arguments(
        Set.of(AARDVARK_CLIPPED_2_6),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_3_4),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_3_4, AARDVARK_CLIPPED_2_6)
      )
    );
  }

  @ParameterizedTest
  @MethodSource("pruneArguments")
  void testPrune(Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> cache,
    Instant now, Duration maxAge,
    Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> expectedCacheAfterPrune) {

    aceiNeighborMerger = AceiNeighborMerger.create(mockMerger, mockRepository, cache);
    aceiNeighborMerger.prune(now, maxAge);
    assertEquals(expectedCacheAfterPrune, cache);
  }

  private static Stream<Arguments> pruneArguments() {
    return Stream.of(
      //typical prune scenario, losing the oldest value
      arguments(
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_4_6),
        AARDVARK_CLOCKLOCK_4_6.getEndTime(),
        Duration.between(AARDVARK_CLOCKLOCK_2_4.getEndTime(), AARDVARK_CLOCKLOCK_4_6.getEndTime()),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_4_6)),
      //keeping the latest value per composite key
      arguments(
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_4_6, AARDVARK_CLIPPED_0_2, AARDVARK_CLIPPED_2_4),
        AARDVARK_CLOCKLOCK_4_6.getEndTime().plus(Duration.ofMinutes(10)),
        Duration.ofMinutes(10),
        AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_4_6, AARDVARK_CLIPPED_2_4))
    );
  }

  @Test
  void testTryMergeCombinedBackfillNoKeyCollisions() {
    AceiMergeChecker mergeChecker = AceiMergeChecker.create(mockConfig);

    when(mockConfig.resolve(anyString(), anyList()))
      .thenReturn(Map.of("merge-tolerance", Duration.ofMillis(500).toString()));

    AceiUpdatesMerger merger = AceiUpdatesMerger.create(mergeChecker);

    when(mockRepository.findBooleanAceiLatestBefore(any()))
      .thenAnswer(
        invocation -> {
          var o = invocation.getArguments()[0];
          if (o instanceof ChannelTimeAceiTypeRequest) {
            var request = (ChannelTimeAceiTypeRequest) o;

            switch (request.getType()) {
              case CLOCK_LOCKED:
                return AceiMaps.buildRepositoryResults(
                  AARDVARK_CLOCKLOCK_0_2);
              case CLIPPED:
                return AceiMaps.buildRepositoryResults(
                  AARDVARK_CLIPPED_0_2);
              default:
                fail();
            }
          }
          return Collections.emptyMap();
        }
      );

    AceiUpdates updateSets = AceiUpdates.builder()
      .setBooleanInserts(Set.of(AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLIPPED_2_4)).build();

    Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> cache = AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_4_6, AARDVARK_CLIPPED_4_6);

    aceiNeighborMerger = AceiNeighborMerger.create(merger, mockRepository, cache);

    AceiUpdates results = aceiNeighborMerger.tryMergeWithNeighbors(updateSets);

    AceiUpdates expected = AceiUpdates.builder()
      .setBooleanInserts(Set.of(AARDVARK_CLOCKLOCK_0_6, AARDVARK_CLIPPED_0_6))
      .setBooleanDeletes(Set.of(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLIPPED_0_2, AARDVARK_CLOCKLOCK_4_6, AARDVARK_CLIPPED_4_6))
      .build();

    assertEquals(expected, results);

    for (var expectedAcei : expected.getBooleanInserts()) {
      assertEquals(1,
        aceiNeighborMerger.repositoryCache.get(AceiKeyBuilder.buildKey(expectedAcei)).size());
      assertEquals(expectedAcei,
        aceiNeighborMerger.repositoryCache.get(AceiKeyBuilder.buildKey(expectedAcei))
          .floorEntry(expectedAcei.getEndTime()).getValue());
    }
  }

  @Test
  void testTryMergeRecentNoRepoCall() {
    AceiMergeChecker mergeChecker = AceiMergeChecker.create(mockConfig);

    when(mockConfig.resolve(anyString(), anyList()))
      .thenReturn(Map.of("merge-tolerance", Duration.ofMillis(500).toString()));

    AceiUpdatesMerger merger = AceiUpdatesMerger.create(mergeChecker);
    Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> cache = AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_2_4);
    aceiNeighborMerger = AceiNeighborMerger.create(merger, mockRepository, cache);

    AceiUpdates updateSets = AceiUpdates.from(AARDVARK_CLOCKLOCK_4_6);
    AceiUpdates actual = aceiNeighborMerger.tryMergeWithNeighbors(updateSets);

    AceiUpdates expected = AceiUpdates.builder()
      .addBooleanDelete(AARDVARK_CLOCKLOCK_2_4)
      .addBooleanInsert(AARDVARK_CLOCKLOCK_2_6)
      .build();
    assertEquals(expected, actual);

    verify(mockRepository, never()).findBooleanAceiEarliestAfter(any());
    verify(mockRepository, never()).findBooleanAceiLatestBefore(any());
  }

  @Test
  void testRepositoryNeighborUpdateWrapPrevious() {
    AceiMergeChecker mergeChecker = AceiMergeChecker.create(mockConfig);

    Results secondResults = Results.builder()
      .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_4_6))
      .addPreviousToRequest(AARDVARK_CLOCKLOCK_4_6)
      .addNextToRequest(AARDVARK_CLOCKLOCK_0_2).build();

    when(mockConfig.resolve(anyString(), anyList()))
      .thenReturn(Map.of("merge-tolerance", Duration.ofMillis(500).toString()));

    AceiUpdatesMerger merger = AceiUpdatesMerger.create(mergeChecker);

    aceiNeighborMerger = AceiNeighborMerger.create(merger, mockRepository, new HashMap<>());

    var retrievalGapFill = AceiMaps
      .buildRepositoryResults(AARDVARK_CLOCKLOCK_2_4);

    doReturn(retrievalGapFill).when(mockRepository)
      .findBooleanAceiLatestBefore(ChannelTimeAceiTypeRequest.builder()
        .setType(AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED)
        .addTime("aardvark", AARDVARK_CLOCKLOCK_4_6.getEndTime()).build());
    doReturn(retrievalGapFill).when(mockRepository)
      .findBooleanAceiEarliestAfter(ChannelTimeAceiTypeRequest.builder()
        .setType(AcquiredChannelEnvironmentIssueType.CLOCK_LOCKED)
        .addTime("aardvark", AARDVARK_CLOCKLOCK_0_2.getEndTime()).build());

    Results resultsFinal = aceiNeighborMerger.findRepositoryNeighbors(secondResults);

    assertEquals(Set.of(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_4_6),
      resultsFinal.getUpdatedInserts());
    assertEquals(Set.of(AARDVARK_CLOCKLOCK_2_4), resultsFinal.getAceiToDelete());
  }

  @Test
  void testSuccessfulDBCalls() {
    Results dummyCacheResults = Results.builder()
      .setUpdatedInserts(Set.of(AARDVARK_CLOCKLOCK_2_4))
      .addPreviousToRequest(AARDVARK_CLOCKLOCK_2_4)
      .addNextToRequest(AARDVARK_CLOCKLOCK_2_4)
      .build();

    aceiNeighborMerger = AceiNeighborMerger.create(mockMerger, mockRepository, mockCache);

    aceiNeighborMerger.findRepositoryNeighbors(dummyCacheResults);

    verify(mockRepository).findBooleanAceiLatestBefore(latestBeforeCapture.capture());
    verify(mockRepository).findBooleanAceiEarliestAfter(earliestAfterCapture.capture());
    ChannelTimeAceiTypeRequest earliestAfterResult = earliestAfterCapture.getValue();
    ChannelTimeAceiTypeRequest latestBeforeResult = latestBeforeCapture.getValue();

    assertEquals(earliestAfterResult.getType(), AARDVARK_CLOCKLOCK_2_4.getType());
    assertTrue(earliestAfterResult.getChannelNamesToTime()
      .containsKey(AARDVARK_CLOCKLOCK_2_4.getChannelName()));
    assertEquals(1,
      earliestAfterResult.getChannelNamesToTime().get(AARDVARK_CLOCKLOCK_2_4.getChannelName())
        .size());
    assertTrue(
      earliestAfterResult.getChannelNamesToTime().get(AARDVARK_CLOCKLOCK_2_4.getChannelName())
        .contains(AARDVARK_CLOCKLOCK_2_4.getEndTime()));

    assertEquals(latestBeforeResult.getType(), AARDVARK_CLOCKLOCK_2_4.getType());
    assertTrue(latestBeforeResult.getChannelNamesToTime()
      .containsKey(AARDVARK_CLOCKLOCK_2_4.getChannelName()));
    assertEquals(1,
      latestBeforeResult.getChannelNamesToTime().get(AARDVARK_CLOCKLOCK_2_4.getChannelName())
        .size());
    assertTrue(
      latestBeforeResult.getChannelNamesToTime().get(AARDVARK_CLOCKLOCK_2_4.getChannelName())
        .contains(AARDVARK_CLOCKLOCK_2_4.getEndTime()));
  }

  @Test
  void testCachedNeighborUpdateWrapPrevious() {
    AceiMergeChecker mergeChecker = AceiMergeChecker.create(mockConfig);

    when(mockConfig.resolve(anyString(), anyList()))
      .thenReturn(Map.of("merge-tolerance", Duration.ofMillis(500).toString()));

    AceiUpdatesMerger merger = AceiUpdatesMerger.create(mergeChecker);

    var cache = AceiMaps.buildRepositoryCache(AARDVARK_CLOCKLOCK_2_4);

    aceiNeighborMerger = AceiNeighborMerger.create(merger, mockRepository, cache);

    var results = aceiNeighborMerger
      .findCachedNeighbors(Set.of(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_4_6));

    assertEquals(Set.of(AARDVARK_CLOCKLOCK_0_2, AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_4_6),
      results.getUpdatedInserts());
    assertEquals(Set.of(AARDVARK_CLOCKLOCK_2_4), results.getAceiToDelete());

    aceiNeighborMerger
      .updateCache(merger.mergeAllBooleanAceis(results.getUpdatedInserts())
      );

    var expectedCache = AceiMaps
      .buildRepositoryCache(AARDVARK_CLOCKLOCK_0_6);

    assertEquals(expectedCache, aceiNeighborMerger.repositoryCache);
  }
}