package gms.shared.frameworks.configuration;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import java.time.temporal.ChronoUnit;

@AutoValue
public abstract class RetryConfig {
  public abstract long getInitialDelay();
  public abstract long getMaxDelay();
  public abstract ChronoUnit getDelayUnits();
  public abstract int getMaxAttempts();

  @JsonCreator
  public static RetryConfig create(
      @JsonProperty("initialDelay") long initialDelay,
      @JsonProperty("maxDelay") long maxDelay, 
      @JsonProperty("delayUnits") ChronoUnit delayUnits,
      @JsonProperty("maxAttempts") int maxAttempts) {
    return new AutoValue_RetryConfig(initialDelay, maxDelay, delayUnits, maxAttempts);
  }
}
