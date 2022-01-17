package gms.shared.stationdefinition.api.station.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.utilities.javautilities.objectmapper.ObjectMapperFactory;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class StationChangeTimesRequestTest {

  @Test
  void testCreateValidation() {
    assertThrows(IllegalStateException.class,
      () -> StationChangeTimesRequest.create(STATION, Instant.EPOCH.plusSeconds(5), Instant.EPOCH));
  }

  @Test
  void testSerialization() throws JsonProcessingException {
    ObjectMapper mapper = ObjectMapperFactory.getJsonObjectMapper();
    StationChangeTimesRequest request = StationChangeTimesRequest.create(STATION,
      Instant.EPOCH,
      Instant.EPOCH.plusSeconds(5));
    assertEquals(request, mapper.readValue(mapper.writeValueAsString(request), StationChangeTimesRequest.class));
  }
}
