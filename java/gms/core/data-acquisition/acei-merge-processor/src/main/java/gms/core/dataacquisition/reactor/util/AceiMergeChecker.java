package gms.core.dataacquisition.reactor.util;

import com.google.common.collect.Range;
import gms.shared.frameworks.configuration.Selector;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Implementation of {@link MergeChecker} to determine if two {@link
 * gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue}s share enough common
 * metadata and are close enough in time that they can be merged together.
 */
public class AceiMergeChecker implements MergeChecker<AcquiredChannelEnvironmentIssueBoolean> {

  final MergeChecker<AcquiredChannelEnvironmentIssueBoolean> statusChecker = (acei1, acei2) -> acei1
      .getStatus().equals(acei2.getStatus());

  final MergeChecker<AcquiredChannelEnvironmentIssueBoolean> metadataChecker = (acei1, acei2) ->
      acei1.getChannelName().equals(acei2.getChannelName()) && acei1.getType()
          .equals(acei2.getType());

  private final ToleranceResolver toleranceResolver;

  AceiMergeChecker(ToleranceResolver toleranceResolver) {
    this.toleranceResolver = toleranceResolver;
  }

  public static AceiMergeChecker create(ConfigurationConsumerUtility config) {
    return new AceiMergeChecker(new ConfigurationToleranceResolver(config));
  }

  public static AceiMergeChecker create(ToleranceResolver toleranceForChannelResolver) {
    return new AceiMergeChecker(toleranceForChannelResolver);
  }

  @Override
  public boolean canMerge(AcquiredChannelEnvironmentIssueBoolean t1,
      AcquiredChannelEnvironmentIssueBoolean t2) {
    return (metadataChecker.and(statusChecker).canMerge(t1, t2)) && checkTimeRange(t1, t2);
  }

  private boolean checkTimeRange(AcquiredChannelEnvironmentIssueBoolean t1,
      AcquiredChannelEnvironmentIssueBoolean t2) {
    Duration mergeTolerance = toleranceResolver.apply(t1.getChannelName());

    Range<Instant> acei1Range = Range.closed(t1.getStartTime(), t1.getEndTime());

    Range<Instant> acei2RangeTolerancePadded = Range.closed(
        t2.getStartTime().minus(mergeTolerance),
        t2.getEndTime().plus(mergeTolerance));

    return acei1Range.isConnected(acei2RangeTolerancePadded);
  }

  /**
   * Resolves merge tolerance from Processing Configuration
   */
  public static class ConfigurationToleranceResolver implements ToleranceResolver {

    private static final String CONFIGURATION = "acei-merge-processor.merge-tolerance";
    private static final String CHANNEL_NAME_SELECTOR_KEY = "ChannelName";
    private static final String MERGE_TOLERANCE = "merge-tolerance";

    private final ConfigurationConsumerUtility config;

    public ConfigurationToleranceResolver(
        ConfigurationConsumerUtility config) {
      this.config = config;
    }

    @Override
    public Duration resolveTolerance(String channelName) {
      return Duration.parse(String.valueOf(config.resolve(CONFIGURATION,
          List.of(Selector.from(CHANNEL_NAME_SELECTOR_KEY, channelName))).get(MERGE_TOLERANCE)));
    }
  }
}

