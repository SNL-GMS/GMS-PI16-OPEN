package gms.shared.utilities.logging;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;

import java.io.IOException;
import java.util.List;
import java.util.stream.Stream;
import net.logstash.logback.argument.StructuredArguments;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.slf4j.LoggerFactory;

class StructuredLoggingWrapperTests {

  @ParameterizedTest
  @MethodSource("stackTracesTestSource")
  void testStackTraces(Object[] logArguments, Object[] expected) {
    StructuredLoggingWrapper wrapper = StructuredLoggingWrapper.create(LoggerFactory.getLogger(StructuredLoggingWrapperTests.class));
    Object[] result = wrapper.aggregateThrowableStackTraces(logArguments);

    assertArrayEquals(expected, result);
  }

  private static Stream<Arguments> stackTracesTestSource() throws IOException {
    var badStateException = new IllegalStateException("BAD STATE");
    var badArgException = new IllegalArgumentException("BAD ARG");
    return Stream.of(
        Arguments.arguments(
            Stream.of(
                "test",
                badStateException
            ).toArray(),
            Stream.of(
                "test",
                StructuredArguments.value("stackTraces",
                    List.of(StructuredLoggingWrapper.getStackTraceLog(badStateException)))
            ).toArray()
        ),
        Arguments.arguments(
            Stream.of(
                "test",
                badStateException,
                badArgException
            ).toArray(),
            Stream.of(
                "test",
                StructuredArguments.value("stackTraces",
                    List.of(
                        StructuredLoggingWrapper.getStackTraceLog(badStateException),
                        StructuredLoggingWrapper.getStackTraceLog(badArgException)))
            ).toArray()
        )
    );
  }
}