package gms.testtools.mockwaveform;

import gms.shared.frameworks.common.ContentType;
import gms.shared.frameworks.common.annotations.Component;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;

import java.util.Collection;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

@Component("mock-waveform")
@Path("/waveform-manager-service/waveform")
public interface MockWaveformService {
  @Path("/channel-segment/query/channel-timerange")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "Loads and returns ChannelSegment<Waveform> based on channel and time range")
  Collection<ChannelSegment<Waveform>> findWaveformsByChannelsAndTimeRange(
    @RequestBody(description = "List of channels and time range used to query ChannelSegment<Waveform>")
      ChannelTimeRangeRequest channelTimeRangeRequest);
}
