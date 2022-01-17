package gms.shared.stationdefinition.api.station.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.utilities.javautilities.objectmapper.ObjectMapperFactory;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StationGroupsTimeFacetRequestTest {

    @Test
    void testSerialization() throws IOException {
        ObjectMapper mapper = ObjectMapperFactory.getJsonObjectMapper();
        StationGroupsTimeFacetRequest request = StationGroupsTimeFacetRequest.builder()
                .setStationGroupNames(List.of("STG"))
                .setEffectiveTime(Instant.now())
                .setFacetingDefinition(FacetingDefinition
                        .builder()
                        .setClassType("testFacetingDefinition")
                        .setPopulated(true)
                        .build())
                .build();
        String requestJson = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(request);
        StationGroupsTimeFacetRequest rebuilt = mapper.readValue(requestJson, StationGroupsTimeFacetRequest.class);
        assertEquals(request, rebuilt);
    }
}
