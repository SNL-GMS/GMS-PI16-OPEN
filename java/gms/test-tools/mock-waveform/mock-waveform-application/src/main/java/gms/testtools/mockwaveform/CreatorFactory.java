package gms.testtools.mockwaveform;

public class CreatorFactory {
  private static WaveformCreator waveformCreatorInstance;
  private static ChannelSegmentCreator channelSegmentCreatorInstance;

  private CreatorFactory() {
  }

  public static WaveformCreator getWaveformCreatorInstance() {
    if (waveformCreatorInstance == null) {
      waveformCreatorInstance = WaveformCreator.create();
    }
    return waveformCreatorInstance;
  }

  public static ChannelSegmentCreator getChannelSegmentCreatorInstance() {
    if (channelSegmentCreatorInstance == null) {
      channelSegmentCreatorInstance = ChannelSegmentCreator.create(getWaveformCreatorInstance());
    }
    return channelSegmentCreatorInstance;
  }
}
