package gms.testtools.mockworkflow.kafka;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import static com.google.common.base.Preconditions.checkArgument;
import static org.apache.commons.lang3.StringUtils.isNotEmpty;

@AutoValue
@JsonSerialize(as = KafkaConnectionConfiguration.class)
@JsonDeserialize(builder = AutoValue_KafkaConnectionConfiguration.Builder.class)
public abstract class KafkaConnectionConfiguration {

  public abstract String getKeySerializer();

  public abstract String getValueSerializer();

  public static Builder builder() {
    return new AutoValue_KafkaConnectionConfiguration.Builder();
  }

  public static KafkaConnectionConfiguration create() {
    return KafkaConnectionConfiguration.builder()
      .setKeySerializer("org.apache.kafka.common.serialization.StringSerializer")
      .setValueSerializer("org.apache.kafka.common.serialization.StringSerializer")
      .build();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    public abstract Builder setKeySerializer(String keySerializer);

    public abstract Builder setValueSerializer(String valueSerializer);

    public abstract KafkaConnectionConfiguration autoBuild();

    public KafkaConnectionConfiguration build() {
      var kafkaConnectionConfiguration = autoBuild();

      checkArgument(isNotEmpty(kafkaConnectionConfiguration.getKeySerializer()),
        "SystemKafkaConnectionConfiguration requires non-null, non-empty keySerializer");
      checkArgument(isNotEmpty(kafkaConnectionConfiguration.getValueSerializer()),
        "SystemKafkaConnectionConfiguration requires non-null, non-empty valueSerializer");
      return kafkaConnectionConfiguration;
    }
  }
}
