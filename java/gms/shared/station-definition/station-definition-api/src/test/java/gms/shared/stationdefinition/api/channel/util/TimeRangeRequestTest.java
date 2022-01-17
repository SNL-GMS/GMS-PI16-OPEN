package gms.shared.stationdefinition.api.channel.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.stationdefinition.api.util.TimeRangeRequest;
import gms.shared.utilities.javautilities.objectmapper.ObjectMapperFactory;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TimeRangeRequestTest {

  @Test
  void testSerialization() throws IOException {
    TimeRangeRequest request = TimeRangeRequest.builder()
            .setStartTime(Instant.EPOCH)
            .setEndTime(Instant.EPOCH.plusSeconds(3))
            .build();
    ObjectMapper mapper = ObjectMapperFactory.getJsonObjectMapper();
    assertEquals(request, mapper.readValue(mapper.writeValueAsString(request), TimeRangeRequest.class));
  }

}