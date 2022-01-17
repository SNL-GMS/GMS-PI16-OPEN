package gms.shared.waveform.converter;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.dao.css.StationChannelTimeKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.utilities.javautilities.objectmapper.ObjectMapperFactory;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.testfixture.ChannelSegmentTestFixtures;
import gms.utilities.waveformreader.WaveformReader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.fail;

class ChannelSegmentConverterTest {

  private static final File MAIN_DIR = new File(ChannelSegmentConverterTest.class.
    getClassLoader().getResource("WaveformFiles").getFile());


  private static final String E1WAVEFORMS1 = "E1Waveforms1.json";
  private static final String E1WAVEFORMS2 = "E1Waveforms2.json";
  private static final String S4WAVEFORMS = "S4Waveforms.json";
  private static final String I4_AND_F4_WAVEFORMS = "I4andF4Waveforms.json";
  private static final String T4WAVEFORMS = "T4Waveforms.json";
  private static final String S2WAVEFORMS = "S2Waveforms.json";
  private static final String S3WAVEFORMS = "S3Waveforms.json";
  private static final String BAD_DATA = "BAD_DATA.w";

  private ChannelSegmentConverter channelSegmentConverter;

  @BeforeEach
  void setUp() {
    channelSegmentConverter = ChannelSegmentConvertImpl.create();
  }

  @Test
  void testConvertChannelSegmentSingleE1Waveform() {
    List<WfdiscDao> wfdiscDaos = ChannelSegmentTestFixtures.getTestWfdiscListForSingleE1();
    Channel channel = ChannelSegmentTestFixtures.getTestChannelE1();
    wfdiscDaos = setWfdisdaoDir(wfdiscDaos);
    Instant startTime = wfdiscDaos.stream()
      .map(WfdiscDao::getTime)
      .min(Instant::compareTo)
      .orElseThrow();
    Instant endTime = wfdiscDaos.stream()
      .map(WfdiscDao::getEndTime)
      .max(Instant::compareTo)
      .orElseThrow();
    ChannelSegment<Waveform> convertedChannelSegment =
      channelSegmentConverter.convert(channel, wfdiscDaos, startTime, endTime);

    List<Waveform> waveforms = null;
    WfdiscDao wfdiscDao = wfdiscDaos.get(0);
    try (InputStream in = new FileInputStream(new File(wfdiscDao.getDir(), wfdiscDao.getDfile()))) {
      double[] values = WaveformReader.readSamples(in, wfdiscDao.getDataType().toString(), wfdiscDao.getNsamp(), wfdiscDao.getFoff(),0);
      double calibration = wfdiscDao.getCalib();
      for (int i = 0; i < values.length; i++) {
        values[i]*= calibration;
      }

      waveforms = List.of(Waveform.create(wfdiscDao.getTime(), wfdiscDao.getSamprate(), values));
    } catch (IOException e) {
      fail("Unable to read waveforms json file", e);
    }

    ChannelSegment<Waveform> channelSegmentCorrect =
      ChannelSegmentTestFixtures.createChannelSegment(channel, waveforms,
        convertedChannelSegment.getId().getCreationTime());

    assertEquals(channelSegmentCorrect, convertedChannelSegment);
  }

  @Test
  void testConvertChannelSegmentMultipleE1Waveforms() {
    List<WfdiscDao> wfdiscDaos = ChannelSegmentTestFixtures.getTestWfdiscListForMultipleE1();
    Channel channel = ChannelSegmentTestFixtures.getTestChannelE1();
    wfdiscDaos = setWfdisdaoDir(wfdiscDaos);
    Instant startTime = wfdiscDaos.stream()
      .map(WfdiscDao::getTime)
      .min(Instant::compareTo)
      .orElseThrow();
    Instant endTime = wfdiscDaos.stream()
      .map(WfdiscDao::getEndTime)
      .max(Instant::compareTo)
      .orElseThrow();

    ChannelSegment<Waveform> convertedChannelSegment =
      channelSegmentConverter.convert(channel, wfdiscDaos, startTime, endTime);

    List<Waveform> waveforms = wfdiscDaos.stream()
      .map(wfdiscDao -> {
          try (InputStream in = new FileInputStream(new File(wfdiscDao.getDir(), wfdiscDao.getDfile()))) {
            double[] values = WaveformReader.readSamples(in, wfdiscDao.getDataType().toString(), wfdiscDao.getNsamp(), wfdiscDao.getFoff(), 0);
            double calibration = wfdiscDao.getCalib();
            for (int i = 0; i < values.length; i++) {
              values[i]*= calibration;
            }

            return Waveform.create(wfdiscDao.getTime(), wfdiscDao.getSamprate(), values);
          } catch(IOException ex) {
            fail("error loading waveforms");
            return null;
          }
      })
      .filter(Objects::nonNull)
      .collect(Collectors.toList());

    ChannelSegment<Waveform> channelSegmentCorrect =
      ChannelSegmentTestFixtures.createChannelSegment(channel, waveforms,
        convertedChannelSegment.getId().getCreationTime());

    assertEquals(channelSegmentCorrect, convertedChannelSegment);
  }

  @Test
  void testConvertChannelSegmentS4FormatWaveform() {
    List<WfdiscDao> wfdiscDaos = ChannelSegmentTestFixtures.getTestWfdiscListForS4();
    Channel channel = ChannelSegmentTestFixtures.getTestChannelS4();
    wfdiscDaos = setWfdisdaoDir(wfdiscDaos);

    Instant startTime = wfdiscDaos.stream()
      .map(WfdiscDao::getTime)
      .min(Instant::compareTo)
      .orElseThrow();
    Instant endTime = wfdiscDaos.stream()
      .map(WfdiscDao::getEndTime)
      .max(Instant::compareTo)
      .orElseThrow();

    ChannelSegment<Waveform> convertedChannelSegment =
      channelSegmentConverter.convert(channel, wfdiscDaos, startTime, endTime);

    List<Waveform> waveforms = null;
    WfdiscDao wfdiscDao = wfdiscDaos.get(0);
    try (InputStream in = new FileInputStream(new File(wfdiscDao.getDir(), wfdiscDao.getDfile()))) {
      double readingDurationNano = Duration.between(startTime, endTime).toNanos();

      int samplesToRead = (int) ((readingDurationNano / 1_000_000_000L) * wfdiscDao.getSamprate() + 1);
      double[] values = WaveformReader.readSamples(in, wfdiscDao.getDataType().toString(), samplesToRead, wfdiscDao.getFoff(), 0);
      double calibration = wfdiscDao.getCalib();
      for (int i = 0; i < values.length; i++) {
        values[i]*= calibration;
      }

      waveforms = List.of(Waveform.create(wfdiscDao.getTime(), wfdiscDao.getSamprate(), values));
    } catch (IOException e) {
      fail("Unable to read waveforms json file", e);
    }

    ChannelSegment<Waveform> channelSegmentCorrect =
      ChannelSegmentTestFixtures.createChannelSegment(channel, waveforms,
        convertedChannelSegment.getId().getCreationTime());

    assertEquals(channelSegmentCorrect, convertedChannelSegment);
  }

  @Test
  void testConvertChannelSegmentI4FormatWaveform() {
    List<WfdiscDao> wfdiscDaos = ChannelSegmentTestFixtures.getTestWfdiscListForI4();
    Channel channel = ChannelSegmentTestFixtures.getTestChannelI4F4S2();
    wfdiscDaos = setWfdisdaoDir(wfdiscDaos);
    Instant startTime = wfdiscDaos.stream()
      .map(WfdiscDao::getTime)
      .min(Instant::compareTo)
      .orElseThrow();
    Instant endTime = wfdiscDaos.stream()
      .map(WfdiscDao::getEndTime)
      .max(Instant::compareTo)
      .orElseThrow();

    ChannelSegment<Waveform> convertedChannelSegment =
      channelSegmentConverter.convert(channel, wfdiscDaos, startTime, endTime);

    List<Waveform> waveforms = null;
    try {
      waveforms = getWaveforms(I4_AND_F4_WAVEFORMS);
    } catch (IOException e) {
      fail("Unable to read waveforms json file", e);
    }

    ChannelSegment<Waveform> channelSegmentCorrect =
      ChannelSegmentTestFixtures.createChannelSegment(channel, waveforms,
        convertedChannelSegment.getId().getCreationTime());

    assertEquals(channelSegmentCorrect, convertedChannelSegment);
  }

  @Test
  void testConvertChannelSegmentT4FormatWaveform() {
    List<WfdiscDao> wfdiscDaos = ChannelSegmentTestFixtures.getTestWfdiscListForT4();
    Channel channel = ChannelSegmentTestFixtures.getTestChannelT4();
    wfdiscDaos = setWfdisdaoDir(wfdiscDaos);
    Instant startTime = wfdiscDaos.stream()
      .map(WfdiscDao::getTime)
      .min(Instant::compareTo)
      .orElseThrow();
    Instant endTime = wfdiscDaos.stream()
      .map(WfdiscDao::getEndTime)
      .max(Instant::compareTo)
      .orElseThrow();

    ChannelSegment<Waveform> convertedChannelSegment =
      channelSegmentConverter.convert(channel, wfdiscDaos, startTime, endTime);

    List<Waveform> waveforms = null;
    try {
      waveforms = getWaveforms(T4WAVEFORMS);
    } catch (IOException e) {
      fail("Unable to read waveforms json file", e);
    }

    ChannelSegment<Waveform> channelSegmentCorrect =
      ChannelSegmentTestFixtures.createChannelSegment(channel, waveforms,
        convertedChannelSegment.getId().getCreationTime());

    assertEquals(channelSegmentCorrect, convertedChannelSegment);
  }

  @Test
  void testConvertChannelSegmentS3FormatWaveform() {
    List<WfdiscDao> wfdiscDaos = ChannelSegmentTestFixtures.getTestWfdiscListForS3();
    Channel channel = ChannelSegmentTestFixtures.getTestChannelS3();
    wfdiscDaos = setWfdisdaoDir(wfdiscDaos);
    Instant startTime = wfdiscDaos.stream()
      .map(WfdiscDao::getTime)
      .min(Instant::compareTo)
      .orElseThrow();
    Instant endTime = wfdiscDaos.stream()
      .map(WfdiscDao::getEndTime)
      .max(Instant::compareTo)
      .orElseThrow();

    ChannelSegment<Waveform> convertedChannelSegment =
      channelSegmentConverter.convert(channel, wfdiscDaos, startTime, endTime);

    List<Waveform> waveforms = null;
    try {
      waveforms = getWaveforms(S3WAVEFORMS);
    } catch (IOException e) {
      fail("Unable to read waveforms json file", e);
    }

    ChannelSegment<Waveform> channelSegmentCorrect =
      ChannelSegmentTestFixtures.createChannelSegment(channel, waveforms,
        convertedChannelSegment.getId().getCreationTime());

    assertEquals(channelSegmentCorrect, convertedChannelSegment);
  }

  @Test
  void testConvertChannelSegmentS2FormatWaveform() {
    List<WfdiscDao> wfdiscDaos = ChannelSegmentTestFixtures.getTestWfdiscListForS2();
    Channel channel = ChannelSegmentTestFixtures.getTestChannelI4F4S2();
    wfdiscDaos = setWfdisdaoDir(wfdiscDaos);
    Instant startTime = wfdiscDaos.stream()
      .map(WfdiscDao::getTime)
      .min(Instant::compareTo)
      .orElseThrow();
    Instant endTime = wfdiscDaos.stream()
      .map(WfdiscDao::getEndTime)
      .max(Instant::compareTo)
      .orElseThrow();

    ChannelSegment<Waveform> convertedChannelSegment =
      channelSegmentConverter.convert(channel, wfdiscDaos, startTime, endTime);

    List<Waveform> waveforms = null;
    try {
      waveforms = getWaveforms(S2WAVEFORMS);
    } catch (IOException e) {
      fail("Unable to read waveforms json file", e);
    }

    ChannelSegment<Waveform> channelSegmentCorrect =
      ChannelSegmentTestFixtures.createChannelSegment(channel, waveforms,
        convertedChannelSegment.getId().getCreationTime());

    assertEquals(channelSegmentCorrect, convertedChannelSegment);
  }

  @Test
  void testEmptyWfdisc() {
    List<WfdiscDao> wfdiscDaos = Collections.emptyList();
    Channel channel1 = ChannelSegmentTestFixtures.getTestChannelE1();

    ChannelSegment<Waveform> convertedChannelSegment =
      channelSegmentConverter.convert(channel1, wfdiscDaos, Instant.EPOCH, Instant.now());

    assertNull(convertedChannelSegment);
  }

  @Test
  void testDifferentChan() {
    List<WfdiscDao> wfdiscDaos = ChannelSegmentTestFixtures.getTestWfdiscListForSingleE1();
    wfdiscDaos.get(0).setChannelCode("BHN");
    Channel channel1 = ChannelSegmentTestFixtures.getTestChannelE1();
    wfdiscDaos = setWfdisdaoDir(wfdiscDaos);
    Instant startTime = wfdiscDaos.stream()
      .map(WfdiscDao::getTime)
      .min(Instant::compareTo)
      .orElseThrow();
    Instant endTime = wfdiscDaos.stream()
      .map(WfdiscDao::getEndTime)
      .max(Instant::compareTo)
      .orElseThrow();

    ChannelSegment<Waveform> convertedChannelSegment =
      channelSegmentConverter.convert(channel1, wfdiscDaos, startTime, endTime);

    assertNull(convertedChannelSegment);
  }

  @Test
  void testDifferentSta() {
    List<WfdiscDao> wfdiscDaos = ChannelSegmentTestFixtures.getTestWfdiscListForSingleE1();
    wfdiscDaos.get(0).setStationCode("ASAR");
    Channel channel1 = ChannelSegmentTestFixtures.getTestChannelE1();
    wfdiscDaos = setWfdisdaoDir(wfdiscDaos);

    Instant startTime = wfdiscDaos.stream()
      .map(WfdiscDao::getTime)
      .min(Instant::compareTo)
      .orElseThrow();
    Instant endTime = wfdiscDaos.stream()
      .map(WfdiscDao::getEndTime)
      .max(Instant::compareTo)
      .orElseThrow();

    ChannelSegment<Waveform> convertedChannelSegment =
      channelSegmentConverter.convert(channel1, wfdiscDaos, startTime, endTime);

    assertNull(convertedChannelSegment);
  }

  @Test
  void testInputStreamError() {

    List<WfdiscDao> wfdiscDaos = ChannelSegmentTestFixtures.getTestWfdiscListForSingleE1();
    Channel channel1 = ChannelSegmentTestFixtures.getTestChannelE1();
    wfdiscDaos = setWfdisdaoDir(wfdiscDaos);
    wfdiscDaos.get(0).setDfile(BAD_DATA);

    Instant startTime = wfdiscDaos.stream()
      .map(WfdiscDao::getTime)
      .min(Instant::compareTo)
      .orElseThrow();
    Instant endTime = wfdiscDaos.stream()
      .map(WfdiscDao::getEndTime)
      .max(Instant::compareTo)
      .orElseThrow();

    ChannelSegment<Waveform> convertedChannelSegment =
      channelSegmentConverter.convert(channel1, wfdiscDaos, startTime, endTime);
    assertNull(convertedChannelSegment);
  }

  private List<WfdiscDao> setWfdisdaoDir(List<WfdiscDao> wfdiscDaos) {

    return wfdiscDaos.stream()
      .map(wfdiscDao -> {
        wfdiscDao.setDir(MAIN_DIR + "/data");
        return wfdiscDao;
      })
      .collect(Collectors.toList());
  }

  private List<Waveform> getWaveforms(String fileName) throws IOException {
    File file = new File(MAIN_DIR + File.separator + fileName);
    ObjectMapper objectMapper = ObjectMapperFactory.getJsonObjectMapper();

    return objectMapper.readValue(file, new TypeReference<>() {
    });
  }

}
