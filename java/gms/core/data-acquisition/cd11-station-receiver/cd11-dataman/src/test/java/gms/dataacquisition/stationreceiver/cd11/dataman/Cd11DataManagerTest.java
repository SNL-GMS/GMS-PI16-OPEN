package gms.dataacquisition.stationreceiver.cd11.dataman;

import com.fasterxml.jackson.databind.ObjectMapper;
import gms.core.dataacquisition.receiver.DataFrameReceiverConfiguration;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Header;
import gms.dataacquisition.stationreceiver.cd11.common.frames.MalformedFrame;
import gms.dataacquisition.stationreceiver.cd11.common.frames.PartialFrame;
import gms.dataacquisition.stationreceiver.cd11.dataman.configuration.DataManConfig;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiObjectMapperFactory;
import gms.shared.frameworks.osd.coi.waveforms.RawStationDataFrame;
import gms.shared.utilities.kafka.KafkaConfiguration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.reactivestreams.Publisher;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;
import reactor.kafka.sender.KafkaOutbound;
import reactor.kafka.sender.KafkaSender;
import reactor.kafka.sender.SenderRecord;
import reactor.kafka.sender.SenderResult;
import reactor.kafka.sender.TransactionManager;

class Cd11DataManagerTest {

  private static final String RSDF_RESOURCE = "LBTB-RSDF.json";
  private static final ObjectMapper objectMapper = CoiObjectMapperFactory.getJsonObjectMapper();


  @Test
  void testCd11DataManager() throws IOException, InterruptedException {

    KafkaConfiguration kafkaConfiguration = Mockito.mock(KafkaConfiguration.class);
    Mockito.when(kafkaConfiguration.getInputRsdfTopic()).thenReturn("rsdf-topic");
    Mockito.when(kafkaConfiguration.getMalformedFrameTopic()).thenReturn("malformed-topic");

    Mockito.when(kafkaConfiguration.getApplicationId()).thenReturn("1");
    Mockito.when(kafkaConfiguration.getBootstrapServers()).thenReturn("1");
    Mockito.when(kafkaConfiguration.getTransactionTimeout()).thenReturn(1);
    Mockito.when(kafkaConfiguration.getAcks()).thenReturn("1");
    Mockito.when(kafkaConfiguration.getDeliveryTimeout()).thenReturn(1);

    DataFrameReceiverConfiguration dataFrameReceiverConfiguration = Mockito
      .mock(DataFrameReceiverConfiguration.class);
    DataManConfig dataManConfig = Mockito.mock(DataManConfig.class);

    Cd11DataManager cd11DataManager = Cd11DataManager
      .create(dataManConfig, dataFrameReceiverConfiguration, kafkaConfiguration);

    CountDownLatch rsdfCountDownLatch = new CountDownLatch(1);
    CountDownLatch partialFrameCountDownLatch = new CountDownLatch(1);

    MockKafkaSender<RawStationDataFrame> rsdfSender = new MockKafkaSender<>(
      rsdfCountDownLatch);

    MockKafkaSender<MalformedFrame> partialFrameMockKafkaSender = new MockKafkaSender<>(
      partialFrameCountDownLatch);

    Sinks.Many<RawStationDataFrame> localRsdfSink = Sinks.many().unicast().onBackpressureBuffer();
    Sinks.Many<MalformedFrame> malformedSink = Sinks.many().unicast().onBackpressureBuffer();
    cd11DataManager.initialize(rsdfSender, partialFrameMockKafkaSender, () -> localRsdfSink,
      () -> malformedSink);

    //Create RawStationDataFrame from file
    byte[] rsdfBytes = Files.readAllBytes(Paths.get("src", "test", "resources", RSDF_RESOURCE));

    Cd11Header cd11Header = Mockito.mock(Cd11Header.class);
    Mockito.when(cd11Header.getFrameCreator()).thenReturn("the creator");
    var malformed = MalformedFrame.builder()
      .setPartialFrame(PartialFrame.builder().setHeader(cd11Header).build())
      .setStation(cd11Header.getFrameCreator())
      .setCause(new IOException("Whoops"))
      .setBytes(new byte[]{})
      .setReadPosition(0).build();
    var rsdf = objectMapper.readValue(rsdfBytes, RawStationDataFrame.class);
    localRsdfSink.tryEmitNext(rsdf);
    malformedSink.tryEmitNext(malformed);
    cd11DataManager.start(1, Duration.ofMinutes(10000), Duration.ofMinutes(10000));

    rsdfCountDownLatch.await(500, TimeUnit.MILLISECONDS);
    partialFrameCountDownLatch.await(500, TimeUnit.MILLISECONDS);

    //Verify both the rsdf and partialFrame were "sent" via the mock kafka producer
    Assertions.assertEquals(0, rsdfCountDownLatch.getCount());
    Assertions.assertEquals(0, partialFrameCountDownLatch.getCount());

    cd11DataManager.shutdown();

  }

  private static class MockKafkaSender<U> implements KafkaSender<String, U> {

    private CountDownLatch countDownLatch;

    MockKafkaSender(
      CountDownLatch countDownLatch) {
      this.countDownLatch = countDownLatch;
    }

    @Override
    public <T> Flux<SenderResult<T>> send(
      Publisher<? extends SenderRecord<String, U, T>> records) {
      return null;
    }

    @Override
    public <T> Flux<Flux<SenderResult<T>>> sendTransactionally(
      Publisher<? extends Publisher<? extends SenderRecord<String, U, T>>> records) {

      var outerFlux = Flux.from(records);
      var flux = outerFlux
        .map(Flux::from);

      return flux
        .map(innerFlux -> innerFlux.map(senderRecord -> {
          countDownLatch.countDown();
          return new SenderResult<T>() {
            @Override
            public RecordMetadata recordMetadata() {
              return null;
            }

            @Override
            public Exception exception() {
              return null;
            }

            @Override
            public T correlationMetadata() {
              return senderRecord.correlationMetadata();
            }
          };
        }));
    }

    @Override
    public TransactionManager transactionManager() {
      return null;
    }

    @Override
    public KafkaOutbound<String, U> createOutbound() {
      return null;
    }

    @Override
    public <T> Mono<T> doOnProducer(
      Function<Producer<String, U>, ? extends T> function) {
      return null;
    }

    @Override
    public void close() {

    }
  }
}