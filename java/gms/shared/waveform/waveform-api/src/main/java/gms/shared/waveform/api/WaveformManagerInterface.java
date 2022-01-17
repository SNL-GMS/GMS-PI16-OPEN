package gms.shared.waveform.api;

import gms.shared.frameworks.common.ContentType;
import gms.shared.frameworks.common.annotations.Component;
import gms.shared.waveform.api.util.ChannelSegmentDescriptorRequest;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import java.util.Collection;

@Component("waveform-manager")
@Path("/waveform-manager-service/waveform")
public interface WaveformManagerInterface {

  /**
   * Returns a collection of {@link ChannelSegments} for each Channel entity provided in the query parameters
   * (since Channel is faceted, the provided objects may be fully populated or contain only references).
   *
   * The response has a collection of ChannelSegments for each Channel entity since a ChannelSegment
   * is associated to a single Channel object but there may be multiple versions of each Channel entity
   * within the queried time interval.
   *
   * Each ChannelSegment may contain multiple Waveforms to account for gaps in available waveform samples
   * or changes in sample rate, but each Waveform is as long as possible.
   * This operation always returns calibrated waveform samples.
   *
   * @param channelTimeRangeRequest List of channels to and time ranges to query over.
   *
   * @return list of all {@link ChannelSegments} objects for each Channel entity within the queried time interval
   */
  @Path("/channel-segment/query/channel-timerange")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "Loads and returns ChannelSegment<Waveform> based on channel and time range")
  Collection<ChannelSegment<Waveform>> findWaveformsByChannelsAndTimeRange(
      @RequestBody(description = "List of channels and time range used to query ChannelSegment<Waveform>")
          ChannelTimeRangeRequest channelTimeRangeRequest);

  /**
   * Returns a collection of {@link ChannelSegments} as it existed at the creation time listed in
   * ChannelSegmentDescriptor, even if newer data samples have since been stored in this WaveformRepository.
   * (since Channel is faceted, the provided objects may be fully populated or contain only references).
   *
   * All of the samples returned for a ChannelSegmentDescriptor must be for the exact Channel version provided
   * in that ChannelSegmentDescriptor. Each returned ChannelSegment may contain multiple Waveforms to account
   * for gaps in available waveform samples or changes in sample rate, but each Waveform is as long as possible.
   *
   * @param ChannelSegmentDescriptorRequest ChannelName, time ranges, and creation time to query over.
   *
   * @return list of all {@link ChannelSegments} objects for each Channel entity within the queried time interval
   */
  @Path("/channel-segment/query/channel-segment-descriptors")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "Loads and returns ChannelSegment<Waveform> based on channel name and segment start, end, and creation times")
  Collection<ChannelSegment<Waveform>> findWaveformsByChannelSegmentDescriptors(
      @RequestBody(description = "Channel name and segment start, end, and creation times used to query ChannelSegment<Waveform>")
          ChannelSegmentDescriptorRequest channelSegmentDescriptorRequest);
}
