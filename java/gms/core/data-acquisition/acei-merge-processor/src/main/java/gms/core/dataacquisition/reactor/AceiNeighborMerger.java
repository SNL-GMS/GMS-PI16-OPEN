package gms.core.dataacquisition.reactor;

import com.google.auto.value.AutoValue;
import com.google.common.collect.Sets;
import gms.shared.frameworks.osd.api.OsdRepositoryInterface;
import gms.shared.frameworks.osd.api.rawstationdataframe.AceiUpdates;
import gms.shared.frameworks.osd.api.util.ChannelTimeAceiTypeRequest;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue.AcquiredChannelEnvironmentIssueType;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.apache.commons.lang3.ObjectUtils;
import org.slf4j.LoggerFactory;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Map.Entry;
import java.util.NavigableMap;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentSkipListMap;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Object for resolving nearest-neighbor merges by querying the OSD for neighboring ACEIs, merging
 * where possible, and updating the resulting AceiUpdates to reflect what inserts and deletes should
 * be applied to the OSD. Behavior includes merging with most recently known aceis, and incorporating backfill merges.
 *
 * Retrieved values are cached for performance improvements.
 */
public class AceiNeighborMerger {

  static final Duration CACHE_EXPIRATION = Duration.ofMinutes(10);

  private final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(AceiNeighborMerger.class));

  private final AceiUpdatesMerger updatesMerger;
  private final OsdRepositoryInterface sohRepository;
  final Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> repositoryCache;
  private Disposable pruneDisposable;

  private AceiNeighborMerger(AceiUpdatesMerger updatesMerger,
    OsdRepositoryInterface sohRepository,
    Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> repositoryCache) {
    this.updatesMerger = updatesMerger;
    this.sohRepository = sohRepository;
    this.repositoryCache = repositoryCache;
  }

  void startCachePruner() {
    logger.info("Initializing Acei Cache Pruning");
    pruneDisposable = Flux.interval(AceiNeighborMerger.CACHE_EXPIRATION, AceiNeighborMerger.CACHE_EXPIRATION)
      .doOnNext(i -> prune(Instant.now(), AceiNeighborMerger.CACHE_EXPIRATION))
      .subscribe(val -> {
        },
        err -> logger.error("Cache pruner failed", err));
  }

  /* set to package-private for testing purposes*/
  void prune(Instant now, Duration maxAge) {
    logger.debug("Pruning Cache");
    int startingTotal = repositoryCache.values().stream().mapToInt(Map::size).sum();
    repositoryCache.values().forEach(subCache -> subCache
      .headMap(ObjectUtils.min(now.minus(maxAge), subCache.lastKey()))
      .clear());
    int finalTotal = repositoryCache.values().stream().mapToInt(Map::size).sum();
    logger.info("Pruned {} values from cache", startingTotal - finalTotal);
  }

  /**
   * Default Creation method. Includes initial cache population with recent values.
   *
   * @param updatesMerger Helper class for determining merges and calculating merge results.
   * @param sohRepository Repository class for retrieving aceis due to cache misses.
   * @return The acei neighbor merger
   */
  public static AceiNeighborMerger create(AceiUpdatesMerger updatesMerger,
    OsdRepositoryInterface sohRepository) {

    Objects.requireNonNull(updatesMerger);
    Objects.requireNonNull(sohRepository);

    AceiNeighborMerger aceiNeighborMerger = new AceiNeighborMerger(updatesMerger, sohRepository, new ConcurrentHashMap<>());
    aceiNeighborMerger.updateCache(sohRepository.findLatestBooleanAcei("placeholder"));
    aceiNeighborMerger.startCachePruner();
    return aceiNeighborMerger;
  }

  public void shutDown() {
    logger.info("Shutting Down Acei Neighbor Merger");
    pruneDisposable.dispose();
    pruneDisposable = null;
  }

  /* For testing purposes ONLY */
  static AceiNeighborMerger create(
    AceiUpdatesMerger updatesMerger,
    OsdRepositoryInterface sohRepository,
    Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> repositoryCache) {

    Objects.requireNonNull(updatesMerger);
    Objects.requireNonNull(sohRepository);

    return new AceiNeighborMerger(updatesMerger, sohRepository, repositoryCache);
  }

  /**
   * Attempt a merge of incoming AceiUpdates with ACEIs already stored in the OSD
   *
   * @param aceiUpdates AceiUpdates to merge with stored and/or cached data
   * @return The resulting collection of inserts and deletes, now updated after merging with
   * previous data
   */
  public AceiUpdates tryMergeWithNeighbors(AceiUpdates aceiUpdates) {
    Instant executionStartTime = Instant.now();

    Set<AcquiredChannelEnvironmentIssueBoolean> booleanInserts = aceiUpdates.getBooleanInserts();

    var cacheUpdateResults = findCachedNeighbors(booleanInserts);

    var repositoryUpdateResults = findRepositoryNeighbors(cacheUpdateResults);

    Set<AcquiredChannelEnvironmentIssueBoolean> updatedInserts = updatesMerger
        .mergeAllBooleanAceis(repositoryUpdateResults.getUpdatedInserts());

    updateCache(updatedInserts);

    Instant endTime = Instant.now();
    Duration executionTime = Duration.between(executionStartTime, endTime);

    logger.info("{} execution time: {}", AceiNeighborMerger.class.getSimpleName(), executionTime);

    return aceiUpdates.toBuilder()
        .setBooleanInserts(updatedInserts)
        .setBooleanDeletes(repositoryUpdateResults.getAceiToDelete())
        .build();
  }

  /**
   * Returns the results of querying the cache for neighbors of the input acei boolean inserts. Includes values found
   * in the cache, and future queries that need to be made due to cache misses.
   * @param booleanInserts Acei booleans to find neighbors for.
   * @return Combined results of cache hits, cache misses and aceis to include in the merging process.
   */
  Results findCachedNeighbors(
      Set<AcquiredChannelEnvironmentIssueBoolean> booleanInserts) {
    var resultsBuilder = Results.builder();
    Set<AcquiredChannelEnvironmentIssueBoolean> updated = new HashSet<>();
    for (var current : booleanInserts) {

      Optional<AcquiredChannelEnvironmentIssueBoolean> latest = latest(repositoryCache, current);
      boolean isRecent = latest.isEmpty() || !latest.get().getEndTime().isAfter(current.getEndTime());

      Optional<AcquiredChannelEnvironmentIssueBoolean> prevInTolerance = previousInTolerance(repositoryCache, current);
      Optional<AcquiredChannelEnvironmentIssueBoolean> nextInTolerance = nextInTolerance(repositoryCache, current);
      boolean isEnclosed = prevInTolerance.filter(prev -> prev.encloses(current))
        .or(() -> nextInTolerance.filter(next -> next.encloses(current))).isPresent();

      if (!isEnclosed) {
        prevInTolerance.ifPresentOrElse(prev -> {
          resultsBuilder.addAceiToDelete(prev);
          updated.add(prev);
        }, () -> {
          if(!isRecent) {
            resultsBuilder.addPreviousToRequest(current);
          }
        });

        nextInTolerance.ifPresentOrElse(next -> {
          resultsBuilder.addAceiToDelete(next);
          updated.add(next);
        }, () -> {
          if (!isRecent) {
            resultsBuilder.addNextToRequest(current);
          }
        });

        updated.add(current);
      } else {
        logger.info(
            "Encountered cached ACEI that fully encloses a candidate. Skipping candidate {}",
            current);
      }
    }
    return resultsBuilder
        .setUpdatedInserts(updated)
        .build();
  }

  /**
   * Reads cache misses from input results and queries for neighbors from the osd
   * @param cacheUpdatedResults Initial cache hit/miss results
   * @return Full results including hits from the repository
   */
  Results findRepositoryNeighbors(Results cacheUpdatedResults) {

    var updatedResults = cacheUpdatedResults.toBuilder();
    // Retrieve the missing merge neighbors
    var previousByAceiKey = cacheUpdatedResults.getPrevRequests().entrySet().stream()
        .flatMap(entry -> buildChannelTypeToBatchResultEntries(entry, sohRepository::findBooleanAceiLatestBefore))
        .collect(Collectors.toMap(Entry::getKey, Entry::getValue));
    var nextByAceiKey = cacheUpdatedResults.getNextRequests().entrySet().stream()
        .flatMap(entry -> buildChannelTypeToBatchResultEntries(entry, sohRepository::findBooleanAceiEarliestAfter))
        .collect(Collectors.toMap(Entry::getKey, Entry::getValue));

    var mergeableFromRepository = cacheUpdatedResults.getUpdatedInserts().stream()
        .flatMap(acei -> {
          Optional<AcquiredChannelEnvironmentIssueBoolean> prevInTolerance =
              previousInTolerance(previousByAceiKey, acei);
          prevInTolerance.ifPresent(prev -> {
            logger.info("Adding prev ACEI to delete set s:{} e:{}", prev.getStartTime(),
                prev.getEndTime());
            updatedResults.addAceiToDelete(prev);
          });

          Optional<AcquiredChannelEnvironmentIssueBoolean> nextInTolerance =
              nextInTolerance(nextByAceiKey, acei);
          nextInTolerance.ifPresent(next -> {
            logger.info("Adding next ACEI to delete set s:{} e:{}", next.getStartTime(),
                next.getEndTime());
            updatedResults.addAceiToDelete(next);
          });

          return Stream.of(prevInTolerance, nextInTolerance)
              .map(Optional::stream);
        })
        .flatMap(Function.identity())
        .collect(Collectors.toSet());

    return updatedResults
        .setUpdatedInserts(Sets.union(updatedResults.getUpdatedInserts(), mergeableFromRepository))
        .build();
  }

  /**
   * Helper method for querying for neighbors and merging the results.
   * @param requestEntry Neighbor request data with acei metadata key
   * @param aceiQueryFunction Osd query to use for the neighbor retrieval
   * @return Full combined stream of query results
   */
  Stream<Entry<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>>> buildChannelTypeToBatchResultEntries(
    Entry<AcquiredChannelEnvironmentIssueType, ChannelTimeAceiTypeRequest> requestEntry,
    Function<ChannelTimeAceiTypeRequest, Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>>> aceiQueryFunction) {
    var results = aceiQueryFunction.apply(requestEntry.getValue());

    return results.entrySet().stream()
      .map(result -> Map.entry(result.getKey() + requestEntry.getKey(), result.getValue()));
  }

  private Optional<AcquiredChannelEnvironmentIssueBoolean> latest(
    Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> aceisByKeyAndTime,
    AcquiredChannelEnvironmentIssueBoolean current) {
    return Optional
      .ofNullable(aceisByKeyAndTime.get(AceiKeyBuilder.buildKey(current)))
      .map(NavigableMap::lastEntry)
      .map(Entry::getValue);
  }

  private Optional<AcquiredChannelEnvironmentIssueBoolean> previousInTolerance(
    Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> aceisByKeyAndTime,
    AcquiredChannelEnvironmentIssueBoolean current) {
    Optional<Entry<Instant, AcquiredChannelEnvironmentIssueBoolean>> cacheFloor = Optional
      .ofNullable(aceisByKeyAndTime.get(AceiKeyBuilder.buildKey(current)))
      .map(aceisByTime -> aceisByTime.floorEntry(current.getEndTime()));

    return cacheFloor.map(Entry::getValue).filter(floor -> updatesMerger.canMerge(current, floor));
  }

  private Optional<AcquiredChannelEnvironmentIssueBoolean> nextInTolerance(
      Map<String, NavigableMap<Instant, AcquiredChannelEnvironmentIssueBoolean>> aceisByKeyAndTime,
      AcquiredChannelEnvironmentIssueBoolean current) {
    Optional<Entry<Instant, AcquiredChannelEnvironmentIssueBoolean>> cacheCeil = Optional
        .ofNullable(aceisByKeyAndTime.get(AceiKeyBuilder.buildKey(current)))
        .map(aciesByTime -> aciesByTime.ceilingEntry(current.getEndTime()));

    return cacheCeil.map(Entry::getValue).filter(ceil -> updatesMerger.canMerge(current, ceil));
  }

  /**
   * Final step in merge process will update the cache with the latest known merged state of aceis.
   * @param toInsert Aceis that will be inserted into the database, used to modify the cache.
   */
  void updateCache(Collection<AcquiredChannelEnvironmentIssueBoolean> toInsert) {
    for (var acei : toInsert) {
      var aceisByTime = repositoryCache
        .computeIfAbsent(AceiKeyBuilder.buildKey(acei), key -> new ConcurrentSkipListMap<>());

      aceisByTime.subMap(acei.getStartTime(), acei.getEndTime()).clear();
      aceisByTime.put(acei.getEndTime(), acei);
    }
  }

  AceiUpdatesMerger getUpdatesMerger() {
    return updatesMerger;
  }

  OsdRepositoryInterface getSohRepository() {
    return sohRepository;
  }

  /**
   * Value class returning results from either cache or OSD checks for nearest-neighbors
   */
  @AutoValue
  abstract static class Results {

    abstract Set<AcquiredChannelEnvironmentIssueBoolean> getUpdatedInserts();

    abstract Set<AcquiredChannelEnvironmentIssueBoolean> getAceiToDelete();

    abstract Map<AcquiredChannelEnvironmentIssueType, ChannelTimeAceiTypeRequest> getPrevRequests();

    abstract Map<AcquiredChannelEnvironmentIssueType, ChannelTimeAceiTypeRequest> getNextRequests();

    abstract Builder toBuilder();

    static Builder builder() {
      return new AutoValue_AceiNeighborMerger_Results.Builder()
          .setUpdatedInserts(new HashSet<>())
          .setAceiToDelete(new HashSet<>())
          .setPrevRequests(new EnumMap<>(AcquiredChannelEnvironmentIssueType.class))
          .setNextRequests(new EnumMap<>(AcquiredChannelEnvironmentIssueType.class));
    }

    static Results emptyResults() {
      return builder().build();
    }

    @AutoValue.Builder
    abstract static class Builder {

      Map<AcquiredChannelEnvironmentIssueType, ChannelTimeAceiTypeRequest.Builder> prevRequestBuilders = new EnumMap<>(
          AcquiredChannelEnvironmentIssueType.class);

      Map<AcquiredChannelEnvironmentIssueType, ChannelTimeAceiTypeRequest.Builder> nextRequestBuilders = new EnumMap<>(
          AcquiredChannelEnvironmentIssueType.class);

      abstract Builder setUpdatedInserts(
          Set<AcquiredChannelEnvironmentIssueBoolean> updatedInserts);

      abstract Set<AcquiredChannelEnvironmentIssueBoolean> getUpdatedInserts();

      abstract Builder setAceiToDelete(
          Set<AcquiredChannelEnvironmentIssueBoolean> aceiToDelete);

      abstract Set<AcquiredChannelEnvironmentIssueBoolean> getAceiToDelete();

      Builder addAceiToDelete(AcquiredChannelEnvironmentIssueBoolean acei) {
        var aceiToDelete = new HashSet<>(getAceiToDelete());
        aceiToDelete.add(acei);
        setAceiToDelete(aceiToDelete);
        return this;
      }

      abstract Builder setPrevRequests(
          Map<AcquiredChannelEnvironmentIssueType, ChannelTimeAceiTypeRequest> prevRequests);

      abstract Map<AcquiredChannelEnvironmentIssueType, ChannelTimeAceiTypeRequest> getPrevRequests();

      abstract Builder setNextRequests(
          Map<AcquiredChannelEnvironmentIssueType, ChannelTimeAceiTypeRequest> nextRequests);

      abstract Map<AcquiredChannelEnvironmentIssueType, ChannelTimeAceiTypeRequest> getNextRequests();

      Builder addPreviousToRequest(AcquiredChannelEnvironmentIssue<?> acei) {
        var prevReqBuilder = prevRequestBuilders.computeIfAbsent(acei.getType(),
            k -> ChannelTimeAceiTypeRequest.builder().setType(acei.getType()));
        prevReqBuilder.addTime(acei.getChannelName(), acei.getEndTime());
        return this;
      }

      Builder addNextToRequest(AcquiredChannelEnvironmentIssue<?> acei) {
        var nextReqBuilder = nextRequestBuilders.computeIfAbsent(acei.getType(),
            k -> ChannelTimeAceiTypeRequest.builder().setType(acei.getType()));
        nextReqBuilder.addTime(acei.getChannelName(), acei.getEndTime());
        return this;
      }

      abstract Results autoBuild();

      Results build() {
        if (this.getPrevRequests().isEmpty()) {
          this.setPrevRequests(prevRequestBuilders.entrySet().stream()
              .map(entry -> Map.entry(entry.getKey(), entry.getValue().build()))
              .collect(Collectors.toMap(Entry::getKey, Entry::getValue)));
        }
        if (this.getNextRequests().isEmpty()) {
          this.setNextRequests(nextRequestBuilders.entrySet().stream()
              .map(entry -> Map.entry(entry.getKey(), entry.getValue().build()))
              .collect(Collectors.toMap(Entry::getKey, Entry::getValue)));
        }
        return autoBuild();
      }
    }
  }
}
