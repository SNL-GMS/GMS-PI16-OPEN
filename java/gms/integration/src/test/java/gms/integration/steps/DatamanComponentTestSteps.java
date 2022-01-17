package gms.integration.steps;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.io.Files;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11FrameReader;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11FrameFactory;
import gms.dataacquisition.stationreceiver.cd11.common.FrameUtilities;
import gms.dataacquisition.stationreceiver.cd11.common.enums.FrameType;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Acknack;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Alert;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11CommandRequest;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11CommandResponse;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11ConnectionExchange;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Data;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Frame;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11OptionExchange;
import gms.dataacquisition.stationreceiver.cd11.common.frames.CustomReset;
import gms.integration.util.StepUtils;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiObjectMapperFactory;
import gms.shared.frameworks.osd.coi.waveforms.RawStationDataFrame;
import gms.shared.frameworks.test.utils.services.GmsServiceType;
import io.cucumber.core.internal.gherkin.deps.com.google.gson.JsonElement;
import io.cucumber.java.After;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.io.File;
import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.IntStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.shaded.com.google.common.net.InetAddresses;

/**
 * DataMan Gerkin test steps using supplied rsdf files from a local directory in json format
 */
@Testcontainers
public class DatamanComponentTestSteps {

  private static final Logger logger = LoggerFactory.getLogger(DatamanComponentTestSteps.class);

  private static final String RESOURCE_PATH_PREFIX =
      "gms/integration/requests/dataacquisition/dataman/";

  // JSON Resources for comparing kafka messages
  private static final String KAFKA_RSDF_RESOURCE = "LBTB-KAFKA-RSDF.json";

  // Kafka topics for RSDF Kafka topic
  private static final String RSDF_TOPIC = "soh.rsdf";

  private static final String CD11_DATA_FRAME_CLASS_KEY = "Cd11Data";
  private static final String RSDF_CLASS_KEY = "RawStationDataFrame";

  // Class map for separating the rsdf, acei and extract objects
  private static final Map<String, Class<?>> CLASS_MAP = new HashMap<>();

  // Maps Json objects to corresponding GMS objects
  private static final ObjectMapper objectMapper = CoiObjectMapperFactory.getJsonObjectMapper();

  static {
    CLASS_MAP.put(CD11_DATA_FRAME_CLASS_KEY, Cd11Data.class);
    CLASS_MAP.put(RSDF_CLASS_KEY, RawStationDataFrame.class);
  }

  // Resource files for the expected ACEI and Soh Extract objects
  String kafkaRsdfResourceFile = RESOURCE_PATH_PREFIX + KAFKA_RSDF_RESOURCE;
  private Map<Class<?>, List<?>> listsParsedFromResources = new HashMap<>();
  private Cd11Data cd11Data = null;
  private final int MAXSOCKETWAITTIME = 2000;

  // compose environment
  private static Environment environment = null;
  private Cd11FrameFactory cd11FrameFactory;

  private SocketChannel socketClient = null;
  boolean connected = false;
  boolean disconnected = false;
  boolean reconnected = false;
  boolean dataFramesSent = false;
  final AtomicReference<byte[]> inboundByteArray = new AtomicReference<>();
  private InetSocketAddress datamanSocketAddress;

  private Cd11Frame optionRequestFrame;

  public DatamanComponentTestSteps(Environment environment) {
    if (DatamanComponentTestSteps.environment == null) {
      DatamanComponentTestSteps.environment = environment;
    }
  }

  @Given("a Cd11FrameFactory for station {string}")
  public void aCdFrameFactoryForStation(String stationName) {
    cd11FrameFactory = Cd11FrameFactory.createUnauthenticated(stationName, "0");
  }

  @Given("an unused dataman connection")
  public void aUnusedConnection() throws UnknownHostException {
    datamanSocketAddress = getDatamanInetSocketAddress();
    socketClient = null;
    connected = false;
    disconnected = false;
    reconnected = false;
    dataFramesSent = false;
    inboundByteArray.set(null);
  }

  @Given("an input {string} frame resource file contains JSON versions of {string} objects")
  public void anInputResourceContainsJsonVersionsOf(String resourceName, String className)
      throws IOException, URISyntaxException {
    Class<?> clazz = CLASS_MAP.get(className);
    assertNotNull(clazz);
    URL url = StepUtils.class.getClassLoader().getResource(RESOURCE_PATH_PREFIX + resourceName);
    File jsonFile = Paths.get(url.toURI()).toFile();

    //String fileContents = Files.asByteSource(jsonFile).toString();
    String fileContents = new String(Files.asByteSource(jsonFile).read());

    Optional<?> rsdfOpt = Optional.of(objectMapper.readValue(fileContents, clazz));
    RawStationDataFrame rsdf = (RawStationDataFrame) rsdfOpt.get();
    assertNotNull(rsdf);

    logger.info(">>>> Read instance of {} from input resource {}", className, resourceName);
    logger.info("RSDF: " + rsdf);

    listsParsedFromResources.put(clazz, Collections.singletonList(rsdf));
  }

  @Given("the {string} object is converted to a {string} object")
  public void theObjectIsConvertedToACd11DataFrame(String rsdfClass, String cd11Frame) {
    Class<?> clazz = CLASS_MAP.get(rsdfClass);
    List<?> rsdfObjects = listsParsedFromResources.get(clazz);

    // Get the single RSDF from the list
    RawStationDataFrame rsdf = (RawStationDataFrame) rsdfObjects.get(0);

    assertNotNull(rsdf);

    // Convert the RSDF to a Cd11Data
    Cd11Frame frame = Cd11FrameReader.readFrame(ByteBuffer.wrap(rsdf.getRawPayload())).cd11();
    cd11Data = FrameUtilities.asPayloadType(frame.getPayload(), FrameType.DATA);

    assertNotNull(cd11Data);
  }

  @Given("the dataman socket is connected and sends a list of channel subframes")
  public void theCd11SocketIsConnectedAndSendsSubframes()
      throws IOException {

    final Cd11Frame cd11DataFrame = cd11FrameFactory
        .wrap(this.cd11Data, 1);

    sendDataToDataman(cd11DataFrame.toBytes());

    logger.info("Verifying CD11 Data Frame sent to Dataman...");
    verifyDataSent();
    logger.info("CD11 Data Frame sent to Dataman!");

    logger.info(String
        .format("Cd11 Socket Data Frames (len = %d):", this.cd11Data.getChannelSubframes().size()));

    this.cd11Data.getChannelSubframes().forEach(msg -> logger.info(msg.toString()));
  }

  @Then("within a period of {int} seconds expected {string} message is readable from the kafka topic {string}")
  public void withinGivenPeriodMessagesAreReadableFromTheKafkaTopic(int timeoutSeconds,
      String rsdfClass,
      String topicName) throws Exception {

    logger.info("Kafka Receive RSDFs:");
    final Class<?> clazzAcei = CLASS_MAP.get(rsdfClass);
    assertNotNull(clazzAcei);

    // Check the port exists and is open for Kafka
    Optional<Integer> portOpt = Optional
        .of(environment.deploymentCtxt().getServicePort(GmsServiceType.KAFKA_ONE));

    List<String> kafkaMessages = environment.deploymentCtxt()
        .receiveKafkaMessages(topicName, 1, timeoutSeconds * 1000);
    logger.info("Kafka messages (size = " + kafkaMessages.size() + "):");
    logger.info(kafkaMessages.toString());

    // Create the Rsdf object from json resource file
    JsonElement rsdfEelement = StepUtils.parseJsonResource(kafkaRsdfResourceFile);
    RawStationDataFrame expectedRsdf = createRsdfObject(rsdfEelement);

    // Compare the rsdf objects
    boolean rsdfmessagePassed = compareRsdfObjects(kafkaMessages, expectedRsdf);

    assertTrue(rsdfmessagePassed, "Failed to receive the expected Rsdf messages");
  }

  @When("the dataman socket is connected and sends a ACKNACK request for frame set {string}")
  public void theCd11SocketIsConnectedAndSendsAckNack(String frameSetAcked)
      throws IOException {
    final var lowestSeqNum = 1L;
    final var highestSeqNum = 3L;
    final var gaps = new long[]{lowestSeqNum, highestSeqNum};
    final Cd11Frame acknackFrame = cd11FrameFactory
        .wrap(Cd11Acknack.builder()
            .setFrameSetAcked(frameSetAcked)
            .setLowestSeqNum(lowestSeqNum)
            .setHighestSeqNum(highestSeqNum)
            .setGapRanges(gaps).build());

    sendDataToDataman(acknackFrame.toBytes());
  }

  @Then("an ACKNACK response is received for frame set {string}")
  public void anAcknackResponseIsReceivedForFrameSet(String frameSetAcked) throws IOException {
    verifyDataSent();

    receiveDataFromDataman(inboundByteArray);
    logger.info("Verifying ACKNACK response received from Dataman...");
    final var cd11AcknackFrame = parseAcknackFrame(inboundByteArray.get());
    assertTrue(cd11AcknackFrame.isPresent(), "ACKNACK response was not received from Dataman!");
    final var receivedFrame = cd11AcknackFrame.get();
    assertEquals(frameSetAcked, receivedFrame.getFrameSetAcked());
    assertTrue(receivedFrame.getGapRanges().length < 1);
    logger.info("Verified ACKNACK response received from Dataman!");
  }

  @When("the dataman socket is connected and sends a Alert request")
  public void theCd11SocketIsConnectedAndSendsAlert()
      throws IOException {
    final var message = "Test Alert Message \t\r\n1234567890-=`~!@$%^&*()_+[]{}\\|;':\",./<>?";
    final Cd11Frame alertFrame = cd11FrameFactory.wrap(Cd11Alert.create(message));

    sendDataToDataman(alertFrame.toBytes());
  }

  @And("the dataman socket was disconnected")
  public void theDatamanSocketWasDisconnected() throws IOException {
    connectSocketClient(true);
    assertTrue(disconnected);
    assertTrue(reconnected);
  }

  @Then("the dataman socket was sent a {string} message")
  public void messageWasSentToDataMan(String messageType) {
    logger.info("Verifying {} sent to Dataman...", messageType);
    verifyDataSent();
    logger.info("{} sent to Dataman!", messageType);
  }

  @When("an ACKNACK frame for frame set {string} is sent to dataman after sending malformed data")
  public void anACKNACKFrameCanBeSentAndRetrievedFromDatamanAfterSendingMalformedData(
      String frameSetAcked)
      throws IOException {
    final var seqNum = 1L;
    final var gaps = new long[]{1, 3};
    var acknackFrame = cd11FrameFactory.wrap(Cd11Acknack.builder()
        .setFrameSetAcked(frameSetAcked)
        .setLowestSeqNum(seqNum)
        .setHighestSeqNum(4L)
        .setGapRanges(gaps).build());

    final var outboundData = Arrays
        .asList(acknackFrame.getPayload().toBytes(), acknackFrame.toBytes());

    sendDataToDataman(outboundData);
  }

  @When("a CommandResponseFrame with sequence of {int} is sent to Dataman for station {string}")
  public void aCommandResponseFrameWithSequenceOfToUpdateTheGapListForStation(int sequence,
      String stationName) throws IOException {
    final Cd11Frame commandResponseFrame = cd11FrameFactory
        .wrap(Cd11CommandResponse.builder()
            .setResponderStation(stationName)
            .setSite("LBTB1")
            .setChannel("SHZ")
            .setLocName("ss")
            .setTimestamp(Instant.now())
            .setCommandRequestMessage("do it!")
            .setResponseMessage("did it!")
            .build(), sequence);

    sendDataToDataman(commandResponseFrame.toBytes());
  }

  @Then("a gap list between {int} and {int} is reported from Dataman")
  public void aGapListIsReportedFromDataman(int sequence, int nextSequence) throws IOException {
    receiveDataFromDataman(inboundByteArray);

    verifyDataSent();
    final var cd11AcknackFrame = parseAcknackFrame(inboundByteArray.get());
    assertTrue(cd11AcknackFrame.isPresent(), "ACKNACK response was not received from Dataman!");
    logger.info("Verifying ACKNACK response received from Dataman...");
    final var receivedFrame = cd11AcknackFrame.get();
    assertEquals(sequence, receivedFrame.getLowestSeqNum());
    assertEquals(nextSequence, receivedFrame.getHighestSeqNum());
    assertEquals(1, receivedFrame.getGapCount());
    final long[] gaps = new long[]{sequence + 1, nextSequence};
    assertEquals(gaps.length, receivedFrame.getGapRanges().length);
    IntStream.range(0, gaps.length)
        .forEach(i -> assertEquals(gaps[i], receivedFrame.getGapRanges()[i]));
    logger.info("Verified ACKNACK response received from Dataman!");
  }

  @When("sending an ACKNAK for frame set {string} with highestSeqNum of {int} and no gaps")
  public void sendingAnACKNAKWithHighestSeqNumOfAndNoGapsWillResetDatamansGapList(
      String frameSetAcked, int highestSeqNum)
      throws IOException {
    final var seqNum = 1L;
    final Cd11Frame acknackFrame = cd11FrameFactory
        .wrap(Cd11Acknack.builder()
            .setFrameSetAcked(frameSetAcked)
            .setLowestSeqNum(seqNum)
            .setHighestSeqNum(highestSeqNum)
            .setGapRanges(new long[]{}).build());
    connected = false;
    dataFramesSent = false;

    sendDataToDataman(acknackFrame.toBytes());
  }

  @When("a CustomReset is sent")
  public void sendingAnCustomResetFrame() throws IOException {
    Cd11Frame resetFrame = cd11FrameFactory.wrap(CustomReset.create("TEST".getBytes(
        StandardCharsets.US_ASCII)));
    connected = false;
    dataFramesSent = false;

    sendDataToDataman(resetFrame.toBytes());
  }

  @Then("dataman's gap list is reset for frame set {string}")
  public void datamansGapListIsReset(String frameSetAcked) throws IOException {
    verifyDataSent();

    receiveDataFromDataman(inboundByteArray);
    final var cd11AcknackFrame = parseAcknackFrame(inboundByteArray.get());
    assertTrue(cd11AcknackFrame.isPresent(), "ACKNACK response was not received from Dataman!");
    logger.info("Verifying ACKNACK response received from Dataman...");
    final var receivedFrame = cd11AcknackFrame.get();
    assertEquals(frameSetAcked, receivedFrame.getFrameSetAcked());
    assertEquals(0, receivedFrame.getLowestSeqNum());
    assertEquals(-1, receivedFrame.getHighestSeqNum());
    assertEquals(0, receivedFrame.getGapCount());
    assertEquals(0, receivedFrame.getGapRanges().length);
    logger.info("Verified ACKNACK response received from Dataman!");
  }

  @When("the dataman socket is connected and sends an Option request")
  public void theCd11SocketIsConnectedAndSendsOptionRequest()
      throws IOException {
    String optionRequest = "No Mayo";
    optionRequestFrame = cd11FrameFactory.wrapRequest(Cd11OptionExchange.builder()
        .setOptionType(1)
        .setOptionValue(FrameUtilities.padToLength(optionRequest,
            FrameUtilities.calculatePaddedLength(optionRequest.length(), 4)))
        .build());

    sendDataToDataman(optionRequestFrame.toBytes());
  }

  @Then("an OPTION response is received from dataman")
  public void anOPTIONResponseIsReceivedFromDataman() throws IOException {
    receiveDataFromDataman(inboundByteArray);

    Optional<Cd11OptionExchange> optionResponse = readOptionResponseFrame(
        inboundByteArray.get());

    Cd11OptionExchange expected = FrameUtilities
        .asPayloadType(optionRequestFrame.getPayload(), FrameType.OPTION_REQUEST);
    assertEquals(expected.getOptionType(), optionResponse.get().getOptionType());
    assertEquals(expected.getOptionValue(), optionResponse.get().getOptionValue());
  }

  private Optional<Cd11OptionExchange> readOptionResponseFrame(byte[] frameByteArray) {

    Cd11Frame optionResponseFrame = Cd11FrameReader.readFrame(ByteBuffer.wrap(frameByteArray))
        .cd11();
    logger.info("Byte frame type: {}", optionResponseFrame.getType());
    if (optionResponseFrame.getType().equals(FrameType.OPTION_RESPONSE)) {
      return Optional.of(FrameUtilities
          .asPayloadType(optionResponseFrame.getPayload(), FrameType.OPTION_RESPONSE));
    }
    return Optional.empty();
  }


  @When("the dataman socket is connected and sends a {string}")
  public void theDatamanSocketIsConnectedAndSendsAFrame_type(String frameType)
      throws IOException {
    Cd11Frame frame = getNoOpCd11Frame(frameType);
    connected = false;
    dataFramesSent = false;

    sendDataToDataman(frame.toBytes());
  }

  private Cd11Frame getNoOpCd11Frame(String frameType) {
    Cd11Frame frame;
    short major = 1;
    short minor = 0;
    switch (frameType) {
      case "COMMAND REQUEST":
        frame = cd11FrameFactory
            .wrap(Cd11CommandRequest.builder()
                .setSite("LBTB1")
                .setChannel("SHZ")
                .setLocName("ss")
                .setTimestamp(Instant.now())
                .setCommandMessage("do it!")
                .build());
        break;
      case "CONNECTION REQUEST":
        frame = cd11FrameFactory.wrapRequest(Cd11ConnectionExchange.builder()
            .setStationOrResponderName("TEST")
            .setStationOrResponderName("IDC")
            .setIpAddress(InetAddresses.coerceToInteger(datamanSocketAddress.getAddress()))
            .setPort(datamanSocketAddress.getPort())
            .setMajorVersion(major)
            .setMinorVersion(minor)
            .build());
        break;
      case "CONNECTION RESPONSE":
        frame = cd11FrameFactory.wrapResponse(Cd11ConnectionExchange.builder()
            .setStationOrResponderName("TEST")
            .setStationOrResponderName("IDC")
            .setIpAddress(InetAddresses.coerceToInteger(datamanSocketAddress.getAddress()))
            .setPort(datamanSocketAddress.getPort())
            .setMajorVersion(major)
            .setMinorVersion(minor)
            .build());
        break;
      case "OPTION RESPONSE":
        frame = cd11FrameFactory.wrapResponse(Cd11OptionExchange.builder()
            .setOptionType(1)
            .setOptionValue("12345678")
            .build());
        break;
      default:
        throw new IllegalArgumentException("frame type not recognized");
    }
    return frame;
  }

  // Compare the Rsdf objects from the kafka queue and the expected message
  private boolean compareRsdfObjects(List<String> kafkaMessages, RawStationDataFrame expectedRsdf) {

    // Create the JsonElement list from the kafka messages
    List<JsonElement> jsonElementList = StepUtils.createJsonElementList(kafkaMessages);

    // Ensure that JsonElement list only has one object
    if (jsonElementList.size() != 1) {
      return false;
    }

    // Create Kafka SOH Extract object from kafka messages
    JsonElement jsonRsdf = jsonElementList.get(0);
    RawStationDataFrame kafkaRsdf = createRsdfObject(jsonRsdf);

    // Compare the expected and kafka rsdf objects

    return expectedRsdf.hasSameStateAndRawPayload(kafkaRsdf);
  }

  // Create the Rsdf object from json element
  private RawStationDataFrame createRsdfObject(JsonElement jsonElement) {

    String rsdfString = jsonElement.getAsJsonObject().toString();

    Optional<RawStationDataFrame> rsdfOpt;
    try {
      rsdfOpt = Optional.of(
          objectMapper.readValue(rsdfString, RawStationDataFrame.class));
    } catch (IOException e) {
      throw new RuntimeException(e);
    }

    return rsdfOpt.get();
  }

  private Optional<Cd11Acknack> parseAcknackFrame(byte[] frameByteArray) {
    logger.info("Parsing ACKNACK response received from Dataman...");
    Cd11Frame acknackFrame;
    acknackFrame = Cd11FrameReader.readFrame(ByteBuffer.wrap(frameByteArray)).cd11();
    logger.info("Byte frame type: {}", acknackFrame.getType());
    if (acknackFrame.getType().equals(FrameType.ACKNACK)) {
      logger.info("ACKNACK response received from Dataman: {}",
          acknackFrame.getHeader().getFrameCreator());
      return Optional
          .of(FrameUtilities.asPayloadType(acknackFrame.getPayload(), FrameType.ACKNACK));
    }
    return Optional.empty();
  }

  private Optional<Cd11Alert> parseAlertFrame(byte[] frameByteArray) {
    logger.info("Parsing Alert response received from Dataman...");
    Cd11Frame alertFrame = Cd11FrameReader.readFrame(ByteBuffer.wrap(frameByteArray)).cd11();
    logger.info("Byte frame type: {}", alertFrame.getType());

    if (alertFrame.getType().equals(FrameType.ALERT)) {
      logger.info("Alert response received from Dataman: {}", alertFrame.getPayload().toString());
      return Optional.of(FrameUtilities.asPayloadType(alertFrame.getPayload(), FrameType.ALERT));
    }
    return Optional.empty();
  }

  private void sendDataToDataman(byte[] outboundData) throws IOException {
    this.sendDataToDataman(Collections.singletonList(outboundData));
  }

  private void sendDataToDataman(List<? extends byte[]> outboundData)
      throws IOException {

    connectSocketClient(false);

    if (socketClient.isConnected() || socketClient.finishConnect()) {
      connected = true;
      // Send messages to server
      logger.info("NIO TCP CLIENT - OUTBOUND STARTED...");
      for (byte[] d : outboundData) {
        if (!socketClient.isConnected()) {
          logger.info("NIO TCP CLIENT - RECONNECTING...");
          socketClient.connect(datamanSocketAddress);
          logger.info("NIO TCP CLIENT - RECONNECTED");
        }
        final var buffer = ByteBuffer.wrap(d);
        socketClient.write(buffer);
        logger.info("NIO TCP CLIENT - SENT SOME DATA");
        buffer.clear();
      }
      dataFramesSent = true;
      logger.info("NIO TCP CLIENT - OUTBOUND COMPLETE");
    }
  }

  private void receiveDataFromDataman(AtomicReference<byte[]> inbound) throws IOException {
    if (inbound != null) {
      connectSocketClient(false);
      inbound.set(null);
      logger.info("NIO TCP CLIENT - INBOUND STARTED...");
      final var byteBuffer = ByteBuffer.allocate(10000);
      socketClient.read(byteBuffer);
      inbound.set(byteBuffer.array());
      logger.info("NIO TCP CLIENT - GOT SOME DATA");
      logger.info("NIO TCP CLIENT - INBOUND COMPLETE");
    }
  }

  private void connectSocketClient(boolean checkForDisconnect) throws IOException {
    if (socketClient != null && socketClient.isConnected()) {

      int read = 0;
      if (checkForDisconnect) {
        try {
          logger.warn("NIO TCP CLIENT - CHECKING CONNECTION STATUS...");
          Optional<Cd11Alert> cd11AlertFrame = Optional.empty();
          while (cd11AlertFrame.isEmpty()) {
            inboundByteArray.set(null);
            receiveDataFromDataman(inboundByteArray);
            cd11AlertFrame = parseAlertFrame(inboundByteArray.get());
          }
          String alertMessage = cd11AlertFrame.get().getMessage().toLowerCase();
          logger.info("Cd11 Alert frame message: {}", alertMessage);
          if (alertMessage.contains("shutting down connection")) {
            logger.warn("NIO TCP CLIENT - SHUTDOWN DETECTED...");
            read = -1;
            disconnectSocketClient();
            socketClient = null;
            // this sleep is needed to allow old dataman (with shaky event model) to complete its
            // shutdown and restart cycle
            Thread.sleep(2000);
          }
        } catch (IOException | InterruptedException e) {
          logger.warn("NIO TCP CLIENT - FAILED TO CHECK CONNECTION STATUS", e);
          read = -1;
        }
      }

      if (read >= 0) {
        logger.info("NIO TCP CLIENT - ALREADY CONNECTED");
      } else {
        logger.info("NIO TCP CLIENT - RECONNECTING...");
        connectSocketClient(false);
        reconnected = true;
        logger.info("NIO TCP CLIENT - RECONNECTED");
      }
    } else {
      logger.info("NIO TCP CLIENT - CONNECTING...");
      socketClient = SocketChannel.open(datamanSocketAddress);
      logger.info("NIO TCP CLIENT - CONNECTED");
    }
  }

  private InetSocketAddress getDatamanInetSocketAddress() throws UnknownHostException {
    final var deploymentCtxt = environment.deploymentCtxt();
    final var datamanAddress = InetAddress
        .getByName(deploymentCtxt.getServiceHost(GmsServiceType.DATAMAN));
    final var datamanPort = environment.deploymentCtxt()
        .getServicePort(GmsServiceType.DATAMAN);

    return new InetSocketAddress(datamanAddress, datamanPort);
  }

  @After("@dataman")
  public void disconnectSocketClient() throws IOException {
    logger.info("NIO TCP CLIENT - DISCONNECTING...");
    if (socketClient.isConnected()) {
      socketClient.close();
      logger.info("NIO TCP CLIENT - DISCONNECTED");
      disconnected = true;
    } else {
      logger.info("NIO TCP CLIENT - ALREADY DISCONNECTED");
    }
  }

  private void verifyDataSent() {
    logger.info("Verifying connection was established...");
    assertTrue(connected);
    logger.info("Verified connection was established!");
    logger.info("Verifying data frame was sent...");
    assertTrue(dataFramesSent);
    logger.info("Verified data frame was sent!");
  }
}