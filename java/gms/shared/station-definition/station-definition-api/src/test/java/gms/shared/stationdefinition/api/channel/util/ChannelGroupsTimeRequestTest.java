package gms.shared.stationdefinition.api.channel.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.utilities.javautilities.objectmapper.ObjectMapperFactory;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ChannelGroupsTimeRequestTest {
    @Test
    void testSerialization() throws IOException {
        ObjectMapper mapper = ObjectMapperFactory.getJsonObjectMapper();
        ChannelGroupsTimeRequest request = ChannelGroupsTimeRequest.builder()
                .setChannelGroupNames(List.of("Test Group"))
                .setEffectiveTime(Instant.now())
                .build();
        String requestJson = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(request);
        ChannelGroupsTimeRequest rebuilt = mapper.readValue(requestJson, ChannelGroupsTimeRequest.class);
        assertEquals(request, rebuilt);
    }
}
