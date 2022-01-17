package gms.shared.waveform.api.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.mock;

import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.factory.StationDefinitionAccessorFactory;
import gms.shared.utilities.javautilities.objectmapper.ObjectMapperFactory;
import gms.shared.utilities.test.TestUtilities;
import gms.shared.waveform.api.WaveformRepositoryInterface;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import gms.shared.waveform.testfixture.WaveformRequestTestFixtures;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class SerializationTest {

    @ParameterizedTest
    @MethodSource("getSerializationArguments")
    @SuppressWarnings("unchecked")
    void testSerialization(Object request, Class clazz) throws IOException {
        ObjectMapper mapper = ObjectMapperFactory.getJsonObjectMapper();
        String requestJson = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(request);
        var rebuilt = mapper.readValue(requestJson, clazz);
        assertEquals(request, rebuilt);
    }

    static Stream<Arguments> getSerializationArguments() {
        return Stream.of(
            arguments(WaveformRequestTestFixtures.channelTimeRangeRequest, ChannelTimeRangeRequest.class),
            arguments(WaveformRequestTestFixtures.facetedChannelTimeRangeRequest, ChannelTimeRangeRequest.class),
            arguments(WaveformRequestTestFixtures.channelSegmentDescriptorRequest, ChannelSegmentDescriptorRequest.class),
            arguments(WaveformRequestTestFixtures.facetedChannelSegmentDescriptorRequest, ChannelSegmentDescriptorRequest.class));
    }
}
