package gms.shared.frameworks.osd.dao.channelsoh;

import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueAnalog;
import java.util.Objects;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;

/**
 * Define a Data Access Object to allow access to the relational database.
 */
@Entity
@Table(name = "channel_env_issue_analog")
public class AcquiredChannelEnvironmentIssueAnalogDao extends AcquiredChannelEnvironmentIssueDao {

  @Column(name = "status", nullable = false)
  private double status;

  public double getStatus() {
    return status;
  }

  public void setStatus(double status) {
    this.status = status;
  }

  public AcquiredChannelEnvironmentIssueAnalog toCoi() {
    return AcquiredChannelEnvironmentIssueAnalog.from(
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
    AcquiredChannelEnvironmentIssueAnalogDao that = (AcquiredChannelEnvironmentIssueAnalogDao) o;
    return Double.compare(that.getStatus(), getStatus()) == 0 &&
        getId().equals(that.getId()) &&
        getEndTime().equals(that.getEndTime());
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, endTime, status);
  }

  @Override
  public String toString() {
    return "AcquiredChannelSohAnalogDao{" +
        "id=" + id.toString() +
        ", endTime=" + endTime +
        ", status=" + status +
        '}';
  }
}
