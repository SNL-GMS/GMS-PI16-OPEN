package gms.dataacquisition.stationreceiver.cd11.dataman.handlers;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willReturn;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import com.fasterxml.jackson.databind.ObjectMapper;
import gms.core.dataacquisition.receiver.DataFrameReceiverConfiguration;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11FrameFactory;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11FrameReader;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11GapList;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11OrMalformedFrame;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11OrMalformedFrame.Kind;
import gms.dataacquisition.stationreceiver.cd11.common.FrameUtilities;
import gms.dataacquisition.stationreceiver.cd11.common.GapList;
import gms.dataacquisition.stationreceiver.cd11.common.enums.FrameType;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Acknack;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Alert;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11CommandResponse;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Frame;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Header;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11OptionExchange;
import gms.dataacquisition.stationreceiver.cd11.common.frames.CustomReset;
import gms.dataacquisition.stationreceiver.cd11.common.frames.MalformedFrame;
import gms.dataacquisition.stationreceiver.cd11.common.frames.PartialFrame;
import gms.dataacquisition.stationreceiver.cd11.common.reactor.netty.Cd11Connection;
import gms.dataacquisition.stationreceiver.cd11.dataman.Cd11GapListUtility;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiObjectMapperFactory;
import gms.shared.frameworks.osd.coi.waveforms.RawStationDataFrame;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.stream.Stream;
import mockit.MockUp;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatcher;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;
import reactor.netty.ByteBufFlux;
import reactor.netty.NettyInbound;
import reactor.netty.NettyOutbound;
import reactor.test.StepVerifier;
import reactor.test.publisher.TestPublisher;
import reactor.test.scheduler.VirtualTimeScheduler;

@ExtendWith(MockitoExtension.class)
class ReactorCd11FrameHandlerTests {

  Cd11FrameFactory frameFactory = Cd11FrameFactory.createDefault();

  Cd11GapList gapList;

  @Mock
  DataFrameReceiverConfiguration receiverConfiguration;

  @Captor
  ArgumentCaptor<Flux<Cd11Frame>> framesCaptor;

  Sinks.Many<RawStationDataFrame> rsdfSink;

  Sinks.Many<MalformedFrame> malformedFrameSink;

  @Mock
  NettyInbound inbound;

  @Mock
  NettyOutbound outbound;

  ReactorCd11FrameHandler handler;

  private static final String RSDF_RESOURCE = "LBTB-RSDF.json";
  private static final String RSDF_STATION_NAME = "LBTB";

  private static final ObjectMapper objectMapper = CoiObjectMapperFactory.getJsonObjectMapper();
  private TestPublisher<byte[]> testPublisher;

  @BeforeEach
  void setUp() {
    rsdfSink = Sinks.many().unicast().onBackpressureError();
    malformedFrameSink = Sinks.many().unicast().onBackpressureError();
    gapList = spy(new Cd11GapList());
    testPublisher = TestPublisher.create();

    handler = spy(new ReactorCd11FrameHandler(RSDF_STATION_NAME, receiverConfiguration,
        frameFactory, rsdfSink, malformedFrameSink, gapList));
  }

  @Test
  void testHandleAcknackFrame() {
    Cd11Acknack acknack = Cd11Acknack.builder()
        .setFrameSetAcked("TEST:0")
        .setLowestSeqNum(0)
        .setHighestSeqNum(1)
        .setGapCount(0)
        .setGapRanges(new long[]{})
        .build();

    handler.handleAcknack(frameFactory.wrap(acknack));

    assertEquals(acknack.getFrameSetAcked(), handler.getFrameSet());
    verify(gapList).checkForReset(any());
  }

  @Test
  void testInstantShutdown() {
    assertDoesNotThrow(handler::shutdown);
  }

  @ParameterizedTest
  @MethodSource("alertBytesSource")
  void testHandleAlertFrame(byte[][] alertFrameBytes) {

    given(inbound.withConnection(any())).willReturn(inbound);
    given(inbound.receive()).willReturn(ByteBufFlux.fromInbound(testPublisher));

    StepVerifier.create(handler.apply(inbound, outbound))
        .then(() -> handler.setCd11Connection(spy(handler.getCd11Connection().orElseThrow())))
        .then(() -> testPublisher.emit(alertFrameBytes))
        .verifyComplete();

    Cd11Connection spiedConnection = handler.getCd11Connection().orElseThrow();
    verify(spiedConnection, never()).send(argThat(isType(FrameType.ALERT)));
    verify(spiedConnection, atLeastOnce()).close();
    verifyNoMoreInteractions(spiedConnection);
  }

  private static Stream<Arguments> alertBytesSource() {
    Cd11FrameFactory frameFactory = Cd11FrameFactory.createDefault();
    Cd11Frame alertFrame = frameFactory.wrap(Cd11Alert.create("TEST ALERT."));
    byte[] alertBytes = alertFrame.toBytes();

    return Stream.of(
        Arguments.arguments((Object) new byte[][]{alertBytes}),
        Arguments.arguments((Object) new byte[][]{alertBytes, alertBytes, alertBytes, alertBytes})
    );
  }

  @Test
  void testHandleCommandResponse() {
    Cd11Frame commandResponseFrame = frameFactory.wrap(Cd11CommandResponse.builder()
        .setResponderStation("TEST")
        .setSite("SITE")
        .setChannel("CHZ")
        .setLocName("LC")
        .setTimestamp(Instant.EPOCH)
        .setCommandRequestMessage("CRM")
        .setResponseMessage("RESPONSE")
        .build(), 11235813);

    handler.handleCommandResponse(commandResponseFrame);

    verify(gapList).processSequenceNumber(commandResponseFrame.getHeader().getSequenceNumber());
  }

  @Test
  void testHandleDataFrame() throws IOException {
    RawStationDataFrame inputRsdf = getRawStationDataFrame();
    Cd11OrMalformedFrame notMalformed = Cd11FrameReader
        .readFrame(ByteBuffer.wrap(inputRsdf.getRawPayload()));
    assertEquals(Kind.CD11, notMalformed.getKind());

    Cd11Frame cd11Frame = notMalformed.cd11();
    assertEquals(FrameType.DATA, cd11Frame.getType());
    //Leveraging understanding of the test data frame to properly set up configuration
    inputRsdf.getMetadata().getChannelNames().forEach(channel ->
        willReturn(Optional.of(channel)).given(receiverConfiguration).getChannelName(channel));

    StepVerifier.create(rsdfSink.asFlux())
        .then(() -> handler.handleData(cd11Frame))
        .then(rsdfSink::tryEmitComplete)
        .expectNextMatches(rsdf -> rsdf.hasSameStateAndRawPayload(
            inputRsdf.toBuilder()
                //reception time is set during RSDF creation, so need those to align
                .setMetadata(inputRsdf.getMetadata().toBuilder()
                    .setReceptionTime(rsdf.getMetadata().getReceptionTime())
                    .build())
                .build()))
        .verifyComplete();

    verify(gapList).processSequenceNumber(cd11Frame.getHeader().getSequenceNumber());
  }

  private RawStationDataFrame getRawStationDataFrame() throws IOException {
    byte[] rsdfBytes = Files.readAllBytes(Paths.get("src", "test", "resources", RSDF_RESOURCE));
    return objectMapper.readValue(rsdfBytes, RawStationDataFrame.class);
  }

  @ParameterizedTest
  @MethodSource("malformedFrameSource")
  void testHandleMalformedFrame(MalformedFrame malformed, MalformedFrame expected) {
    StepVerifier.create(malformedFrameSink.asFlux())
        .then(() -> handler.handleMalformed(malformed))
        .then(malformedFrameSink::tryEmitComplete)
        .expectNext(expected)
        .verifyComplete();
  }

  private static Stream<Arguments> malformedFrameSource() {
    PartialFrame frameWithHeader = PartialFrame.builder()
        .setHeader(Cd11Header.create(FrameType.DATA, 42, "TEST", "DEST", 100, 0))
        .build();

    MalformedFrame malformedFrameWithHeader = MalformedFrame.builder()
        .setStation("TEST")
        .setPartialFrame(frameWithHeader)
        .setCause(new IOException("bah"))
        .setBytes((new byte[]{1}))
        .setReadPosition(1)
        .build();

    MalformedFrame malformedFrameWithoutHeader = MalformedFrame.builder()
        .setPartialFrame(PartialFrame.builder().build())
        .setCause(new IOException("bah"))
        .setBytes(new byte[]{1})
        .setReadPosition(1)
        .build();

    return Stream.of(
        Arguments.arguments(
            malformedFrameWithHeader,
            malformedFrameWithHeader
        ),
        Arguments.arguments(
            malformedFrameWithoutHeader,
            malformedFrameWithoutHeader.toBuilder()
                .setStation(RSDF_STATION_NAME)
                .build()
        )
    );
  }

  @Test
  void testHandleOptionRequestFrame() {
    String request = "TEST";
    Cd11OptionExchange optionExchange = Cd11OptionExchange.builder()
        .setOptionType(1)
        .setOptionValue(FrameUtilities.padToLength(
            request, FrameUtilities.calculatePaddedLength(request.length(), 4))).build();
    Cd11Frame optionRequestFrame = frameFactory
        .wrapRequest(optionExchange);

    Cd11Frame expected = frameFactory.wrapResponse(optionExchange);

    Cd11Connection mockConnection = mock(Cd11Connection.class);

    given(mockConnection.sendContinuous(framesCaptor.capture())).willReturn(Mono.empty());

    handler.handleOptionRequest(Flux.just(optionRequestFrame), mockConnection);

    StepVerifier
        .create(framesCaptor.getValue())
        .consumeNextWith(frame -> assertEquals(expected.getPayload(), frame.getPayload()))
        .verifyComplete();
  }

  @ParameterizedTest
  @MethodSource("customResetBytesSource")
  void testHandleCustomResetFrame(byte[][] resetFrameBytes) {

    new MockUp<Cd11GapListUtility>() {
      @mockit.Mock
      public void clearGapState(String stationName) {
      }
    };

    given(inbound.withConnection(any())).willReturn(inbound);
    given(inbound.receive()).willReturn(ByteBufFlux.fromInbound(testPublisher));

    StepVerifier.create(handler.apply(inbound, outbound))
        .then(() -> handler.setCd11Connection(spy(handler.getCd11Connection().orElseThrow())))
        .then(() -> testPublisher.emit(resetFrameBytes))
        .verifyComplete();

    Cd11Connection spiedConnection = handler.getCd11Connection().orElseThrow();
    verify(spiedConnection, never()).send(any(Cd11Frame.class));
    verify(spiedConnection, atLeastOnce()).close();
    verifyNoMoreInteractions(spiedConnection);
  }

  private static Stream<Arguments> customResetBytesSource() {
    Cd11FrameFactory frameFactory = Cd11FrameFactory.createDefault();
    CustomReset resetFrame = CustomReset.create("RESET".getBytes(StandardCharsets.US_ASCII));
    byte[] resetBytes = frameFactory.wrap(resetFrame).toBytes();

    return Stream.of(
        Arguments.arguments((Object) new byte[][]{resetBytes}),
        Arguments.arguments((Object) new byte[][]{resetBytes, resetBytes, resetBytes, resetBytes})
    );
  }

  @Test
  void testSendAcknackPeriodically() {

    VirtualTimeScheduler.getOrSet();

    final Cd11Frame cd11AcknackFrame = frameFactory
        .wrap(Cd11Acknack.builder()
            .setFrameSetAcked("TEST:0")
            .setLowestSeqNum(0)
            .setHighestSeqNum(0)
            .setGapRanges(new long[0])
            .setGapCount(0)
            .build());
    byte[] cd11AcknackBytes = cd11AcknackFrame.toBytes();

    //Mock no inbound data
    given(inbound.withConnection(any())).willReturn(inbound);
    given(inbound.receive()).willReturn(ByteBufFlux.fromInbound(
        Flux.interval(Duration.ofSeconds(ReactorCd11FrameHandler.ACKNACK_TIME_SECONDS))
            .map(i -> cd11AcknackBytes)));

    given(outbound.sendByteArray(any())).willReturn(outbound);
    given(outbound.then()).willReturn(Mono.empty());

    int expectedAcknacks = 10;
    int expectedAlerts = 1;

    StepVerifier.withVirtualTime(() -> handler.apply(inbound, outbound))
        .thenAwait(Duration.ofMinutes(expectedAcknacks))
        .then(() -> handler.shutdown())
        .verifyComplete();

    verify(outbound, times(expectedAcknacks + expectedAlerts)).sendByteArray(any());
  }

  @Test
  void testPersistGapsPeriodically() {
    new MockUp<Cd11GapListUtility>() {
      @mockit.Mock
      public void persistGapState(String stationName, GapList gapList) {
      }
    };

    final Cd11Frame cd11AcknackFrame = frameFactory
        .wrap(Cd11Acknack.builder()
            .setFrameSetAcked("TEST:0")
            .setLowestSeqNum(0)
            .setHighestSeqNum(0)
            .setGapRanges(new long[0])
            .setGapCount(0)
            .build());
    byte[] cd11AcknackBytes = cd11AcknackFrame.toBytes();

    //Mock no inbound data
    given(inbound.withConnection(any())).willReturn(inbound);
    given(inbound.receive()).willReturn(ByteBufFlux.fromInbound(
        Flux.interval(Duration.ofSeconds(ReactorCd11FrameHandler.ACKNACK_TIME_SECONDS))
            .map(i -> cd11AcknackBytes)));

    //For shutdown
    given(outbound.sendByteArray(any())).willReturn(outbound);
    given(outbound.then()).willReturn(Mono.empty());

    StepVerifier.withVirtualTime(() -> handler.apply(inbound, outbound))
        .thenAwait(Duration.ofMinutes(12))
        .then(() -> handler.shutdown())
        .verifyComplete();

    verify(handler, times(2)).tryPersist();
  }

  @Test
  void testHeartbeatTimeout() {
    //Mock no inbound data
    given(inbound.withConnection(any())).willReturn(inbound);
    given(inbound.receive()).willReturn(ByteBufFlux.fromInbound(Flux.never()));

    given(outbound.sendByteArray(any())).willReturn(outbound);
    given(outbound.then()).willReturn(Mono.empty());

    StepVerifier.withVirtualTime(() -> handler.apply(inbound, outbound))
        .thenAwait(ReactorCd11FrameHandler.HEARTBEAT_DURATION.plusSeconds(1))
        .expectComplete()
        .verify(Duration.ofSeconds(1));
  }

  private static ArgumentMatcher<Cd11Frame> isType(FrameType type) {
    return frame -> type.equals(frame.getType());
  }
}