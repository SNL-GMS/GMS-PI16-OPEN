package gms.core.performancemonitoring.ssam.control;

import static com.google.common.base.Preconditions.checkNotNull;

import com.google.common.collect.Lists;
import gms.core.performancemonitoring.soh.control.configuration.StationSohDefinition;
import gms.core.performancemonitoring.ssam.control.api.DecimationRequestParams;
import gms.core.performancemonitoring.ssam.control.api.HistoricalStationSohAnalysisView;
import gms.core.performancemonitoring.ssam.control.api.StationSohAnalysisManager;
import gms.core.performancemonitoring.ssam.control.config.StationSohMonitoringDefinition;
import gms.core.performancemonitoring.ssam.control.config.StationSohMonitoringUiClientParameters;
import gms.core.performancemonitoring.uimaterializedview.QuietedSohStatusChangeUpdate;
import gms.shared.frameworks.control.ControlContext;
import gms.shared.frameworks.osd.api.OsdRepositoryInterface;
import gms.shared.frameworks.osd.api.util.HistoricalStationSohRequest;
import gms.shared.frameworks.osd.coi.signaldetection.StationGroup;
import gms.shared.frameworks.osd.coi.soh.CapabilitySohRollup;
import gms.shared.frameworks.osd.coi.soh.StationSoh;
import gms.shared.frameworks.osd.coi.soh.quieting.QuietedSohStatusChange;
import gms.shared.frameworks.osd.coi.soh.quieting.UnacknowledgedSohStatusChange;
import gms.shared.frameworks.osd.coi.systemmessages.SystemMessage;
import gms.shared.frameworks.osd.dto.soh.HistoricalStationSoh;
import gms.shared.frameworks.osd.repository.OsdRepositoryFactory;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.EmitterProcessor;
import reactor.core.publisher.Mono;
import reactor.kafka.sender.KafkaSender;
import reactor.kafka.sender.SenderOptions;

/**
 * ReactiveStationSohAnalysisManager(SSAM) is responsible for controlling computation needed for the
 * UI including station acknowledgement and quieting.  SSAM tracks changes to quiet and acknowledge
 * stations and publishes to the ui-materialized-view kafka topic.  SSAM also publishes Station SOH
 * related status messages to be viewed using SystemMessagesDisplay.
 */
public class ReactiveStationSohAnalysisManager implements StationSohAnalysisManager {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(ReactiveStationSohAnalysisManager.class));

  public static final String KAFKA_BOOTSTRAP_SERVERS = "kafka-bootstrap-servers";

  private final StationSohAnalysisManagerConfiguration processingConfig;
  private final SystemConfig systemConfig;

  // Set to true in start(), back to false in stop()
  private volatile boolean active = false;

  // Initialized in startKafkaConsumersAndProducer()
  private KafkaSender<String, String> kafkaSender;


  ReactiveStationSohAnalysisManager(StationSohAnalysisManagerConfiguration processingConfig,
      SystemConfig systemConfig
  ) {
    this.processingConfig = processingConfig;
    this.systemConfig = systemConfig;
  }

  /**
   * Factory Method for {@link StationSohAnalysisManager}
   *
   * @param controlContext access to externalized dependencies.
   * @return {@link ReactiveStationSohAnalysisManager}
   */
  public static ReactiveStationSohAnalysisManager create(ControlContext controlContext) {
    checkNotNull(controlContext);

    StationSohAnalysisManagerConfiguration stationSohAnalysisManagerConfiguration =
        StationSohAnalysisManagerConfiguration.create(
            controlContext.getProcessingConfigurationConsumerUtility(),
            OsdRepositoryFactory.createOsdRepository(controlContext.getSystemConfig()));

    return new ReactiveStationSohAnalysisManager(
        stationSohAnalysisManagerConfiguration,
        controlContext.getSystemConfig());
  }

  /**
   * Starts the control. This method should perform any time-consuming initialization steps and
   * start long-running background processes, if any. It should not run indefinitely, but should
   * return within a reasonable amount of time of not more than a few seconds.
   */
  public synchronized void start() {

    if (active) {
      throw new IllegalStateException("control is already active");
    }

    try {

      active = true;

      // Initialize from OSD on start
      var cachePullStart = Instant.now();
      logger.debug("Starting cache initializing at {}", cachePullStart);

      initializeFromOsd(dataContainer -> {
        Duration cacheFinish = Duration.between(cachePullStart, Instant.now());
        logger.debug("Cache initialization completed at {}", cacheFinish);

        //
        // Start the various providers and publishers
        //
        logger.info("Starting providers and publishers");
        startProvidersAndPublishers(
            dataContainer
        );
      });

      // Register a shutdown hook to stop the control.
      Runtime.getRuntime().addShutdownHook(new Thread(this::stop));
    } catch (RuntimeException rte) {

      // This is most likely a NullPointerException from a configuration variable not being set
      // or some other kind of unchecked exception. Rather than letting such exceptions bubble up
      // to crash the application and hence the docker container, which will just restart, crash
      // again, restart, crash again..., log the error so people can look in the container log
      // and diagnosis the problem.
      logger.error("Error starting the control", rte);
    }
  }

  /**
   * Does the reverse of start().
   */
  public synchronized void stop() {
    logger.info("Stopping services");
    if (active) {
      try {
        if (kafkaSender != null) {
          kafkaSender.close();
        }
      } finally {
        kafkaSender = null;
        active = false;
      }
    }
  }

  @Override
  public StationSohMonitoringUiClientParameters resolveStationSohMonitoringUiClientParameters(
      String placeholder) {
    return this.processingConfig.resolveDisplayParameters();
  }

  @Override
  public HistoricalStationSohAnalysisView retrieveDecimatedHistoricalStationSoh(
      DecimationRequestParams decimationRequestParams) {

    return DecimationUtility.decimateHistoricalStationSoh(
        decimationRequestParams,
        getHistoricalStationSoh(decimationRequestParams,
            this.processingConfig.getSohRepositoryInterface())
    );
  }

  @Override
  public SystemConfig getSystemConfig() {
    return this.systemConfig;
  }

  /**
   * Start up all of our providers and publishes so that we can receive things and publish things.
   *
   * @param dataContainer DataContainer convenience object that wraps all of our preloaded data
   */
  private void startProvidersAndPublishers(DataContainer dataContainer) {

    kafkaSender = KafkaSender.create(senderOptions(systemConfig));

    var stationGroups = processingConfig.stationGroups();

    var systemMessageEmitterProcessor = EmitterProcessor.<SystemMessage>create();

    var unacknowledgedSohStatusChangeEmitterProcessor = EmitterProcessor
        .<UnacknowledgedSohStatusChange>create();

    var quietedPublisherProcessor = EmitterProcessor.<QuietedSohStatusChangeUpdate>create();

    var reactiveKafkaUtility = new SsamReactiveKafkaUtility(
        kafkaSender,
        unacknowledgedSohStatusChangeEmitterProcessor,
        quietedPublisherProcessor,
        systemMessageEmitterProcessor,
        processingConfig,
        systemConfig
    );

    startProvidersAndPublishers(
        reactiveKafkaUtility,
        dataContainer,
        stationGroups
    );

  }

  /**
   * Private helper method intended to be used inside the decimate call. Method will return a Map of
   * SohMonitorType to HistoricalStationSoh
   *
   * @param decimationRequestParams the decimationRequestParams
   * @return Map<SohMonitorType, HistoricalStationSoh> HistoricalStationSohData
   */
  static HistoricalStationSoh getHistoricalStationSoh(
      DecimationRequestParams decimationRequestParams,
      OsdRepositoryInterface osdRepositoryInterface) {

    return osdRepositoryInterface.retrieveHistoricalStationSoh(
        HistoricalStationSohRequest.create(
            decimationRequestParams.getStationName(),
            decimationRequestParams.getStartTime(),
            decimationRequestParams.getEndTime(),
            decimationRequestParams.getSohMonitorType()
        )
    );
  }

  static SenderOptions<String, String> senderOptions(SystemConfig systemConfig) {
    var properties = new HashMap<String, Object>();
    properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,
        systemConfig.getValue(KAFKA_BOOTSTRAP_SERVERS));
    properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
    properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
    properties.put(ProducerConfig.LINGER_MS_CONFIG, 0);
    // By default, a producer doesn't wait for an acknowledgement from kafka when it sends
    // a message to a topic. Setting it to "1" means that it will wait for at least one kafka
    // node to acknowledge. The safest is "all", but that makes sending a little slower.
    properties.put(ProducerConfig.ACKS_CONFIG, "0");
    return SenderOptions.create(properties);
  }


  private void initializeFromOsd(Consumer<DataContainer> dataContainerConsumer) {
    ReactiveStationSohAnalysisManager.initializeFromOsd(dataContainerConsumer, this.processingConfig);
  }

  static void initializeFromOsd(Consumer<DataContainer> dataContainerConsumer,
      StationSohAnalysisManagerConfiguration stationSohAnalysisManagerConfiguration) {

    var stationSohMonitoringDefinition =
        stationSohAnalysisManagerConfiguration.resolveDisplayParameters().getStationSohControlConfiguration();

    var osdRepositoryInterface =
        stationSohAnalysisManagerConfiguration.getSohRepositoryInterface();

    //
    // Calling Mono.just with the method calls will call them immediately and block, we want to
    // parallelize them. So using Mono.just(true).
    //

    var stationSohMono = Mono.just(true).map(
        b ->
            initializeCurrentStationSoh(
                stationSohMonitoringDefinition, osdRepositoryInterface
            )
    );

    var capabilityMono = Mono.just(true).map(
        b ->
            initializeCurrentCapabilitySohRollups(
                stationSohMonitoringDefinition, osdRepositoryInterface
            )
    );

    var quietedStatusChangeMono = Mono.just(true).map(
        b ->
            initializeQuietedSohStatusChanges(
                osdRepositoryInterface
            )
    );

    var unackStatusChangeMono = Mono.just(true).map(
        b ->
            initializeUnacknowledgedSohStatusChanges(
                stationSohMonitoringDefinition, osdRepositoryInterface
            )
    );

    Mono.zip(stationSohMono, capabilityMono, quietedStatusChangeMono, unackStatusChangeMono)
        .subscribe(
            tuple -> dataContainerConsumer.accept(new DataContainer(
                tuple.getT1(),
                tuple.getT2(),
                tuple.getT3(),
                tuple.getT4()
            ))
        );
  }

  static void startProvidersAndPublishers(
      SsamReactiveKafkaUtility ssamReactiveKafkaUtility,
      DataContainer dataContainer,
      List<StationGroup> stationGroups
  ) {

    ssamReactiveKafkaUtility.startSohQuietAndUnacknowledgedCacheManager(
        dataContainer.quietedSohStatusChanges,
        dataContainer.unacknowledgedSohStatusChanges,
        dataContainer.latestStationSohByStation.values()
    );

    ssamReactiveKafkaUtility.startSystemMessagesProducer();

    ssamReactiveKafkaUtility.startMaterializedViewProducer(
        dataContainer.latestStationSohByStation,
        dataContainer.latestCapabilitySohRollupByStationGroup,
        stationGroups
    );

    ssamReactiveKafkaUtility.startAcknowledgedMaterializedViewProducer(
        dataContainer.latestStationSohByStation,
        dataContainer.latestCapabilitySohRollupByStationGroup,
        stationGroups
    );

    ssamReactiveKafkaUtility.startQuietedMaterializedViewProducer(
        dataContainer.latestStationSohByStation,
        dataContainer.latestCapabilitySohRollupByStationGroup,
        stationGroups
    );

    ssamReactiveKafkaUtility.startQuietedAndUnackProducers();
  }

  /**
   * Populates the current {@link StationSoh} map for each station contained in the {@link
   * StationSohMonitoringDefinition}.
   */
  static Map<String, StationSoh> initializeCurrentStationSoh(
      StationSohMonitoringDefinition stationSohMonitoringDefinition,
      OsdRepositoryInterface osdRepositoryInterface
  ) {

    var latestStationSohByStation = new ConcurrentHashMap<String, StationSoh>();

    var stationSohDefinitions =
        stationSohMonitoringDefinition.getStationSohDefinitions();

    var stationNames = stationSohDefinitions.stream()
        .map(StationSohDefinition::getStationName)
        .collect(Collectors.toList());

    Lists.partition(stationNames, (stationNames.size() / 4) + 1)
        .stream()
        .parallel()
        .filter(names -> !names.isEmpty())
        .peek(names -> logger.info("Retrieving latest StationSoh for {} stations", names.size()))
        .map(osdRepositoryInterface::retrieveByStationId)
        .flatMap(List::stream)
        .forEach(
            stationSoh -> latestStationSohByStation.put(stationSoh.getStationName(), stationSoh));
    logger.info("StationSoh DB retrieval  returned {} entries.", latestStationSohByStation.size());

    return latestStationSohByStation;
  }

  /**
   * Populates the most current {@link CapabilitySohRollup}s for the configured station groups.
   */
  static Map<String, CapabilitySohRollup> initializeCurrentCapabilitySohRollups(
      StationSohMonitoringDefinition stationSohMonitoringDefinition,
      OsdRepositoryInterface osdRepositoryInterface) {

    var latestCapabilitySohRollupByStationGroup = new ConcurrentHashMap<String, CapabilitySohRollup>();

    var stationGroups = new HashSet<>(
        stationSohMonitoringDefinition.getDisplayedStationGroups());

    List<CapabilitySohRollup> capabilitySohRollups;
    if (stationGroups.isEmpty()) {
      logger.warn("No displayed station groups have been defined");
      capabilitySohRollups = Collections.emptyList();
    } else {
      logger.info("Retrieving CapabilitySohRollups for {} StationGroups", stationGroups.size());
      capabilitySohRollups = osdRepositoryInterface.retrieveLatestCapabilitySohRollupByStationGroup(
          stationGroups);
      logger.info("CapabilitySohRollup DB retrieval returned {} entries.",
          capabilitySohRollups.size());
    }

    for (CapabilitySohRollup capabilitySohRollup : capabilitySohRollups) {
      latestCapabilitySohRollupByStationGroup.put(capabilitySohRollup.getForStationGroup(),
          capabilitySohRollup);
    }

    return latestCapabilitySohRollupByStationGroup;
  }

  /**
   * Retrieves unacknowledged SOH status change events from the db.
   */
  static Set<UnacknowledgedSohStatusChange> initializeUnacknowledgedSohStatusChanges(
      StationSohMonitoringDefinition stationSohMonitoringDefinition,
      OsdRepositoryInterface osdRepositoryInterface) {

    var stationSohDefinitions =
        stationSohMonitoringDefinition.getStationSohDefinitions();

    var stationNames = stationSohDefinitions.stream()
        .map(StationSohDefinition::getStationName)
        .collect(Collectors.toList());

    logger.info("Retrieving UnacknowledgedSohStatusChanges for {} stations", stationNames.size());
    var unacknowledgedSohStatusChanges = !stationNames.isEmpty() ?
        new HashSet<>(osdRepositoryInterface.retrieveUnacknowledgedSohStatusChanges(stationNames)) :
        Collections.<UnacknowledgedSohStatusChange>emptySet();

    logger.info("UnacknowledgedSohStatusChanges DB retrieval returned {} entries.",
        unacknowledgedSohStatusChanges.size());

    return unacknowledgedSohStatusChanges;
  }

  /**
   * Retrieves quieted SOH status changes for the current instant minus the specified duration.
   */
  static Set<QuietedSohStatusChange> initializeQuietedSohStatusChanges(
      OsdRepositoryInterface osdRepositoryInterface
  ) {

    logger.info("Retrieving active QuietedSohStatusChanges");
    var quietedSohStatusChanges =
        new HashSet<>(osdRepositoryInterface.retrieveQuietedSohStatusChangesByTime(Instant.now()));
    logger.info("QuitedSohStatusChange DB retrieval returned {} entries.",
        quietedSohStatusChanges.size());

    return quietedSohStatusChanges;
  }

  static class DataContainer {

    // Cache of latest StationSoh. Should contain the most recent StationSoh for each station being
    // monitored. Initialized at startup from the OSD and kept up to date with StationSoh received
    // from a kafka topic. Keyed by station name.
    final Map<String, StationSoh> latestStationSohByStation;

    // Cache of latest CapabilitySohRollup. Should contain the most recent
    // CapabilitySohRollup for each station group being monitored.
    // Initialized at startup from the OSD and kept up to date with CapabilitySohRollup
    // received from a kafka topic. Keyed by station group name.
    final Map<String, CapabilitySohRollup> latestCapabilitySohRollupByStationGroup;

    // Contains quieted Soh status changes. Initialized from the OSD at
    // startup and used in the list manager initialization.
    final Set<QuietedSohStatusChange> quietedSohStatusChanges;

    // Contains unacknowledged SohStatus changes. This is initialized from
    // the OSD at startup and used in the list manager initialization.
    final Set<UnacknowledgedSohStatusChange> unacknowledgedSohStatusChanges;

    DataContainer(
        Map<String, StationSoh> latestStationSohByStation,
        Map<String, CapabilitySohRollup> latestCapabilitySohRollupByStationGroup,
        Set<QuietedSohStatusChange> quietedSohStatusChanges,
        Set<UnacknowledgedSohStatusChange> unacknowledgedSohStatusChanges) {
      this.latestStationSohByStation = latestStationSohByStation;
      this.latestCapabilitySohRollupByStationGroup = latestCapabilitySohRollupByStationGroup;
      this.quietedSohStatusChanges = quietedSohStatusChanges;
      this.unacknowledgedSohStatusChanges = unacknowledgedSohStatusChanges;
    }
  }
}
