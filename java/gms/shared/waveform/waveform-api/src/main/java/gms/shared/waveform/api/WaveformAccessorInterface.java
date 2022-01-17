package gms.shared.waveform.api;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.ChannelSegmentDescriptor;
import gms.shared.waveform.coi.Waveform;
import java.time.Instant;
import java.util.Collection;
import java.util.Set;

public interface  WaveformAccessorInterface extends WaveformRepositoryInterface {

  /**
   * Implements the same query as the findByChannelsAndTimeRange operation described above,
   * but uses the provided FacetingDefinition to determine how to populate the Channel object associated
   * by each ChannelSegment<Waveform>.
   *
   * @param channels List of channels to return the list of ChannelSegments for.
   * @param startTime beginning time of waveforms to query over
   * @param endTime end time of waveforms to query over
   * @param facetingDefinition used to determine how to populate the Channel object
   *
   * @return list of all {@link ChannelSegments} objects for each Channel entity within the queried time interval
   */
  Collection<ChannelSegment<Waveform>> findByChannelsAndTimeRange(
      Set<Channel> channels, Instant startTime, Instant endTime, FacetingDefinition facetingDefinition);

  /**
   * Implements the same query as the findWaveformsByChannelsAndTimeRange operation described above,
   * but uses the provided FacetingDefinition to determine how to populate the Channel object associated
   * by each ChannelSegment<Waveform>.
   *
   * @param channelName ChannelName to query ChannelSegments for.
   * @param segmentStartTime beginning time of channel segments to query over
   * @param segmentEndTime end time of channel segments to query over
   * @param segmentCreationTime time the channel segment existed
   * @param facetingDefinition used to determine how to populate the Channel object
   *
   * @return list of all {@link ChannelSegments} objects for each Channel entity within the queried time interval
   */
  Collection<ChannelSegment<Waveform>> findByChannelNamesAndSegmentDescriptor(
      Collection<ChannelSegmentDescriptor> channelSegmentDescriptors,
      FacetingDefinition facetingDefinition);
}
