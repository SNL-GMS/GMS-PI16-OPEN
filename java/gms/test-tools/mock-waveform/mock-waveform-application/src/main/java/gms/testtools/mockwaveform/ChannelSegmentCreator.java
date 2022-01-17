package gms.testtools.mockwaveform;

import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelTypes;
import gms.shared.stationdefinition.coi.channel.ChannelTypesParser;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.repository.util.StationDefinitionIdUtility;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import org.apache.commons.lang3.Validate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public class ChannelSegmentCreator {

  private final WaveformCreator waveformCreator;

  private ChannelSegmentCreator(WaveformCreator waveformCreator) {
    this.waveformCreator = waveformCreator;
  }

  public static ChannelSegmentCreator create(WaveformCreator waveformCreator) {
    Validate.notNull(waveformCreator);
    return new ChannelSegmentCreator(waveformCreator);
  }

  public static final long WAVEFORM_NUM_HOURS = 2;
  private static final Duration WAVEFORM_DURATION = Duration.ofHours(WAVEFORM_NUM_HOURS);
  private static final Logger logger = LoggerFactory.getLogger(ChannelSegmentCreator.class);

  public List<ChannelSegment<Waveform>> getChannelSegments(
    Set<Channel> channels, Instant startTime, Instant stopTime) {

    Objects.requireNonNull(channels);
    Objects.requireNonNull(startTime);
    Objects.requireNonNull(stopTime);

    if (channels.isEmpty() || stopTime.isBefore(startTime)) {
      logger.warn("Must provide non-empty list of channels and stoptime that is after start time," +
        "returning empty list of channel segments");
      return Collections.emptyList();
    }

    Duration duration = Duration.between(startTime, stopTime);

    long numIntervals = duration.toHours() / WAVEFORM_NUM_HOURS;
    Duration rem = duration.minus(Duration.ofHours(WAVEFORM_NUM_HOURS * numIntervals));
    List<Range<Instant>> timeRanges = new ArrayList<>();
    Instant currentTime = startTime;

    for (int i = 0; i < numIntervals; i++) {
      timeRanges.add(Range.openClosed(currentTime, currentTime.plus(WAVEFORM_DURATION)));
      currentTime = currentTime.plus(WAVEFORM_DURATION);
    }

    if (rem.toMinutes() != 0) {
      timeRanges.add(Range.openClosed(currentTime, currentTime.plus(rem)));
    }


    return channels.stream()
      .map(channel -> {

        int initialPos = new SecureRandom().nextInt(waveformCreator.getsamplesLength());
        List<Waveform> waveforms = waveformCreator.getWaveforms(timeRanges, initialPos);

        if (channel.isPresent()) {
          return ChannelSegment.from(channel, channel.getUnits(), waveforms, Instant.now());
        }

        SiteChanKey siteChanKey = StationDefinitionIdUtility.getCssKey(channel);
        Optional<ChannelTypes> channelTypesOptional = ChannelTypesParser
          .parseChannelTypes(siteChanKey.getChannelCode());

        Preconditions.checkState(channelTypesOptional.isPresent(),
          "Could not parse channel types for given channel");
        ChannelTypes channelTypes = channelTypesOptional.get();
        Units units = Units.determineUnits(channelTypes.getDataType());

        return ChannelSegment.from(channel, units, waveforms, Instant.now());
      })
      .collect(Collectors.toList());
  }


}
