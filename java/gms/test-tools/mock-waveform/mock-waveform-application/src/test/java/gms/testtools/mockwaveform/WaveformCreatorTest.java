package gms.testtools.mockwaveform;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.fail;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.Range;
import gms.shared.utilities.javautilities.objectmapper.ObjectMapperFactory;
import gms.shared.waveform.coi.Waveform;
import java.io.File;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;

class WaveformCreatorTest {

  private static final long INTERVAL_HOURS = 2;

  private static final File MAIN_DIR = new File(WaveformCreatorTest.class.
    getClassLoader().getResource("CreatorJsons").getFile());

  private static final String CREATED_WAVFORMS = "WaveformCreatorWaveforms.json";
  private static final String CREATED_WAVFORMS_WRAP = "WaveformCreatorWaveformWrap.json";

  @Test
  void testCreateListofWaveForms() {
    Instant startTime = Instant.parse("2021-03-03T17:33:14.156910Z");
    List<Range<Instant>> timeRanges = new ArrayList<>();

    for (int i = 0; i < 3; i++) {
      timeRanges.add(Range.openClosed(startTime.plus(Duration.ofHours(i * INTERVAL_HOURS)), startTime.plus(Duration.ofHours((i + 1) * INTERVAL_HOURS))));
    }

    List<Waveform> waveforms = CreatorFactory.getWaveformCreatorInstance().getWaveforms(timeRanges, 0);

    try {
      List<Waveform> waveformCorrect = getWaveforms(CREATED_WAVFORMS);
      assertNotNull(waveformCorrect);
      assertEquals(waveformCorrect, waveforms);
    } catch (IOException e) {
      fail("Unable to read waveforms json file", e);
    }
  }

  @Test
  void testCreateListofWaveFormsWrapAround() {
    Instant startTime = Instant.parse("2021-03-03T17:33:14.156910Z");
    List<Range<Instant>> timeRanges = new ArrayList<>();

    for (int i = 0; i < 4; i++) {
      timeRanges.add(Range.openClosed(startTime.plus(Duration.ofHours(i * INTERVAL_HOURS)), startTime.plus(Duration.ofHours((i + 1) * INTERVAL_HOURS))));
    }

    List<Waveform> waveforms = CreatorFactory.getWaveformCreatorInstance().getWaveforms(timeRanges, 200000);

    try {
      List<Waveform> waveformCorrect = getWaveforms(CREATED_WAVFORMS_WRAP);
      assertNotNull(waveformCorrect);
      assertEquals(waveformCorrect, waveforms);
    } catch (IOException e) {
      fail("Unable to read waveforms json file", e);
    }
  }

  @Test
  void testEmptyTimeRangeList() {

    List<Waveform> waveforms = CreatorFactory.getWaveformCreatorInstance().getWaveforms(Collections.emptyList(), 0);
    assertEquals(Collections.emptyList(), waveforms);
  }

  private List<Waveform> getWaveforms(String fileName) throws IOException {

    File file = new File(MAIN_DIR.toString() + File.separator + fileName);
    ObjectMapper objectMapper = ObjectMapperFactory.getJsonObjectMapper();

    return Arrays.asList(objectMapper.readValue(file, Waveform[].class));
  }
}
