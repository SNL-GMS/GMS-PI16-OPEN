package gms.dataacquisition.stationreceiver.cd11.connman;


import com.google.common.net.InetAddresses;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11FrameReader;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11FrameFactory;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11OrMalformedFrame;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11Validator;
import gms.dataacquisition.stationreceiver.cd11.common.FrameParsingDecoder;
import gms.dataacquisition.stationreceiver.cd11.common.FrameUtilities;
import gms.dataacquisition.stationreceiver.cd11.common.configuration.Cd11ConnectionConfig;
import gms.dataacquisition.stationreceiver.cd11.common.enums.FrameType;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11ConnectionExchange;
import gms.dataacquisition.stationreceiver.cd11.connman.configuration.Cd11ConnManConfig;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.reactivestreams.Publisher;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Mono;
import reactor.netty.NettyInbound;
import reactor.netty.NettyOutbound;

import java.util.Map;
import java.util.function.BiFunction;
import java.util.function.Function;


/**
 * Server listens to incoming messages in NIO fashion. Each message is checked to see if it conforms
 * to the expected payload and if it does, the server responds to the request to continue the
 * handshake
 */
public class Cd11ConnManNettyHandler {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
          .create(LoggerFactory.getLogger(Cd11ConnManNettyHandler.class));

  private static final int AUTHENTICATION_KEY_IDENTIFIER = 7;
  private static final String STATION = "station";

  public BiFunction<NettyInbound, NettyOutbound, Publisher<Void>> handleInboundOutbound(
      Cd11ConnManConfig cd11ConnManConfig,
      Function<String, Cd11Station> cd11StationLookup,
      Map<String, Boolean> ignoredStationsMap) {

    return (nettyInbound, nettyOutbound) ->
      nettyInbound.withConnection(x ->
        x.addHandlerFirst(new FrameParsingDecoder()))
        .receive()
        .asByteBuffer()
        .map(Cd11FrameReader::readFrame)
        .flatMap(frameOrMalformed -> {
          if (frameOrMalformed.getKind() == Cd11OrMalformedFrame.Kind.MALFORMED) {
            logger.warn("Dropping malformed frame due to read error", frameOrMalformed.malformed().getCause());
            return Mono.empty();
          } else {
            return Mono.just(frameOrMalformed.cd11());
          }
        })
        .doOnNext(cd11Frame -> {
          // Validate CRC for frame.
          if (!FrameUtilities.isValidCRC(cd11Frame.toBytes(), cd11Frame)) {
            logger.addKeyValueArgument(STATION, cd11Frame.getHeader().getFrameCreator());
            logger.warn("CRC check failed for frame.");
            logger.removeArgument(STATION);
          }
        })
        .flatMap(cd11Frame -> {
          logger.info("A request to the Connection Manager was received, beginning to process the request.");
          Cd11FrameFactory cd11FrameFactory = createCd11FrameFactory(cd11ConnManConfig);
          Cd11ConnectionConfig connectionConfig = cd11ConnManConfig.getConnectionConfig();

          if (!cd11Frame.getType().equals(FrameType.CONNECTION_REQUEST)) {
            logger.debug("Expected Cd11Frame of type {}, but received {}", FrameType.CONNECTION_REQUEST, cd11Frame.getType());
          } else {
            Cd11ConnectionExchange connectionRequest = FrameUtilities.asPayloadType(cd11Frame.getPayload(), FrameType.CONNECTION_REQUEST);
            if (!ignoredStationsMap.containsKey(connectionRequest.getStationOrResponderName())) {
              //As this station is NOT set to be ignored, begin processing the request
              processConnectionRequestFrame(connectionRequest, nettyOutbound, cd11StationLookup, connectionConfig, cd11FrameFactory);
            } else {
              logger.addKeyValueArgument(STATION, connectionRequest.getStationOrResponderName());
              logger.debug("Cd11 Request frame for station {} is being ignored.", connectionRequest.getStationOrResponderName());
            }
          }
          return Mono.empty();
        }).then();
  }

  // Create the cd11 frame factory for reading and converting byte data
  private Cd11FrameFactory createCd11FrameFactory(Cd11ConnManConfig cd11ConnManConfig) {
    return Cd11FrameFactory.create(AUTHENTICATION_KEY_IDENTIFIER, cd11ConnManConfig.getFrameCreator(),
      cd11ConnManConfig.getFrameDestination());
  }

  // Process the connection request frame from client and send response frame
  private void processConnectionRequestFrame(Cd11ConnectionExchange connectionRequest,
    NettyOutbound nettyOutbound,
    Function<String, Cd11Station> cd11StationLookup,
    Cd11ConnectionConfig connectionConfig, Cd11FrameFactory cd11FrameFactory) {

    String stationName = connectionRequest.getStationOrResponderName();
    logger.addKeyValueArgument(STATION, stationName);
    logger.info("Received connection request from station {} at {}:{}", stationName, InetAddresses.fromInteger(connectionRequest.getIpAddress()), connectionRequest.getPort());

    // Find the station info.
    Cd11Station cd11Station = cd11StationLookup.apply(stationName);

    // Check that the station name is known.
    if (cd11Station == null) {
      logger.warn(
        "Connection request received from station {} that has no active configuration; ignoring connection.",
        stationName);
    } else {
      String consumerAddressIp = InetAddresses.toAddrString(cd11Station.dataConsumerIpAddress);
      // Check that the request originates from the expected IP Address.
      // Send out the Connection Response Frame.
      logger.info("Configured data consumer retrieved from cd11Station, resolved IP: {}",
        consumerAddressIp);

      logger.info("Connection Request from station {} processed. Redirecting station to {}:{} ",
        stationName,
        cd11Station.dataConsumerIpAddress,
        cd11Station.dataConsumerPort);
      // Create the Cd11ConnectionResponseFrame with the frame factory
      Cd11ConnectionExchange connectionResponse = Cd11ConnectionExchange
        .withConfig(connectionConfig)
        .setIpAddress(Cd11Validator.validIpAddress(cd11Station.dataConsumerIpAddress))
        .setPort(cd11Station.dataConsumerPort)
        .setSecondIpAddress(0)
        .setSecondPort(0)
        .build();

      // Send the response frame back to the client for connecting station
      nettyOutbound.sendByteArray(Mono.just(cd11FrameFactory.wrapResponse(connectionResponse).toBytes()))
        .then()
        .subscribe();

      logger.info("Connection Response Frame sent to station {}.", stationName);
    }

  }
}

