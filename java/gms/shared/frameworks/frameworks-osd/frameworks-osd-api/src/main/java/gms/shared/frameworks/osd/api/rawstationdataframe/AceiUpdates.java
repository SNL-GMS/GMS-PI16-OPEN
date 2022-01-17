package gms.shared.frameworks.osd.api.rawstationdataframe;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableSet;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueAnalog;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;

import java.util.Collection;
import java.util.Comparator;

import static java.util.Collections.emptySet;
import static java.util.Collections.singleton;

@AutoValue
@JsonSerialize(as = AceiUpdates.class)
@JsonDeserialize(builder = AutoValue_AceiUpdates.Builder.class)
public abstract class AceiUpdates {

  public abstract ImmutableSet<AcquiredChannelEnvironmentIssueAnalog> getAnalogDeletes();

  public abstract ImmutableSet<AcquiredChannelEnvironmentIssueBoolean> getBooleanDeletes();

  public abstract ImmutableSet<AcquiredChannelEnvironmentIssueAnalog> getAnalogInserts();

  public ImmutableList<AcquiredChannelEnvironmentIssueAnalog> getSortedAnalogInserts(
      Comparator<AcquiredChannelEnvironmentIssueAnalog> comparator) {
    return ImmutableList.sortedCopyOf(comparator, getAnalogInserts());
  }

  public abstract ImmutableSet<AcquiredChannelEnvironmentIssueBoolean> getBooleanInserts();

  public ImmutableList<AcquiredChannelEnvironmentIssueBoolean> getSortedBooleanInserts(
      Comparator<AcquiredChannelEnvironmentIssueBoolean> comparator) {
    return ImmutableList.sortedCopyOf(comparator, getBooleanInserts());
  }

  public static AceiUpdates from(AcquiredChannelEnvironmentIssue<?> acei) {

    if (acei instanceof AcquiredChannelEnvironmentIssueBoolean) {
      return from((AcquiredChannelEnvironmentIssueBoolean) acei);
    } else if (acei instanceof AcquiredChannelEnvironmentIssueAnalog) {
      return from((AcquiredChannelEnvironmentIssueAnalog) acei);
    } else {
      throw new IllegalArgumentException("ACEI must be either of type boolean or analog");
    }
  }

  public static AceiUpdates from(AcquiredChannelEnvironmentIssueAnalog acei) {
    return builder().setAnalogInserts(singleton(acei)).build();
  }

  public static AceiUpdates from(AcquiredChannelEnvironmentIssueBoolean acei) {
    return builder().setBooleanInserts(singleton(acei)).build();
  }

  public abstract Builder toBuilder();

  public static Builder builder() {
    return new AutoValue_AceiUpdates.Builder()
        .setAnalogDeletes(emptySet())
        .setAnalogInserts(emptySet())
        .setBooleanDeletes(emptySet())
        .setBooleanInserts(emptySet());
  }

  public static AceiUpdates emptyUpdates() {
    return builder().build();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    public abstract ImmutableSet<AcquiredChannelEnvironmentIssueAnalog> getAnalogDeletes();

    public abstract Builder setAnalogDeletes(
        Collection<AcquiredChannelEnvironmentIssueAnalog> analogDeletes);

    public abstract ImmutableSet.Builder<AcquiredChannelEnvironmentIssueAnalog> analogDeletesBuilder();

    public Builder addAnalogDelete(AcquiredChannelEnvironmentIssueAnalog analogDelete){
      analogDeletesBuilder().add(analogDelete);
      return this;
    }

    public abstract ImmutableSet<AcquiredChannelEnvironmentIssueBoolean> getBooleanDeletes();

    public abstract Builder setBooleanDeletes(
        Collection<AcquiredChannelEnvironmentIssueBoolean> booleanDeletes);

    public abstract ImmutableSet.Builder<AcquiredChannelEnvironmentIssueBoolean> booleanDeletesBuilder();

    public Builder addBooleanDelete(AcquiredChannelEnvironmentIssueBoolean booleanDelete){
      booleanDeletesBuilder().add(booleanDelete);
      return this;
    }

    public abstract ImmutableSet<AcquiredChannelEnvironmentIssueAnalog> getAnalogInserts();

    public abstract Builder setAnalogInserts(
        Collection<AcquiredChannelEnvironmentIssueAnalog> analogInserts);

    public abstract ImmutableSet.Builder<AcquiredChannelEnvironmentIssueAnalog> analogInsertsBuilder();

    public Builder addAnalogInsert(AcquiredChannelEnvironmentIssueAnalog analogInsert){
      analogInsertsBuilder().add(analogInsert);
      return this;
    }

    public abstract ImmutableSet<AcquiredChannelEnvironmentIssueBoolean> getBooleanInserts();

    public abstract Builder setBooleanInserts(
        Collection<AcquiredChannelEnvironmentIssueBoolean> booleanInserts);

    public abstract ImmutableSet.Builder<AcquiredChannelEnvironmentIssueBoolean> booleanInsertsBuilder();

    public Builder addBooleanInsert(AcquiredChannelEnvironmentIssueBoolean booleanInsert){
      booleanInsertsBuilder().add(booleanInsert);
      return this;
    }

    public abstract AceiUpdates build();
  }

}
