package gms.shared.waveform.accessor;

import com.google.common.base.Preconditions;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.api.StationDefinitionAccessorInterface;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.factory.StationDefinitionAccessorFactory;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.shared.waveform.api.facet.WaveformFacetingUtility;
import gms.shared.waveform.api.WaveformAccessorInterface;
import gms.shared.waveform.api.WaveformRepositoryInterface;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.ChannelSegmentDescriptor;
import gms.shared.waveform.coi.Waveform;

import java.time.Instant;
import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.commons.lang3.Validate;
import org.slf4j.LoggerFactory;

/**
 * Accessor for retrieving Waveforms from the backing store.  This contains a cache of previously retrieved channels,
 * and a class to a retrieve any channels not in the cache from the backing store.
 */
public class WaveformAccessor implements WaveformAccessorInterface {
  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper.create(LoggerFactory.getLogger(WaveformAccessor.class));
  private final WaveformRepositoryInterface waveformRepositoryImpl;
  private final StationDefinitionAccessorInterface stationDefinitionAccessorImpl;

  public static final String NULL_CHANNELS = "Channel list cannot be null";
  public static final String NULL_CHANNEL_SEGMENT_DESCRIPTORS = "Channel segment descriptors list cannot be null";
  public static final String EMPTY_CHANNELS_MESSAGE = "Channels cannot be empty";
  public static final String EMPTY_CHANNEL_SEGMENT_DESCRIPTORS_MESSAGE = "Channel segment descriptors cannot be empty";
  public static final String START_END_TIME_ERR = "Start Time cannot be after end time";
  public static final String START_FUTURE_ERR = "Start Time cannot be in the future";
  public static final String END_FUTURE_ERR = "End Time cannot be in the future";
  public static final String NULL_FACETING_DEFINITION_MESSAGE = "Faceting definition cannot be null";

  private WaveformAccessor(
    WaveformRepositoryInterface waveformRepositoryImpl,
    StationDefinitionAccessorInterface stationDefinitionAccessorImpl) {

    this.waveformRepositoryImpl = waveformRepositoryImpl;
    this.stationDefinitionAccessorImpl = stationDefinitionAccessorImpl;
  }

  /**
   * Create a WaveformAccessor that will leverage the provided
   * {@link WaveformAccessorInterface} to retrieve data and resolve requests.
   *
   * @param waveformRepositoryImpl the repository for retrieving waveforms
   * @return a WaveformAccessor that leverages the provided repository.
   */
  public static WaveformAccessor create(
    SystemConfig systemConfig,
    WaveformRepositoryInterface waveformRepositoryImpl,
    StationDefinitionAccessorFactory stationDefinitionAccessorFactory) {
    Validate.notNull(systemConfig, "systemConfig cannot be null");
    Validate.notNull(waveformRepositoryImpl, "waveformRepositoryImpl cannot be null");
    Validate.notNull(stationDefinitionAccessorFactory, "stationDefinitionAccessorFactory cannot be null");

    return new WaveformAccessor(
      waveformRepositoryImpl,
      stationDefinitionAccessorFactory.getBridgedStationDefinitionAccessorInstance());
  }

  @Override
  public Collection<ChannelSegment<Waveform>> findByChannelsAndTimeRange(
    Set<Channel> channels, Instant startTime, Instant endTime) {

    Preconditions.checkNotNull(channels, NULL_CHANNELS);
    Preconditions.checkState(!channels.isEmpty(), EMPTY_CHANNELS_MESSAGE);
    Preconditions.checkState(startTime.isBefore(endTime), START_END_TIME_ERR);
    Preconditions.checkState(startTime.isBefore(Instant.now()), START_FUTURE_ERR);
    Preconditions.checkState(endTime.isBefore(Instant.now()), END_FUTURE_ERR);

    return waveformRepositoryImpl.findByChannelsAndTimeRange(
      channels, startTime, endTime);
  }

  @Override
  public Collection<ChannelSegment<Waveform>> findByChannelsAndTimeRange(
    Set<Channel> channels, Instant startTime, Instant endTime, FacetingDefinition facetingDefinition) {

    Preconditions.checkNotNull(channels, NULL_CHANNELS);
    Preconditions.checkState(!channels.isEmpty(), EMPTY_CHANNELS_MESSAGE);
    Preconditions.checkState(startTime.isBefore(endTime), START_END_TIME_ERR);
    Preconditions.checkState(startTime.isBefore(Instant.now()), START_FUTURE_ERR);
    Preconditions.checkState(endTime.isBefore(Instant.now()), END_FUTURE_ERR);
    Preconditions.checkNotNull(facetingDefinition, NULL_FACETING_DEFINITION_MESSAGE);

    Collection<ChannelSegment<Waveform>> channelSegments = waveformRepositoryImpl.findByChannelsAndTimeRange(
      channels, startTime, endTime);
    WaveformFacetingUtility facetingUtil = WaveformFacetingUtility.create(this, stationDefinitionAccessorImpl);

    return channelSegments.stream().map(channelSeg ->
      (ChannelSegment<Waveform>) facetingUtil.populateFacets(channelSeg, facetingDefinition)
    ).collect(Collectors.toList());
  }

  @Override
  public Collection<ChannelSegment<Waveform>> findByChannelNamesAndSegmentDescriptor(
    Collection<ChannelSegmentDescriptor> channelSegmentDescriptors) {

    Preconditions.checkNotNull(channelSegmentDescriptors, NULL_CHANNEL_SEGMENT_DESCRIPTORS);
    Preconditions.checkState(!channelSegmentDescriptors.isEmpty(), EMPTY_CHANNEL_SEGMENT_DESCRIPTORS_MESSAGE);

    logger.info("Retrieving waveforms for {} channel segment descriptors", channelSegmentDescriptors.size());
    return waveformRepositoryImpl.findByChannelNamesAndSegmentDescriptor(
      channelSegmentDescriptors);
  }

  @Override
  public Collection<ChannelSegment<Waveform>> findByChannelNamesAndSegmentDescriptor(
    Collection<ChannelSegmentDescriptor> channelSegmentDescriptors, FacetingDefinition facetingDefinition) {

    Preconditions.checkNotNull(channelSegmentDescriptors, NULL_CHANNEL_SEGMENT_DESCRIPTORS);
    Preconditions.checkState(!channelSegmentDescriptors.isEmpty(), EMPTY_CHANNEL_SEGMENT_DESCRIPTORS_MESSAGE);
    Preconditions.checkNotNull(facetingDefinition, NULL_FACETING_DEFINITION_MESSAGE);

    logger.info("Retrieving waveforms for {} channel segment descriptors", channelSegmentDescriptors.size());

    Collection<ChannelSegment<Waveform>> channelSegments = waveformRepositoryImpl.findByChannelNamesAndSegmentDescriptor(
      channelSegmentDescriptors);
    WaveformFacetingUtility facetingUtil = WaveformFacetingUtility.create(this, stationDefinitionAccessorImpl);

    return channelSegments.stream().map(channelSeg ->
      (ChannelSegment<Waveform>) facetingUtil.populateFacets(channelSeg, facetingDefinition)
    ).collect(Collectors.toList());
  }
}
