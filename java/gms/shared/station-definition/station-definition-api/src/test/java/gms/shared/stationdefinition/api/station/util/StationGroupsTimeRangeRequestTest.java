package gms.shared.stationdefinition.api.station.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.stationdefinition.api.util.TimeRangeRequest;
import gms.shared.utilities.javautilities.objectmapper.ObjectMapperFactory;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StationGroupsTimeRangeRequestTest {

    @Test
    void testSerialization() throws IOException {
        ObjectMapper mapper = ObjectMapperFactory.getJsonObjectMapper();
        StationGroupsTimeRangeRequest request = StationGroupsTimeRangeRequest.builder()
                .setStationGroupNames(List.of("STG"))
                .setTimeRange(TimeRangeRequest.builder()
                        .setStartTime(Instant.parse("2019-09-24T19:00:00Z"))
                        .setEndTime(Instant.parse("2019-09-24T20:00:00Z"))
                        .build())
                .build();
        String requestJson = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(request);
        StationGroupsTimeRangeRequest rebuilt = mapper.readValue(requestJson, StationGroupsTimeRangeRequest.class);
        assertEquals(request, rebuilt);
    }
}
