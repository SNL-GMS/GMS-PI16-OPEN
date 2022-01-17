package gms.dataacquisition.stationreceiver.cd11.common.reactor.netty;

import gms.dataacquisition.stationreceiver.cd11.common.Cd11FrameReader;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11OrMalformedFrame;
import gms.dataacquisition.stationreceiver.cd11.common.FrameParsingDecoder;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Frame;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.ByteBufAllocator;

import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks.EmitResult;
import reactor.core.publisher.Sinks.Empty;
import reactor.netty.NettyInbound;
import reactor.netty.NettyOutbound;

/**
 * Wrapper class for Reactor Netty connection apis directed at managing sending and receiving of
 * Cd11Frames, and closing of the tcp connection.
 */
public class Cd11Connection {

  public static final String STATION_NAME_KEY = "station";
  private final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(Cd11Connection.class));

  private final NettyInbound inbound;
  private final NettyOutbound outbound;
  private final Empty<Void> completionSink;

  private final AtomicBoolean isClosing = new AtomicBoolean(false);

  public Cd11Connection(String stationName, NettyInbound inbound, NettyOutbound outbound,
      Empty<Void> completionSink) {
    this.inbound = inbound.withConnection(x ->
        x.addHandlerFirst(new FrameParsingDecoder()));
    this.outbound = outbound;
    this.completionSink = completionSink;

    logger.addValueArgument(STATION_NAME_KEY, stationName);
  }

  /**
   * Sends a Cd11Frame on the tcp outbound
   *
   * @param frame Frame to send
   * @return a void Mono representing completion status of the send.
   */
  public Mono<Void> send(Cd11Frame frame) {
    return outbound.sendByteArray(Mono.just(frame).map(Cd11Frame::toBytes)).then();
  }

  /**
   * Sends Cd11Frames on the tcp outbound
   *
   * @param frames Frames to send
   * @return a void Mono representing completion status of the send.
   */
  public Mono<Void> sendAll(Flux<Cd11Frame> frames) {
    return outbound.sendByteArray(frames.map(Cd11Frame::toBytes)).then();
  }

  /**
   * Manages the sending of a continuous stream of Cd11Frames on the tcp outbound
   *
   * @param frames Frames to send continuously
   * @return a void Mono representing completion status of the continuous send.
   */
  public Mono<Void> sendContinuous(Flux<Cd11Frame> frames) {
    return outbound.send(frames.map(this::toByteBuf), byteBuf -> true).then();
  }

  private ByteBuf toByteBuf(Cd11Frame frame) {
    return ByteBufAllocator.DEFAULT
        .buffer()
        .writeBytes(frame.toBytes());
  }

  /**
   * Receives packets from the tcp inbound and parses them into Cd11Frames. Note that this parsing
   * includes the different types of frames each Cd11Frame can represent.
   *
   * @return Flux of parsed Cd11Frames of all incoming types.
   */
  public Flux<Cd11OrMalformedFrame> receive() {
    return inbound
        .receive()
        .asByteBuffer()
        .map(Cd11FrameReader::readFrame)
        .onErrorContinue((e, obj) -> logger.error(
            "Inbound frame construction failed. Handling here to avoid canceling subscription. Returned object: {}",
            obj, e));
  }

  public void close() {
    if (isClosing.compareAndSet(false, true)){
      EmitResult result = completionSink.tryEmitEmpty();
      if (result.isSuccess()) {
        logger.info("Connection close signal emitted");
      } else {
        logger.warn("Emission failed for connection close signal... Result {}", result);
      }
    } else {
      logger.debug("Connection already closed");
    }
  }

}
