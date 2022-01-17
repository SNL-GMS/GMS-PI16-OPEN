package gms.core.performancemonitoring.ssam.control;

import gms.core.performancemonitoring.soh.control.configuration.StationSohDefinition;
import gms.core.performancemonitoring.ssam.control.ReactiveStationSohAnalysisManager.DataContainer;
import gms.core.performancemonitoring.ssam.control.api.DecimationRequestParams;
import gms.core.performancemonitoring.ssam.control.config.StationSohMonitoringDefinition;
import gms.core.performancemonitoring.ssam.control.config.StationSohMonitoringUiClientParameters;
import gms.shared.frameworks.osd.api.OsdRepositoryInterface;
import gms.shared.frameworks.osd.api.util.HistoricalStationSohRequest;
import gms.shared.frameworks.osd.coi.signaldetection.StationGroup;
import gms.shared.frameworks.osd.coi.soh.CapabilitySohRollup;
import gms.shared.frameworks.osd.coi.soh.SohMonitorType;
import gms.shared.frameworks.osd.coi.soh.StationSoh;
import gms.shared.frameworks.osd.coi.soh.quieting.QuietedSohStatusChange;
import gms.shared.frameworks.osd.coi.soh.quieting.UnacknowledgedSohStatusChange;
import gms.shared.frameworks.osd.dto.soh.HistoricalSohMonitorValues;
import gms.shared.frameworks.osd.dto.soh.HistoricalStationSoh;
import gms.shared.frameworks.osd.dto.soh.PercentSohMonitorValues;
import gms.shared.frameworks.systemconfig.SystemConfig;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

class ReactiveStationSohAnalysisManagerTests {

  @Test
  void testStartProvidersAndPublishers() {

    SsamReactiveKafkaUtility mockUtility = Mockito.mock(SsamReactiveKafkaUtility.class);

    var emptyLatestStationSoh = Map.<String, StationSoh>of();
    var emptyLatestCapabilitySohRollup = Map.<String, CapabilitySohRollup>of();
    var emptyQuietedStatusChangesSet = Set.<QuietedSohStatusChange>of();
    var emptyUnackedSatusChangesSet = Set.<UnacknowledgedSohStatusChange>of();

    DataContainer emptyDataContainer = new DataContainer(
        emptyLatestStationSoh,
        emptyLatestCapabilitySohRollup,
        emptyQuietedStatusChangesSet,
        emptyUnackedSatusChangesSet
    );

    var emptyStationGroups = List.<StationGroup>of();

    ReactiveStationSohAnalysisManager.startProvidersAndPublishers(
        mockUtility,
        emptyDataContainer,
        emptyStationGroups
    );

    Mockito.verify(mockUtility)
        .startSohQuietAndUnacknowledgedCacheManager(
            Mockito.same(emptyQuietedStatusChangesSet),
            Mockito.same(emptyUnackedSatusChangesSet),

            // We want to test that the sets are the SAME in terms of reference. But, dont
            // want to rely on Map.values returning a consistent reference, so settle for normal
            // equality.
            Mockito.eq(emptyLatestStationSoh.values())
        );

    Mockito.verify(mockUtility).startSystemMessagesProducer();

    Mockito.verify(mockUtility)
        .startMaterializedViewProducer(
            Mockito.same(emptyLatestStationSoh),
            Mockito.same(emptyLatestCapabilitySohRollup),
            Mockito.same(emptyStationGroups)
        );

    Mockito.verify(mockUtility).
        startAcknowledgedMaterializedViewProducer(
            Mockito.same(emptyLatestStationSoh),
            Mockito.same(emptyLatestCapabilitySohRollup),
            Mockito.same(emptyStationGroups)
        );

    Mockito.verify(mockUtility).
        startQuietedMaterializedViewProducer(
            Mockito.same(emptyLatestStationSoh),
            Mockito.same(emptyLatestCapabilitySohRollup),
            Mockito.same(emptyStationGroups)
        );

    Mockito.verify(mockUtility).startQuietedAndUnackProducers();
  }

  @Test
  void testGetHistoricalStationSoh() {

    var osdRepositoryInterface = Mockito.mock(OsdRepositoryInterface.class);

    var historicalSohMonitorValues1 = HistoricalSohMonitorValues
        .create("CHANNEL1", Map.of(SohMonitorType.MISSING,
            PercentSohMonitorValues.create(new double[]{2.43, 4.5,})));

    var historicalSohMonitorValues2 = HistoricalSohMonitorValues
        .create("CHANNEL2", Map.of(SohMonitorType.MISSING,
            PercentSohMonitorValues.create(new double[]{2.43, 4.63,})));

    Mockito.when(osdRepositoryInterface.retrieveHistoricalStationSoh(any(
        HistoricalStationSohRequest.class)))
        .thenReturn(HistoricalStationSoh.create("MY_COOL_STATION", new long[]{32323, 43424},
            List.of(historicalSohMonitorValues1, historicalSohMonitorValues2)));

    var endTime = Instant.now();
    var startTime = endTime.minus(30, ChronoUnit.HOURS);

    var decimationRequestParams = DecimationRequestParams
        .create(startTime.toEpochMilli(), endTime.toEpochMilli(), 1000, "MY_COOL_STATION",
            SohMonitorType.MISSING);

    var historicalStationSoh = ReactiveStationSohAnalysisManager
        .getHistoricalStationSoh(decimationRequestParams, osdRepositoryInterface);

    Assertions.assertEquals("MY_COOL_STATION", historicalStationSoh.getStationName());

    Assertions.assertEquals(2, historicalStationSoh.getMonitorValues().size());

    Assertions.assertEquals(2, historicalStationSoh.getCalculationTimes().length);

    Assertions.assertEquals(historicalSohMonitorValues1,
        historicalStationSoh.getMonitorValues().stream().filter(
            historicalSohMonitorValues -> historicalSohMonitorValues.getChannelName()
                .equals("CHANNEL1")).findFirst().orElse(null));

    Assertions.assertEquals(historicalSohMonitorValues2,
        historicalStationSoh.getMonitorValues().stream().filter(
            historicalSohMonitorValues -> historicalSohMonitorValues.getChannelName()
                .equals("CHANNEL2")).findFirst().orElse(null));
  }

  @Test
  void testSenderOptions() {
    var systemConfig = Mockito.mock(SystemConfig.class);

    Mockito.when(systemConfig
        .getValue(eq(ReactiveStationSohAnalysisManager.KAFKA_BOOTSTRAP_SERVERS)))
        .thenReturn("kafka-broker-address");

    var senderOptions = ReactiveStationSohAnalysisManager.senderOptions(systemConfig);

    Assertions.assertEquals("kafka-broker-address", senderOptions.producerProperties()
        .get(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG));
  }

  @Test
  void testInitializeFromOsd(){

    var stationSohAnalysisManagerConfiguration = Mockito
        .mock(StationSohAnalysisManagerConfiguration.class);

    var stationSohMonitoringUiClientParameters = Mockito
        .mock(StationSohMonitoringUiClientParameters.class);
    var stationSohMonitoringDefinition = Mockito.mock(StationSohMonitoringDefinition.class);

    Mockito.when(stationSohMonitoringUiClientParameters.getStationSohControlConfiguration())
        .thenReturn(stationSohMonitoringDefinition);

    Mockito.when(stationSohAnalysisManagerConfiguration.resolveDisplayParameters())
        .thenReturn(stationSohMonitoringUiClientParameters);

    var osdRepositoryInterface = Mockito.mock(OsdRepositoryInterface.class);

    Mockito.when(stationSohAnalysisManagerConfiguration.getSohRepositoryInterface())
        .thenReturn(osdRepositoryInterface);

    Mockito.when(stationSohMonitoringDefinition.getStationSohDefinitions()).thenReturn(
        Set.of(StationSohDefinition.create("Station1", Set.of(), Map.of(), Set.of(), Map.of()),
            StationSohDefinition.create("Station2", Set.of(), Map.of(), Set.of(), Map.of())));

    Mockito.when(stationSohMonitoringDefinition.getDisplayedStationGroups())
        .thenReturn(List.of("Group1", "Group2"));

    var stationSoh1 = Mockito.mock(StationSoh.class);
    var stationSoh2 = Mockito.mock(StationSoh.class);

    Mockito.when(stationSoh1.getStationName()).thenReturn("Station1");
    Mockito.when(stationSoh2.getStationName()).thenReturn("Station2");

    var capabilitySohRollup1 = Mockito.mock(CapabilitySohRollup.class);
    var capabilitySohRollup2 = Mockito.mock(CapabilitySohRollup.class);

    Mockito.when(capabilitySohRollup1.getForStationGroup()).thenReturn("Group1");
    Mockito.when(capabilitySohRollup2.getForStationGroup()).thenReturn("Group2");

    var quietedSohStatusChange = Mockito.mock(QuietedSohStatusChange.class);
    var unacknowledgedSohStatusChange = Mockito.mock(UnacknowledgedSohStatusChange.class);

    Mockito.when(osdRepositoryInterface.retrieveByStationId(any(List.class)))
        .thenReturn(List.of(stationSoh1,stationSoh2));
    Mockito.when(
        osdRepositoryInterface.retrieveLatestCapabilitySohRollupByStationGroup(any(HashSet.class)))
        .thenReturn(
            List.of(capabilitySohRollup1,capabilitySohRollup2));

    Mockito.when(osdRepositoryInterface.retrieveQuietedSohStatusChangesByTime(any(Instant.class)))
        .thenReturn(List.of(quietedSohStatusChange));
    Mockito
        .when(osdRepositoryInterface.retrieveUnacknowledgedSohStatusChanges(any(Collection.class)))
        .thenReturn(
            List.of(unacknowledgedSohStatusChange));

    AtomicBoolean consumerCalled = new AtomicBoolean();
    consumerCalled.set(false);
    
    var consumer = new Consumer<DataContainer>() {

      @Override
      public void accept(DataContainer dataContainer) {
        Assertions
            .assertEquals(stationSoh1, dataContainer.latestStationSohByStation.get("Station1"));
        Assertions
            .assertEquals(stationSoh2, dataContainer.latestStationSohByStation.get("Station2"));
        Assertions.assertEquals(capabilitySohRollup1,
            dataContainer.latestCapabilitySohRollupByStationGroup.get("Group1"));
        Assertions.assertEquals(capabilitySohRollup2,
            dataContainer.latestCapabilitySohRollupByStationGroup.get("Group2"));
        Assertions.assertEquals(quietedSohStatusChange,
            dataContainer.quietedSohStatusChanges.stream().findFirst().orElse(null));
        Assertions.assertEquals(unacknowledgedSohStatusChange,
            dataContainer.unacknowledgedSohStatusChanges.stream().findFirst().orElse(null));

        consumerCalled.set(true);

      }


    };

    ReactiveStationSohAnalysisManager.initializeFromOsd(consumer, stationSohAnalysisManagerConfiguration);
    Assertions.assertTrue(consumerCalled.get());

  }

}
