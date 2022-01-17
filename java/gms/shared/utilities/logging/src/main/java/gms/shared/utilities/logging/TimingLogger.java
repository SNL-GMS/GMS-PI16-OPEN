package gms.shared.utilities.logging;

import java.util.function.BiFunction;
import java.util.function.Supplier;
import net.logstash.logback.argument.StructuredArguments;

public class TimingLogger <T> implements BiFunction<String, Supplier<T>, T> {
  private final StructuredLoggingWrapper logger;
  private TimingLogger(StructuredLoggingWrapper logger) {
      this.logger = logger;
  }
  public static<T> TimingLogger<T> create(StructuredLoggingWrapper logger) {
    return new TimingLogger<>(logger);
  }
  @Override
  public T apply(String timedMethod, Supplier<T> supplier) {
    long start = System.currentTimeMillis();
    T t = supplier.get();
    long end = System.currentTimeMillis();
    long elapsedTime = end-start;
    logger.info("{} ran in {} milliseconds", 
        StructuredArguments.v("methodName", timedMethod),
        StructuredArguments.v("elapsedTime", elapsedTime),
        StructuredArguments.v("startTime", start),
        StructuredArguments.v("endTime", end));
    return t;
  }
}
