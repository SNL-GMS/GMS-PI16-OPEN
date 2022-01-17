package gms.shared.stationdefinition.api.channel.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.utilities.javautilities.objectmapper.ObjectMapperFactory;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ChannelGroupsTimeFacetRequestTest {

    @Test
    void testSerialization() throws IOException {
        ObjectMapper mapper = ObjectMapperFactory.getJsonObjectMapper();
        ChannelGroupsTimeFacetRequest request = ChannelGroupsTimeFacetRequest.builder()
                .setChannelGroupNames(List.of("Test Group"))
                .setEffectiveTime(Instant.now())
                .setFacetingDefinition(FacetingDefinition
                        .builder()
                        .setClassType("testFacetingDefinition")
                        .setPopulated(true)
                        .build())
                .build();
        String requestJson = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(request);
        ChannelGroupsTimeFacetRequest rebuilt = mapper.readValue(requestJson, ChannelGroupsTimeFacetRequest.class);
        assertEquals(request, rebuilt);
    }
}
