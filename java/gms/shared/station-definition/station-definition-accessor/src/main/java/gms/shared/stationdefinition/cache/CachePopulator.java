package gms.shared.stationdefinition.cache;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.api.StationDefinitionAccessorInterface;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import net.jodah.failsafe.Failsafe;
import net.jodah.failsafe.RetryPolicy;
import org.hibernate.JDBCException;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

public class CachePopulator {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(CachePopulator.class));

  private final StationDefinitionAccessorInterface stationDefinitionAccessor;

  private CachePopulator(StationDefinitionAccessorInterface stationDefinitionAccessor) {
    this.stationDefinitionAccessor = stationDefinitionAccessor;
  }

  /**
   * Creates a new CachePopulator that leverages the provided {@link StationDefinitionAccessorInterface}
   *
   * @param stationDefinitionAccessor the {@link StationDefinitionAccessorInterface} used to retrieve data and
   * populate the cache
   * @return a new CachePopulator
   */
  public static CachePopulator create(StationDefinitionAccessorInterface stationDefinitionAccessor) {
    Objects.requireNonNull(stationDefinitionAccessor);

    return new CachePopulator(stationDefinitionAccessor);
  }

  /**
   * Populates this instance's {@link StationDefinitionAccessorInterface} with data for the provided time period, using
   * the provided list of station group names
   *
   * @param stationGroupNames the station group names used to populate the cache
   * @param periodStart The beginning of the operational time period
   * @param periodEnd The end of the operational time period
   */
  public void populate(List<String> stationGroupNames, Duration periodStart, Duration periodEnd) {
    Objects.requireNonNull(stationGroupNames);
    Objects.requireNonNull(periodStart);
    Objects.requireNonNull(periodEnd);
    Preconditions.checkState(!periodStart.isNegative(),
      "Cannot populate cache based on negative period start duration");
    Preconditions.checkState(!periodEnd.isNegative(),
      "Cannot populate cache based on a negative period end duration");
    Preconditions.checkState(periodStart.compareTo(periodEnd) != 0,
      "Cannot populate cache with empty cache duration (period start equal to period end");
    Preconditions.checkState(periodStart.compareTo(periodEnd) > 0,
      "Cannot populate cache with a negative caching duration (period start shorter than period end");

    Instant startTime = Instant.now().minus(periodStart);
    Instant endTime = Instant.now().minus(periodEnd);

    logger.info("Populating cache");

    RetryPolicy<Void> retryPolicy = new RetryPolicy<Void>()
      .withBackoff(1, 60, ChronoUnit.SECONDS) // TODO (sgk 04/12/2021 validate backoff parameters)
      .withMaxAttempts(10)
      .handle(List.of(JDBCException.class))
      .onFailedAttempt(e -> logger.info("Cache population attempt failed with error{}, will try again...", e));

    try {
      Failsafe.with(retryPolicy).run(() -> stationDefinitionAccessor.cache(stationGroupNames,
        startTime,
        endTime));
    } catch (Exception ex) {
      logger.error("Error loading cache", ex);
    }
  }
}
