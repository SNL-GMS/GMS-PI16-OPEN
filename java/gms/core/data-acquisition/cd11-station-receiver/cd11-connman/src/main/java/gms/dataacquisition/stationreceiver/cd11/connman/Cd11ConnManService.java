package gms.dataacquisition.stationreceiver.cd11.connman;

import static com.google.common.base.Preconditions.checkNotNull;

import gms.dataacquisition.stationreceiver.cd11.connman.configuration.Cd11ConnManConfig;
import gms.shared.frameworks.common.annotations.Component;
import gms.shared.frameworks.control.ControlContext;
import gms.shared.frameworks.control.ControlFactory;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import javax.ws.rs.Path;
import org.slf4j.LoggerFactory;

@Component("connman")
@Path("/da-connman")
public class Cd11ConnManService {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
          .create(LoggerFactory.getLogger(Cd11ConnManService.class));

  private final Cd11ConnMan cd11ConnMan;

  private Cd11ConnManService(Cd11ConnMan connMan) {
    this.cd11ConnMan = connMan;
  }

  /**
   * Create {@link Cd11ConnManService} from a {@link ControlContext}
   *
   * @param context the control context, not null
   * @return an instance of Cd11ConnManService
   */
  public static Cd11ConnManService create(ControlContext context) {
    checkNotNull(context, "Cannot create Cd11ConnManService from null context");

    logger.info("Retrieving Configuration...");
    SystemConfig systemConfig = context.getSystemConfig();
    Cd11ConnManConfig cd11ConnManConfig = Cd11ConnManConfig
        .create(context.getProcessingConfigurationConsumerUtility(),
            systemConfig.getValueAsInt("cd11-dataconsumer-baseport"));

    logger.info("Initializing Cd11 Connection Manager...");
    ReactorCd11ConnMan connMan = ReactorCd11ConnMan
        .create(context.getSystemConfig(), cd11ConnManConfig);

    logger.info("Connection Manager Successfully Initialized");
    return new Cd11ConnManService(connMan);
  }

  public Cd11ConnMan getCd11ConnMan() {
    return cd11ConnMan;
  }

  public static void main(String[] args) {
    Cd11ConnMan cd11ConnMan = ControlFactory.runService(Cd11ConnManService.class).getCd11ConnMan();

    logger.info("Starting Connection Manager");
    cd11ConnMan.start();
  }
}
