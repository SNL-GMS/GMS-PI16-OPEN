package gms.shared.stationdefinition.api.channel;

import gms.shared.frameworks.common.ContentType;
import gms.shared.stationdefinition.api.channel.util.ChannelGroupsTimeFacetRequest;
import gms.shared.stationdefinition.api.channel.util.ChannelGroupsTimeRangeRequest;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import java.util.List;

public interface ChannelGroupManagerInterface {

  /**
   * Retrieves all {@link ChannelGroup} objects specified by a list of channel group names,
   * with optional effective time and optional faceting definition.
   * If the list is empty, the server will return an empty list of channel groups.
   *
   * @param request {@link ChannelGroupsTimeFacetRequest} facet request object
   * @return list of {@link ChannelGroup} objects
   */
  @Path("/channel-groups/query/names")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "retrieves all channel groups specified by a list of channel group names, "
    + "effectiveTime and facetingDefinition")
  List<ChannelGroup> findChannelGroupsByName(
    @RequestBody(description = "List of channel group names, effective time and faceting definition",
      required = true)
    ChannelGroupsTimeFacetRequest request);

  /**
   * Retrieves all {@link ChannelGroup} objects specified by a list of channel group names and
   * time range bounding the groups.
   * If the list is empty, the server will return an empty list of channel groups.
   *
   * @param request The collections of channel group names and time range of the channel groups
   * @return list of {@link ChannelGroup} objects
   */
  @Path("/channel-groups/query/names-timerange")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "retrieves all channel groups specified by a list of channel group names, "
    + "effectiveTime and facetingDefinition")
  List<ChannelGroup> findChannelGroupsByNameAndTimeRange(
    @RequestBody(description = "List of channel group names, effective time and "
      + "faceting definition", required = true)
      ChannelGroupsTimeRangeRequest request);
}
