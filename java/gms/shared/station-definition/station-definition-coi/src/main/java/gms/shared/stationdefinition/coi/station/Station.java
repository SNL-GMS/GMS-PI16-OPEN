package gms.shared.stationdefinition.coi.station;

import static gms.shared.stationdefinition.coi.utils.StationDefinitionCoiUtils.STATION_COMPARATOR;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty.Access;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.channel.RelativePosition;
import gms.shared.stationdefinition.coi.id.VersionId;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.NavigableSet;
import java.util.Objects;
import java.util.Optional;
import java.util.TreeSet;
import java.util.stream.Collectors;

import org.apache.commons.lang3.Validate;

@AutoValue
@JsonSerialize(as = AutoValue_Station.class)
@JsonDeserialize(builder = AutoValue_Station.Builder.class)
public abstract class Station implements Comparable<Station> {
  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    Station.Builder setName(String name);

    String getName();

    default Station.Builder setEffectiveAt(Instant effectiveAt) {
      return setEffectiveAt(Optional.ofNullable(effectiveAt));
    }

    Station.Builder setEffectiveAt(Optional<Instant> effectiveAt);

    @JsonUnwrapped
    default Station.Builder setData(Station.Data data) {
      return setData(Optional.ofNullable(data));
    }

    Station.Builder setData(Optional<Station.Data> data);

    Station autoBuild();

    default Station build() {
      Station station = autoBuild();
      Validate.notEmpty(station.getName(), "Station must be provided a name");
      station.getData().ifPresent(data -> Preconditions.checkState(station.getEffectiveAt().isPresent()));

      return autoBuild();
    }
  }

  public static Station.Builder builder() {
    return new AutoValue_Station.Builder();
  }

  public abstract Station.Builder toBuilder();

  public static Station createEntityReference(String name) {
    return Station.builder()
      .setName(name)
      .build();
  }

  public Station toEntityReference() {
    return new AutoValue_Station.Builder()
      .setName(getName())
      .build();
  }

  public static Station createVersionReference(String name, Instant effectiveAt) {
    Objects.requireNonNull(effectiveAt);
    return Station.builder()
      .setName(name)
      .setEffectiveAt(effectiveAt)
      .build();
  }

  public abstract String getName();

  public abstract Optional<Instant> getEffectiveAt();

  @JsonIgnore
  public StationType getType() {
    return getDataOrThrow().getType();
  }

  @JsonIgnore
  public String getDescription() {
    return getDataOrThrow().getDescription();
  }


  @JsonIgnore
  public Map<String, RelativePosition> getRelativePositionsByChannel() {
    return getDataOrThrow().getRelativePositionsByChannel();
  }

  @JsonIgnore
  public Location getLocation() {
    return getDataOrThrow().getLocation();
  }

  @JsonIgnore
  public Optional<Instant> getEffectiveUntil() {
    return getDataOrThrow().getEffectiveUntil();
  }

  @JsonIgnore
  public NavigableSet<ChannelGroup> getChannelGroups() {
    return getDataOrThrow().getChannelGroups();
  }

  @JsonIgnore
  public NavigableSet<Channel> getAllRawChannels() {
    return getDataOrThrow().getAllRawChannels();
  }

  @JsonIgnore
  public boolean isPresent() {
    return getData().isPresent();
  }

  @JsonUnwrapped
  @JsonProperty(access = Access.READ_ONLY)
  public abstract Optional<Station.Data> getData();

  private Station.Data getDataOrThrow() {
    return getData().orElseThrow(() -> new IllegalStateException("Only contains ID facet"));
  }

  @AutoValue
  @JsonSerialize(as = Station.Data.class)
  @JsonDeserialize(builder = AutoValue_Station_Data.Builder.class)
  public abstract static class Data {

    public abstract Data.Builder toBuilder();

    @AutoValue.Builder
    @JsonPOJOBuilder(withPrefix = "set")
    public interface Builder {

      Station.Data.Builder setType(StationType stationType);

      Optional<StationType> getType();

      Station.Data.Builder setDescription(String description);

      Optional<String> getDescription();

      Station.Data.Builder setRelativePositionsByChannel(
        Map<String, RelativePosition> relativePositionsByChannel);

      Optional<Map<String, RelativePosition>> getRelativePositionsByChannel();

      Station.Data.Builder setLocation(Location location);

      Optional<Location> getLocation();

      Station.Data.Builder setEffectiveUntil(Optional<Instant> effectiveUntil);

      default Station.Data.Builder setEffectiveUntil(Instant effectiveUntil) {
        return setEffectiveUntil(Optional.ofNullable(effectiveUntil));
      }

      Optional<Instant> getEffectiveUntil();

      Station.Data.Builder setChannelGroups(NavigableSet<ChannelGroup> channelGroups);

      default Data.Builder setChannelGroups(Collection<ChannelGroup> channelGroups) {
        var treeSet = new TreeSet<ChannelGroup>();
        treeSet.addAll(channelGroups);

        return setChannelGroups(treeSet);
      }

      Optional<NavigableSet<ChannelGroup>> getChannelGroups();

      Station.Data.Builder setAllRawChannels(NavigableSet<Channel> channels);

      default Station.Data.Builder setAllRawChannels(Collection<Channel> channels) {
        var treeSet = new TreeSet<Channel>();
        treeSet.addAll(channels);
        return setAllRawChannels(treeSet);
      }

      Optional<NavigableSet<Channel>> getAllRawChannels();

      Station.Data autoBuild();

      default Station.Data build() {

        final List<Optional<?>> allFields = List
          .of(getType(), getDescription(), getRelativePositionsByChannel(),
            getLocation(), getChannelGroups(), getAllRawChannels());
        final long numPresentFields = allFields.stream().filter(Optional::isPresent).count();

        if (0 == numPresentFields) {
          return null;
        } else if (allFields.size() == numPresentFields) {

          Validate.notEmpty(getAllRawChannels().orElseThrow(),
            "Station must have a non-empty list of channels");
          Validate
            .isTrue(getDescription().orElseThrow().length() <= 1024,
              "Descriptions can be no longer than 1024 characters");
          Validate.notEmpty(getChannelGroups().orElseThrow(),
            "Station must have a non-empty list of channel groups");
          Validate.notEmpty(getRelativePositionsByChannel().orElseThrow(),
            "Station being passed an empty or null map of relative positions for channels it manages");

          getAllRawChannels().orElseThrow().forEach(
            channel -> Validate.isTrue(
              getRelativePositionsByChannel().orElseThrow().containsKey(channel.getName()),
              "Station passed in a relative position for a channel it does not manage"));
          final var channelNames = getAllRawChannels().orElseThrow().stream().map(Channel::getName)
            .collect(Collectors.toList());

          Validate
            .isTrue(
              getChannelGroups().orElseThrow().stream().noneMatch(ChannelGroup::isPresent) ||
                getChannelGroups().orElseThrow().stream()
                  .map(ChannelGroup::getChannels)
                  .flatMap(Collection::stream)
                  .map(Channel::getName)
                  .allMatch(channelNames::contains),
              "Station cannot have ChannelGroups which groups Channels that are not part of the Station.");

          return autoBuild();
        }

        throw new IllegalStateException(
          "Either all FacetedDataClass fields must be populated or none of them can be populated");
      }
    }

    public abstract StationType getType();

    public abstract String getDescription();

    public abstract Map<String, RelativePosition> getRelativePositionsByChannel();

    public abstract Location getLocation();

    public abstract Optional<Instant> getEffectiveUntil();

    public abstract NavigableSet<ChannelGroup> getChannelGroups();

    public abstract NavigableSet<Channel> getAllRawChannels();

    public static Data.Builder builder() {
      return new AutoValue_Station_Data.Builder();
    }

  }


  @Override
  public int compareTo(Station otherStation) {
    return STATION_COMPARATOR.compare(this, otherStation);
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
}