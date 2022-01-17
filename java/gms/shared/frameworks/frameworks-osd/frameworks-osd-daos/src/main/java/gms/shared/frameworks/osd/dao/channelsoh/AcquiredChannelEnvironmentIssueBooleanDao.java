package gms.shared.frameworks.osd.dao.channelsoh;

import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;
import java.util.Objects;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;

/**
 * Define a Data Access Object to allow access to the relational database.
 */
@Entity
@Table(name = "channel_env_issue_boolean")
public class AcquiredChannelEnvironmentIssueBooleanDao extends AcquiredChannelEnvironmentIssueDao {

  @Column(name = "status", nullable = false)
  private boolean status;

  public boolean isStatus() {
    return status;
  }

  public void setStatus(boolean status) {
    this.status = status;
  }

  public AcquiredChannelEnvironmentIssueBoolean toCoi() {
    return AcquiredChannelEnvironmentIssueBoolean.from(
        this.id.getChannelName(), this.id.getType(),
        this.id.getStartTime(), this.endTime, this.status);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    AcquiredChannelEnvironmentIssueBooleanDao that = (AcquiredChannelEnvironmentIssueBooleanDao) o;
    return isStatus() == that.isStatus() &&
        getId().equals(that.getId()) &&
        getEndTime().equals(that.getEndTime());
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, endTime, status);
  }

  @Override
  public String toString() {
    return "AcquiredChannelEnvironmentIssueBooleanDao{" +
        "id=" + id.toString() +
        ", endTime=" + endTime +
        ", status=" + status +
        '}';
  }
}
