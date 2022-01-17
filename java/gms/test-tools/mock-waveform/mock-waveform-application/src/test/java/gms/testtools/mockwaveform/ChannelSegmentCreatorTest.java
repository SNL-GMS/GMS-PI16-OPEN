package gms.testtools.mockwaveform;

import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import gms.shared.waveform.coi.Waveform;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;


class ChannelSegmentCreatorTest {

  private static final double INTERVAL_MINUTES = ChannelSegmentCreator.WAVEFORM_NUM_HOURS * 60.0;
  private static final int MILLISECOND_DELTA = 500;
  private static final Instant START_TIME = Instant.parse("2021-03-03T16:33:14.156910Z");
  private static final Channel CHANNEL = Channel.createVersionReference("TEST.TEST1.BHZ", Instant.now());

  @Test
  void testChannelSegmentCreator() {

    Instant endTime = Instant.parse("2021-03-03T23:00:14.156910Z");

    double minutes = Duration.between(START_TIME, endTime).toMinutes();
    int numWaveforms = (int) Math.ceil(minutes / (INTERVAL_MINUTES));

    Set<Channel> channelList = Set.of(CHANNEL);
    List<ChannelSegment<Waveform>> waveformChannelSegment =
      CreatorFactory.getChannelSegmentCreatorInstance().getChannelSegments(channelList, START_TIME, endTime);

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

    double minutes = Duration.between(START_TIME, endTime).toMinutes();
    int numWaveforms = (int) Math.ceil(minutes / (INTERVAL_MINUTES));

    Set<Channel> channelList = Set.of(CHANNEL);
    List<ChannelSegment<Waveform>> waveformChannelSegment =
      CreatorFactory.getChannelSegmentCreatorInstance().getChannelSegments(channelList, START_TIME, endTime);

    assertEquals(waveformChannelSegment.get(0).getTimeseries().size(), numWaveforms);
  }

  @Test
  void testEmptyChannelList() {
    Instant endTime = Instant.parse("2021-03-03T23:00:14.156910Z");

    final List<ChannelSegment<Waveform>> result = CreatorFactory.getChannelSegmentCreatorInstance()
        .getChannelSegments(Collections.emptySet(), START_TIME, endTime);

    assertEquals(Collections.emptyList(), result);
  }


  @Test
  void testEndBeforeStartTimeList() {
    Instant endTime = Instant.parse("2021-03-03T15:00:14.156910Z");

    final List<ChannelSegment<Waveform>> result = CreatorFactory.getChannelSegmentCreatorInstance()
        .getChannelSegments(Set.of(CHANNEL), START_TIME, endTime);

    assertEquals(Collections.emptyList(), result);
  }


}
