package gms.core.dataacquisition.reactor;

import gms.shared.frameworks.control.ControlContext;
import gms.shared.frameworks.messaging.KafkaOffsetWrapper;
import gms.shared.frameworks.osd.api.rawstationdataframe.AceiUpdates;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue.AcquiredChannelEnvironmentIssueType;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueAnalog;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;
import gms.shared.reactor.ReactorKafkaFluxSupplier;
import org.apache.kafka.common.TopicPartition;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.GroupedFlux;
import reactor.kafka.receiver.ReceiverOffset;
import reactor.kafka.receiver.ReceiverPartition;
import reactor.kafka.receiver.ReceiverRecord;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.BDDMockito.willReturn;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

@ExtendWith(MockitoExtension.class)
class ReactorAceiMergeProcessorTest {

  @Mock
  ControlContext mockContext;

  @Mock
  ReactorKafkaFluxSupplier<AcquiredChannelEnvironmentIssue<?>> mockFluxSupplier;

  @Mock
  AceiMergerFactory mockFactory;

  @Mock
  AceiUpdatesMerger updatesMerger;

  @Mock
  AceiNeighborMerger backfillMerger;

  @Mock
  AceiUpdatesConsumer aceiUpdatesConsumer;

  @Mock
  ReceiverOffset offset;

  @Mock
  ReceiverOffset offset2;

  @Mock
  ReceiverRecord<String, AcquiredChannelEnvironmentIssue<?>> aBooleanRecord;

  @Mock
  ReceiverRecord<String, AcquiredChannelEnvironmentIssue<?>> aBackFillRecord;

  @Mock
  ReceiverRecord<String, AcquiredChannelEnvironmentIssue<?>> aAnalogRecord;

  @Spy
  Map<TopicPartition, Disposable> subscriptionRecords = new HashMap<>();

  TopicPartition topicPartition;

  @Mock
  GroupedFlux<TopicPartition, ReceiverRecord<String, AcquiredChannelEnvironmentIssue<?>>> groupedFlux;

  @Mock
  Disposable disposable;



  ReactorAceiMergeProcessor processor;

  @BeforeEach
  void setUp() {

    processor = ReactorAceiMergeProcessor.create(mockContext);

    topicPartition = new TopicPartition("test", 1);

    subscriptionRecords.put(topicPartition, disposable);

    processor
        .initialize(mockFluxSupplier, mockFactory, aceiUpdatesConsumer, 3, Duration.ofSeconds(1),
            subscriptionRecords);
  }

  @Test
  @Disabled("Intermittent failure in pipelines due to race condition. MUST FIX")
    //TODO Intermittent failure in pipelines due to race condition. MUST FIX
  void testStartSinglePartition() {
    given(mockFactory.buildUpdatesMerger()).willReturn(updatesMerger);
    given(mockFactory.buildNeighborMerger()).willReturn(backfillMerger);

    AcquiredChannelEnvironmentIssueBoolean aBoolean = AcquiredChannelEnvironmentIssueBoolean
        .from("channelA", AcquiredChannelEnvironmentIssueType.CLIPPED, Instant.EPOCH,
            Instant.EPOCH.plusSeconds(10), true);
    AcquiredChannelEnvironmentIssueAnalog aAnalog = AcquiredChannelEnvironmentIssueAnalog
        .from("channelA", AcquiredChannelEnvironmentIssueType.NUMBER_OF_SAMPLES, Instant.EPOCH,
            Instant.EPOCH.plusSeconds(10), 100.0);

    willReturn(1L).given(offset).offset();
    willReturn(2L).given(offset2).offset();

    willReturn(aBoolean).given(aBooleanRecord).value();
    willReturn(offset).given(aBooleanRecord).receiverOffset();

    willReturn(aAnalog).given(aAnalogRecord).value();
    willReturn(offset2).given(aAnalogRecord).receiverOffset();

    Flux<GroupedFlux<TopicPartition, ReceiverRecord<String, AcquiredChannelEnvironmentIssue<?>>>> inputFlux = Flux
        .just(
            aBooleanRecord, aAnalogRecord).groupBy(acei -> new TopicPartition("test", 0));
    given(mockFluxSupplier.getPartitionFlux()).willReturn(inputFlux);

    AceiUpdates expectedUpdates = AceiUpdates.builder()
        .setBooleanInserts(List.of(aBoolean))
        .setAnalogInserts(List.of(aAnalog))
        .build();

    given(updatesMerger.mergeAll(any())).willReturn(expectedUpdates);
    given(backfillMerger.tryMergeWithNeighbors(expectedUpdates))
        .willReturn(expectedUpdates);

    willDoNothing().given(aceiUpdatesConsumer).accept(any());

    processor.start();

    verify(aceiUpdatesConsumer, timeout(10000)).accept(any());
    verifyNoMoreInteractions(aceiUpdatesConsumer);
  }

  @Test
  void testMergeOffsets() {
    List<ReceiverRecord<String, AcquiredChannelEnvironmentIssue<?>>> recordCollection = List
        .of(aBooleanRecord, aBackFillRecord);

    AcquiredChannelEnvironmentIssueBoolean aBoolean = AcquiredChannelEnvironmentIssueBoolean
        .from("channelA", AcquiredChannelEnvironmentIssueType.CLIPPED, Instant.EPOCH,
            Instant.EPOCH.plusSeconds(10), true);
    AcquiredChannelEnvironmentIssueBoolean aBackFill = AcquiredChannelEnvironmentIssueBoolean
        .from("channelA", AcquiredChannelEnvironmentIssueType.CLIPPED,
            Instant.EPOCH.plusSeconds(10),
            Instant.EPOCH.plusSeconds(11), true);

    AceiUpdates mockUpdates = Mockito.mock(AceiUpdates.class);

    ReceiverOffset booleanOffset = Mockito.mock(ReceiverOffset.class);
    willReturn(1L).given(booleanOffset).offset();
    ReceiverOffset backfillOffset = Mockito.mock(ReceiverOffset.class);
    willReturn(2L).given(backfillOffset).offset();

    willReturn(aBoolean).given(aBooleanRecord).value();
    willReturn(aBackFill).given(aBackFillRecord).value();

    willReturn(booleanOffset).given(aBooleanRecord).receiverOffset();
    willReturn(backfillOffset).given(aBackFillRecord).receiverOffset();

    willReturn(mockUpdates).given(updatesMerger).mergeAll(any());

    KafkaOffsetWrapper<AceiUpdates> result = processor
        .mergeOffsets(recordCollection, updatesMerger);

    assertEquals(mockUpdates, result.getValue());
    assertEquals(backfillOffset, result.getOffset());

    verify(updatesMerger).mergeAll(any());
  }


  @Test
  void testDisposalListener() {
    Collection<ReceiverPartition> partitionCollection = new ArrayList<>();

    ReceiverPartition receiverPartition = Mockito.mock(ReceiverPartition.class);
    willReturn(topicPartition).given(receiverPartition).topicPartition();
    partitionCollection.add(receiverPartition);

    processor.disposalListener(partitionCollection);

    verify(disposable).dispose();

  }
}