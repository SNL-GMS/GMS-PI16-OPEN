package gms.testtools.mockwaveform.application;

import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.testtools.mockwaveform.ChannelSegmentCreator;
import gms.testtools.mockwaveform.CreatorFactory;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import gms.testtools.mockwaveform.MockWaveformService;

import java.util.Collection;

public class MockWaveformController implements MockWaveformService {
  private final ChannelSegmentCreator channelSegmentCreator;

  private MockWaveformController(ChannelSegmentCreator channelSegmentCreator) {
    this.channelSegmentCreator = channelSegmentCreator;
  }

  public static MockWaveformController create() {
    final ChannelSegmentCreator channelSegmentCreator = CreatorFactory
        .getChannelSegmentCreatorInstance();

    return new MockWaveformController(channelSegmentCreator);
  }

  public Collection<ChannelSegment<Waveform>> findWaveformsByChannelsAndTimeRange(
      ChannelTimeRangeRequest channelTimeRangeRequest) {

    return channelSegmentCreator
        .getChannelSegments(channelTimeRangeRequest.getChannels(), channelTimeRangeRequest.getStartTime(),
            channelTimeRangeRequest.getEndTime());
  }
}
