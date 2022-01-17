package gms.shared.stationdefinition.api.station.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.utilities.javautilities.objectmapper.ObjectMapperFactory;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StationGroupsTimeRequestTest {
    @Test
    void testSerialization() throws IOException {
        ObjectMapper mapper = ObjectMapperFactory.getJsonObjectMapper();
        StationGroupsTimeRequest request = StationGroupsTimeRequest.builder()
                .setStationGroupNames(List.of("STG"))
                .setEffectiveTime(Instant.now())
                .build();
        String requestJson = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(request);
        StationGroupsTimeRequest rebuilt = mapper.readValue(requestJson, StationGroupsTimeRequest.class);
        assertEquals(request, rebuilt);
    }
}
