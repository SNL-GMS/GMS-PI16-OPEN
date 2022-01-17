package gms.shared.frameworks.osd.dao.channelsoh;

import java.time.Instant;
import javax.persistence.Column;
import javax.persistence.EmbeddedId;
import javax.persistence.MappedSuperclass;

@MappedSuperclass
public class AcquiredChannelEnvironmentIssueDao {

  @EmbeddedId
  protected AcquiredChannelEnvironmentIssueId id;

  @Column(name = "end_time", nullable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
  protected Instant endTime;

  public AcquiredChannelEnvironmentIssueId getId() {
    return id;
  }

  public void setId(AcquiredChannelEnvironmentIssueId id) {
    this.id = id;
  }

  public Instant getEndTime() {
    return endTime;
  }

  public void setEndTime(Instant endTime) {
    this.endTime = endTime;
  }

}
