package gms.shared.stationdefinition.coi.channel;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty.Access;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.id.VersionId;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationId;
import gms.shared.stationdefinition.coi.utils.Units;
import org.apache.commons.lang3.Validate;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import static gms.shared.stationdefinition.coi.utils.StationDefinitionCoiUtils.CHANNEL_COMPARATOR;


/**
 * Represents both raw and derived channels created and used in GMS processing operations. Construct
 * new Channels using the operations in {link ChannelFactory}.
 */
@AutoValue
@JsonSerialize(as = ChannelBase.class)
@JsonDeserialize(builder = AutoValue_Channel.Builder.class)
public abstract class Channel extends ChannelBase implements Comparable<Channel> {

  public static final String NAME_SEPARATOR = ".";
  public static final String COMPONENT_SEPARATOR = "/";
  public static final String ATTRIBUTE_SEPARATOR = ",";

  public static Builder builder() {
    return new AutoValue_Channel.Builder();
  }

  public abstract Builder toBuilder();

  @Override
  public int compareTo(Channel otherChannel) {
    return CHANNEL_COMPARATOR.compare(this, otherChannel);
  }

  @Override
  public abstract int hashCode();

  @Override
  public abstract boolean equals(Object obj);

  @JsonIgnore
  public VersionId toVersionId() {
    return VersionId.builder()
      .setEntityId(getName())
      .setEffectiveAt(getEffectiveAt()
        .orElseThrow(() -> new IllegalStateException("Cannot create version id from entity instantiation")))
      .build();
  }

  public static Channel createEntityReference(String name) {
    return new AutoValue_Channel.Builder()
      .setName(name)
      .build();
  }

  public Channel toEntityReference() {
    return new AutoValue_Channel.Builder()
      .setName(getName())
      .build();
  }

  public static Channel createVersionReference(String name, Instant effectiveAt) {
    Objects.requireNonNull(effectiveAt);
    return new AutoValue_Channel.Builder()
      .setName(name)
      .setEffectiveAt(effectiveAt)
      .build();
  }

  public String getCanonicalName() {
    return getDataOrThrow().getCanonicalName();
  }

  public Optional<Instant> getEffectiveUntil() { return getDataOrThrow().getEffectiveUntil(); }

  public String getDescription() {
    return getDataOrThrow().getDescription();
  }

  public Station getStation() { return getDataOrThrow().getStation(); }

  public ChannelDataType getChannelDataType() {
    return getDataOrThrow().getChannelDataType();
  }

  public ChannelBandType getChannelBandType() {
    return getDataOrThrow().getChannelBandType();
  }

  public ChannelInstrumentType getChannelInstrumentType() {
    return getDataOrThrow().getChannelInstrumentType();
  }

  public ChannelOrientationType getChannelOrientationType() {
    return getDataOrThrow().getChannelOrientationType();
  }

  public char getChannelOrientationCode() {
    return getDataOrThrow().getChannelOrientationCode();
  }

  public Units getUnits() {
    return getDataOrThrow().getUnits();
  }

  public double getNominalSampleRateHz() {
    return getDataOrThrow().getNominalSampleRateHz();
  }

  public Location getLocation() {
    return getDataOrThrow().getLocation();
  }

  public Orientation getOrientationAngles() {
    return getDataOrThrow().getOrientationAngles();
  }

  public List<Channel> getConfiguredInputs() { return getDataOrThrow().getConfiguredInputs(); }

  public Map<String, Object> getProcessingDefinition() {
    return getDataOrThrow().getProcessingDefinition();
  }

  public Map<ChannelProcessingMetadataType, Object> getProcessingMetadata() {
    return getDataOrThrow().getProcessingMetadata();
  }

  public Optional<Response> getResponse() {
    return getDataOrThrow().getResponse();
  }

  public boolean isPresent() {
    return getData().isPresent();
  }

  @JsonUnwrapped
  @JsonProperty(access = Access.READ_ONLY)
  public abstract Optional<Channel.Data> getData();

  private Channel.Data getDataOrThrow() {
    return getDataOptional().orElseThrow(() -> new IllegalStateException("Only contains ID facet"));
  }

  Optional<Channel.Data> getDataOptional() {
    return getData();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    Channel.Builder setName(String name);

    String getName();

    default Channel.Builder setEffectiveAt(Instant effectiveAt) {
      return setEffectiveAt(Optional.ofNullable(effectiveAt));
    }

    Channel.Builder setEffectiveAt(Optional<Instant> effectiveAt);

    @JsonUnwrapped
    default Channel.Builder setData(Channel.Data data) {
      return setData(Optional.ofNullable(data));
    }

    Channel.Builder setData(Optional<Channel.Data> data);

    Channel autoBuild();

    default Channel build() {
      Channel channel = autoBuild();
      Validate.notEmpty(channel.getName(), "Channel must be provided a name");
      channel.getData().ifPresent(data -> Preconditions.checkState(channel.getEffectiveAt().isPresent(),
        "Channel EffectiveAt is required if the channel has data"));
      return channel;
    }
  }

  @AutoValue
  @JsonSerialize(as = Channel.Data.class)
  @JsonDeserialize(builder = AutoValue_Channel_Data.Builder.class)
  public abstract static class Data extends ChannelBase.Data {

    public static Builder builder() {
      return new AutoValue_Channel_Data.Builder();
    }

    public abstract Channel.Data.Builder toBuilder();

    @AutoValue.Builder
    @JsonPOJOBuilder(withPrefix = "set")
    public interface Builder {

      Channel.Data.Builder setCanonicalName(String canonicalName);

      Optional<String> getCanonicalName();

      default Channel.Data.Builder setEffectiveUntil(Instant effectiveUntil) {
        return setEffectiveUntil(Optional.ofNullable(effectiveUntil));
      }

      Channel.Data.Builder setEffectiveUntil(Optional<Instant> effectiveUntil);

      Channel.Data.Builder setDescription(String description);

      Optional<String> getDescription();

      Channel.Data.Builder setStation(Station station);

      Optional<Station> getStation();

      Channel.Data.Builder setChannelDataType(ChannelDataType channelDataType);

      Optional<ChannelDataType> getChannelDataType();

      Channel.Data.Builder setChannelBandType(ChannelBandType channelBandType);

      Optional<ChannelBandType> getChannelBandType();

      Channel.Data.Builder setChannelInstrumentType(ChannelInstrumentType channelInstrumentType);

      Optional<ChannelInstrumentType> getChannelInstrumentType();

      Channel.Data.Builder setChannelOrientationType(ChannelOrientationType channelOrientationType);

      Optional<ChannelOrientationType> getChannelOrientationType();

      Channel.Data.Builder setChannelOrientationCode(char channelOrientationCode);

      Optional<Character> getChannelOrientationCode();

      Channel.Data.Builder setUnits(Units units);

      Optional<Units> getUnits();

      Channel.Data.Builder setNominalSampleRateHz(double nominalSampleRateHz);

      Optional<Double> getNominalSampleRateHz();

      Channel.Data.Builder setLocation(Location location);

      Optional<Location> getLocation();

      Channel.Data.Builder setOrientationAngles(Orientation orientationAngles);

      Optional<Orientation> getOrientationAngles();

      Channel.Data.Builder setConfiguredInputs(List<Channel> configuredInputs);

      Optional<List<Channel>> getConfiguredInputs();

      Channel.Data.Builder setProcessingDefinition(Map<String, Object> processingDefinition);

      Optional<Map<String, Object>> getProcessingDefinition();

      Channel.Data.Builder setProcessingMetadata(
        Map<ChannelProcessingMetadataType, Object> processingMetadata);

      Optional<Map<ChannelProcessingMetadataType, Object>> getProcessingMetadata();

      Channel.Data.Builder setResponse(Optional<Response> response);

      default Channel.Data.Builder setResponse(Response response) {
        setResponse(Optional.ofNullable(response));
        return this;
      }

      Optional<Response> getResponse();

      Channel.Data autoBuild();

      default Channel.Data build() {

        final List<Optional<?>> allFields = List
          .of(getCanonicalName(), getDescription(), getStation(),
            getChannelDataType(), getChannelBandType(), getChannelInstrumentType(),
            getChannelOrientationType(), getChannelOrientationCode(), getUnits(),
            getNominalSampleRateHz(), getLocation(), getOrientationAngles(),
            getConfiguredInputs(), getProcessingDefinition(), getProcessingMetadata());
        final long numPresentFields = allFields.stream().filter(Optional::isPresent).count();

        if (0 == numPresentFields) {
          return null;
        } else if (allFields.size() == numPresentFields) {

          Validate.notEmpty(getCanonicalName().orElseThrow(),
            "Channel must be provided a canonical name");

          getConfiguredInputs().orElseThrow().forEach(ci ->
            Validate.notNull(ci, "None of the configured inputs for a channel should be null")
          );

          // Validate necessary processingMetadata entries
          Validate.isTrue(
            getProcessingMetadata().orElseThrow()
              .containsKey(ChannelProcessingMetadataType.CHANNEL_GROUP),
            "Channel's processingMetadata must include an entry for CHANNEL_GROUP");

          // Validate consistent channelOrientationType and channelOrientationCode parameters
          Validate.isTrue(!Character.isWhitespace(getChannelOrientationCode().orElseThrow()),
            "Channel's channelOrientationCode cannot be whitespace");

          Validate.isTrue(orientationCodesMatch(getChannelOrientationType().orElseThrow(),
            getChannelOrientationCode().orElseThrow()),
            "channelOrientationType.code must match orientationCode when orientationType is not 'UNKNOWN'");

          return autoBuild();
        }

        throw new IllegalStateException(
          "Either all FacetedDataClass fields must be populated or none of them can be populated");
      }

      /**
       * Determines whether the orientationType's {@link ChannelOrientationType#getCode()} matches
       * the provided orientationCode. A match occurs if the orientationType is {@link
       * ChannelOrientationType#UNKNOWN} or if orientationType is not {@link
       * ChannelOrientationType#UNKNOWN} and the orientationType's {@link
       * ChannelOrientationType#getCode()} is equal to orientationCode.
       *
       * @param orientationType a {@link ChannelOrientationType}, not null
       * @param orientationCode a character, not whitespace
       * @return true of the {@link ChannelOrientationType#getCode()} matches the orientationCode
       * and false otherwise.
       */
      private static boolean orientationCodesMatch(ChannelOrientationType orientationType,
        char orientationCode) {

        if (ChannelOrientationType.UNKNOWN != orientationType) {
          return Character.toUpperCase(orientationType.getCode()) == Character.toUpperCase(orientationCode);
        }

        return true;
      }
    }

    public abstract Station getStation();

    public abstract List<Channel> getConfiguredInputs();

    @Override
    StationId getStationId() {
      StationId.Builder builder = StationId.builder().setName(getStation().getName());
      getStation().getEffectiveAt().ifPresent(builder::setEffectiveAt);
      return builder.build();
    }
    @Override
    List<ChannelId> getChannelId() {
      return getConfiguredInputs().stream().map(ci -> {
          var builder = ChannelId.builder().setName(ci.getName());
          ci.getEffectiveAt().ifPresent(builder::setEffectiveAt);
          return builder.build();
      }).collect(Collectors.toList());
    }
  }
}
