package gms.shared.stationdefinition.api.station;

import gms.shared.frameworks.common.ContentType;
import gms.shared.stationdefinition.api.station.util.StationGroupsTimeFacetRequest;
import gms.shared.stationdefinition.api.station.util.StationGroupsTimeRangeRequest;
import gms.shared.stationdefinition.coi.station.StationGroup;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import java.util.List;

public interface StationGroupManagerInterface {

  /**
   * Retrieves all {@link StationGroup} objects specified by a list of station group names and
   * optional effective time instant and optional faceting definition.
   * If the list is empty, the server will return an empty list.
   *
   * @param request The collections of station groups names, effective time of the groups and faceting definition
   * @return list of {@link StationGroup} objects
   */
  @Path("/station-groups/query/names")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "retrieves all station groups specified by a list of station group names, "
    + "effectiveTime and facetingDefinition")
  List<StationGroup> findStationGroupsByName(
    @RequestBody(description = "List of station group names, effective time and " +
      "faceting definition", required = true)
      StationGroupsTimeFacetRequest request);

  /**
   * Retrieves all {@link StationGroup} objects specified by a list of station group names and
   * time range bounding the groups.
   * If the list is empty, the server will return an empty list.
   *
   * @param request The collections of station groups names and time range of the groups
   * @return list of {@link StationGroup} objects
   */
  @Path("/station-groups/query/names-timerange")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "retrieves all station groups specified by a list of station group names and time range")
  List<StationGroup> findStationGroupsByNameAndTimeRange(
    @RequestBody(description = "List of station group names and time range", required = true)
      StationGroupsTimeRangeRequest request);
}
