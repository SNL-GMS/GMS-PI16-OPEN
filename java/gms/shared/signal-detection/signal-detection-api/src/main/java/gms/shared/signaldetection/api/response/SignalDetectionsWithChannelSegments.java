package gms.shared.signaldetection.api.response;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableSet;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;

@AutoValue
@JsonSerialize(as = SignalDetectionsWithChannelSegments.class)
@JsonDeserialize(builder = AutoValue_SignalDetectionsWithChannelSegments.Builder.class)
public abstract class SignalDetectionsWithChannelSegments {

  public abstract ImmutableSet<SignalDetection> getSignalDetections();

  public abstract ImmutableSet<ChannelSegment<? extends Timeseries>> getChannelSegments();

  public static Builder builder() {
    return new AutoValue_SignalDetectionsWithChannelSegments.Builder();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    Builder setSignalDetections(ImmutableSet<SignalDetection> signalDetections);

    ImmutableSet.Builder<SignalDetection> signalDetectionsBuilder();

    default Builder addSignalDetection(SignalDetection signalDetection) {
      signalDetectionsBuilder().add(signalDetection);
      return this;
    }

    Builder setChannelSegments(ImmutableSet<ChannelSegment<? extends Timeseries>> channelSegments);

    ImmutableSet.Builder<ChannelSegment<? extends Timeseries>> channelSegmentsBuilder();

    default Builder addChannelSegment(ChannelSegment<? extends Timeseries> channelSegment) {
      channelSegmentsBuilder().add(channelSegment);
      return this;
    }

    SignalDetectionsWithChannelSegments build();

  }


}
