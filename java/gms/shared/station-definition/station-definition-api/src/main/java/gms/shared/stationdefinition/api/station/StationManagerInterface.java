package gms.shared.stationdefinition.api.station;

import gms.shared.frameworks.common.ContentType;
import gms.shared.stationdefinition.api.station.util.StationChangeTimesRequest;
import gms.shared.stationdefinition.api.station.util.StationsTimeFacetRequest;
import gms.shared.stationdefinition.api.station.util.StationsTimeRangeRequest;
import gms.shared.stationdefinition.coi.station.Station;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface StationManagerInterface {
  /**
   * Returns a list of {@link Station} objects that corresponds to the list of
   * {@link StationsTimeRangeRequest#getStationNames()} passed in with optional
   * effective time and optional faceting definition.
   * If an empty list is provided, this method will return an empty list of stations.
   *
   * @param request {@link StationsTimeFacetRequest} facet request object
   * @return list of all {@link Station} objects for the given set of station names that
   * have an {@link Station#getEffectiveAt()} that is with in the specified time range of the
   * request.
   */
  @Path("/stations/query/names")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(description = "returns all stations specified by list of names")
  List<Station> findStationsByName(
    @RequestBody(description = "list of station names to retrieve", required = true)
      StationsTimeFacetRequest request);

  /**
   * Retrieves all {@link Station} objects specified by a list of station names and
   * time range bounding the station.
   * If the list is empty, the server will return an empty list of stations.
   *
   * @param request The collections of station names and time range of the stations
   * @return list of {@link Station} objects
   */
  @Path("/stations/query/names-timerange")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "retrieves all stations specified by a list of station names and time range")
  List<Station> findStationsByNameAndTimeRange(
    @RequestBody(description = "List of station names and time range", required = true)
      StationsTimeRangeRequest request);


  /**
   * Retrieves the times at which the provided {@link Station} and any of its aggregate objects changed, within the
   * provided time range.
   * @param request the {@link Station} and bounding time range
   * @return a collection of {@link Instant}s representing times when new versions of the {@link Station} and/or any
   * of its aggregate objects became effective
   */
  @Path("stations/query/change-times")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "retrieves all times that a station or any of its aggregate members changed")
  List<Instant> determineStationChangeTimes(
    @RequestBody(description = "Station and the start and end time range", required = true)
      StationChangeTimesRequest request);


}
