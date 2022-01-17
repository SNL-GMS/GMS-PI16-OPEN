package gms.testtools.mockwaveform;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.Range;
import gms.shared.utilities.javautilities.objectmapper.ObjectMapperFactory;
import gms.shared.waveform.coi.Waveform;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class WaveformCreator {

  private WaveformCreator() {
    ObjectMapper objectMapper = ObjectMapperFactory.getJsonObjectMapper();
    try {
      samples = objectMapper.readValue(FILE, double[].class);
    } catch (IOException e) {
      logger.error("Error reading waveform samples.", e);
    }
  }

  public static WaveformCreator create() {
    return new WaveformCreator();
  }

  private static final int SAMPLE_RATE_SECONDS = 40;

  private static final URL FILE = WaveformCreator.class.getClassLoader()
      .getResource("Waveforms" + File.separator + "WaveformsArrayCalibrated.json");

  private final Logger logger = LoggerFactory.getLogger(WaveformCreator.class);
  private double[] samples;


  public List<Waveform> getWaveforms(List<Range<Instant>> waveformTimeRanges, int initialPosition) {

    Objects.requireNonNull(waveformTimeRanges);
    Objects.requireNonNull(initialPosition);

    if (waveformTimeRanges.isEmpty()) {
      logger.warn("Empty list of time ranges passed to Waveform creator, returning empty list");
      return Collections.emptyList();
    }

    if (samples.length == 0) {
      logger.error("Samples for waveforms were not loaded");
      return Collections.emptyList();
    }

    int position = initialPosition;
    List<Waveform> waveformList = new ArrayList<>();

    for (Range<Instant> timeRange : waveformTimeRanges) {

      int numSamples = (int) (Duration.between(timeRange.lowerEndpoint(), timeRange.upperEndpoint()).toSeconds() * SAMPLE_RATE_SECONDS);
      double[] waveformArray = new double[numSamples];
      position = getSubsetOfSamplesCircularArray(samples, waveformArray, position);
      Waveform newWaveform = Waveform.create(timeRange.lowerEndpoint(), SAMPLE_RATE_SECONDS, waveformArray);
      newWaveform.getEndTime();
      waveformList.add(newWaveform);
    }

    return waveformList;
  }

  public int getsamplesLength() {
    return samples.length;
  }

  private int getSubsetOfSamplesCircularArray(double[] samples, double[] waveformArray, int initialPosition) {
    int samplesPosition = initialPosition;
    int wavPos = 0;
    int endPos = samplesPosition + waveformArray.length;
    int rem;

    while (endPos >= samples.length) {

      rem = samples.length - samplesPosition;
      System.arraycopy(samples, samplesPosition, waveformArray, wavPos, rem);
      samplesPosition = 0;
      wavPos += rem;
      endPos -= samples.length;
    }
    rem = endPos - samplesPosition;
    System.arraycopy(samples, samplesPosition, waveformArray, wavPos, rem);

    return samplesPosition + rem;
  }


}
