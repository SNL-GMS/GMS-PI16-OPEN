package gms.tools.stationrefbuilder;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSet;
import java.util.Collection;
import java.util.Map;

@AutoValue
@JsonSerialize(as = StationReferenceBuilderConfiguration.class)
@JsonDeserialize(builder = AutoValue_StationReferenceBuilderConfiguration.Builder.class)
public abstract class StationReferenceBuilderConfiguration {

  public abstract String getDetailedStationGroupListFilename();

  public abstract String getStationGroupListFilename();

  public abstract String getDefaultJsonFilename();

  public abstract String getCd11JsonFilename();

  public abstract String getCurrentImplementor();

  public abstract boolean getWriteJson();

  public abstract boolean getReplaceZeroes();

  public abstract boolean getWriteAffiliations();

  public abstract boolean getWriteCsv();

  public abstract boolean getCheckForDuplicates();

  public abstract boolean getCheckForWhitespace();

  public abstract ImmutableMap<Protocols, Object> getStationsByProtocol();

  public abstract ImmutableMap<Priorities, Object> getStationsByPriority();

  public abstract ImmutableSet<Replacement> getSpecialReplacements();

  public abstract Builder toBuilder();

  public static Builder builder() {
    return new AutoValue_StationReferenceBuilderConfiguration.Builder();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    public abstract Builder setDetailedStationGroupListFilename(
        String detailedStationGroupListFilename);

    public abstract Builder setStationGroupListFilename(String stationGroupListFilename);

    public abstract Builder setDefaultJsonFilename(String defaultJsonFilename);

    public abstract Builder setCd11JsonFilename(String cd11JsonFilename);

    public abstract Builder setCurrentImplementor(String implementor);

    public abstract Builder setWriteJson(boolean writeJson);

    public abstract Builder setReplaceZeroes(boolean replaceZeroes);

    public abstract Builder setWriteAffiliations(boolean writeAffiliations);

    public abstract Builder setWriteCsv(boolean writeCsv);

    public abstract Builder setCheckForDuplicates(boolean checkForDuplicates);

    public abstract Builder setCheckForWhitespace(boolean checkForWhitespace);

    abstract Builder setStationsByProtocol(ImmutableMap<Protocols, Object> stationsByProtocol);

    public Builder setStationsByProtocol(Map<Protocols, Object> stationsByProtocol) {
      return setStationsByProtocol(ImmutableMap.copyOf(stationsByProtocol));
    }

    abstract ImmutableMap.Builder<Protocols, Object> stationsByProtocolBuilder();

    public Builder putStationsByProtocol(Protocols protocol, Object stations) {
      stationsByProtocolBuilder().put(protocol, stations);
      return this;
    }

    abstract Builder setStationsByPriority(ImmutableMap<Priorities, Object> stationsByPriority);

    public Builder setStationsByPriority(Map<Priorities, Object> stationsByPriority){
      return setStationsByPriority(ImmutableMap.copyOf(stationsByPriority));
    }

    abstract ImmutableMap.Builder<Priorities, Object> stationsByPriorityBuilder();

    public Builder putStationsByPriority(Priorities priority, Object stations) {
      stationsByPriorityBuilder().put(priority, stations);
      return this;
    }

    abstract Builder setSpecialReplacements(ImmutableSet<Replacement> specialReplacements);

    public Builder setSpecialReplacements(Collection<Replacement> specialReplacements){
      return setSpecialReplacements(ImmutableSet.copyOf(specialReplacements));
    }

    abstract ImmutableSet.Builder<Replacement> specialReplacementsBuilder();

    public Builder putSpecialReplacement(Replacement replacement) {
      specialReplacementsBuilder().add(replacement);
      return this;
    }

    protected abstract StationReferenceBuilderConfiguration autoBuild();

    public StationReferenceBuilderConfiguration build() {
      return autoBuild();
    }
  }

}
