package gms.dataacquisition.stationreceiver.cd11.dataman;

import static com.google.common.base.Preconditions.checkNotNull;

import gms.core.dataacquisition.receiver.DataFrameReceiverConfiguration;
import gms.dataacquisition.stationreceiver.cd11.dataman.configuration.DataManConfig;
import gms.shared.frameworks.common.annotations.Component;
import gms.shared.frameworks.control.ControlContext;
import gms.shared.frameworks.control.ControlFactory;
import gms.shared.frameworks.osd.coi.waveforms.AcquisitionProtocol;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.kafka.KafkaConfiguration;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import javax.ws.rs.Path;
import org.slf4j.LoggerFactory;


/**
 * Service class responsible for mapping component information to allow configuration and control
 * frameworks to setup appropriately
 */
@Component("dataman")
@Path("/da-dataman")
public class Cd11DataManService {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(Cd11DataManService.class));

  private final Cd11DataManager dataMan;

  public Cd11DataManService(Cd11DataManager dataMan) {
    this.dataMan = dataMan;
  }

  public static Cd11DataManService create(ControlContext context) {
    checkNotNull(context, "Cannot create Cd11DataManService from null context");

    logger.info("Initializing Configuration...");
    SystemConfig systemConfig = context.getSystemConfig();

    // DataManConfig setup using processing config
    DataManConfig dataManConfig = DataManConfig
        .create(context.getProcessingConfigurationConsumerUtility(),
            systemConfig.getValueAsInt("cd11-dataconsumer-baseport"));

    // DataFrameReceiverConfiguration setup using processing and system config
    DataFrameReceiverConfiguration dataFrameReceiverConfiguration = DataFrameReceiverConfiguration
        .create(AcquisitionProtocol.CD11, context.getProcessingConfigurationRepository(),
            systemConfig);

    // ReactorKafkaConfiguration using system config
    KafkaConfiguration kafkaConfiguration = KafkaConfiguration
        .create(systemConfig);

    logger.info("Initializing Cd11 Data Manager...");
    Cd11DataManager dataMan = Cd11DataManager
        .create(dataManConfig, dataFrameReceiverConfiguration, kafkaConfiguration);

    logger.info("Cd11 Data Manager Successfully Initialized");
    return new Cd11DataManService(dataMan);
  }

  public Cd11DataManager getDataMan() {
    return dataMan;
  }

  public static void main(String[] args) {

    Cd11DataManager dataMan = ControlFactory.runService(Cd11DataManService.class).getDataMan();
    try {
      logger.info("Initializing Data Manager...");
      dataMan.initialize();
      logger.info("Initialization Complete");
      logger.info("Starting Data Manager");
      dataMan.start();
      Runtime.getRuntime().addShutdownHook(new Thread(dataMan::shutdown));
    } catch (Exception e) {
      logger.error("DataMan encountered an unrecoverable exception: ", e);
      System.exit(1);
    }
  }
}
