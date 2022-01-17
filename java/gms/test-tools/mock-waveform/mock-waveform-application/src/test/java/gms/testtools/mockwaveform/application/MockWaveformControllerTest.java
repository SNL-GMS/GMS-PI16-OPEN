package gms.testtools.mockwaveform.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import gms.testtools.mockwaveform.ChannelSegmentCreator;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MockWaveformControllerTest {


  private static final double INTERVAL_MINUTES = ChannelSegmentCreator.WAVEFORM_NUM_HOURS * 60.0;
  private static final int MILLISECOND_DELTA = 500;
  private static final Instant START_TIME = Instant.parse("2021-03-03T16:33:14.156910Z");
  private static final Channel CHANNEL = Channel.createVersionReference("TEST.TEST1.BHZ", Instant.now());

  private MockWaveformController controller;

  @BeforeEach
  public void testSetup() {
    controller = MockWaveformController.create();
  }

  @Test
  void testChannelSegmentCreator() {

    Instant endTime = Instant.parse("2021-03-03T23:00:14.156910Z");
    Set<Channel> channelList = Set.of(CHANNEL);

    double minutes = Duration.between(START_TIME, endTime).toMinutes();
    int numWaveforms = (int) Math.ceil(minutes / (INTERVAL_MINUTES));

    List<ChannelSegment<Waveform>> waveformChannelSegment = new ArrayList<>(controller.findWaveformsByChannelsAndTimeRange(
      ChannelTimeRangeRequest.builder().setChannels(channelList).setStartTime(START_TIME).setEndTime(endTime).build()));

    assertEquals(channelList.size(), waveformChannelSegment.size());
    final ChannelSegment<Waveform> channelSegmentResult = waveformChannelSegment.get(0);
    assertEquals(CHANNEL, channelSegmentResult.getId().getChannel());
    assertEquals(Timeseries.Type.WAVEFORM, channelSegmentResult.getTimeseriesType());
    assertEquals(START_TIME, channelSegmentResult.getId().getStartTime());
    assertEquals(endTime.toEpochMilli(), channelSegmentResult.getId().getEndTime().toEpochMilli(), MILLISECOND_DELTA);
    assertEquals(Units.NANOMETERS, channelSegmentResult.getUnits());
    assertEquals(numWaveforms, channelSegmentResult.getTimeseries().size());
  }

  @Test
  void testChannelSegmentCreatorLessThanMinuteOverTwoHours() {

    Instant endTime = Instant.parse("2021-03-03T18:34:13.15691Z");
    Set<Channel> channelList = Set.of(CHANNEL);

    double minutes = Duration.between(START_TIME, endTime).toMinutes();
    int numWaveforms = (int) Math.ceil(minutes / (INTERVAL_MINUTES));

    List<ChannelSegment<Waveform>> waveformChannelSegment = new ArrayList<>(controller.findWaveformsByChannelsAndTimeRange(
      ChannelTimeRangeRequest.builder().setChannels(channelList).setStartTime(START_TIME).setEndTime(endTime).build()));

    assertEquals(waveformChannelSegment.get(0).getTimeseries().size(), numWaveforms);
  }

  @Test
  void testEmptyChannelList() {
    Instant endTime = Instant.parse("2021-03-03T23:00:14.156910Z");
    final Set<Channel> channelList = Set.of();

    final List<ChannelSegment<Waveform>> result = new ArrayList<>(controller.findWaveformsByChannelsAndTimeRange(
      ChannelTimeRangeRequest.builder().setChannels(channelList).setStartTime(START_TIME).setEndTime(endTime).build()));

    assertEquals(Collections.emptyList(), result);
  }

}