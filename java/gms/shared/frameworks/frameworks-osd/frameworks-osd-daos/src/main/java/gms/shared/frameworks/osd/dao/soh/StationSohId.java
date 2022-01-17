package gms.shared.frameworks.osd.dao.soh;

import gms.shared.frameworks.osd.dao.channel.StationDao;
import java.io.Serializable;
import java.util.Objects;

public class StationSohId implements Serializable {

  private static final long serialVersionUID = 1L;

  private int id;

  private StationDao station;

  public StationSohId() {
    // empty JPA constructor
  }

  public StationSohId(int id, StationDao station) {
    this.id = id;
    this.station = station;
  }

  public int getId() {
    return id;
  }

  public void setId(int id) {
    this.id = id;
  }

  public StationDao getStation() {
    return station;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    StationSohId that = (StationSohId) o;

    return getId() == that.getId() && getStation().getName().equals(that.getStation().getName());
  }

  @Override
  public int hashCode() {
    return Objects.hash(getId(), getStation().getName());
  }

}
