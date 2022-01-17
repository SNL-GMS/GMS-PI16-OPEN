package gms.shared.waveform.converter;

import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelTypes;
import gms.shared.stationdefinition.coi.channel.ChannelTypesParser;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.dao.css.enums.DataType;
import gms.shared.stationdefinition.repository.util.StationDefinitionIdUtility;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.coi.util.TimeseriesUtility;
import gms.utilities.waveformreader.WaveformReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

public class ChannelSegmentConvertImpl implements ChannelSegmentConverter {

  private ChannelSegmentConvertImpl() {
  }

  /**
   * creates and validates a new {@link ChannelSegmentConvertImpl}
   *
   * @return a {@link ChannelSegmentConvertImpl}
   */
  public static ChannelSegmentConvertImpl create() {
    return new ChannelSegmentConvertImpl();
  }

  private static final Logger logger = LoggerFactory.getLogger(ChannelSegmentConvertImpl.class);
  private static final double NANO_SECOND_PER_SECOND = 1_000_000_000L;

  /**
   * Converts a Channel a list of WfdiscDao and File pairs into a {@link ChannelSegment<Waveform>}
   *
   * @param channel    The channel corresponding to the wfdiscDaos
   * @param wfdiscDaos a list of  WfdiscDaos
   * @return A ChannelSegment representing the provided channel, wfdisDaos, and .w files
   */
  public ChannelSegment<Waveform> convert(Channel channel, List<WfdiscDao> wfdiscDaos, Instant startTime,
    Instant endTime) {

    Objects.requireNonNull(channel);
    Objects.requireNonNull(wfdiscDaos);

    if (wfdiscDaos.isEmpty()) {
      logger.warn("List of wfdiscs and files is empty, returning null ChannelSegment");
      return null;
    }

    List<Waveform> waveformList = wfdiscDaos.stream()
      .map(wfdiscDao -> {

        File file = new File(wfdiscDao.getDir() + File.separator + wfdiscDao.getDfile());

        if (!checkWfdicMatchesFileAndChannel(wfdiscDao, channel)) {
          logger.warn("Wfdisc dao with station code {}, channel code {}, and start time {} "
              + "does not match with channel provided", wfdiscDao.getStationCode(),
            wfdiscDao.getChannelCode(), wfdiscDao.getTime());
          return List.<Waveform>of();
        }

        // Extract the wfdisc metadata
        return readWaveforms(channel, wfdiscDao, file, startTime, endTime);
      })
      .filter(list -> !list.isEmpty())
      .flatMap(List::stream)
      .filter(waveform -> Range.closed(startTime, endTime)
          .isConnected(Range.closed(waveform.getStartTime(), waveform.getEndTime())))
      .map(waveform -> waveform.trim(startTime, endTime))
      .collect(Collectors.toList());

    if (waveformList.isEmpty()) {
      return null;
    }

    SiteChanKey siteChanKey = StationDefinitionIdUtility.getCssKey(channel);
    Optional<ChannelTypes> channelTypesOptional = ChannelTypesParser
      .parseChannelTypes(siteChanKey.getChannelCode());

    Preconditions.checkState(channelTypesOptional.isPresent(),
      "Could not parse channel types for given channel");
    ChannelTypes channelTypes = channelTypesOptional.get();
    Units units = Units.determineUnits(channelTypes.getDataType());
    Collections.sort(waveformList);
    final Range<Instant> timeRange = TimeseriesUtility.computeSpan(waveformList);
    return ChannelSegment.from(channel, units, waveformList, timeRange.lowerEndpoint());
  }

  /**
   * readWaveforms from a file, producing multiple waveforms if the file contains more data than a single double array
   * can hold
   */
  private List<Waveform> readWaveforms(Channel channel,
    WfdiscDao wfdiscDao,
    File file,
    Instant startTime,
    Instant endTime) {
    Instant wfdiscStartTime = wfdiscDao.getTime();
    Instant wfdiscEndTime = wfdiscDao.getEndTime();
    double sampRateSeconds = wfdiscDao.getSamprate();
    DataType dataType = wfdiscDao.getDataType();
    int nsamp = wfdiscDao.getNsamp();
    long foff = wfdiscDao.getFoff();

    Instant waveformStart = Instant.now();
    Instant readingStartTime = startTime.isBefore(wfdiscStartTime) ? wfdiscStartTime : startTime;
    Instant readingEndTime = endTime.isAfter(wfdiscEndTime) ? wfdiscEndTime : endTime;

    double readingDurationNano = Duration.between(readingStartTime, readingEndTime).toNanos();
    long expectedSamplesToRead = (long) ((readingDurationNano / NANO_SECOND_PER_SECOND) * sampRateSeconds + 1);
    long actualSamplesToRead = Math.min(nsamp, expectedSamplesToRead);

    long skipNanos = !startTime.isAfter(wfdiscStartTime) ? 0 : Duration.between(wfdiscStartTime, startTime).toNanos();
    long currentSkip = (long) ((skipNanos / NANO_SECOND_PER_SECOND) * sampRateSeconds);
    List<Waveform> waveforms = new ArrayList<>();
    try (InputStream inputStream = new FileInputStream(file)) {
      logger.info("Reading waveform for {}", channel.getName());
      logger.info("Start: {}, End: {}, skip: {}, num samples: {}", wfdiscStartTime, wfdiscEndTime, currentSkip, nsamp);
      double[] data = WaveformReader.readSamples(inputStream, dataType.toString(), (int) actualSamplesToRead, foff, (int) currentSkip);
      double calibration = wfdiscDao.getCalib();
      for (int i = 0; i < data.length; i++) {
        data[i]*= calibration;
      }

      waveforms.add(Waveform.create(readingStartTime, sampRateSeconds, data));
    } catch (IOException e) {
      logger.warn("Unable to create waveform due to IOException: ", e);
    }
    Instant waveformEnd = Instant.now();
    logger.debug("Reading waveforms for {} from file took {} ms",
      channel.getName(),
      Duration.between(waveformStart, waveformEnd).toMillis());
    return waveforms;
  }

  private boolean checkWfdicMatchesFileAndChannel(WfdiscDao wfdisc, Channel channel) {

    SiteChanKey siteChanKey = StationDefinitionIdUtility.getCssKeyFromName(channel.getName());

    return wfdisc.getStationCode().equals(siteChanKey.getStationCode())
      && wfdisc.getChannelCode().equals(siteChanKey.getChannelCode());
  }


}
