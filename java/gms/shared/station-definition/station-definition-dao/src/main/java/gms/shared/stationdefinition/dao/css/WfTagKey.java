package gms.shared.stationdefinition.dao.css;

import gms.shared.stationdefinition.dao.css.converter.TagNameConverter;
import gms.shared.stationdefinition.dao.css.enums.TagName;

import javax.persistence.Column;
import javax.persistence.Convert;
import javax.persistence.Embeddable;
import java.io.Serializable;

@Embeddable
public class WfTagKey implements Serializable {
  private TagName tagName;
  private long wfId;
  private long id;

  @Column(name = "tagid", nullable = false)
  public long getId() {
    return id;
  }

  public void setId(long tagId) {
    this.id = tagId;
  }

  @Column(name = "tagname", nullable = false)
  @Convert(converter = TagNameConverter.class)
  public TagName getTagName() {
    return tagName;
  }

  public void setTagName(TagName tagName) {
    this.tagName = tagName;
  }

  @Column(name = "wfid", nullable = false)
  public long getWfId() {
    return wfId;
  }

  public void setWfId(long wfId) {
    this.wfId = wfId;
  }
}
