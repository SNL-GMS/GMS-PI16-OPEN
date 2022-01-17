package gms.dataacquisition.stationreceiver.cd11.dataman.handlers;

import static gms.dataacquisition.stationreceiver.cd11.common.FrameUtilities.asPayloadType;
import static java.lang.String.format;

import gms.core.dataacquisition.receiver.DataFrameReceiverConfiguration;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11FrameFactory;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11GapList;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11OrMalformedFrame;
import gms.dataacquisition.stationreceiver.cd11.common.FrameUtilities;
import gms.dataacquisition.stationreceiver.cd11.common.enums.FrameType;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Acknack;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Alert;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Frame;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11OptionExchange;
import gms.dataacquisition.stationreceiver.cd11.common.frames.MalformedFrame;
import gms.dataacquisition.stationreceiver.cd11.common.reactor.Cd11CompositeFluxHandler;
import gms.dataacquisition.stationreceiver.cd11.common.reactor.Cd11FluxHandler;
import gms.dataacquisition.stationreceiver.cd11.common.reactor.netty.Cd11Connection;
import gms.dataacquisition.stationreceiver.cd11.dataman.Cd11GapListUtility;
import gms.dataacquisition.stationreceiver.cd11.parser.Cd11RawStationDataFrameUtility;
import gms.shared.frameworks.osd.coi.waveforms.RawStationDataFrame;
import gms.shared.utilities.logging.StructuredLoggingWrapper;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.BiFunction;

import org.slf4j.LoggerFactory;
import reactor.core.Disposable;
import reactor.core.Disposables;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;
import reactor.core.publisher.Sinks.EmitResult;
import reactor.core.publisher.Sinks.Empty;
import reactor.core.publisher.Sinks.Many;
import reactor.netty.NettyInbound;
import reactor.netty.NettyOutbound;

/**
 * High level class responsible for representing proper CD1.1 protocol behavior for managing a
 * connection and the sending and receiving of different types of CD1.1 frames.
 */
public class ReactorCd11FrameHandler implements
  BiFunction<NettyInbound, NettyOutbound, Mono<Void>> {

  public static final String STATION_NAME_KEY = "station";
  static final Duration HEARTBEAT_DURATION = Duration.ofSeconds(120);
  private static final String DEFAULT_FRAME_SET = "0:0";
  private final StructuredLoggingWrapper logger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(ReactorCd11FrameHandler.class));

  //In the future we will want to make these values configurable
  private static final int GAP_EXPIRATION_IN_DAYS = -1; // Never expire.
  private static final Duration STORE_GAP_STATE_INTERVAL = Duration.ofMinutes(5);
  static final int ACKNACK_TIME_SECONDS = 55;

  private final String stationName;
  private final DataFrameReceiverConfiguration receiverConfig;
  private final Cd11FrameFactory frameFactory;
  private final Many<RawStationDataFrame> rsdfSink;
  private final Many<MalformedFrame> malformedFrameSink;
  private final Cd11GapList cd11GapList;
  private Disposable.Composite dataDisposables;

  private final AtomicReference<String> frameSet;
  private Cd11Connection cd11Connection;

  ReactorCd11FrameHandler(String stationName,
    DataFrameReceiverConfiguration receiverConfig,
    Cd11FrameFactory frameFactory,
    Many<RawStationDataFrame> rsdfSink,
    Many<MalformedFrame> malformedFrameSink,
    Cd11GapList cd11GapList) {
    this.stationName = stationName;
    this.receiverConfig = receiverConfig;
    this.frameFactory = frameFactory;
    this.rsdfSink = rsdfSink;
    this.malformedFrameSink = malformedFrameSink;
    this.cd11GapList = cd11GapList;
    this.frameSet = new AtomicReference<>(DEFAULT_FRAME_SET);
    logger.addValueArgument(STATION_NAME_KEY, stationName);
  }

  Optional<Cd11Connection> getCd11Connection() {
    return Optional.ofNullable(cd11Connection);
  }

  // For testing purposes ONLY
  void setCd11Connection(Cd11Connection connection) {
    this.cd11Connection = connection;
  }

  public static ReactorCd11FrameHandler create(String stationName,
    DataFrameReceiverConfiguration receiverConfig, Many<RawStationDataFrame> rsdfSink,
    Many<MalformedFrame> malformedFrameSink) {

    // create the frame factory
    Cd11FrameFactory cd11FrameFactory = Cd11FrameFactory.createDefault();
    Cd11GapList gapList = Cd11GapListUtility.loadGapState(stationName);
    return new ReactorCd11FrameHandler(stationName, receiverConfig, cd11FrameFactory,
      rsdfSink, malformedFrameSink, gapList);
  }

  /**
   * The BiFunction leveraged by reactor netty to handle an active tcp connection.
   *
   * @param inbound Inbound tcp connection for receiving packets
   * @param outbound Outbound tcp connection for sending packets
   * @return IMPORTANT: The publisher provided here controls the overall lifecycle of the tcp
   * connection. Triggering completion of this publisher will shut down the connection.
   */
  @Override
  public Mono<Void> apply(NettyInbound inbound, NettyOutbound outbound) {
    dataDisposables = Disposables.composite();

    getGapExpiration()
      .ifPresent(duration -> dataDisposables.add(removeExpiredGapsPeriodically(duration)));
    dataDisposables.add(persistGapsPeriodically(STORE_GAP_STATE_INTERVAL));

    Empty<Void> completionSink = Sinks.empty();

    cd11Connection = new Cd11Connection(stationName, inbound, outbound, completionSink);

    dataDisposables.add(sendAcknackPeriodically(cd11Connection));
    Cd11FluxHandler fluxHandler = assembleCompositeFluxHandler(cd11Connection);

    cd11Connection.receive()
      .timeout(HEARTBEAT_DURATION, handleTimeout())
      .groupBy(Cd11OrMalformedFrame::getKind)
      .map(gf ->
        Cd11OrMalformedFrame.Kind.CD11.equals(gf.key())
          ? fluxHandler.handle(gf.map(Cd11OrMalformedFrame::cd11))
          : gf.map(Cd11OrMalformedFrame::malformed).subscribe(this::handleMalformed)
      )
      .subscribe(dataDisposables::add);

    return completionSink.asMono();
  }

  Mono<Void> alert() {
    return getCd11Connection().map(conn -> conn.send(frameFactory.wrap(
      Cd11Alert.create(format("Shutdown triggered for station %s", stationName)))))
      .orElse(Mono.empty());
  }

  <T> Mono<T> dispose() {
    return Mono.fromRunnable(() -> {
      dataDisposables.dispose();
      getCd11Connection().ifPresent(Cd11Connection::close);
    });
  }

  private <T> Mono<T> handleTimeout() {
    return Mono.defer(() -> {
      logger.warn("Acknack Heartbeat Timeout {} reached.", HEARTBEAT_DURATION);
      return alert().then(dispose());
    });
  }

  private Disposable sendAcknackPeriodically(Cd11Connection connection) {
    logger.info("Starting periodic ACKNACK sending");
    Flux<Cd11Acknack> acknackFlux = Flux.interval(Duration.ofSeconds(ACKNACK_TIME_SECONDS))
      .map(i -> buildLatestAcknack());

    return acknackFlux
      .map(frameFactory::wrap)
      .flatMap(connection::send)
      .subscribe();
  }

  private Cd11Acknack buildLatestAcknack() {
    return Cd11Acknack.withGapList(cd11GapList)
      .setFrameSetAcked(frameSet.get())
      .build();
  }

  private Cd11FluxHandler assembleCompositeFluxHandler(Cd11Connection connection) {
    Cd11CompositeFluxHandler compositeFluxHandler = new Cd11CompositeFluxHandler();

    //shutdown situations
    compositeFluxHandler.registerFluxHandler(FrameType.CUSTOM_RESET_FRAME, this::handleReset);
    compositeFluxHandler.registerFluxHandler(FrameType.ALERT, this::handleAlert);

    compositeFluxHandler.registerFrameHandler(FrameType.ACKNACK, this::handleAcknack);

    compositeFluxHandler.registerFluxHandler(FrameType.OPTION_REQUEST,
      optionRequest -> handleOptionRequest(optionRequest, connection));
    compositeFluxHandler
      .registerFrameHandler(FrameType.COMMAND_RESPONSE, this::handleCommandResponse);

    compositeFluxHandler.registerFrameHandler(FrameType.DATA, this::handleData);
    compositeFluxHandler.registerFrameHandler(FrameType.CD_ONE_ENCAPSULATION, this::handleData);

    return compositeFluxHandler;
  }

  /**
   * Public shutdown method for resource cleanup from higher-level shutdown calls.
   */
  public void shutdown() {
    alert().then(dispose()).subscribe();
  }

  private Disposable handleReset(Flux<Cd11Frame> resets) {
    return resets
      .doOnNext(frame -> logger.info("Reset Frame received"))
      .flatMap(frame -> reset().then(dispose()))
      .subscribe();
  }

  private <T> Mono<T> reset() {
    return Mono.fromRunnable(() -> {
      Cd11GapListUtility.clearGapState(stationName);
      cd11GapList.resetGapsList();
    });
  }

  Disposable handleAlert(Flux<Cd11Frame> alerts) {
    return alerts
      .doOnNext(frame -> logger.info("Alert Frame received"))
      .flatMap(frame -> dispose())
      .subscribe();
  }

  void handleAcknack(Cd11Frame acknack) {
    Cd11Acknack casted = asPayloadType(acknack.getPayload(), FrameType.ACKNACK);
    //set framesetAcked in frame factory
    frameSet.compareAndSet(DEFAULT_FRAME_SET, casted.getFrameSetAcked());
    //We only use the Acknack to check for a reset, see if highest seq num is below current low.
    cd11GapList.checkForReset(casted);
  }

  public String getFrameSet() {
    return frameSet.get();
  }

  Disposable handleOptionRequest(Flux<Cd11Frame> optionRequests,
    Cd11Connection connection) {
    Flux<Cd11Frame> optionResponses = optionRequests
      .doOnNext(option -> logger
        .info("Received OPTION_REQUEST frame, replying with OPTION_RESPONSE frame"))
      .map(frame -> FrameUtilities.<Cd11OptionExchange>asPayloadType(frame.getPayload(),
        FrameType.OPTION_REQUEST))
      .map(frameFactory::wrapResponse);

    return connection
      .sendContinuous(optionResponses)
      .subscribe();
  }

  void handleCommandResponse(Cd11Frame commandResponse) {
    logger.info("Received COMMAND_RESPONSE frame, recorded the sequence number to gap list");
    cd11GapList.processSequenceNumber(commandResponse.getHeader().getSequenceNumber());
  }

  void handleData(Cd11Frame dataFrame) {
    logger.info("Received DATA frame");
    cd11GapList.processSequenceNumber(dataFrame.getHeader().getSequenceNumber());
    final RawStationDataFrame rsdf = Cd11RawStationDataFrameUtility
      .parseAcquiredDataFrame(dataFrame, stationName, Instant.now(),
        receiverConfig::getChannelName);

    EmitResult result = rsdfSink.tryEmitNext(rsdf);
    if (result.isSuccess()) {
      logger.debug("Emitting DATA frame");
    } else {
      logger.warn("Emission failed for DATA frame... Result {}", result);
    }
  }

  void handleMalformed(MalformedFrame malformed) {
    logger.warn("Received Malformed Frame", malformed.getCause());

    if (malformed.getStation().isEmpty()) {
      malformed = malformed.toBuilder().setStation(stationName).build();
    }

    EmitResult result = malformedFrameSink.tryEmitNext(malformed);
    if (result.isSuccess()) {
      logger.debug("Emitting MALFORMED frame");
    } else {
      logger.warn("Emission failed for MALFORMED frame... Result {}", result);
    }
  }

  private Optional<Duration> getGapExpiration() {
    return GAP_EXPIRATION_IN_DAYS > 0 ? Optional.of(Duration.ofDays(GAP_EXPIRATION_IN_DAYS))
      : Optional.empty();
  }

  //copying the original functionality of dataman
  //would like to modify this so that it is scheduled to remove gaps based on the oldest gap
  private Disposable removeExpiredGapsPeriodically(Duration expirationPeriod) {
    return Flux.interval(expirationPeriod, expirationPeriod)
      .subscribe(i -> cd11GapList.removeExpiredGaps(expirationPeriod));
  }

  private Disposable persistGapsPeriodically(Duration persistPeriod) {
    return Flux.interval(persistPeriod, persistPeriod).subscribe(i -> tryPersist());
  }

  void tryPersist() {
    try {
      Cd11GapListUtility.persistGapState(stationName, cd11GapList.getGapList());
    } catch (IOException e) {
      logger.warn("Could not persist gaps for station {}", stationName, e);
    }
  }
}
