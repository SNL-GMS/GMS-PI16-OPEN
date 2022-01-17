package gms.dataacquisition.stationreceiver.cd11.dataman;

import gms.core.dataacquisition.receiver.DataFrameReceiverConfiguration;
import gms.dataacquisition.stationreceiver.cd11.common.configuration.Cd11DataConsumerParameters;
import gms.dataacquisition.stationreceiver.cd11.common.frames.MalformedFrame;
import gms.dataacquisition.stationreceiver.cd11.dataman.configuration.DataManConfig;
import gms.dataacquisition.stationreceiver.cd11.dataman.handlers.ReactorCd11FrameHandler;
import gms.shared.frameworks.osd.coi.waveforms.RawStationDataFrame;
import gms.shared.utilities.kafka.KafkaConfiguration;
import gms.shared.utilities.kafka.reactor.ReactorKafkaFactory;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiSerializer;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.errors.RecordTooLargeException;
import org.slf4j.LoggerFactory;
import reactor.core.Disposable;
import reactor.core.Disposable.Composite;
import reactor.core.Disposables;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;
import reactor.core.scheduler.Schedulers;
import reactor.kafka.sender.KafkaSender;
import reactor.kafka.sender.SenderRecord;
import reactor.netty.Connection;
import reactor.netty.tcp.TcpServer;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import static com.google.common.base.Preconditions.checkState;
import static java.util.stream.Collectors.toList;
import static java.util.stream.Collectors.toMap;

/**
 * High level CD 1.1 Data management application class. Responsible for managing tcp connections,
 * configuration of connection handling, kafka connections and messaging, and lifecycle management
 * of all of the above.
 */
public class Cd11DataManager {

  public static final String STATION_LOGGING_KEY = "station";
  private static final int NUM_RETRIES_PORT_BIND = 100;
  private static final Duration INITIAL_WAIT = Duration.ofSeconds(1);

  private final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(Cd11DataManager.class));

  private final DataManConfig dataManConfig;
  private final DataFrameReceiverConfiguration receiverConfig;
  private final KafkaConfiguration kafkaConfiguration;

  // Collection of all the stations and the "server" that has been configured with the processing config
  // port that is unique for each station
  private Map<String, TcpServer> serversByStation;

  // the single kafka sender that sends all processed RSDFs to the kafka broker
  private KafkaSender<String, RawStationDataFrame> rsdfSender;

  // a kafka sender for RSDFs that aren't fully processed
  private KafkaSender<String, MalformedFrame> malformedFrameSender;

  // Temporary holder for RSDFs used during processing,
  // used to transport the data going from server to the processing flux
  private List<Sinks.Many<RawStationDataFrame>> rsdfSinks;
  private List<Sinks.Many<MalformedFrame>> malformedFrameSinks;
  private List<ReactorCd11FrameHandler> handlers;

  private boolean initialized = false;
  private Composite serverBindComposite;

  private Cd11DataManager(
      DataManConfig dataManConfig,
      DataFrameReceiverConfiguration receiverConfig,
      KafkaConfiguration kafkaConfiguration) {
    this.dataManConfig = dataManConfig;
    this.receiverConfig = receiverConfig;
    this.kafkaConfiguration = kafkaConfiguration;
  }

  public static Cd11DataManager create(DataManConfig dataManConfig,
      DataFrameReceiverConfiguration dataFrameReceiverConfiguration,
      KafkaConfiguration kafkaConfiguration) {
    return new Cd11DataManager(dataManConfig, dataFrameReceiverConfiguration, kafkaConfiguration);
  }

  /**
   * This initialize method is only meant to be called directly externally via unit testing!
   */
  void initialize(KafkaSender<String, RawStationDataFrame> rsdrSender,
      KafkaSender<String, MalformedFrame> malformedFrameSender,
      Supplier<Sinks.Many<RawStationDataFrame>> rsdfSinkSupplier,
      Supplier<Sinks.Many<MalformedFrame>> malformedFrameSinkSupplier) {

    initialize();
    this.rsdfSender = rsdrSender;
    this.malformedFrameSender = malformedFrameSender;
    this.rsdfSinks.add(rsdfSinkSupplier.get());
    this.malformedFrameSinks.add(malformedFrameSinkSupplier.get());
  }

  /**
   * Initialization of manager state via reading configuration. Sets up kafka senders, station data
   * sinks, and configures tcp connections to be ready for binding.
   */
  public void initialize() {
    var kafkaFactory = new ReactorKafkaFactory(kafkaConfiguration);
    rsdfSender = kafkaFactory
        .createSender(kafkaConfiguration.getApplicationId(), new CoiSerializer<>());
    malformedFrameSender = kafkaFactory
        .createSender(kafkaConfiguration.getApplicationId(), new CoiSerializer<>());
    rsdfSinks = new ArrayList<>();
    malformedFrameSinks = new ArrayList<>();
    handlers = new ArrayList<>();


    serversByStation = dataManConfig.cd11DataConsumerParameters()
        .filter(Cd11DataConsumerParameters::isAcquired)
        .collect(
            toMap(Cd11DataConsumerParameters::getStationName, this::initializeDataConsumerServer));

    serverBindComposite = Disposables.composite();
    initialized = true;
  }

  private TcpServer initializeDataConsumerServer(Cd11DataConsumerParameters consumerParameters) {
    int stationPort = consumerParameters.getPort();
    String stationName = consumerParameters.getStationName();

    Sinks.Many<RawStationDataFrame> rsdfSink = Sinks.many().unicast().onBackpressureBuffer();
    rsdfSinks.add(rsdfSink);
    Sinks.Many<MalformedFrame> malformedFrameSink = Sinks.many().unicast().onBackpressureBuffer();
    malformedFrameSinks.add(malformedFrameSink);

    var handler = ReactorCd11FrameHandler
        .create(stationName, receiverConfig, rsdfSink, malformedFrameSink);
    handlers.add(handler);

    return TcpServer.create()
        .port(stationPort)
        .doOnBound(server -> {
          logger.addKeyValueArgument(STATION_LOGGING_KEY, stationName);
          logger.info("Server bound successfully on port {}", server.port());
          logger.removeArgument(STATION_LOGGING_KEY);
        })
        .doOnConnection(connection -> logConnection(connection, stationName, stationPort))
        .handle(handler);
  }

  private void logConnection(Connection connection, String stationName, int stationPort) {
    logger.addKeyValueArgument(STATION_LOGGING_KEY, stationName);
    logger.info("Data Manager connection established on port {}", stationPort);
    logger.removeArgument(STATION_LOGGING_KEY);
    connection.onDispose(() -> {
      logger.addKeyValueArgument(STATION_LOGGING_KEY, stationName);
      logger.info("Data Manager connection closed on port {}", stationPort);
      logger.removeArgument(STATION_LOGGING_KEY);
    });
  }

  /**
   * Starts the Data manager, subscribing all data sinks to the kafka senders and binds the tcp
   * connections to their ports, making them available for connection.
   */
  public void start() {
    start(100, Duration.ofMillis(500), Duration.ofSeconds(30));
  }

  void start(int maxBufferSize, Duration rsdfBufferedTimeoutDuration,
      Duration malformedFrameTimeoutDuration) {
    checkState(initialized, "Must initialize Cd11DataManager before starting");

    logger.info("Establishing frame sending");

    Flux.fromIterable(rsdfSinks)
        .flatMap(sinks -> sinks.asFlux().publishOn(Schedulers.boundedElastic())
            .map(this::createRsdfRecord), rsdfSinks.size())
        .bufferTimeout(maxBufferSize, rsdfBufferedTimeoutDuration).map(Flux::fromIterable)
        .onBackpressureBuffer()
        .transform(rsdfSender::sendTransactionally)
        .onErrorContinue(RecordTooLargeException.class, (e, obj) -> logger
            .warn(
                "Failed to publish Data frame record(s) due to exceeding configured record size limit",
                e))
        .concatMap(f -> f)
        .onErrorContinue((e, obj) -> logger.error(
            "Data frame publishing failed. Handling here to avoid canceling subscription. Returned object: {}",
            obj, e))
        .subscribe(
            result -> {
              logger.addKeyValueArgument(STATION_LOGGING_KEY, result.correlationMetadata());
              logger.info("Published Data frame");
              logger.removeArgument(STATION_LOGGING_KEY);
            },
            e -> logger.error("Failed to publish Data frame", e));

    Flux.fromIterable(malformedFrameSinks)
        .flatMap(sinks -> sinks.asFlux().publishOn(Schedulers.boundedElastic())
            .map(this::createMalformedFrameRecord), malformedFrameSinks.size())
        .bufferTimeout(maxBufferSize, malformedFrameTimeoutDuration).map(Flux::fromIterable)
        .transform(malformedFrameSender::sendTransactionally)
        .onErrorContinue(RecordTooLargeException.class, (e, obj) -> logger
            .warn(
                "Failed to publish Malformed frame record(s) due to exceeding configured record size limit",
                e))
        .concatMap(f -> f)
        .onErrorContinue((e, obj) -> logger.error(
            "Malformed frame publishing failed. Handling here to avoid canceling subscription. Returned object: {}",
            obj, e))
        .subscribe(
            result -> logger.info("Published Malformed frame {}",
                result.correlationMetadata()),
            e -> logger.error("Failed to publish malformed frame", e));

    logger.info("Binding station ports");
    serverBindComposite.addAll(
        serversByStation.entrySet().stream().map(entry -> bind(entry.getKey(), entry.getValue()))
            .collect(toList())
    );
  }

  private SenderRecord<String, RawStationDataFrame, String> createRsdfRecord(
    RawStationDataFrame rsdf) {
    // create reactor kafka sender record with the rsdf json string
    String stationName = rsdf.getMetadata().getStationName();
    return SenderRecord
        .create(new ProducerRecord<>(kafkaConfiguration.getInputRsdfTopic(), stationName, rsdf),
            stationName);
  }

  private SenderRecord<String, MalformedFrame, String> createMalformedFrameRecord(
      MalformedFrame malformedFrame) {
    String station = malformedFrame.getStation().orElse("EMPTY");
    return SenderRecord.create(
        new ProducerRecord<>(kafkaConfiguration.getMalformedFrameTopic(), station, malformedFrame),
        station);
  }

  private Disposable bind(String stationName, TcpServer tcpServer) {
    return tcpServer.bind()
        .doOnError(e -> {
          logger.addKeyValueArgument(STATION_LOGGING_KEY, stationName);
          logger.error("Error binding server", e);
          logger.removeArgument(STATION_LOGGING_KEY);
        })
        .retryWhen(Retry.backoff(NUM_RETRIES_PORT_BIND, INITIAL_WAIT))
        .subscribe();
  }

  /**
   * Shuts down the data manager application and all held resources, connections and handlers.
   */
  public void shutdown() {
    logger.info("Shutting Down DataMan...");
    handlers.forEach(ReactorCd11FrameHandler::shutdown);
    serverBindComposite.dispose();
    rsdfSinks.forEach(Sinks.Many::tryEmitComplete);
    malformedFrameSinks.forEach(Sinks.Many::tryEmitComplete);
    rsdfSender.close();
    malformedFrameSender.close();
  }
}
