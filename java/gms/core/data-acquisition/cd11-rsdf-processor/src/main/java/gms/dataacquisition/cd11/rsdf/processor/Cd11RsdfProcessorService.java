package gms.dataacquisition.cd11.rsdf.processor;

import static com.google.common.base.Preconditions.checkNotNull;

import gms.core.dataacquisition.receiver.DataFrameReceiverConfiguration;
import gms.shared.frameworks.common.annotations.Component;
import gms.shared.frameworks.control.ControlContext;
import gms.shared.frameworks.control.ControlFactory;
import gms.shared.frameworks.osd.coi.waveforms.AcquisitionProtocol;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.kafka.KafkaConfiguration;
import javax.ws.rs.Path;

/**
 * Service class responsible for mapping component information to allow configuration and control
 * frameworks to setup appropriately
 */
@Component("cd11-rsdf-processor")
@Path("/cd11-rsdf-processor")
public class Cd11RsdfProcessorService {

  private final Cd11RsdfProcessor cd11RsdfProcessor;

  public Cd11RsdfProcessorService(Cd11RsdfProcessor processor) {
    this.cd11RsdfProcessor = processor;
  }

  public static Cd11RsdfProcessorService create(ControlContext context) {
    checkNotNull(context, "Cannot create Cd11RsdfProcessorService from null context");

    SystemConfig systemConfig = context.getSystemConfig();

    KafkaConfiguration kafkaConfiguration = KafkaConfiguration
        .create(systemConfig);
    DataFrameReceiverConfiguration dataFrameReceiverConfiguration = DataFrameReceiverConfiguration
        .create(AcquisitionProtocol.CD11, context.getProcessingConfigurationRepository(),
            systemConfig);

    return new Cd11RsdfProcessorService(
        ReactorCd11RsdfProcessor.create(kafkaConfiguration, dataFrameReceiverConfiguration));
  }

  public Cd11RsdfProcessor getCd11RsdfProcessor() {
    return cd11RsdfProcessor;
  }

  public static void main(String[] args) {
    Cd11RsdfProcessor cd11RsdfProcessor = ControlFactory.runService(Cd11RsdfProcessorService.class)
        .getCd11RsdfProcessor();

    cd11RsdfProcessor.run();
  }
}
