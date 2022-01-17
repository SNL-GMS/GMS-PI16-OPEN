package gms.shared.waveform.repository;

import com.google.common.collect.Range;
import com.google.common.collect.Table;
import com.google.common.collect.TreeBasedTable;
import gms.shared.stationdefinition.accessor.StationDefinitionManager;
import gms.shared.stationdefinition.api.StationDefinitionManagerInterface;
import gms.shared.stationdefinition.api.channel.util.ChannelsTimeFacetRequest;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.repository.util.StationDefinitionIdUtility;
import gms.shared.waveform.api.util.ChannelSegmentDescriptorRequest;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.ChannelSegmentDescriptor;
import gms.shared.waveform.coi.Timeseries;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.converter.ChannelSegmentConvertImpl;
import gms.shared.waveform.testfixture.WaveformRequestTestFixtures;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.commons.lang3.tuple.Triple;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static gms.shared.stationdefinition.facet.FacetingTypes.CHANNEL_TYPE;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_3;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_4;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.WAVEFORM_CHANNEL;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.WAVEFORM_CHANNEL_2;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.WAVEFORM_CHANNEL_EARLY_ON_DATE;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.WAVEFORM_CHANNEL_LATER_ON_DATE;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.WAVEFORM_CHANNEL_LATER_ON_DATE_2;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.channelSegmentDescriptor;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.channelSegmentDescriptor2;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.channelSegmentDescriptorRequest;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.channelSegmentDescriptorRequest2;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.channelsTimeFacetRequest;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.channelsTimeFacetRequest2;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.channelsTimeFacetRequest3;
import static gms.shared.waveform.testfixture.WaveformTestFixtures.randomSamples0To1;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.refEq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class BridgedWaveformRepositoryTest {

  @Mock
  private WfdiscDatabaseConnector wfdiscDatabaseConnector;

  @Mock
  private StationDefinitionManagerInterface StationDefinitionManager;

  @Mock
  private ChannelSegmentConvertImpl channelSegmentConverter;

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(
        arguments(NullPointerException.class, null, mock(StationDefinitionManager.class), mock(
            ChannelSegmentConvertImpl.class)),
        arguments(NullPointerException.class, mock(WfdiscDatabaseConnector.class), null,
            mock(ChannelSegmentConvertImpl.class)),
        arguments(NullPointerException.class, mock(WfdiscDatabaseConnector.class),
            mock(StationDefinitionManager.class), null));
  }

  static Stream<Arguments> getFindByChannelsAndTimeRangeArguments() {
    return Stream.of(
        arguments(WaveformRequestTestFixtures.channelTimeRangeRequest,
            List.of(WFDISC_DAO_1),
            List.of(Pair.of(WAVEFORM_CHANNEL, channelsTimeFacetRequest)), 1),
        arguments(WaveformRequestTestFixtures.channelTimeRangeRequest,
            List.of(WFDISC_TEST_DAO_1, WFDISC_TEST_DAO_4),
            List.of(Pair.of(WAVEFORM_CHANNEL, channelsTimeFacetRequest),
                Pair.of(WAVEFORM_CHANNEL_LATER_ON_DATE, channelsTimeFacetRequest3)), 2),
        arguments(WaveformRequestTestFixtures.channelTimeRangeRequest2Channels,
            List.of(WFDISC_TEST_DAO_1, WFDISC_TEST_DAO_3),
            List.of(Pair.of(WAVEFORM_CHANNEL, channelsTimeFacetRequest),
                Pair.of(WAVEFORM_CHANNEL_2, channelsTimeFacetRequest2)), 2));
  }

  static Stream<Arguments> getValidateChannelSegmentDescriptorArguments() {
    return Stream.of(
        //test Validate.isTrue(x.getStartTime().isBefore(x.getEndTime()));
        arguments(IllegalArgumentException.class, ChannelSegmentDescriptorRequest.builder()
            .setChannelSegmentDescriptors(List.of(ChannelSegmentDescriptor.from(
                WAVEFORM_CHANNEL, Instant.now(),
                Instant.now().minus(10, ChronoUnit.MINUTES), Instant.now()))
            ).build()
        ),
        //Validate.isTrue(x.getChannel().getEffectiveAt().isPresent());
        arguments(IllegalArgumentException.class, ChannelSegmentDescriptorRequest.builder()
            .setChannelSegmentDescriptors(List.of(ChannelSegmentDescriptor.from(
                Channel.builder().setName("EntityRefOnly").build(),
                Instant.now(), Instant.now(), Instant.now()))
            ).build()
        ),
        //test Validate.isTrue(x.getChannel().getEffectiveAt().get().isBefore(x.getEndTime()));
        arguments(IllegalArgumentException.class, ChannelSegmentDescriptorRequest.builder()
            .setChannelSegmentDescriptors(List.of(ChannelSegmentDescriptor.from(
                WAVEFORM_CHANNEL, Instant.now().minus(10, ChronoUnit.MINUTES),
                Instant.now().minus(10, ChronoUnit.MINUTES), Instant.now()))
            ).build()
        ));
  }

  @Test
  void create() {
    assertNotNull(BridgedWaveformRepository
        .create(wfdiscDatabaseConnector, StationDefinitionManager, channelSegmentConverter));
  }

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(Class<? extends Exception> expectedException,
    WfdiscDatabaseConnector wfdiscDatabaseConnector,
      StationDefinitionManagerInterface StationDefinitionManager,
      ChannelSegmentConvertImpl channelSegmentConverter) {

    //make this a parameterized test
    assertThrows(expectedException, () -> BridgedWaveformRepository.create(
        wfdiscDatabaseConnector, StationDefinitionManager, channelSegmentConverter));
  }

  @ParameterizedTest
  @MethodSource("getFindByChannelsAndTimeRangeArguments")
  void findByChannelsAndTimeRange(ChannelTimeRangeRequest request, List<WfdiscDao> wfDiscList,
      List<Pair<Channel, ChannelsTimeFacetRequest>> findChannelsByNameAndTimeArgs,
      int expectedResult) {

    BridgedWaveformRepository repo = BridgedWaveformRepository
        .create(wfdiscDatabaseConnector, StationDefinitionManager, channelSegmentConverter);

    doReturn(wfDiscList).when(wfdiscDatabaseConnector)
        .findWfdiscsByNameAndTimeRange(
            any(Collection.class), eq(request.getStartTime()), eq(request.getEndTime()));

    findChannelsByNameAndTimeArgs.stream().forEach(channelRequestPair -> {
      Channel channel = channelRequestPair.getLeft();
      assertNotNull(channel);
          doReturn(List.of(channelRequestPair.getLeft())).when(StationDefinitionManager)
              .findChannels(channelRequestPair.getRight());

          ChannelSegment<Waveform> channelSegment = ChannelSegment.<Waveform>builder()
            .setId(ChannelSegmentDescriptor.from(channelRequestPair.getLeft(),
              request.getStartTime(),
              request.getEndTime(),
              Instant.EPOCH))
              .setData(ChannelSegment.Data.<Waveform>builder()
                  .setUnits(Units.MICROPASCALS)
                  .setTimeseriesType(Timeseries.Type.WAVEFORM)
                  .setTimeseries(List.of(randomSamples0To1(request.getStartTime(), request.getEndTime(), 40)))
                  .build())
            .build();
          doReturn(channelSegment)
            .when(channelSegmentConverter).convert(refEq(channel, "data"), any(), any(), any());
        }
    );

    Collection<ChannelSegment<Waveform>> channelSegResult =
        repo.findByChannelsAndTimeRange(request.getChannels(), request.getStartTime(),
            request.getEndTime());

    assertNotNull(channelSegResult);
    assertEquals(expectedResult, channelSegResult.size());
    channelSegResult.forEach(channelSegment -> {
      ChannelSegmentDescriptor descriptor = channelSegment.getId();
      assertTrue(Range.closed(request.getStartTime(), request.getEndTime())
        .encloses(Range.closed(descriptor.getStartTime(), descriptor.getEndTime())));
    });
  }

  @ParameterizedTest
  @MethodSource("getFindByChannelSegmentDescriptorArguments")
  void findByChannelSegmentDescriptor(ChannelSegmentDescriptorRequest csdRequest,
      Map<ChannelSegmentDescriptor, List<Channel>> stationDefQueryResponses,
      Table<Channel, Triple<Instant, Instant, Instant>, List<WfdiscDao>> channelEndTimePairToWfdiscResponseList,
      int expectedSize) {

    var repo = BridgedWaveformRepository
        .create(wfdiscDatabaseConnector, StationDefinitionManager, channelSegmentConverter);

    List<Pair<ChannelsTimeFacetRequest, List<Channel>>> channelsTimeRequest =
        csdRequest.getChannelSegmentDescriptors().stream()
            .map(csd -> Pair.of(ChannelsTimeFacetRequest.builder().
                    setChannelNames(List.of(csd.getChannel().getName()))
                    .setEffectiveTime(csd.getChannel().getEffectiveAt().orElseThrow())
                .setFacetingDefinition(FacetingDefinition.builder()
                  .setPopulated(true)
                  .setClassType(CHANNEL_TYPE.getValue())
                  .build())
                .build(),
                stationDefQueryResponses.get(csd))
            ).collect(Collectors.toList());

    channelsTimeRequest.stream()
        .map(request -> doReturn(request.getRight()).when(StationDefinitionManager)
            .findChannels(request.getLeft())
        ).collect(Collectors.toList());

    channelEndTimePairToWfdiscResponseList.cellSet().forEach(tableCell -> {
      Channel channel = tableCell.getRowKey();
      Triple<Instant, Instant, Instant> startEndTimes = tableCell.getColumnKey();
      doReturn(tableCell.getValue()).when(wfdiscDatabaseConnector).findWfdiscsByNameTimeRangeAndCreationTime(
          List.of(StationDefinitionIdUtility.getCssKey(channel)),
          startEndTimes.getLeft(),
          startEndTimes.getMiddle(),
          startEndTimes.getRight()
      );

      if (!tableCell.getValue().isEmpty()) {
        ChannelSegment<Waveform> result = ChannelSegment.<Waveform>builder()
          .setId(ChannelSegmentDescriptor.from(channel,
            startEndTimes.getLeft(),
            startEndTimes.getMiddle(),
            startEndTimes.getRight()))
            .setData(ChannelSegment.Data.<Waveform>builder()
                .setUnits(Units.MICROPASCALS)
                .setTimeseriesType(Timeseries.Type.WAVEFORM)
                .setTimeseries(List.of(randomSamples0To1(startEndTimes.getLeft(), startEndTimes.getMiddle(), 40)))
                .build())
          .build();

        doReturn(result).when(channelSegmentConverter)
          .convert(Channel.createVersionReference(channel.getName(), channel.getEffectiveAt().get()),
              tableCell.getValue(), startEndTimes.getLeft(), startEndTimes.getMiddle());
      }
    });

    Collection<ChannelSegment<Waveform>> channelSegResult =
        repo.findByChannelNamesAndSegmentDescriptor(
            csdRequest.getChannelSegmentDescriptors());

    assertNotNull(channelSegResult);
    assertEquals(expectedSize, channelSegResult.size());
  }

  static Stream<Arguments> getFindByChannelSegmentDescriptorArguments() {
    Table<Channel, Triple<Instant, Instant, Instant>, List<WfdiscDao>> table1 = TreeBasedTable.create();
    table1.put(WAVEFORM_CHANNEL_LATER_ON_DATE_2, Triple.of(WAVEFORM_CHANNEL_LATER_ON_DATE_2.getEffectiveAt().orElseThrow(),
      channelSegmentDescriptor.getEndTime(), channelSegmentDescriptor.getCreationTime()), List.of(WFDISC_DAO_1));
    Table<Channel, Triple<Instant, Instant, Instant>, List<WfdiscDao>> table2 = TreeBasedTable.create();
    table2.put(WAVEFORM_CHANNEL, Triple.of(channelSegmentDescriptor.getStartTime(),
      channelSegmentDescriptor.getEndTime(), channelSegmentDescriptor.getCreationTime()), List.of(WFDISC_DAO_1));
    table2.put(WAVEFORM_CHANNEL_2, Triple.of(WAVEFORM_CHANNEL_2.getEffectiveAt().orElseThrow(),
      channelSegmentDescriptor2.getEndTime(), channelSegmentDescriptor2.getCreationTime()), List.of());
    Table<Channel, Triple<Instant, Instant, Instant>, List<WfdiscDao>> table3 = TreeBasedTable.create();
    table3.put(WAVEFORM_CHANNEL_EARLY_ON_DATE, Triple.of(channelSegmentDescriptor.getStartTime(),
      channelSegmentDescriptor.getEndTime(), channelSegmentDescriptor.getCreationTime()), List.of(WFDISC_DAO_1)
    );

    return Stream.of(
      // find by a single channelSegmentDescriptor
      arguments(channelSegmentDescriptorRequest,
        Map.of(channelSegmentDescriptor, List.of(WAVEFORM_CHANNEL_LATER_ON_DATE_2)),
        table1,
        1),
      // filter Out Channel with loadDate > creationDate
      arguments(channelSegmentDescriptorRequest2,
        Map.ofEntries(
          Map.entry(channelSegmentDescriptor,
            List.of(WAVEFORM_CHANNEL)),
          Map.entry(channelSegmentDescriptor2,
            List.of(WAVEFORM_CHANNEL_2))),
        table2,
        1),
      //findBy channelSegmentDescriptor where channel has no ceiling (ie: no endTime)
      arguments(channelSegmentDescriptorRequest,
        Map.of(channelSegmentDescriptor, List.of(
          WAVEFORM_CHANNEL_EARLY_ON_DATE)),
        table3,
        1),
      //findBy channelSegmentDescriptor where channel has no floor
      arguments(channelSegmentDescriptorRequest,
        Map.of(channelSegmentDescriptor, List.of(
          WAVEFORM_CHANNEL_LATER_ON_DATE)),
        TreeBasedTable.create(),
        0)
    );
  }

  @ParameterizedTest
  @MethodSource("getValidateChannelSegmentDescriptorArguments")
  void validateChannelSegmentDescriptor(
      Class<? extends Exception> expectedException,
      ChannelSegmentDescriptorRequest csdRequest) {
    var repo = BridgedWaveformRepository
        .create(wfdiscDatabaseConnector, StationDefinitionManager, channelSegmentConverter);

    assertThrows(expectedException, () -> repo.findByChannelNamesAndSegmentDescriptor(
        csdRequest.getChannelSegmentDescriptors()));
  }
}
