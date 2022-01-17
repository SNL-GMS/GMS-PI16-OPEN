import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import gms.dataacquisition.component.test.utils.AbstractKafkaConsumerApplication;
import gms.dataacquisition.component.test.utils.KafkaTest;
import gms.shared.frameworks.injector.InjectableType;
import gms.shared.frameworks.injector.RsdfIdModifier;
import gms.shared.frameworks.osd.coi.Units;
import gms.shared.frameworks.osd.coi.channel.Channel;
import gms.shared.frameworks.osd.coi.channel.ChannelBandType;
import gms.shared.frameworks.osd.coi.channel.ChannelDataType;
import gms.shared.frameworks.osd.coi.channel.ChannelInstrumentType;
import gms.shared.frameworks.osd.coi.channel.ChannelOrientationType;
import gms.shared.frameworks.osd.coi.channel.ChannelProcessingMetadataType;
import gms.shared.frameworks.osd.coi.channel.ChannelSegment;
import gms.shared.frameworks.osd.coi.channel.Orientation;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiObjectMapperFactory;
import gms.shared.frameworks.osd.coi.signaldetection.Location;
import gms.shared.frameworks.osd.coi.waveforms.RawStationDataFrame;
import gms.shared.frameworks.osd.coi.waveforms.RawStationDataFrame.AuthenticationStatus;
import gms.shared.frameworks.osd.coi.waveforms.RawStationDataFrameMetadata;
import gms.shared.frameworks.osd.coi.waveforms.RawStationDataFramePayloadFormat;
import gms.shared.frameworks.osd.coi.waveforms.Waveform;
import gms.shared.frameworks.osd.coi.waveforms.WaveformSummary;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.kafka.reactor.ReactorKafkaFactory;
import org.apache.kafka.clients.consumer.ConsumerRebalanceListener;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.TopicPartition;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.BDDMockito.willReturn;


@Tag("component")
@ExtendWith(MockitoExtension.class)
class AbstractKafkaConsumerApplicationComponentTest extends KafkaTest {

  @Mock
  private SystemConfig mockSystemConfiguration;

  @BeforeEach
  void setup() throws InterruptedException {
    initialize();
  }

  @Test
  void testReceiptOfRawStationDataFrame() throws InterruptedException {
    final Instant startTime = Instant.now();

    final String inputTopic = "input-topic";
    final int numberOfExpectedRawStationDataFrames = 1;
    final AtomicInteger numberOfReceivedRawStationDataFrames = new AtomicInteger(0);
    final CountDownLatch countDownLatch = new CountDownLatch(numberOfExpectedRawStationDataFrames);

    initializeMockSystemConfiguration();

    // Channels
    Channel channel1 = Channel.from(
        "Test Channel 1",
        "Test Canonical Name 1",
        "Test Channel Description 1",
        "stationOne",
        ChannelDataType.DIAGNOSTIC_SOH,
        ChannelBandType.BROADBAND,
        ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
        ChannelOrientationType.VERTICAL,
        ChannelOrientationType.VERTICAL.getCode(),
        Units.COUNTS_PER_NANOMETER,
        50.0,
        Location.from(265.0, 47.65, 50.0, 100.0),
        Orientation.from(50.0, 95.0),
        List.of(),
        Map.of(),
        Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, "Test Channel Group 1"));
    UUID CHANNEL_SEGMENT1_ID = UUID
        .fromString("57015315-f7b2-4487-b3e7-8780fbcfb413");
    String segmentStartDateString = "1970-01-02T03:04:05.123Z";
    Instant SEGMENT_START = Instant.parse(segmentStartDateString);
    double SAMPLE_RATE1 = 2.0;
    double[] WAVEFORM_POINTS1 = new double[]{1.1, 2.2, 3.3, 4.4, 5.5};
    Waveform waveform1 = Waveform.from(
        SEGMENT_START, SAMPLE_RATE1, WAVEFORM_POINTS1);
    List<Waveform> waveforms1 = List.of(waveform1);
    ChannelSegment<Waveform> channelSegment1 = ChannelSegment.from(
        CHANNEL_SEGMENT1_ID, channel1, channel1.getName(),
        ChannelSegment.Type.RAW, waveforms1);
    // Waveform Summaries
    Map<String, WaveformSummary> waveformSummaries = Map.of(
        channel1.getName(), WaveformSummary.from(channel1.getName(),
            Instant.now(), Instant.now().plusSeconds(20L)));
    Instant SEGMENT1_END = channelSegment1.getEndTime();
    // RawStationDataFrames
    String FRAME1_STATION_NAME = "TEST STATION";

    RawStationDataFrame frame1 = RawStationDataFrame.builder()
        .setId(UUID.randomUUID())
        .setMetadata(RawStationDataFrameMetadata.builder()
            .setStationName(FRAME1_STATION_NAME)
            .setChannelNames(List.of(channel1.getName()))
            .setPayloadFormat(RawStationDataFramePayloadFormat.CD11)
            .setReceptionTime(SEGMENT1_END.plusSeconds(10))
            .setPayloadStartTime(SEGMENT_START)
            .setPayloadEndTime(SEGMENT1_END)
            .setAuthenticationStatus(AuthenticationStatus.AUTHENTICATION_SUCCEEDED)
            .setWaveformSummaries(waveformSummaries)
            .build())
        .setRawPayload(new byte[50])
        .build();

    addDataGenerator(InjectableType.RAW_STATION_DATA_FRAME_ID,
        Duration.ofMillis(100), 1, 1, () -> frame1,
        new RsdfIdModifier(),
        this::submitToKafka
    );

    // Note: you'll need to update application-id and input-topic so that they are unique in each
    // mock system configuration passed to each instantiation of AbstractKafkaConsumerApplication
    addKafkaConsumer(new AbstractKafkaConsumerApplication<>() {
      @Override
      protected void initialize() {
        setSystemConfig(mockSystemConfiguration);
        super.initialize();
        setInputTopic(inputTopic);
      }

      @Override
      protected String getComponentName() {
        return "rsdf-test-consumer";
      }

      @Override
      protected Optional<Object> parseMessage(String messageString) {
        final ObjectMapper objectMapper = CoiObjectMapperFactory.getJsonObjectMapper();
        getLogger().info("Received RSDF, parsing...");
        try {
          return Optional.ofNullable(objectMapper.readValue(messageString, new TypeReference<>() {
          }));
        } catch (IOException e) {
          getLogger().error("Error parsing RSDF", e);
          return Optional.empty();
        }
      }

      @Override
      protected void consumeRecords(Collection<Object> records) {
        numberOfReceivedRawStationDataFrames.getAndAdd(records.size());
        if (numberOfReceivedRawStationDataFrames.get() > 0) {
          countDownLatch.countDown();
        }
      }

      @Override
      protected Optional<ConsumerRebalanceListener> getConsumerRebalanceListener() {
        return Optional.of(new ConsumerRebalanceListener() {
          @Override
          public void onPartitionsRevoked(Collection<TopicPartition> partitions) {
            getLogger().info("Partitions revoked");
          }

          @Override
          public void onPartitionsAssigned(Collection<TopicPartition> partitions) {
            getLogger().info("Partitions assigned");
            getConsumerRunner().getMessagePoller().seekToBeginning(partitions);
          }
        });
      }
    });

    run();

    countDownLatch.await(30, TimeUnit.SECONDS);

    if (countDownLatch.getCount() == 0) {
      getLogger().info("Asserting we received the expected number of messages");
      assertEquals(numberOfExpectedRawStationDataFrames,
          numberOfReceivedRawStationDataFrames.get());
    } else {
      getLogger().warn("Timed out waiting to receive messages");
    }

    getLogger().info("Test duration: {} ms", Duration.between(startTime, Instant.now()).toMillis());
  }

  @AfterEach
  void tearDown() {
    cleanup();
  }

  private void submitToKafka(Object next) {
    Producer<String, String> producer = ReactorKafkaFactory.getProducer(
        "mock_data_inject_producer_raw_station_data_frame_id",
        getBootstrapServersString(),
        10,
        1000L,
        mockSystemConfiguration);
    try {
      ProducerRecord<String, String> record = new ProducerRecord<>("soh.rsdf",
          CoiObjectMapperFactory.getJsonObjectMapper().writeValueAsString(next));
      producer.send(record);
    } catch (JsonProcessingException ex) {
      throw new UncheckedIOException(ex);
    }
  }

  private void initializeMockSystemConfiguration() {

    // mock configuration for KafkaConfiguration
    willReturn("rsdf-test-consumer")
        .given(mockSystemConfiguration).getValue("application-id");
    willReturn(getBootstrapServersString())
        .given(mockSystemConfiguration).getValue("kafka-bootstrap-servers");
    willReturn("soh.rsdf")
        .given(mockSystemConfiguration).getValue("input-topic");
    willReturn("soh.rsdf")
        .given(mockSystemConfiguration).getValue("kafka-rsdf-topic");
    willReturn("malformed.frame")
        .given(mockSystemConfiguration).getValue("kafka-malformed-topic");
    willReturn("soh.acei")
        .given(mockSystemConfiguration).getValue("kafka-acquiredchannelsoh-topic");
    willReturn("soh.extract")
        .given(mockSystemConfiguration).getValue("kafka-stationsohinput-topic");
    willReturn("org.apache.kafka.common.serialization.Serdes$StringSerde")
        .given(mockSystemConfiguration).getValue("reactor-kafka-key-serializer");
    willReturn("org.apache.kafka.common.serialization.Serdes$StringSerde")
        .given(mockSystemConfiguration).getValue("reactor-kafka-value-serializer");
    willReturn("all")
        .given(mockSystemConfiguration).getValue("reactor-kafka-sender-acks");
    willReturn("org.apache.kafka.common.serialization.StringDeserializer")
        .given(mockSystemConfiguration).getValue("kafka-key-deserializer");
    willReturn("org.apache.kafka.common.serialization.StringDeserializer")
        .given(mockSystemConfiguration).getValue("kafka-value-deserializer");
    willReturn("10000")
        .given(mockSystemConfiguration).getValue("kafka-consumer-session-timeout");
    willReturn("3000")
        .given(mockSystemConfiguration).getValue("kafka-consumer-heartbeat-interval");

    // end mock configuration for KafkaConfiguration


    // mock configuration for KafkaConnectionConfiguration
    willReturn("org.apache.kafka.common.serialization.StringSerializer")
        .given(mockSystemConfiguration).getValue("kafka-key-serializer");
    willReturn("org.apache.kafka.common.serialization.StringSerializer")
        .given(mockSystemConfiguration).getValue("kafka-value-serializer");
    willReturn("gzip")
        .given(mockSystemConfiguration).getValue("kafka-compression-type");
  }

}
