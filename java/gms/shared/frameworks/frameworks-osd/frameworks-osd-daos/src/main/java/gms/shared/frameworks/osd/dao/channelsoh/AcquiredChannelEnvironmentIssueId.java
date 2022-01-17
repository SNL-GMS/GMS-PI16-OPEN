package gms.shared.frameworks.osd.dao.channelsoh;

import static com.google.common.base.Preconditions.checkNotNull;
import static com.google.common.base.Preconditions.checkState;

import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue.AcquiredChannelEnvironmentIssueType;
import gms.shared.frameworks.osd.dao.channel.ChannelDao;
import gms.shared.frameworks.osd.dao.stationgroupsoh.converter.AcquiredChannelEnvironmentIssueTypeConverter;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import javax.persistence.Column;
import javax.persistence.Convert;
import javax.persistence.Embeddable;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;

@Embeddable
public class AcquiredChannelEnvironmentIssueId implements Serializable {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "channel_name", referencedColumnName = "name")
  private transient ChannelDao channel;

  //this allows us to retrieve the channel_name without an extraneous join
  @Column(name = "channel_name", insertable = false, updatable = false)
  private String channelName;

  @Column(name = "type", nullable = false)
  @Convert(converter = AcquiredChannelEnvironmentIssueTypeConverter.class)
  private AcquiredChannelEnvironmentIssueType type;

  @Column(name = "start_time", nullable = false)
  private Instant startTime;

  public AcquiredChannelEnvironmentIssueId() {

  }

  public AcquiredChannelEnvironmentIssueId(
      String channelName, AcquiredChannelEnvironmentIssueType type, Instant startTime) {
    checkNotNull(startTime, "ACEI ID startTime must not be null");
    checkNotNull(type, "ACEI ID type must not be null");
    checkState(channelName != null && !channelName.isEmpty(),
        "ACEI ID channelName must not be empty");
    this.channelName = channelName;
    this.type = type;
    this.startTime = startTime;
  }

  public ChannelDao getChannel() {
    return channel;
  }

  public String getChannelName() {
    return channelName;
  }

  public AcquiredChannelEnvironmentIssueType getType() {
    return type;
  }

  public Instant getStartTime() {
    return startTime;
  }

  public void setChannel(ChannelDao channel) {
    this.channel = channel;
  }

  public void setChannelName(String channelName) {
    this.channelName = channelName;
  }

  public void setType(AcquiredChannelEnvironmentIssueType type) {
    this.type = type;
  }

  public void setStartTime(Instant startTime) {
    this.startTime = startTime;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    AcquiredChannelEnvironmentIssueId that = (AcquiredChannelEnvironmentIssueId) o;
    return getChannelName().equals(that.getChannelName()) && getType() == that.getType()
        && getStartTime().equals(that.getStartTime());
  }

  @Override
  public int hashCode() {
    return Objects.hash(channelName, type, startTime);
  }

  @Override
  public String toString() {
    return "AcquiredChannelEnvironmentIssueId{" +
        "channelName='" + channelName + '\'' +
        ", type=" + type +
        ", startTime=" + startTime +
        '}';
  }
}
