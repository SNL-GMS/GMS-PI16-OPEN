package gms.shared.signaldetection.api;

import gms.shared.frameworks.common.ContentType;
import gms.shared.frameworks.common.annotations.Component;
import gms.shared.signaldetection.api.request.DetectionsWithSegmentsByStationsAndTimeRequest;
import gms.shared.signaldetection.api.response.SignalDetectionsWithChannelSegments;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

@Component("signal-detection")
@Path("/signal-detection-manager-service/signal-detection")
public interface SignalDetectionManagerInterface {

  /**
   * Retrieves {@link SignalDetectionsWithChannelSegments} based on the stations, time range, stage id and excluded
   * {@link SignalDetection}s in the request.
   * @param request The {@link DetectionsWithSegmentsByStationsAndTimeRequest} defining the request parameters
   * @return The {@link SignalDetectionsWithChannelSegments} satisfying the request parameters
   */
  @Path("/signal-detections-with-channel-segments/query/stations-timerange")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "retrieves all signal detections and associated with channel segments specified by the provided " +
    "stations, time range, stage, and excluding all signal detections having any of the provided signal detection ids")
  SignalDetectionsWithChannelSegments findDetectionsWithSegmentsByStationsAndTime(@RequestBody(description = "A list of " +
    "stations, a time range, stage id, and signal detection ids to exclude", required = true)
    DetectionsWithSegmentsByStationsAndTimeRequest request);

}

