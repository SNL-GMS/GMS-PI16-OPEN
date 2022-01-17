package gms.core.performancemonitoring.ssam.control;

import static org.mockito.Mockito.times;

import gms.core.performancemonitoring.ssam.control.SsamReactiveKafkaUtility.SohWrapper;
import gms.core.performancemonitoring.ssam.control.config.StationSohMonitoringDefinition;
import gms.core.performancemonitoring.ssam.control.config.StationSohMonitoringDisplayParameters;
import gms.core.performancemonitoring.ssam.control.config.StationSohMonitoringUiClientParameters;
import gms.core.performancemonitoring.ssam.control.dataprovider.ReactiveConsumer;
import gms.core.performancemonitoring.ssam.control.dataprovider.ReactiveConsumerBuilder;
import gms.core.performancemonitoring.ssam.control.datapublisher.ReactiveProducer;
import gms.core.performancemonitoring.ssam.control.datapublisher.ReactiveProducerBuilder;
import gms.core.performancemonitoring.ssam.control.processor.MaterializedViewProcessor;
import gms.core.performancemonitoring.uimaterializedview.AcknowledgedSohStatusChange;
import gms.core.performancemonitoring.uimaterializedview.QuietedSohStatusChangeUpdate;
import gms.core.performancemonitoring.uimaterializedview.UiStationAndStationGroups;
import gms.shared.frameworks.osd.coi.soh.CapabilitySohRollup;
import gms.shared.frameworks.osd.coi.soh.StationSoh;
import gms.shared.frameworks.osd.coi.soh.quieting.UnacknowledgedSohStatusChange;
import gms.shared.frameworks.osd.coi.systemmessages.SystemMessage;
import gms.shared.frameworks.systemconfig.SystemConfig;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import reactor.core.publisher.EmitterProcessor;
import reactor.core.publisher.Flux;
import reactor.kafka.sender.KafkaSender;
import reactor.test.StepVerifier;


class SsamReactiveKafkaUtilityTests {

  // This is so we can mock the parameterized interface KafkaSender
  // without worrying about unchecked casts.
  interface MockKafkaSender extends KafkaSender<String, String> {
    // Methods intentionally left unimplemented.
  }

  static int calcIntervalMillis = 1000;
  static Instant timeGroup1 = Instant.ofEpochMilli(1000);
  static Instant timeGroup2 = Instant.ofEpochMilli(1000 + calcIntervalMillis);
  static StationSoh mockStationSoh1Group1 = Mockito.mock(StationSoh.class);
  static StationSoh mockStationSoh2Group1 = Mockito.mock(StationSoh.class);
  static CapabilitySohRollup mockCapabilitySohRollupGroup1 = Mockito
      .mock(CapabilitySohRollup.class);
  static StationSoh mockStationSoh1Group2 = Mockito.mock(StationSoh.class);
  static StationSoh mockStationSoh2Group2 = Mockito.mock(StationSoh.class);
  static CapabilitySohRollup mockCapabilitySohRollupGroup2 = Mockito
      .mock(CapabilitySohRollup.class);


  @BeforeAll
  static void initialize() {
    Mockito.when(mockStationSoh1Group1.getTime()).thenReturn(timeGroup1);
    Mockito.when(mockStationSoh1Group1.getStationName()).thenReturn("Station1Group1");

    Mockito.when(mockStationSoh2Group1.getTime()).thenReturn(timeGroup1);
    Mockito.when(mockCapabilitySohRollupGroup1.getTime()).thenReturn(timeGroup1);
    Mockito.when(mockCapabilitySohRollupGroup1.getForStationGroup()).thenReturn("Group1");

    Mockito.when(mockStationSoh1Group2.getTime()).thenReturn(timeGroup2);

    Mockito.when(mockStationSoh1Group2.getStationName()).thenReturn("Station1Group2");

    Mockito.when(mockStationSoh2Group2.getTime()).thenReturn(timeGroup2);

    Mockito.when(mockCapabilitySohRollupGroup2.getTime()).thenReturn(timeGroup2);
    Mockito.when(mockCapabilitySohRollupGroup2.getForStationGroup()).thenReturn("Group2");
  }

  @RepeatedTest(10)
  void testCreateSohPackageFlux() {

    StepVerifier.create(
        SsamReactiveKafkaUtility.createSohPackageFlux(
            Flux.just(
                SohWrapper.ofStationSoh(mockStationSoh1Group1),
                SohWrapper.ofStationSoh(mockStationSoh2Group1),
                SohWrapper.ofCapabilitySohRollup(mockCapabilitySohRollupGroup1),

                SohWrapper.ofStationSoh(mockStationSoh1Group2),
                SohWrapper.ofCapabilitySohRollup(mockCapabilitySohRollupGroup2),
                SohWrapper.ofStationSoh(mockStationSoh2Group2)

            ),
            3
        )
    ).expectNext(
        SohPackage.create(
            Set.of(mockCapabilitySohRollupGroup1),
            Set.of(mockStationSoh1Group1, mockStationSoh2Group1)
        ),
        SohPackage.create(
            Set.of(mockCapabilitySohRollupGroup2),
            Set.of(mockStationSoh1Group2, mockStationSoh2Group2)
        )
    ).verifyComplete();
  }


  @RepeatedTest(10)
  void testCreateMaterializedViewFlux() {

    var mockUiStationAndStationGroups1 = Mockito.mock(UiStationAndStationGroups.class);
    Mockito.when(mockUiStationAndStationGroups1.getIsUpdateResponse()).thenReturn(true);

    var mockUiStationAndStationGroups2 = Mockito.mock(UiStationAndStationGroups.class);
    Mockito.when(mockUiStationAndStationGroups2.getIsUpdateResponse()).thenReturn(false);

    MaterializedViewProcessor mockProcessor = x -> {
      if (x.getCapabilitySohRollups().iterator().next().getTime().equals(timeGroup1)) {
        return List.of(mockUiStationAndStationGroups1);
      } else if (x.getCapabilitySohRollups().iterator().next().getTime().equals(timeGroup2)) {
        return List.of(mockUiStationAndStationGroups2);
      } else {
        throw new IllegalStateException("Something is wrong with this test!");
      }
    };

    StepVerifier.create(
        SsamReactiveKafkaUtility.createMaterializedViewFlux(
            Flux.just(
                SohPackage.create(
                    Set.of(mockCapabilitySohRollupGroup1),
                    Set.of(mockStationSoh1Group1, mockStationSoh2Group1)
                ),
                SohPackage.create(
                    Set.of(mockCapabilitySohRollupGroup2),
                    Set.of(mockStationSoh1Group2, mockStationSoh2Group2)
                )
            ),
            mockProcessor
        )
    ).assertNext(uiStationAndStationGroups -> Assertions
        .assertTrue(uiStationAndStationGroups.getIsUpdateResponse())
    ).assertNext(uiStationAndStationGroups -> Assertions
        .assertFalse(uiStationAndStationGroups.getIsUpdateResponse())
    ).verifyComplete();
  }

  @RepeatedTest(10)
  void testCreateSohWrapperFlux() {

    Map<String, StationSoh> latestStationSohByStation = new HashMap<>();
    Map<String, CapabilitySohRollup> latestCapabilitySohRollupByStationGroup = new HashMap<>();

    StepVerifier.create(
        SsamReactiveKafkaUtility.createSohWrapperFlux(
            //
            // Create the following order:
            //  - Soh2 for Group 1
            //  - 100 ms later, Capability for Group 1
            //  - Soh1 for Group 2, calcIntervalMillis after Soh2 for Group 1
            //  - 100 ms later, Capability for Group 2
            //
            Flux.just(
                mockStationSoh2Group1,
                mockStationSoh1Group2
            ).delayElements(Duration.ofMillis(calcIntervalMillis)),
            Flux.just(
                mockCapabilitySohRollupGroup1,
                mockCapabilitySohRollupGroup2
            ).delaySequence(Duration.ofMillis(100))
                .delayElements(Duration.ofMillis(calcIntervalMillis)),
            latestStationSohByStation,
            latestCapabilitySohRollupByStationGroup
        )
    ).assertNext(sohWrapper -> {
          Assertions.assertNotNull(
              sohWrapper.stationSoh()
          );

          Assertions.assertEquals(
              mockStationSoh2Group1.getStationName(),
              sohWrapper.stationSoh().getStationName()
          );
        }
    ).assertNext(sohWrapper -> {
          Assertions.assertNotNull(
              sohWrapper.capabilitySohRollup()
          );

          Assertions.assertEquals(
              mockCapabilitySohRollupGroup1.getForStationGroup(),
              sohWrapper.capabilitySohRollup().getForStationGroup()
          );
        }
    ).assertNext(sohWrapper -> {
          Assertions.assertNotNull(
              sohWrapper.stationSoh()
          );

          Assertions.assertEquals(
              mockStationSoh1Group2.getStationName(),
              sohWrapper.stationSoh().getStationName()
          );
        }
    ).assertNext(sohWrapper -> {
          Assertions.assertNotNull(
              sohWrapper.capabilitySohRollup()
          );

          Assertions.assertEquals(
              mockCapabilitySohRollupGroup2.getForStationGroup(),
              sohWrapper.capabilitySohRollup().getForStationGroup()
          );
        }
    ).verifyComplete();

    Assertions.assertSame(
        mockCapabilitySohRollupGroup1,
        latestCapabilitySohRollupByStationGroup.get(
            mockCapabilitySohRollupGroup1.getForStationGroup()
        )
    );

    Assertions.assertSame(
        mockCapabilitySohRollupGroup2,
        latestCapabilitySohRollupByStationGroup.get(
            mockCapabilitySohRollupGroup2.getForStationGroup()
        )
    );

    Assertions.assertSame(
        mockStationSoh1Group2,
        latestStationSohByStation.get(mockStationSoh1Group2.getStationName())
    );

    Assertions.assertSame(
        mockStationSoh2Group1,
        latestStationSohByStation.get(mockStationSoh2Group1.getStationName())
    );
  }

  @Test
  void testSohPackageFluxEmptiness() {

    //
    // Absolutely no data has arrived, so don't produce any SohPackage
    //
    StepVerifier.create(
        SsamReactiveKafkaUtility.createSohPackageFlux(
            Flux.empty(),
            2
        )
    ).expectNextCount(0)
        .verifyComplete();

    //
    // A capability rollup arrived but no StationSoh, and that is all, so don't produce any SohPackage
    //
    StepVerifier.create(
        SsamReactiveKafkaUtility.createSohPackageFlux(
            Flux.just(SohWrapper.ofCapabilitySohRollup(mockCapabilitySohRollupGroup1)),
            2
        )
    ).expectNextCount(0)
        .verifyComplete();

    //
    // One calculation interval had no data for StationSoh, the next had ALL data,
    // so produce exactly one SohPackage for the second calc. interval
    //
    StepVerifier.create(
        SsamReactiveKafkaUtility.createSohPackageFlux(
            Flux.just(
                // calc interval 1 - no StationSoh
                SohWrapper.ofCapabilitySohRollup(mockCapabilitySohRollupGroup1),

                // calc interval 2
                SohWrapper.ofStationSoh(mockStationSoh1Group2),
                SohWrapper.ofCapabilitySohRollup(mockCapabilitySohRollupGroup2)
            ),
            2
        )
    ).expectNextCount(1)
        .verifyComplete();
  }

  @Test
  void testStartMaterializedViewProducer() {

    var genericProducer = Mockito.mock(ReactiveProducer.class);
    KafkaSender<String, String> mockKafkaSender = Mockito.mock(MockKafkaSender.class);

    var materializedViewProducerBuilder = getReactiveProducerBuilder(
        Assertions::assertNotNull,
        sender -> Assertions.assertSame(mockKafkaSender, sender),
        topic -> Assertions.assertEquals(
            KafkaTopicConfigurationKeys.STATION_SOH_ANALYSIS_VIEW_OUTPUT_TOPIC_KEY
                .getDefaultValue(), topic),
        genericProducer
    );

    var subscribedInputTopics = new HashSet<String>();
    var subscribedClasses = new HashSet<Class<?>>();

    var sohConsumerBuilder = getReactiveConsumerBuilder(
        subscribedClasses::add,
        subscribedInputTopics::add
    );

    var utility = getSsamReactiveKafkaUtility(
        materializedViewProducerBuilder,
        sohConsumerBuilder,
        mockKafkaSender
    );

    utility.startMaterializedViewProducer(
        Map.of(),
        Map.of(),
        List.of()
    );

    Assertions.assertEquals(
        Set.of(
            KafkaTopicConfigurationKeys.STATION_SOH_INPUT_TOPIC_KEY.getDefaultValue(),
            KafkaTopicConfigurationKeys.CAPABILITY_SOH_ROLLUP_INPUT_TOPIC_KEY.getDefaultValue()),
        subscribedInputTopics
    );

    Mockito.verify(genericProducer).start();

    Assertions.assertTrue(
        subscribedClasses.contains(StationSoh.class)
    );
    Assertions.assertTrue(
        subscribedClasses.contains(CapabilitySohRollup.class)
    );
  }

  @Test
  void testStartSystemMessagesProducer() {

    var genericProducer = Mockito.mock(ReactiveProducer.class);
    KafkaSender<String, String> mockKafkaSender = Mockito.mock(MockKafkaSender.class);

    var systemMessageProducerBuilder = getReactiveProducerBuilder(
        Assertions::assertNotNull,
        sender -> Assertions.assertSame(mockKafkaSender, sender),
        topic -> Assertions.assertEquals(
            KafkaTopicConfigurationKeys.SOH_SYSTEM_MESSAGE_OUTPUT_TOPIC_KEY
                .getDefaultValue(), topic),
        genericProducer
    );

    var utility = getSsamReactiveKafkaUtility(
        systemMessageProducerBuilder,
        null,
        mockKafkaSender
    );

    utility.startSystemMessagesProducer();

    Mockito.verify(genericProducer).start();
  }

  @Test
  void testStartAcknowledgedMaterializedViewProducer() {

    var genericProducer = Mockito.mock(ReactiveProducer.class);
    KafkaSender<String, String> mockKafkaSender = Mockito.mock(MockKafkaSender.class);

    var acknowledgedMaterializedViewProducerBuilder = getReactiveProducerBuilder(
        Assertions::assertNotNull,
        sender -> Assertions.assertSame(mockKafkaSender, sender),
        topic -> Assertions.assertEquals(
            KafkaTopicConfigurationKeys.STATION_SOH_ANALYSIS_VIEW_OUTPUT_TOPIC_KEY
                .getDefaultValue(), topic),
        genericProducer
    );

    var acknowledgedSohStatusChangeConsumerBuilder = getReactiveConsumerBuilder(
        clazz -> Assertions.assertEquals(AcknowledgedSohStatusChange.class, clazz),
        topic -> Assertions.assertEquals(
            KafkaTopicConfigurationKeys.ACKNOWLEDGED_SOH_STATUS_CHANGE_INPUT_TOPIC_KEY
                .getDefaultValue(),
            topic
        )
    );

    var utility = getSsamReactiveKafkaUtility(
        acknowledgedMaterializedViewProducerBuilder,
        acknowledgedSohStatusChangeConsumerBuilder,
        mockKafkaSender
    );

    utility.startSohQuietAndUnacknowledgedCacheManager(
        Set.of(),
        Set.of(),
        Set.of()
    );

    utility.startAcknowledgedMaterializedViewProducer(
        Map.of(),
        Map.of(),
        List.of()
    );

    Mockito.verify(genericProducer).start();
  }

  @Test
  void testStartQuietedMaterializedViewProducer() {
    var genericProducer = Mockito.mock(ReactiveProducer.class);
    KafkaSender<String, String> mockKafkaSender = Mockito.mock(MockKafkaSender.class);

    var quietedMaterializedViewProducerBuilder = getReactiveProducerBuilder(
        Assertions::assertNotNull,
        sender -> Assertions.assertSame(mockKafkaSender, sender),
        topic -> Assertions.assertEquals(
            KafkaTopicConfigurationKeys.STATION_SOH_ANALYSIS_VIEW_OUTPUT_TOPIC_KEY
                .getDefaultValue(), topic),
        genericProducer
    );

    var quitedSohStatusChangeConsumerBuilder = getReactiveConsumerBuilder(
        clazz -> Assertions.assertEquals(QuietedSohStatusChangeUpdate.class, clazz),
        topic -> Assertions.assertEquals(
            KafkaTopicConfigurationKeys.QUIETED_SOH_STATUS_CHANGE_INPUT_TOPIC_KEY.getDefaultValue(),
            topic
        )
    );

    var utility = getSsamReactiveKafkaUtility(
        quietedMaterializedViewProducerBuilder,
        quitedSohStatusChangeConsumerBuilder,
        mockKafkaSender
    );

    utility.startSohQuietAndUnacknowledgedCacheManager(
        Set.of(),
        Set.of(),
        Set.of()
    );

    utility.startQuietedMaterializedViewProducer(
        Map.of(),
        Map.of(),
        List.of()
    );

    Mockito.verify(genericProducer).start();
  }

  @Test
  void testStartQuietedAndUnackProducers() {

    var genericProducer = Mockito.mock(ReactiveProducer.class);
    KafkaSender<String, String> mockKafkaSender = Mockito.mock(MockKafkaSender.class);

    var actualTopics = new HashSet<String>();

    var genericProducerBuilder = getReactiveProducerBuilder(
        Assertions::assertNotNull,
        sender -> Assertions.assertSame(mockKafkaSender, sender),
        actualTopics::add,
        genericProducer
    );

    var utility = getSsamReactiveKafkaUtility(
        genericProducerBuilder,
        null,
        mockKafkaSender
    );

    utility.startQuietedAndUnackProducers();

    Assertions.assertEquals(
        2, actualTopics.size()
    );

    Assertions.assertTrue(
        actualTopics.containsAll(
            Set.of(
                KafkaTopicConfigurationKeys.STATION_SOH_QUIETED_OUTPUT_TOPIC_KEY.getDefaultValue(),
                KafkaTopicConfigurationKeys.STATION_SOH_STATUS_CHANGE_OUTPUT_TOPIC_KEY
                    .getDefaultValue()
            )
        )
    );

    Mockito.verify(genericProducer, times(2)).start();
  }

  private static SsamReactiveKafkaUtility getSsamReactiveKafkaUtility(
      ReactiveProducerBuilder reactiveProducerBuilder,
      ReactiveConsumerBuilder reactiveConsumerBuilder,
      KafkaSender<String, String> mockKafkaSender

  ) {

    var unacknowledgedSohStatusChangeEmitterProcessor = EmitterProcessor.<UnacknowledgedSohStatusChange>create();
    var quietedSohStatusChangeUpdateEmitterProcessor = EmitterProcessor.<QuietedSohStatusChangeUpdate>create();
    var systemMessageEmitterProcessor = EmitterProcessor.<SystemMessage>create();

    var processingConfig = Mockito.mock(StationSohAnalysisManagerConfiguration.class);
    var uiParameters = Mockito.mock(StationSohMonitoringUiClientParameters.class);
    var stationSohMonitoringDefinition = Mockito.mock(StationSohMonitoringDefinition.class);
    var displayParameters = Mockito.mock(StationSohMonitoringDisplayParameters.class);

    Mockito.when(processingConfig.resolveDisplayParameters()).thenReturn(uiParameters);
    Mockito.when(uiParameters.getStationSohControlConfiguration())
        .thenReturn(stationSohMonitoringDefinition);
    Mockito.when(uiParameters.getStationSohMonitoringDisplayParameters())
        .thenReturn(displayParameters);
    Mockito.when(displayParameters.getAcknowledgementQuietDuration())
        .thenReturn(Duration.ofMillis(1));

    var systemConfig = Mockito.mock(SystemConfig.class);

    Arrays.stream(KafkaTopicConfigurationKeys.values())
        .forEach(key -> Mockito.when(systemConfig.getValue(key.getConfigKeyString()))
            .thenReturn(key.getDefaultValue()));

    return new SsamReactiveKafkaUtility(
        mockKafkaSender,
        unacknowledgedSohStatusChangeEmitterProcessor,
        quietedSohStatusChangeUpdateEmitterProcessor,
        systemMessageEmitterProcessor,
        processingConfig,
        systemConfig,
        reactiveProducerBuilder,
        reactiveConsumerBuilder
    );
  }

  private static ReactiveConsumerBuilder getReactiveConsumerBuilder(
      Consumer<Class<?>> classConsumer,
      Consumer<String> withTopicConsumer
  ) {

    return new ReactiveConsumerBuilder() {
      @Override
      public <T> ReactiveConsumer<T> build(Class<T> clazz) {
        classConsumer.accept(clazz);
        return Flux::just;
      }

      @Override
      public ReactiveConsumerBuilder withTopic(String topic) {
        withTopicConsumer.accept(topic);
        return this;
      }
    };
  }

  private static ReactiveProducerBuilder getReactiveProducerBuilder(
      Consumer<Flux<?>> withFluxConsumer,
      Consumer<KafkaSender<String, String>> withSenderConsumer,
      Consumer<String> withTopicConsumer,
      ReactiveProducer withBuildResult
  ) {

    return new ReactiveProducerBuilder() {
      @Override
      public ReactiveProducer build() {
        return withBuildResult;
      }

      @Override
      public ReactiveProducerBuilder reset() {
        return this;
      }

      @Override
      public <T> ReactiveProducerBuilder withFlux(Flux<T> flux) {

        withFluxConsumer.accept(flux);
        return this;
      }

      @Override
      public ReactiveProducerBuilder withSender(KafkaSender<String, String> kafkaSender) {

        withSenderConsumer.accept(kafkaSender);
        return this;
      }

      @Override
      public ReactiveProducerBuilder withTopic(String topic) {

        withTopicConsumer.accept(topic);
        return this;
      }
    };
  }
}
