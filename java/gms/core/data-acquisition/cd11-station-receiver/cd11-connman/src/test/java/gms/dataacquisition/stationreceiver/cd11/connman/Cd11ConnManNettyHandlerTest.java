package gms.dataacquisition.stationreceiver.cd11.connman;

import com.google.common.net.InetAddresses;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11FrameFactory;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11FrameReader;
import gms.dataacquisition.stationreceiver.cd11.common.FrameUtilities;
import gms.dataacquisition.stationreceiver.cd11.common.configuration.Cd11ConnectionConfig;
import gms.dataacquisition.stationreceiver.cd11.common.enums.FrameType;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11ConnectionExchange;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Frame;
import gms.dataacquisition.stationreceiver.cd11.common.frames.PartialFrame;
import gms.dataacquisition.stationreceiver.cd11.connman.configuration.Cd11ConnManConfig;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.reactivestreams.Publisher;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Mono;
import reactor.netty.ByteBufFlux;
import reactor.netty.NettyInbound;
import reactor.netty.NettyOutbound;
import reactor.test.StepVerifier;
import reactor.test.publisher.TestPublisher;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.BiFunction;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class Cd11ConnManNettyHandlerTest {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(Cd11ConnManNettyHandlerTest.class));

  @Mock
  NettyInbound inbound;

  @Mock
  NettyOutbound outbound;

  @Mock
  Cd11ConnManConfig mockConfig;

  @Mock
  Cd11ConnectionConfig mockConnConfig;

  @Mock
  Mono<Void> mockMono;

  Map<String, Boolean> ignoredStationsMap;
  List<PartialFrame> frameList;
  private TestPublisher<byte[]> testPublisher;

  @Captor
  ArgumentCaptor<Publisher<? extends byte[]>> byteArrayCaptor;

  @BeforeEach
  void setUp() {

    testPublisher = TestPublisher.create();
    frameList = new ArrayList<>();
    ignoredStationsMap = Collections.emptyMap();
  }

  @Test
  void testHandleInboundOutbound() {
    setupConfig();
    Cd11ConnManNettyHandler testHandler = new Cd11ConnManNettyHandler();
    BiFunction<NettyInbound, NettyOutbound, Publisher<Void>> resultFunction = testHandler
      .handleInboundOutbound(mockConfig, this::mockLookup, ignoredStationsMap);

    given(inbound.withConnection(any())).willReturn(inbound);
    given(inbound.receive()).willReturn(ByteBufFlux.fromInbound(testPublisher));

    given(outbound.sendByteArray(byteArrayCaptor.capture())).willReturn(outbound);
    given(outbound.then()).willReturn(mockMono);

    short version = 1;
    var testFrame = Cd11FrameFactory.createDefault()
      .wrapRequest(Cd11ConnectionExchange.builder()
        .setMajorVersion(version)
        .setMinorVersion(version)
        .setStationOrResponderName("AB")
        .setStationOrResponderType("")
        .setServiceType("TCP")
        .setIpAddress(InetAddresses.coerceToInteger(InetAddresses.forString("192.168.0.1")))
        .setPort(8080).build());
    var data = testFrame.toBytes();
    StepVerifier.create(resultFunction.apply(inbound, outbound))
      .then(() -> testPublisher.emit(data))
      .verifyComplete();
    Mockito.verify(outbound).sendByteArray(any());


    Publisher<? extends byte[]> publisher = byteArrayCaptor.getValue();
    StepVerifier.create(publisher)
      .assertNext(byteArray -> {
        Cd11Frame responseFrame = Cd11FrameReader.readFrame(ByteBuffer.wrap(byteArray)).cd11();
        assertEquals(FrameType.CONNECTION_RESPONSE, responseFrame.getType());

        Cd11ConnectionExchange response = FrameUtilities.asPayloadType(responseFrame.getPayload(), FrameType.CONNECTION_RESPONSE);
        assertEquals(InetAddresses.coerceToInteger(InetAddresses.forString("127.0.0.1")), response.getIpAddress());
        assertEquals("AB", response.getStationOrResponderName());
      }).verifyComplete();
  }


  Cd11Station mockLookup(String station) {
    return new Cd11Station(InetAddresses.forString("192.168.0.1"),
      InetAddresses.forString("127.0.0.1"), 8080);
  }

  private void setupConfig() {
    given(mockConfig.getConnectionConfig()).willReturn(mockConnConfig);

    short version = 1;
    given(mockConfig.getFrameCreator()).willReturn("testLoc");
    given(mockConfig.getFrameDestination()).willReturn("1");

    given(mockConnConfig.getProtocolMajorVersion()).willReturn(version);
    given(mockConnConfig.getProtocolMinorVersion()).willReturn(version);
    given(mockConnConfig.getStationOrResponderName()).willReturn("AB");
    given(mockConnConfig.getStationOrResponderType()).willReturn("IDC");
    given(mockConnConfig.getServiceType()).willReturn("TCP");
  }


}
