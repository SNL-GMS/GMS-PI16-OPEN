package gms.shared.signaldetection.manager;

import gms.shared.frameworks.client.generation.ClientGenerator;
import gms.shared.frameworks.control.ControlContext;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.signaldetection.api.SignalDetectionAccessorInterface;
import gms.shared.signaldetection.api.SignalDetectionManagerInterface;
import gms.shared.signaldetection.api.request.DetectionsWithSegmentsByStationsAndTimeRequest;
import gms.shared.signaldetection.api.response.SignalDetectionsWithChannelSegments;
import gms.shared.signaldetection.cache.util.SignalDetectionCacheFactory;
import gms.shared.signaldetection.factory.SignalDetectionAccessorFactory;
import gms.shared.stationdefinition.accessor.StationDefinitionManager;
import gms.shared.stationdefinition.api.StationDefinitionManagerInterface;
import gms.shared.stationdefinition.database.connector.factory.StationDefinitionDatabaseConnectorFactory;
import gms.shared.stationdefinition.factory.StationDefinitionAccessorFactory;
import gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.shared.utilities.logging.TimingLogger;
import gms.shared.waveform.accessor.WaveformAccessorFactory;
import gms.shared.waveform.repository.BridgedWaveformRepositoryFactory;
import org.slf4j.LoggerFactory;

import java.util.Objects;

public class SignalDetectionManager implements SignalDetectionManagerInterface {

  private static final String STATION_DEFINITION_PERSISTENCE_UNIT = "gms_station_definition";
  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(StationDefinitionManager.class));
  private static final TimingLogger<SignalDetectionsWithChannelSegments> timingLoggerSignalDetections = TimingLogger.create(logger);
  private final SignalDetectionAccessorInterface accessor;

  SignalDetectionManager(SignalDetectionAccessorInterface accessor) {
    this.accessor = accessor;
  }

  public static SignalDetectionManager create(ControlContext context) {
    Objects.requireNonNull(context);

    var bridgeConfig =
      SignalDetectionBridgeConfiguration.create(context.getProcessingConfigurationConsumerUtility());
    var stationDefinitionSystemConfig = SystemConfig.create("station-definition");
    SystemConfig systemConfig = context.getSystemConfig();
    var stationDefinitionEmf =
      BridgedEntityManagerFactoryProvider.create()
        .getEntityManagerFactory(STATION_DEFINITION_PERSISTENCE_UNIT,
          stationDefinitionSystemConfig.getValue(BridgedEntityManagerFactoryProvider.JDBC_URL_CONFIG_KEY),
          systemConfig);

    var stationDefinitionAccessorFactory =
      StationDefinitionAccessorFactory.create(StationDefinitionDatabaseConnectorFactory.create(stationDefinitionEmf));

    var waveformSystemConfig = SystemConfig.create("waveform-manager");
    var waveformAccessorFactory = WaveformAccessorFactory.create(waveformSystemConfig,
      BridgedWaveformRepositoryFactory.create(BridgedEntityManagerFactoryProvider.create()
          .getEntityManagerFactory(STATION_DEFINITION_PERSISTENCE_UNIT,
            waveformSystemConfig.getValue(BridgedEntityManagerFactoryProvider.JDBC_URL_CONFIG_KEY),
            systemConfig),
        ClientGenerator.createClient(StationDefinitionManagerInterface.class)),
      stationDefinitionAccessorFactory);
    SignalDetectionCacheFactory.setUpCache(systemConfig);
    var factory = SignalDetectionAccessorFactory.create(
      stationDefinitionAccessorFactory,
      bridgeConfig.getCurrentSignalDetectionBridgeDefinition(),
      BridgedEntityManagerFactoryProvider.create(),
      systemConfig,
      waveformAccessorFactory);


    return new SignalDetectionManager(factory.getSignalDetectionAccessorInstance());
  }

  @Override
  public SignalDetectionsWithChannelSegments findDetectionsWithSegmentsByStationsAndTime(
    DetectionsWithSegmentsByStationsAndTimeRequest request) {
    Objects.requireNonNull(request, "Request cannot be null");

    return timingLoggerSignalDetections.apply("findDetectionsWithSegmentsByStationsAndTime",
      () -> accessor.findWithSegmentsByStationsAndTime(request.getStations(),
        request.getStartTime(),
        request.getEndTime(),
        request.getStageId(),
        request.getExcludedSignalDetections()));
  }

}
