package gms.shared.stationdefinition.api.channel;

import gms.shared.frameworks.common.ContentType;
import gms.shared.stationdefinition.api.channel.util.ChannelsTimeFacetRequest;
import gms.shared.stationdefinition.api.channel.util.ChannelsTimeRangeRequest;
import gms.shared.stationdefinition.coi.channel.Channel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import java.util.List;

public interface ChannelManagerInterface {

  /**
   * Retrieves all {@link Channel} objects specified by a list of channel names,
   * with optional effective time and optional faceting definition.
   * If the list is empty, the server will return an empty list of channels.
   *
   * @param request The {@link ChannelsTimeFacetRequest} containing the query information
   * @return list of {@link Channel} objects
   */
  @Path("/channels/query/names")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "retrieves all channels specified by a list of channel names, and optionally, an"
    + "effectiveTime and facetingDefinition")
  List<Channel> findChannels(
    @RequestBody(description = "List of channel names, with optional effective time and optional faceting definition",
      required = true)
      ChannelsTimeFacetRequest request);

  /**
   * Retrieves all {@link Channel} objects specified by a list of channel names and
   * time range bounding the groups.
   * If the list is empty, the server will return an empty list of channels.
   *
   * @param request The collections of channel names and time range of the channels
   * @return list of {@link Channel} objects
   */
  @Path("/channels/query/names-timerange")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "retrieves all channels specified by a list of channel names and time range")
  List<Channel> findChannelsByNameAndTimeRange(
    @RequestBody(description = "List of channel names and time range", required = true)
      ChannelsTimeRangeRequest request);
}
