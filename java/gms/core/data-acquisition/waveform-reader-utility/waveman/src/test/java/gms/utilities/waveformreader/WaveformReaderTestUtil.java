package gms.utilities.waveformreader;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.InputStream;
import java.util.Arrays;
import java.util.stream.IntStream;

public class WaveformReaderTestUtil {

    public static void testReadTestData(WaveformReaderInterface reader, InputStream is, int samplesToRead, int samplesToSkip, double[] expected ) throws Exception {

        double[] actual = reader.read(is, samplesToRead, samplesToSkip);
        IntStream.range(0, actual.length)
                .forEach(i -> assertEquals(expected[i], actual[i], 1e-7));
    }

}

