package gms.core.performancemonitoring.ssam.control.api;

import gms.core.performancemonitoring.ssam.control.config.StationSohMonitoringUiClientParameters;
import gms.shared.frameworks.common.ContentType;
import gms.shared.frameworks.common.annotations.Component;
import gms.shared.frameworks.systemconfig.SystemConfig;
import io.swagger.v3.oas.annotations.Operation;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;


@Component("station-soh-analysis-manager")
@Path("/ssam-control")
public interface StationSohAnalysisManager {

  /**
   * Get the display parameters for SOH Monitoring data.
   * @return The display parameters for SOH Monitoring data.
   */
  @Consumes(ContentType.JSON_NAME)
  @Path("/retrieve-station-soh-monitoring-ui-client-parameters")
  @POST
  @Operation(description = "Get the display parameters for SOH Monitoring data.")
  @Produces(ContentType.JSON_NAME)
  //Need placeholder because service framework expects an argument
  StationSohMonitoringUiClientParameters resolveStationSohMonitoringUiClientParameters(String placeholder);

  @Consumes(ContentType.JSON_NAME)
  @Path("/retrieve-decimated-historical-station-soh")
  @POST
  @Operation(description = "Retrieve decimated historical SOH data for a station, for a single monitor type")
  @Produces(ContentType.MSGPACK_NAME)
  HistoricalStationSohAnalysisView retrieveDecimatedHistoricalStationSoh(
      DecimationRequestParams decimationRequestParams);

  /**
   * Perform initialization sequence and start up long-running processes such as
   * the Kafka Consumers and Produces for creating the UI Materialized View.
   */
  void start();

  /**
   * get system config object that was used to configure this service
   *
   * @return SystemConfig object that was used to configure the service
   */
  SystemConfig getSystemConfig();
}
