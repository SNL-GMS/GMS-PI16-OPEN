package gms.shared.stationdefinition.api.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.stationdefinition.api.util.TimeRangeRequest.Builder;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class TimeRangeRequestTest {

  @Test
  void testBuildTimeRangeRequest(){
    final Instant startTime = Instant.now();
    final Instant endTime = startTime.plusSeconds(1);
    final TimeRangeRequest result = TimeRangeRequest.builder()
        .setStartTime(startTime)
        .setEndTime(endTime)
        .build();

    assertNotNull(result);
    assertEquals(startTime, result.getStartTime());
    assertEquals(endTime, result.getEndTime());
  }

  @Test
  void testBuildTimeRangeRequest_endBeforeStart(){
    final Instant startTime = Instant.now();
    final Instant endTime = startTime.minusSeconds(1);

    final Builder builder = TimeRangeRequest.builder()
        .setStartTime(startTime)
        .setEndTime(endTime);

    assertThrows(IllegalArgumentException.class, builder::build);
  }

}