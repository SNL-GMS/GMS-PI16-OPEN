package gms.shared.stationdefinition.api.channel;

import gms.shared.frameworks.common.ContentType;
import gms.shared.stationdefinition.api.channel.util.ResponseTimeFacetRequest;
import gms.shared.stationdefinition.api.channel.util.ResponseTimeRangeRequest;
import gms.shared.stationdefinition.coi.channel.Response;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import java.util.List;

public interface ResponseManagerInterface {
  /**
   * Returns a list of {@link Response} objects that corresponds to the list of Response Ids passed in.
   * <p>
   * If no ids are passed into this interface, an empty list of Responses is returned.
   * if no time is provided to the optional effectiveTime, the time of request is the default
     * if no faceting definition is provided, FAP is faceted by ID
   * @param request a request object with optional time and optional faceting definition
   * @return list of all {@link Response} objects for the given set of Response ids.
   */
  @Path("/response/query/ids")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "retrieves all Responses specified by a list of Response ids")
  List<Response> findResponsesById(
    @RequestBody(description = "list of Response ids", required = true)
      ResponseTimeFacetRequest request);

  /**
   * Returns a list of {@link Response} objects that correspond to the list of Response ids passed
   * in that lie in the requested time range
   *
   * If no ids are passed into the interface, an empty list of Responses is returned.
   * @param request a {@link ResponseTimeRangeRequest} object with ids and time range
   * @return list of all {@link Response} objects for the given ids and time range
   */
  @Path("/response/query/ids-timerange")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "retrieves all responses specified by a list of response ids and time range")
  List<Response> findResponsesByIdAndTimeRange(
    @RequestBody(description = "List of response ids and time range", required = true)
      ResponseTimeRangeRequest request);
}
