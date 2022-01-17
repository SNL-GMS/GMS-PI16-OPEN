package gms.shared.utilities.logging;

import net.logstash.logback.marker.ObjectAppendingMarker;
import org.junit.Test;
import org.junit.jupiter.api.Assertions;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.MockitoJUnitRunner;

@RunWith(MockitoJUnitRunner.class)
public class TimingLoggerTest {
  @Mock
  private StructuredLoggingWrapper logger;
  @Captor
  ArgumentCaptor<String> argumentCaptorMessage;
  @Captor
  ArgumentCaptor<ObjectAppendingMarker>  loggerArguments;


  @Test
  public void testFunctionCalledAndReturned() {
    TimingLogger<Integer> timingLogger = TimingLogger.create(logger);
    Integer result = timingLogger.apply("Returns 50", () -> 50);
    Assertions.assertEquals(50, result);
  }

  @Test
  public void testLoggerCalled() {
    TimingLogger<String> timingLogger = TimingLogger.create(logger);
    timingLogger.apply("Method Name", () -> "result");
    Mockito.verify(logger).info(argumentCaptorMessage.capture(), loggerArguments.capture());
    Assertions.assertEquals("{} ran in {} milliseconds", argumentCaptorMessage.getAllValues().get(0));
    Assertions.assertEquals("Method Name", loggerArguments.getAllValues().get(0).toString());
  }

  @Test
  public void testTimeIsMeasured() {
    TimingLogger<String> timingLogger = TimingLogger.create(logger);
    timingLogger.apply("Method Name", () -> {
      try {
        Thread.sleep(50);
      } catch (InterruptedException e) {
        e.printStackTrace();
      }
      return "result";
    });
    Mockito.verify(logger).info(argumentCaptorMessage.capture(), loggerArguments.capture());
    Assertions.assertTrue(Long.parseLong(loggerArguments.getAllValues().get(1).toString()) >= 50);

  }
}
