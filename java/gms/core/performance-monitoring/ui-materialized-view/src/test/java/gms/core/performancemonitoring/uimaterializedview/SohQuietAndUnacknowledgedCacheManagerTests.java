package gms.core.performancemonitoring.uimaterializedview;

import static org.mockito.ArgumentMatchers.any;

import com.google.common.collect.ImmutableSet;
import gms.core.performancemonitoring.soh.control.configuration.ChannelSohDefinition;
import gms.core.performancemonitoring.soh.control.configuration.StationSohDefinition;
import gms.core.performancemonitoring.ssam.control.config.StationSohMonitoringDefinition;
import gms.core.performancemonitoring.ssam.control.config.StationSohMonitoringDisplayParameters;
import gms.core.performancemonitoring.ssam.control.config.StationSohMonitoringUiClientParameters;
import gms.shared.frameworks.osd.coi.soh.ChannelSoh;
import gms.shared.frameworks.osd.coi.soh.PercentSohMonitorValueAndStatus;
import gms.shared.frameworks.osd.coi.soh.SohMonitorType;
import gms.shared.frameworks.osd.coi.soh.SohStatus;
import gms.shared.frameworks.osd.coi.soh.StationSoh;
import gms.shared.frameworks.osd.coi.soh.quieting.QuietedSohStatusChange;
import gms.shared.frameworks.osd.coi.soh.quieting.SohStatusChange;
import gms.shared.frameworks.osd.coi.soh.quieting.UnacknowledgedSohStatusChange;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import reactor.core.publisher.FluxSink;

public class SohQuietAndUnacknowledgedCacheManagerTests {

  @Test
  public void testUpdateUnacknowledgedList() {

    var stationName = "AAAA";

    var oldStationSohs = List.of(createMockStationSoh(stationName, SohStatus.GOOD, Instant.EPOCH));

    var cacheManager = new SohQuietAndUnacknowledgedCacheManager(
        Set.of(),
        Set.of(),
        oldStationSohs,
        createUiClientParameters()
    );

    Assertions.assertEquals(List.of(), cacheManager.getUnacknowledgedList());

    var stationSohs = List.of(createMockStationSoh(stationName, SohStatus.MARGINAL,
        Instant.EPOCH.plusSeconds(1)));

    cacheManager.updateUnacknowledgedList(stationSohs);

    Assertions.assertEquals(1, cacheManager.getUnacknowledgedList().size());

    var unacknowlegedStatusChange = cacheManager.getUnacknowledgedList().iterator().next();

    var expectedUnacknowlegedStatusChange = createUnacknowledgedStatusChange(stationName,
        Set.of(stationName + ".AAA.AAA"));

    Assertions.assertEquals(expectedUnacknowlegedStatusChange, unacknowlegedStatusChange);
  }

  @Test
  public void testGetLastStationSohList() {

    var stationName = "AAAA";

    var oldStationSohs = List.of(createMockStationSoh(stationName, SohStatus.GOOD, Instant.EPOCH));

    var cacheManager = new SohQuietAndUnacknowledgedCacheManager(
        Set.of(),
        Set.of(),
        oldStationSohs,
        createUiClientParameters()
    );

    Assertions.assertEquals(oldStationSohs, cacheManager.getLastStationSohList());
  }

  @Test
  public void testAddQuietSohStatusChange() {

    var quietedStatusChange = QuietedSohStatusChange.create(
        Instant.now(),
        Duration.ofSeconds(100),
        SohMonitorType.ENV_CLIPPED,
        "AAAA.AAA.AAA",
        Optional.empty(),
        "AAAA"
    );

    var quietedStatusChangeUpdate = QuietedSohStatusChangeUpdate.create(quietedStatusChange);

    var cacheManager = new SohQuietAndUnacknowledgedCacheManager(
        Set.of(),
        Set.of(),
        List.of(),
        createUiClientParameters()
    );

    var quietedStatusChanges = cacheManager.getQuietedSohStatusChanges();

    Assertions.assertEquals(List.of(), quietedStatusChanges);

    cacheManager.addQuietSohStatusChange(quietedStatusChangeUpdate);

    quietedStatusChanges = cacheManager.getQuietedSohStatusChanges();

    Assertions.assertEquals(List.of(), quietedStatusChanges);
  }

  @Test
  public void testAddAcknowledgedStationToQuietList() {

    FluxSink<QuietedSohStatusChangeUpdate> mockQuietedSink = Mockito.mock(FluxSink.class);

    var cacheManager = new SohQuietAndUnacknowledgedCacheManager(
        Set.of(),
        Set.of(),
        List.of(),
        createUiClientParameters(),
        null,
        null,
        mockQuietedSink
    );

    var statusChanges = List.of(
        SohStatusChange.from(
            Instant.EPOCH,
            SohMonitorType.ENV_CLIPPED,
            "AAAA.AAA.AAA"
        )
    );

    var acknowlegedStatusChange = AcknowledgedSohStatusChange.from(
        UUID.randomUUID(),
        "a",
        Instant.EPOCH,
        Optional.empty(),
        statusChanges,
        "AAAA"
    );

    cacheManager.addAcknowledgedStationToQuietList(acknowlegedStatusChange);

    Assertions.assertEquals(List.of(), cacheManager.getQuietedSohStatusChanges());

    Mockito.verify(mockQuietedSink).next(any());
  }

  private UnacknowledgedSohStatusChange createUnacknowledgedStatusChange(String station,
      Set<String> channels) {

    var sohStatusChanges = channels.stream().map(channel ->
        SohStatusChange.from(
            Instant.EPOCH.plusSeconds(1),
            SohMonitorType.ENV_CLIPPED,
            channel
        )
    ).collect(Collectors.toSet());

    return UnacknowledgedSohStatusChange.from(
        station,
        sohStatusChanges
    );
  }

  private StationSohMonitoringUiClientParameters createUiClientParameters() {

    var stationSohDefinition = createMockStationSohDefinition("AAAA", Set.of("AAAA.AAA.AAA"));

    var stationSohMonitoringDefinition = StationSohMonitoringDefinition.from(
        Duration.ofSeconds(90),
        List.of(),
        Duration.ofSeconds(10),
        Set.of(stationSohDefinition)
    );

    var stationSohMonitoringDisplayParameters = StationSohMonitoringDisplayParameters.from(
        Duration.ofSeconds(30),
        10,
        10,
        Duration.ofSeconds(10),
        List.of(),
        Duration.ofSeconds(30),
        List.of()
    );

    return StationSohMonitoringUiClientParameters.from(
        stationSohMonitoringDefinition,
        stationSohMonitoringDisplayParameters
    );
  }

  private StationSohDefinition createMockStationSohDefinition(String station,
      Set<String> channels) {

    var stationSohDefinition = Mockito.mock(StationSohDefinition.class);

    Mockito.when(stationSohDefinition.getStationName()).thenReturn(station);

    Mockito.when(stationSohDefinition.getSohMonitorTypesForRollup())
        .thenReturn(Set.of(SohMonitorType.ENV_CLIPPED));

    channels.forEach(channel -> Mockito.when(stationSohDefinition.getChannelsBySohMonitorType())
        .thenReturn(Map.of(SohMonitorType.ENV_CLIPPED, Set.of(channel))));

    var mockChannelSohDefinitions = createMockChannelSohDefinitions(channels,
        Set.of(SohMonitorType.ENV_CLIPPED));

    Mockito.when(stationSohDefinition.getChannelSohDefinitions())
        .thenReturn(mockChannelSohDefinitions);

    return stationSohDefinition;
  }

  private Set<ChannelSohDefinition> createMockChannelSohDefinitions(Set<String> channels,
      Set<SohMonitorType> monitorTypesForRollup) {

    return channels.stream().map(channel -> {

      var channelSohDefinition = Mockito.mock(ChannelSohDefinition.class);

      Mockito.when(channelSohDefinition.getChannelName()).thenReturn(channel);

      Mockito.when(channelSohDefinition.getSohMonitorTypesForRollup())
          .thenReturn(monitorTypesForRollup);

      return channelSohDefinition;
    }).collect(Collectors.toSet());
  }

  private StationSoh createMockStationSoh(String stationName, SohStatus sohStatus, Instant time) {

    var mockChannelSoh = createMockChannelSoh(stationName + ".AAA.AAA", sohStatus,
        Set.of(SohMonitorType.ENV_CLIPPED));

    var mockStationSoh = Mockito.mock(StationSoh.class);

    Mockito.when(mockStationSoh.getStationName()).thenReturn(stationName);

    Mockito.when(mockStationSoh.getSohStatusRollup()).thenReturn(sohStatus);

    Mockito.when(mockStationSoh.getChannelSohs()).thenReturn(ImmutableSet.of(mockChannelSoh));

    Mockito.when(mockStationSoh.getTime()).thenReturn(time);

    return mockStationSoh;
  }

  private ChannelSoh createMockChannelSoh(String channelName, SohStatus sohStatus,
      Set<SohMonitorType> sohMonitorTypes) {

    var channelSoh = Mockito.mock(ChannelSoh.class);

    Mockito.when(channelSoh.getChannelName()).thenReturn(channelName);

    sohMonitorTypes.forEach(sohMonitorType -> {

      var sohMonitorValueAndStatus = PercentSohMonitorValueAndStatus
          .from(50.0, sohStatus, sohMonitorType);

      Mockito.when(channelSoh.getAllSohMonitorValueAndStatuses())
          .thenReturn(ImmutableSet.of(sohMonitorValueAndStatus));
    });

    return channelSoh;
  }
}
