package gms.shared.workflow.api;

import gms.shared.frameworks.common.ContentType;
import gms.shared.frameworks.common.annotations.Component;
import gms.shared.workflow.api.requests.StageIntervalsByStageIdAndTimeRequest;
import gms.shared.workflow.api.requests.UpdateActivityIntervalStatusRequest;
import gms.shared.workflow.api.requests.UpdateInteractiveAnalysisStageIntervalStatusRequest;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import java.util.List;
import java.util.Map;

@Component("workflow-manager")
@Path("/workflow-manager-service/workflow-manager")
public interface WorkflowManagerInterface {

  @Consumes(ContentType.JSON_NAME)
  @Path("/workflow-definition")
  @POST
  @Operation(description = "Get the Workflow definition")
  @Produces(ContentType.JSON_NAME)
    //Need placeholder because service framework expects an argument
  Workflow getWorkflowDefinition(String placeholder);

  @Consumes(ContentType.JSON_NAME)
  @Path("/interval/stage/query/ids-timerange")
  @POST
  @Operation(description = "Retrieves and returns Stage Intervals matching the set of stage names and time range" +
    " in the provided request body.")
  Map<String, List<StageInterval>> findStageIntervalsByStageIdAndTime(
    @RequestBody(description = "List of stage names and time range") StageIntervalsByStageIdAndTimeRequest request);

  @Consumes(ContentType.JSON_NAME)
  @Path("/interval/stage/interactive-analysis/update")
  @POST
  @Operation(description = "Updates the stage interval matching the provided ID with the provided status.")
  void updateInteractiveAnalysisStageIntervalStatus(UpdateInteractiveAnalysisStageIntervalStatusRequest request);

  @Consumes(ContentType.JSON_NAME)
  @Path("/interval/activity/update")
  @POST
  @Operation(description = "Updates the activity interval whose metadata matches the provided activity ID and stage ID with the provided status.")
  void updateActivityIntervalStatus(UpdateActivityIntervalStatusRequest request);
}
