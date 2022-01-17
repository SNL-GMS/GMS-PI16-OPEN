package gms.dataacquisition.stationreceiver.cd11.dataprovider;


import static java.lang.String.format;

import gms.dataacquisition.stationreceiver.cd11.common.Cd11FrameFactory;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11FrameReader;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11GapList;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11OrMalformedFrame;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11OrMalformedFrame.Kind;
import gms.dataacquisition.stationreceiver.cd11.common.FrameUtilities;
import gms.dataacquisition.stationreceiver.cd11.common.enums.FrameType;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Acknack;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Alert;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Frame;
import gms.dataacquisition.stationreceiver.cd11.common.reactor.netty.Cd11Connection;
import gms.shared.frameworks.osd.coi.waveforms.RawStationDataFrame;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.core.Disposable;
import reactor.core.Disposables;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;
import reactor.netty.NettyInbound;
import reactor.netty.NettyOutbound;
import reactor.netty.tcp.TcpClient;
import reactor.util.retry.Retry;

/**
 * Handles the establishment of connection to a data consumer, then subsequent periodic sending and
 * receiving of acknack frames as well as publishing of data frames to the data consumer.
 * <p>
 * Upon connection interruption from the peer for any reason, cleans up the active connection and
 * shuts down.
 */
public class Cd11Client {

  private static final int NUM_RETRIES_PORT_BIND = 100;
  private static final Duration INITIAL_WAIT = Duration.ofSeconds(1);
  private static final Logger logger = LoggerFactory.getLogger(Cd11Client.class);

  private final String stationName;
  private final TcpClient delegate;
  private final Handler handler;

  /**
   * Constructs a {@link Cd11Client} to manage the client connection to a data consumer.
   *
   * @param stationName Name of the station for the consumer we will be connecting to
   */
  public Cd11Client(String stationName, TcpClient delegate, Handler handler) {
    this.stationName = stationName;
    this.delegate = delegate;
    this.handler = handler;
  }

  public static Cd11Client create(String stationName, String host, int port,
      Flux<RawStationDataFrame> rsdfFlux) {
    Handler handler = new Handler(stationName);

    TcpClient delegate = TcpClient.create()
        .host(host)
        .port(port)
        .handle((inbound, outbound) -> handler.handle(inbound, outbound, rsdfFlux));

    return new Cd11Client(stationName, delegate, handler);
  }

  Mono<Void> connect() {
    logger.info("Station {} establishing connection...", stationName);

    return delegate.connect()
        .retryWhen(Retry.backoff(NUM_RETRIES_PORT_BIND, INITIAL_WAIT))
        .doOnSuccess(successful -> logger
            .info("Client for station {} connected successfully", stationName))
        .doOnError(error -> logger
            .error("Error connecting to dataman for station {}", stationName, error))
        .doOnCancel(
            () -> logger.warn("Connection acquisition for station {} cancelled", stationName))
        .then();
  }

  //Used for testing purposes only
  TcpClient getDelegate() {
    return delegate;
  }

  //Used for testing purposes only
  Handler getHandler() {
    return handler;
  }

  public static class Handler {

    static final int ACKNACK_TIME_SECONDS = 55;
    static final Duration HEARTBEAT_DURATION = Duration.ofSeconds(120);

    private final String stationName;
    private final String frameSet;
    private final Cd11FrameFactory frameFactory;
    private final Cd11GapList gapList;

    private Disposable.Composite dataDisposables;
    private Cd11Connection connection;

    public Handler(String stationName) {
      this.stationName = stationName;
      this.frameSet = format("%s:0", stationName);
      this.frameFactory = Cd11FrameFactory.createDefault();
      this.gapList = new Cd11GapList();
    }

    Optional<Cd11Connection> getConnection() {
      return Optional.ofNullable(connection);
    }

    //For testing purposes only
    void setConnection(Cd11Connection connection) {
      this.connection = connection;
    }

    //For testing purposes only
    Cd11GapList getGapList() {
      return gapList;
    }

    Mono<Void> handle(NettyInbound inbound, NettyOutbound outbound,
        Flux<RawStationDataFrame> rsdfFlux) {
      dataDisposables = Disposables.composite();

      Sinks.Empty<Void> completionSink = Sinks.empty();
      connection = new Cd11Connection(stationName, inbound, outbound, completionSink);

      dataDisposables.add(periodicAcknackFlux()
          .map(frameFactory::wrap)
          .flatMap(connection::send)
          .subscribe());
      dataDisposables.add(rsdfFlux
          .flatMap(this::readPayload)
          .flatMap(dataFrame -> connection.send(dataFrame).then(recordToGapsList(dataFrame)))
          .subscribe());

      dataDisposables.add(connection.receive()
          .timeout(HEARTBEAT_DURATION, handleTimeout())
          .flatMap(this::handleFrame)
          .subscribe());

      //TODO: properly handle finite data fluxes
      return completionSink.asMono();
    }

    private Mono<Cd11Frame> readPayload(RawStationDataFrame rsdf) {
      Cd11OrMalformedFrame cd11OrMalformedFrame = Cd11FrameReader.readFrame(ByteBuffer.wrap(
          rsdf.getRawPayload()));
      if (cd11OrMalformedFrame.getKind().equals(Kind.MALFORMED)) {
        logger.warn("Malformed Frame encountered in input RSDF Flux, skipping",
            cd11OrMalformedFrame.malformed().getCause());
        return Mono.empty();
      }

      return Mono.just(cd11OrMalformedFrame.cd11());
    }

    /**
     * Public shutdown method for resource cleanup from higher-level shutdown calls.
     */
    public void shutdown() {
      alert().then(dispose()).subscribe();
    }

    Mono<Void> alert() {
      return getConnection().map(conn -> conn.send(frameFactory
          .wrap(Cd11Alert.create(format("Shutdown triggered for station %s", stationName)))))
          .orElse(Mono.empty());
    }

    <T> Mono<T> dispose() {
      return Mono.fromRunnable(() -> {
        dataDisposables.dispose();
        getConnection().ifPresent(Cd11Connection::close);
      });
    }

    private <T> Mono<T> handleTimeout() {
      return Mono.defer(() -> {
        logger.warn("Acknack Heartbeat Timeout {} reached.", HEARTBEAT_DURATION);
        return alert().then(dispose());
      });
    }

    Flux<Cd11Acknack> periodicAcknackFlux() {
      logger.info("Starting periodic ACKNACK sending");
      return Flux.interval(Duration.ofSeconds(ACKNACK_TIME_SECONDS),
          Duration.ofSeconds(ACKNACK_TIME_SECONDS))
          .map(i -> buildLatestAcknack());
    }

    private Cd11Acknack buildLatestAcknack() {
      return Cd11Acknack.withGapList(gapList).setFrameSetAcked(frameSet).build();
    }

    Mono<Void> recordToGapsList(Cd11Frame dataFrame) {
      return Mono.fromRunnable(
          () -> gapList.processSequenceNumber(dataFrame.getHeader().getSequenceNumber()));
    }

    Mono<Void> handleFrame(Cd11OrMalformedFrame cd11OrMalformedFrame) {
      if (cd11OrMalformedFrame.getKind().equals(Kind.MALFORMED)) {
        logger.error("Client received malformed frame, no processing performed",
            cd11OrMalformedFrame.malformed().getCause());
      } else {
        Cd11Frame cd11Frame = cd11OrMalformedFrame.cd11();
        if (cd11Frame.getType() == FrameType.ALERT) {
          Cd11Alert alertFrame = FrameUtilities
              .asPayloadType(cd11Frame.getPayload(), FrameType.ALERT);
          logger.warn("Alert message received: {}. Closing client for station {}...",
              alertFrame.getMessage(), stationName);
          return dispose();
        }
        logger.debug("Doing nothing for {} frame", cd11Frame.getType());
      }
      return Mono.empty();
    }
  }
}

