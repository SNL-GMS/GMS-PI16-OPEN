package gms.core.performancemonitoring.ssam.control;

import static gms.core.performancemonitoring.ssam.control.KafkaTopicConfigurationKeys.ACKNOWLEDGED_SOH_STATUS_CHANGE_INPUT_TOPIC_KEY;
import static gms.core.performancemonitoring.ssam.control.KafkaTopicConfigurationKeys.CAPABILITY_SOH_ROLLUP_INPUT_TOPIC_KEY;
import static gms.core.performancemonitoring.ssam.control.KafkaTopicConfigurationKeys.QUIETED_SOH_STATUS_CHANGE_INPUT_TOPIC_KEY;
import static gms.core.performancemonitoring.ssam.control.KafkaTopicConfigurationKeys.SOH_SYSTEM_MESSAGE_OUTPUT_TOPIC_KEY;
import static gms.core.performancemonitoring.ssam.control.KafkaTopicConfigurationKeys.STATION_SOH_ANALYSIS_VIEW_OUTPUT_TOPIC_KEY;
import static gms.core.performancemonitoring.ssam.control.KafkaTopicConfigurationKeys.STATION_SOH_INPUT_TOPIC_KEY;
import static gms.core.performancemonitoring.ssam.control.KafkaTopicConfigurationKeys.STATION_SOH_QUIETED_OUTPUT_TOPIC_KEY;
import static gms.core.performancemonitoring.ssam.control.KafkaTopicConfigurationKeys.STATION_SOH_STATUS_CHANGE_OUTPUT_TOPIC_KEY;

import com.google.auto.value.AutoOneOf;
import gms.core.performancemonitoring.ssam.control.SsamReactiveKafkaUtility.SohWrapper.SohType;
import gms.core.performancemonitoring.ssam.control.dataprovider.KafkaConsumer;
import gms.core.performancemonitoring.ssam.control.dataprovider.ReactiveConsumerBuilder;
import gms.core.performancemonitoring.ssam.control.datapublisher.KafkaProducer;
import gms.core.performancemonitoring.ssam.control.datapublisher.ReactiveProducerBuilder;
import gms.core.performancemonitoring.ssam.control.processor.AcknowledgeSohStatusChangeMaterializedViewProcessor;
import gms.core.performancemonitoring.ssam.control.processor.MaterializedViewProcessor;
import gms.core.performancemonitoring.ssam.control.processor.QuietedSohStatusChangeUpdateMaterializedViewProcessor;
import gms.core.performancemonitoring.uimaterializedview.AcknowledgedSohStatusChange;
import gms.core.performancemonitoring.uimaterializedview.QuietedSohStatusChangeUpdate;
import gms.core.performancemonitoring.uimaterializedview.SohQuietAndUnacknowledgedCacheManager;
import gms.core.performancemonitoring.uimaterializedview.UiStationAndStationGroups;
import gms.core.performancemonitoring.uimaterializedview.UiStationSoh;
import gms.shared.frameworks.osd.coi.signaldetection.StationGroup;
import gms.shared.frameworks.osd.coi.soh.CapabilitySohRollup;
import gms.shared.frameworks.osd.coi.soh.StationSoh;
import gms.shared.frameworks.osd.coi.soh.quieting.QuietedSohStatusChange;
import gms.shared.frameworks.osd.coi.soh.quieting.UnacknowledgedSohStatusChange;
import gms.shared.frameworks.osd.coi.systemmessages.SystemMessage;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.EmitterProcessor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.FluxSink;
import reactor.core.scheduler.Schedulers;
import reactor.kafka.sender.KafkaSender;

/**
 * Utility class (that gets instantiated) containing the bulk of SSAM controls Kafka and Reactive
 * functionality (like creating Kafka consumers and producers and the Fluxes associated with them)
 */
class SsamReactiveKafkaUtility {

  // Uses the legacy logger for now to create timing logs, until the structed logs
  // can be read by the timing scripts
  private static final Logger legacyLogger = LogManager
      .getLogger(SsamReactiveKafkaUtility.class);

  private static final Level TIMING = Level.getLevel("TIMING");

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(SsamReactiveKafkaUtility.class));

  /**
   *  Wrap either a CapabilitySohRollup or StationSoh into an instance of this one class.
   *  This helps greatly with packaging Capability rollups and station sohs together.
   */
  @AutoOneOf(SohWrapper.SohType.class)
  abstract static class SohWrapper {

    public enum SohType {
      CAPABILITY_SOH_ROLLUP,
      STATION_SOH
    }

    public abstract SohType getSohType();

    public Instant wrapperTimeStamp() {
      if (this.getSohType() == SohType.STATION_SOH) {
        return stationSoh().getTime();
      } else {
        return capabilitySohRollup().getTime();
      }
    }

    public abstract StationSoh stationSoh();

    public abstract CapabilitySohRollup capabilitySohRollup();

    public static SohWrapper ofStationSoh(StationSoh stationSoh) {
      return AutoOneOf_SsamReactiveKafkaUtility_SohWrapper.stationSoh(stationSoh);
    }

    public static SohWrapper ofCapabilitySohRollup(CapabilitySohRollup capabilitySohRollup) {
      return AutoOneOf_SsamReactiveKafkaUtility_SohWrapper.capabilitySohRollup(capabilitySohRollup);
    }
  }

  // Initialized in startKafkaConsumersAndProducer()
  private final KafkaSender<String, String> kafkaSender;

  private final EmitterProcessor<SystemMessage> systemMessageEmitterProcessor;
  // Get a single sink for all "sinkers" to use
  private final FluxSink<SystemMessage> systemMessageSink;

  private final EmitterProcessor<QuietedSohStatusChangeUpdate> quietedSohStatusChangeUpdateEmitterProcessor;
  // Get a single sink for all "sinkers" to use
  private final FluxSink<QuietedSohStatusChangeUpdate> quietedSohStatusChangeUpdateSink;

  private final EmitterProcessor<UnacknowledgedSohStatusChange> unacknowledgedSohStatusChangeEmitterProcessor;

  private final StationSohAnalysisManagerConfiguration processingConfig;
  private final SystemConfig systemConfig;

  // The builder that will build all of our producers
  private final ReactiveProducerBuilder reactiveProducerBuilder;

  //The builder that will build all of our consumers
  private final ReactiveConsumerBuilder reactiveConsumerBuilder;


  // List manager to handle unacknowledged and quieted states needed for the
  // UiStationAndStationGroupGenerator class
  private SohQuietAndUnacknowledgedCacheManager sohQuietAndUnacknowledgedCacheManager;

  /**
   * Create a new instance of the utility
   *
   * @param kafkaSender Sender to use for pubishing to Kafka
   * @param unacknowledgedSohStatusChangeEmitterProcessor Processor that will be used to generate
   * unacknowledged status changes
   * @param quietedSohStatusChangeUpdateEmitterProcessor Processor that will be used to generate quieted status changes
   * @param systemMessageEmitterProcessor Processor that will be used to publish system messages
   * @param processingConfig processing configuration
   * @param systemConfig system configuration
   */
  public SsamReactiveKafkaUtility(
      KafkaSender<String, String> kafkaSender,
      EmitterProcessor<UnacknowledgedSohStatusChange> unacknowledgedSohStatusChangeEmitterProcessor,
      EmitterProcessor<QuietedSohStatusChangeUpdate> quietedSohStatusChangeUpdateEmitterProcessor,
      EmitterProcessor<SystemMessage> systemMessageEmitterProcessor,
      StationSohAnalysisManagerConfiguration processingConfig,
      SystemConfig systemConfig) {

    this.kafkaSender = kafkaSender;
    this.unacknowledgedSohStatusChangeEmitterProcessor = unacknowledgedSohStatusChangeEmitterProcessor;
    this.quietedSohStatusChangeUpdateEmitterProcessor = quietedSohStatusChangeUpdateEmitterProcessor;
    this.quietedSohStatusChangeUpdateSink = quietedSohStatusChangeUpdateEmitterProcessor.sink();
    this.processingConfig = processingConfig;
    this.systemConfig = systemConfig;

    this.systemMessageEmitterProcessor = systemMessageEmitterProcessor;
    this.systemMessageSink = systemMessageEmitterProcessor.sink();

    this.reactiveProducerBuilder = KafkaProducer.getBuilder();
    this.reactiveConsumerBuilder = KafkaConsumer.getBuilder(systemConfig);

  }

  /**
   * Create a new instance of the utility. Used for testing, so that the tester can mock Kafka
   * producers and consumers.
   *
   * @param kafkaSender Sender to use for pubishing to Kafka
   * @param unacknowledgedSohStatusChangeEmitterProcessor Processor that will be used to generate
   * unacknowledged status changes
   * @param quietedSohStatusChangeUpdateEmitterProcessor Processor that will be used to generate quieted status changes
   * @param systemMessageEmitterProcessor Processor that will be used to publish system messages
   * @param processingConfig processing configuration
   * @param systemConfig system configuration
   * @param reactiveProducerBuilder Builder for the reactive producers
   * @param reactiveConsumerBuilder Builder for the reactive consumers
   */
  // SonarQube java:S107 Methods should not have too many parameters
  //  There is only one more parameter than 7, and this is used for testing only. That said, we may
  //  want to break up this utility in the future.
  SsamReactiveKafkaUtility(
      KafkaSender<String, String> kafkaSender,
      EmitterProcessor<UnacknowledgedSohStatusChange> unacknowledgedSohStatusChangeEmitterProcessor,
      EmitterProcessor<QuietedSohStatusChangeUpdate> quietedSohStatusChangeUpdateEmitterProcessor,
      EmitterProcessor<SystemMessage> systemMessageEmitterProcessor,
      StationSohAnalysisManagerConfiguration processingConfig,
      SystemConfig systemConfig,
      ReactiveProducerBuilder reactiveProducerBuilder,
      ReactiveConsumerBuilder reactiveConsumerBuilder
  ) {

    this.kafkaSender = kafkaSender;
    this.unacknowledgedSohStatusChangeEmitterProcessor = unacknowledgedSohStatusChangeEmitterProcessor;
    this.quietedSohStatusChangeUpdateEmitterProcessor = quietedSohStatusChangeUpdateEmitterProcessor;
    this.quietedSohStatusChangeUpdateSink = quietedSohStatusChangeUpdateEmitterProcessor.sink();
    this.processingConfig = processingConfig;
    this.systemConfig = systemConfig;

    this.systemMessageEmitterProcessor = systemMessageEmitterProcessor;
    this.systemMessageSink = systemMessageEmitterProcessor.sink();

    this.reactiveProducerBuilder = reactiveProducerBuilder;
    this.reactiveConsumerBuilder = reactiveConsumerBuilder;
  }

  /**
   * Start the internal SohQuietAndUnacknowledgedCacheManager for detecting changes in quiet/unack
   * status
   * @param initialQuietedSohStatusChanges initial set of quiet status changes
   * @param initialUnacknowledgedSohStatusChanges initial set of unack status changes
   * @param initialStationSohs Initial set of station sohs
   */
  void startSohQuietAndUnacknowledgedCacheManager(
      Set<QuietedSohStatusChange> initialQuietedSohStatusChanges,
      Set<UnacknowledgedSohStatusChange> initialUnacknowledgedSohStatusChanges,
      Collection<StationSoh> initialStationSohs
  ) {

    this.sohQuietAndUnacknowledgedCacheManager = new SohQuietAndUnacknowledgedCacheManager(
        initialQuietedSohStatusChanges,
        initialUnacknowledgedSohStatusChanges,
        new ArrayList<>(initialStationSohs),
        this.processingConfig.resolveDisplayParameters(),
        systemMessageSink,
        unacknowledgedSohStatusChangeEmitterProcessor.sink(),
        quietedSohStatusChangeUpdateSink
    );
  }

  /**
   * Start publishing  System Messages provided by systemMessageFlux
   *
   * @param systemMessageFlux Flux of SystemMessage objects to publish
   * @param kafkaSender KafkaSender object
   * @param systemConfig system configuration containing connection info
   */
  void startSystemMessagesProducer() {

    var systemMessagesOutputTopic = SOH_SYSTEM_MESSAGE_OUTPUT_TOPIC_KEY
        .getSystemConfigValue(systemConfig);

    var systemMessageProducer = this.reactiveProducerBuilder.reset()
        .withFlux(systemMessageEmitterProcessor)
        .withSender(this.kafkaSender)
        .withTopic(systemMessagesOutputTopic)
        .build();

    systemMessageProducer.start();
  }

  /**
   * Start the materialized view producer.
   *
   * @param latestStationSohByStation Initial map of stations, by station name
   * @param latestCapabilitySohRollupByStationGroup Initial map of capabiolity rollups, by station
   * group name
   * @param stationGroups Set of configured station groups
   */
  void startMaterializedViewProducer(
      Map<String, StationSoh> latestStationSohByStation,
      Map<String, CapabilitySohRollup> latestCapabilitySohRollupByStationGroup,
      List<StationGroup> stationGroups
  ) {
    var stationSohControlConfiguration = this.processingConfig
        .resolveDisplayParameters()
        .getStationSohControlConfiguration();

    var stationCount = stationSohControlConfiguration.getStationSohDefinitions().size();

    var groupCount = stationSohControlConfiguration.getDisplayedStationGroups().size();

    startMaterializedViewProducer(
        createSohPackageFlux(
            startStateOfHealthConsumers(
                latestStationSohByStation,
                latestCapabilitySohRollupByStationGroup
            ),
            //
            // SohWrapper will wrap either a StationSoh or CapabilitySohRollup. Not neither, and not
            // both. So, there should be a total of (configured stations + configured station groups)
            // SohWrappers for each calculation interval.
            //
            stationCount + groupCount
        ),
        stationGroups
    );
  }

  /**
   * Start the main materialized view processor - the one that contains the most recent state-of-health
   * info from upstream.
   *
   * @param sohPackageFlux Flux of SohCorrelations
   * @param stationGroups The StationGroups we are working with, for reference
   */
  private void startMaterializedViewProducer(
      Flux<SohPackage> sohPackageFlux,
      List<StationGroup> stationGroups
  ) {

    var materializedViewOutputTopic = STATION_SOH_ANALYSIS_VIEW_OUTPUT_TOPIC_KEY
        .getSystemConfigValue(systemConfig);

    var uiStationAndStationGroupsFlux = createMaterializedViewFlux(
        sohPackageFlux,
        sohQuietAndUnacknowledgedCacheManager,
        processingConfig,
        stationGroups,
        systemMessageSink
    );

    var mainMaterializedViewProducer = reactiveProducerBuilder.reset()
        .withFlux(uiStationAndStationGroupsFlux)
        .withSender(this.kafkaSender)
        .withTopic(materializedViewOutputTopic)
        .build();

    mainMaterializedViewProducer.start();
  }

  static Flux<UiStationAndStationGroups> createAcknowledgedMaterializedViewFlux(
      Flux<AcknowledgedSohStatusChange> acknowledgedSohStatusChangeFlux,
      SohQuietAndUnacknowledgedCacheManager sohQuietAndUnacknowledgedCacheManager,
      AcknowledgeSohStatusChangeMaterializedViewProcessor acknowledgeSohStatusChangeMaterializedViewProcessor
  ) {

    return acknowledgedSohStatusChangeFlux
        .doOnNext(sohQuietAndUnacknowledgedCacheManager::addAcknowledgedStationToQuietList)
        .onErrorContinue(
            (throwable, object) ->
                logger.error(
                    "Error with acknowledgement " + object,
                    throwable
                )
        )
        .map(acknowledgeSohStatusChangeMaterializedViewProcessor)
        .flatMap(Flux::fromIterable);
  }

  /**
   * Start the "Acknowledged" materialized view processor, which publishes the materialized view
   * with only acknowledged state-of-health statuses.
   *
   * @param latestStationSohByStation The latest StationSohs, by station name
   * @param latestCapabilitySohRollupByStationGroup The latest CapabilitySohRollups, by group name
   * @param stationGroups The StationGroups we are working with, for reference
   */
  void startAcknowledgedMaterializedViewProducer(
      Map<String, StationSoh> latestStationSohByStation,
      Map<String, CapabilitySohRollup> latestCapabilitySohRollupByStationGroup,
      List<StationGroup> stationGroups
  ) {

    var ackInputTopic = ACKNOWLEDGED_SOH_STATUS_CHANGE_INPUT_TOPIC_KEY
        .getSystemConfigValue(systemConfig);

    var acknowledgedMaterializedViewOutputTopic = STATION_SOH_ANALYSIS_VIEW_OUTPUT_TOPIC_KEY
        .getSystemConfigValue(systemConfig);

    var ackConsumer = reactiveConsumerBuilder
        .withTopic(ackInputTopic)
        .build(AcknowledgedSohStatusChange.class);

    var ackFlux = ackConsumer.getFlux();

    var acknowledgedMaterializedViewProducer = this.reactiveProducerBuilder.reset()
        .withFlux(
            createAcknowledgedMaterializedViewFlux(
                ackFlux,
                sohQuietAndUnacknowledgedCacheManager,
                AcknowledgeSohStatusChangeMaterializedViewProcessor.create(
                    processingConfig.resolveDisplayParameters(),
                    sohQuietAndUnacknowledgedCacheManager,
                    latestStationSohByStation,
                    latestCapabilitySohRollupByStationGroup,
                    systemMessageSink,
                    stationGroups
                )
            )
        )
        .withSender(this.kafkaSender)
        .withTopic(acknowledgedMaterializedViewOutputTopic)
        .build();

    acknowledgedMaterializedViewProducer.start();
  }

  /**
   * Start the "Quieted" materialized view processor, which publishes the materialized view
   * with only quieted state-of-health statuses.
   *
   * @param latestStationSohByStation The latest StationSohs, by station name
   * @param latestCapabilitySohRollupByStationGroup The latest CapabilitySohRollups, by group name
   * @param stationGroups The StationGroups we are working with, for reference
   */
  void startQuietedMaterializedViewProducer(
      Map<String, StationSoh> latestStationSohByStation,
      Map<String, CapabilitySohRollup> latestCapabilitySohRollupByStationGroup,
      List<StationGroup> stationGroups
  ) {

    var quietedInputTopic = QUIETED_SOH_STATUS_CHANGE_INPUT_TOPIC_KEY
        .getSystemConfigValue(systemConfig);

    var quietedMaterializedViewOutputTopic = STATION_SOH_ANALYSIS_VIEW_OUTPUT_TOPIC_KEY
        .getSystemConfigValue(systemConfig);

    var quietedConsumer = reactiveConsumerBuilder
        .withTopic(quietedInputTopic)
        .build(QuietedSohStatusChangeUpdate.class);

    var quietedFlux = quietedConsumer.getFlux()
        .doOnTerminate(quietedSohStatusChangeUpdateSink::complete)
        .doOnNext(quietedSohStatusChangeUpdateSink::next)
        .doOnNext(sohQuietAndUnacknowledgedCacheManager::addQuietSohStatusChange)
        .onErrorContinue(
            (throwable, object) ->
                logger.error(
                    "Error with quieted status change " + object,
                    throwable
                )
        );

    var quietedMaterializedViewProducer = this.reactiveProducerBuilder.reset()
        .withFlux(
            quietedFlux
                .map(QuietedSohStatusChangeUpdateMaterializedViewProcessor.create(
                    processingConfig.resolveDisplayParameters(),
                    sohQuietAndUnacknowledgedCacheManager,
                    latestStationSohByStation,
                    latestCapabilitySohRollupByStationGroup,
                    systemMessageSink,
                    stationGroups
                ))
                .flatMap(Flux::fromIterable)
        )
        .withSender(this.kafkaSender)
        .withTopic(quietedMaterializedViewOutputTopic)
        .build();

    quietedMaterializedViewProducer.start();
  }

  /**
   * Start the relatively simple Quieted and Unack producers.
   */
  void startQuietedAndUnackProducers() {

    var quietedOutputTopic = STATION_SOH_QUIETED_OUTPUT_TOPIC_KEY
        .getSystemConfigValue(systemConfig);

    var unackOutputTopic = STATION_SOH_STATUS_CHANGE_OUTPUT_TOPIC_KEY
        .getSystemConfigValue(systemConfig);

    var quietedProducer = reactiveProducerBuilder.reset()
        .withFlux(quietedSohStatusChangeUpdateEmitterProcessor)
        .withSender(this.kafkaSender)
        .withTopic(quietedOutputTopic)
        .build();

    quietedProducer.start();

    var unackProducer = reactiveProducerBuilder.reset()
        .withFlux(unacknowledgedSohStatusChangeEmitterProcessor)
        .withSender(this.kafkaSender)
        .withTopic(unackOutputTopic)
        .build();

    unackProducer.start();
  }

  /**
   * Start the CapabilitySohRollup and StatonSoh suppliers, merge the into a single Flux of SohWrapper,
   * And return that Flux
   *
   * @return Flux of SohWrappers
   */
  Flux<SohWrapper> startStateOfHealthConsumers(
      Map<String, StationSoh> latestStationSohByStation,
      Map<String, CapabilitySohRollup> latestCapabilitySohRollupByStationGroup
  ) {

    var stationSohInputTopic = STATION_SOH_INPUT_TOPIC_KEY.getSystemConfigValue(systemConfig);

    var capabilityRollupInputTopic = CAPABILITY_SOH_ROLLUP_INPUT_TOPIC_KEY
        .getSystemConfigValue(systemConfig);

    var stationSohConsumer = reactiveConsumerBuilder
        .withTopic(stationSohInputTopic)
        .build(StationSoh.class);

    var capabilitySohRollupConsumer = reactiveConsumerBuilder
        .withTopic(capabilityRollupInputTopic)
        .build(CapabilitySohRollup.class);

    return createSohWrapperFlux(
        stationSohConsumer.getFlux(),
        capabilitySohRollupConsumer.getFlux(),
        latestStationSohByStation,
        latestCapabilitySohRollupByStationGroup
    );
  }


  /**
   * Create a flux that pairs a Flux of StationSoh with a Flux of CapabilitySohRollup into
   * a single Flux of SohWrapper. Also populates the given maps.
   *
   * @param stationSohFlux Flux of StationSoH
   * @param capabilitySohRollupFlux Flux of CapabilitySohRollup
   * @param latestStationSohByStation Map of StationSoh, by station name, to update
   * @param latestCapabilitySohRollupByStationGroup Map of CapabilitySohRollup, by group name, to update
   * @return a Flux of SohWrapper. The two maps will also be upadated as data arrives.
   */
  static Flux<SohWrapper> createSohWrapperFlux(
      Flux<StationSoh> stationSohFlux,
      Flux<CapabilitySohRollup> capabilitySohRollupFlux,
      Map<String, StationSoh> latestStationSohByStation,
      Map<String, CapabilitySohRollup> latestCapabilitySohRollupByStationGroup
  ) {

    //
    // Turn the two fluxes from the two suppliers into a single Flux<SohWrapper>
    //
    return Flux.merge(
        stationSohFlux
            .doOnNext(
                stationSoh -> latestStationSohByStation.put(stationSoh.getStationName(), stationSoh)
            )
            .map(SohWrapper::ofStationSoh),
        capabilitySohRollupFlux
            .doOnNext(
                capabilitySohRollup ->
                    latestCapabilitySohRollupByStationGroup.put(
                        capabilitySohRollup.getForStationGroup(), capabilitySohRollup
                    )
            )
            .map(SohWrapper::ofCapabilitySohRollup)
    );
  }

  /**
   * Create the materialized view flux, from a Flux of SohPackage
   *
   * @param sohPackageFlux Flux of SohPackage
   * @param materializedViewProcessor MaterializedViewProcessor to map a SohPackage to a List of
   * "UiStationAndStationGroups" objects
   * @return Flux of "UiStationAndStationGroups" objects
   */
  static Flux<UiStationAndStationGroups> createMaterializedViewFlux(
      Flux<SohPackage> sohPackageFlux,
      MaterializedViewProcessor materializedViewProcessor
  ) {

    //
    // The MaterializedViewProcessor will potentially create more than one UiStationAndStationGroups
    // object per soh package. So, turn its collection into a flux and merge with the other generated
    // Fluxes
    //
    return Flux.merge(
        sohPackageFlux
            .map(materializedViewProcessor)
            .map(Flux::fromIterable)
    );

  }

  /**
   * Create the materialized view flux, from a Flux of SohPackage. This version creates uses the
   * "default" MaterializedViewProcessor.
   *
   *@param sohPackageFlux Flux of SohPackage
   * @param sohQuietAndUnacknowledgedCacheManager Manager for tracking quiet and unack changes
   * @param processingConfig processing configuration
   * @param stationGroups station groups from configuration
   * @param systemMessageSink Sink to send created SystemMesssages to
   * @return Flux of "UiStationAndStationGroups" objects
   */
  private static Flux<UiStationAndStationGroups> createMaterializedViewFlux(
      Flux<SohPackage> sohPackageFlux,
      SohQuietAndUnacknowledgedCacheManager sohQuietAndUnacknowledgedCacheManager,
      StationSohAnalysisManagerConfiguration processingConfig,
      List<StationGroup> stationGroups,
      FluxSink<SystemMessage> systemMessageSink
  ) {

    var matViewProcessor = MaterializedViewProcessor
        .create(sohQuietAndUnacknowledgedCacheManager,
            processingConfig.resolveDisplayParameters(),
            stationGroups,
            systemMessageSink
        );

    //
    // The MaterializedViewProcessor will potentially create more than one UiStationAndStationGroups
    // object per soh package. So, turn its collection into a flux and merge with the other generated
    // Fluxes
    //
    var uiStationAndStationGroupsFlux = createMaterializedViewFlux(
        sohPackageFlux,
        matViewProcessor
    );

    if (legacyLogger.isEnabled(TIMING)) {

      uiStationAndStationGroupsFlux = uiStationAndStationGroupsFlux
          .doOnNext(uiStationAndStationGroups -> Flux
              .fromIterable(uiStationAndStationGroups.getStationSoh())
              .distinct(UiStationSoh::getUuid)
              .subscribeOn(Schedulers.boundedElastic())
              .subscribe(uiStationSoh -> legacyLogger.log(
                  TIMING,
                  "SOH object {} with timestamp {}; now: {}",
                  uiStationSoh.getUuid(),
                  Instant.ofEpochMilli(uiStationSoh.getTime()),
                  Instant.now()
              )));
    }

    return uiStationAndStationGroupsFlux;
  }

  /**
   * Turn a Flux of SohWrappers into a Flux of SohCorrelations by associating StationSoh and CapabilitySohRollups
   * from the same calculation interval to eachother.
   *
   * @return Flux of SohCorrelation
   */
  static Flux<SohPackage> createSohPackageFlux(
      Flux<SohWrapper> sohWrapperFlux,
      int bufferSize
  ) {

    return Flux.merge(sohWrapperFlux
        .groupBy(SohWrapper::wrapperTimeStamp)
        .map(groupedFlux -> groupedFlux.bufferTimeout(
            bufferSize,
            //
            // The timeout is somewhat arbitrary but should allow enough time for all objects to be
            // generated by SohControl
            //
            Duration.ofSeconds(5))
            .take(1) // There will only ever be one buffered list per calc. interval
            .map(sohWrappers -> {

                  if (sohWrappers.isEmpty()) {
                    return Optional.<SohPackage>empty();
                  }

                  var capabilitySohRollupSet = new HashSet<CapabilitySohRollup>();
                  var stationSohSet = new HashSet<StationSoh>();

                  sohWrappers.forEach(
                      sohWrapper -> {
                        if (sohWrapper.getSohType() == SohType.CAPABILITY_SOH_ROLLUP) {
                          capabilitySohRollupSet.add(sohWrapper.capabilitySohRollup());
                        } else {
                          stationSohSet.add(sohWrapper.stationSoh());
                        }
                      }
                  );

                  return Optional.of(SohPackage.create(
                      capabilitySohRollupSet,
                      stationSohSet
                  ));
                }
            )
            .doOnNext(sohPackageOptional -> {
              if (sohPackageOptional.isEmpty()) {
                logger.warn("Received no data whatsoever for calculation interval {}",
                    groupedFlux.key());
              }
            })
            .filter(Optional::isPresent)
            .map(Optional::get)
            //
            // If we received no StationSohs, something is wrong
            //
            .doOnNext(sohPackage -> {
              if (sohPackage.getStationSohs().isEmpty()) {
                logger
                    .warn("Received no StationSohs for calculation interval {}", groupedFlux.key());
              }
            })
            .filter(sohPackage -> !sohPackage.getStationSohs().isEmpty())
        )
    );

  }

}
