package gms.dataacquisition.cd11.rsdf.processor;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import gms.core.dataacquisition.receiver.DataFrameReceiverConfiguration;
import gms.dataacquisition.cd11.rsdf.util.GmsObjectUtility;
import gms.dataacquisition.component.test.utils.AbstractKafkaConsumerApplication;
import gms.dataacquisition.component.test.utils.KafkaTest;
import gms.shared.frameworks.injector.InjectableType;
import gms.shared.frameworks.injector.RsdfIdModifier;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiObjectMapperFactory;
import gms.shared.frameworks.osd.coi.waveforms.RawStationDataFrame;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.kafka.KafkaConfiguration;
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
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.BDDMockito.willReturn;


@Tag("component")
@ExtendWith(MockitoExtension.class)
 class ReactorCd11RsdfProcessorTest extends KafkaTest {

  private static final String BASE_PATH = "gms/data/";
  private static final String RSDF_PATH = BASE_PATH + "PLCA-RSDF.json";

  protected static ReactorCd11RsdfProcessor processor;

  @Mock
  DataFrameReceiverConfiguration mockReceiverConfiguration;

  @Mock
  private SystemConfig mockSystemConfiguration;

  @BeforeEach
  void setup() {
    initialize();
    initializeMockSystemConfiguration();
    initMockReceiverConfig();
  }

  @Test
  void testReceiptAndProcessOfRawStationDataFrame() throws IOException, InterruptedException {
    final Instant startTime = Instant.now();

    // Soh topics and expected number of messages
    String aceiTopic = "kafka-acquiredchannelsoh-topic";
    String extractTopic = "kafka-stationsohinput-topic";
    final int numberOfExpectedAcei = 68;
    final int numberOfExpectedExtract = 1;

    // Atomic counter of messages and countdown latch
    final AtomicInteger numberOfReceivedAcei = new AtomicInteger(0);
    final AtomicInteger numberOfReceivedExtract = new AtomicInteger(0);
    final CountDownLatch countDownLatchAcei = new CountDownLatch(numberOfExpectedAcei);
    final CountDownLatch countDownLatchExtract = new CountDownLatch(numberOfExpectedExtract);

    // Create the test RSDF object from file
    Optional<?> rsdfOpt = GmsObjectUtility.getGmsObject(RSDF_PATH, RawStationDataFrame.class);
    assertTrue(rsdfOpt.isPresent());
    RawStationDataFrame inputRsdf = (RawStationDataFrame) rsdfOpt.get();
    assertNotNull(inputRsdf);

    // Add data generator to send to kafka
    addDataGenerator(InjectableType.RAW_STATION_DATA_FRAME_ID,
        Duration.ofMillis(100), 1, 1, () -> inputRsdf,
        new RsdfIdModifier(),
        this::submitToKafka);

    // Add the acei consumer
    addKafkaConsumer(new AbstractKafkaConsumerApplication<>() {
      @Override
      protected void initialize() {
        setSystemConfig(mockSystemConfiguration);
        super.initialize();
        setInputTopic(aceiTopic);
      }

      @Override
      protected String getComponentName() {
        return "acei-test-consumer";
      }

      @Override
      protected Optional<Object> parseMessage(String messageString) {
        final ObjectMapper objectMapper = CoiObjectMapperFactory.getJsonObjectMapper();
        getLogger().info("Received ACEI, parsing...");
        try {
          return Optional.ofNullable(objectMapper.readValue(messageString, new TypeReference<>() {
          }));
        } catch (IOException e) {
          getLogger().error("Error parsing ACEI", e);
          return Optional.empty();
        }
      }

      @Override
      protected void consumeRecords(Collection<Object> records) {
        numberOfReceivedAcei.getAndAdd(records.size());
        if (numberOfReceivedAcei.get() > 0) {
          countDownLatchAcei.countDown();
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

    // Add the soh extract consumer
    addKafkaConsumer(new AbstractKafkaConsumerApplication<>() {
      @Override
      protected void initialize() {
        setSystemConfig(mockSystemConfiguration);
        super.initialize();
        setInputTopic(extractTopic);
      }

      @Override
      protected String getComponentName() {
        return "extract-test-consumer";
      }

      @Override
      protected Optional<Object> parseMessage(String messageString) {
        final ObjectMapper objectMapper = CoiObjectMapperFactory.getJsonObjectMapper();
        getLogger().info("Received Extract, parsing...");
        try {
          return Optional.ofNullable(objectMapper.readValue(messageString, new TypeReference<>() {
          }));
        } catch (IOException e) {
          getLogger().error("Error parsing Extract", e);
          return Optional.empty();
        }
      }

      @Override
      protected void consumeRecords(Collection<Object> records) {
        numberOfReceivedExtract.getAndAdd(records.size());
        if (numberOfReceivedExtract.get() > 0) {
          countDownLatchExtract.countDown();
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

    // Reactor Cd11 Rsdf processor
    KafkaConfiguration kafkaConfiguration = buildDefaultTestConfiguration(
        getBootstrapServersString());
    processor = ReactorCd11RsdfProcessor.create(kafkaConfiguration, mockReceiverConfiguration);
    processor.run();

    assertTrue(countDownLatchAcei.await(30, TimeUnit.SECONDS),
        "Timed out waiting to receive acei messages");

    getLogger().info("Asserting we received the expected number of acei messages");
    assertEquals(numberOfExpectedAcei,
        numberOfReceivedAcei.get());

    assertTrue(countDownLatchExtract.await(30, TimeUnit.SECONDS),
        "Timed out waiting to receive extract messages");

    getLogger().info("Asserting we received the expected number of extract messages");
    assertEquals(numberOfExpectedExtract,
        numberOfReceivedExtract.get());

    getLogger().info("Test duration: {} ms", Duration.between(startTime, Instant.now()).toMillis());
  }

  @AfterEach
  void tearDown() {
    cleanup();
    processor.close();
  }

  private static KafkaConfiguration buildDefaultTestConfiguration(String bootstrapServer) {
    return KafkaConfiguration.builder()
        .setApplicationId("cd11-rsdf-processor")
        .setBootstrapServers(bootstrapServer)
        .setInputRsdfTopic("soh.rsdf")
        .setMalformedFrameTopic("malformed.frame")
        .setOutputAcquiredChannelSohTopic("soh.acei")
        .setOutputStationSohInputTopic("soh.extract")
        .setKeySerializer("org.apache.kafka.common.serialization.Serdes$StringSerde")
        .setValueSerializer("org.apache.kafka.common.serialization.Serdes$StringSerde")
        .setNumberOfVerificationAttempts(1)
        .setStreamsCloseTimeoutMs(120000)
        .setConnectionRetryCount(10)
        .setRetryBackoffMs(1000L)
        .setSessionTimeout(60000)
        .setMaxPollInterval(2500)
        .setMaxPollRecords(2000)
        .setAutoCommit(false)
        .setHeartbeatInterval(3000)
        .setTransactionTimeout(30000)
        .setAcks("all")
        .setDeliveryTimeout(120000)
        .build();
  }

  private void submitToKafka(Object next) {

    Producer<String, String> producer = ReactorKafkaFactory.getProducer(
        "mock_data_inject_producer_raw_station_data_frame_id",
        getBootstrapServersString(),
        10,
        1000L,
        mockSystemConfiguration);

    try {
      List<?> nextList = (ArrayList<?>) next;
      ProducerRecord<String, String> record = new ProducerRecord<>("soh.rsdf",
          CoiObjectMapperFactory.getJsonObjectMapper().writeValueAsString(nextList.get(0)));
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
    willReturn("kafka-stationsohinput-topic")
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

  private void initMockReceiverConfig() {
    willReturn(Optional.of("PLCA.PLCA1.SHZ"))
        .given(mockReceiverConfiguration).getChannelName("PLCA.PLCA1.SHZ");
    willReturn(Optional.of("PLCA.PLCAB.BHZ"))
        .given(mockReceiverConfiguration).getChannelName("PLCA.PLCAB.BHZ");
    willReturn(Optional.of("PLCA.PLCAB.BHN"))
        .given(mockReceiverConfiguration).getChannelName("PLCA.PLCAB.BHN");
    willReturn(Optional.of("PLCA.PLCAB.BHE"))
        .given(mockReceiverConfiguration).getChannelName("PLCA.PLCAB.BHE");
  }
}
