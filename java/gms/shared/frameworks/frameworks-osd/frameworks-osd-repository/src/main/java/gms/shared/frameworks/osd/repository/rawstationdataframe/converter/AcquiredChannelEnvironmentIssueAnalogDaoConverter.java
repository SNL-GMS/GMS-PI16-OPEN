package gms.shared.frameworks.osd.repository.rawstationdataframe.converter;

import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueAnalog;
import gms.shared.frameworks.osd.dao.channel.ChannelDao;
import gms.shared.frameworks.osd.dao.channelsoh.AcquiredChannelEnvironmentIssueAnalogDao;
import gms.shared.frameworks.osd.dao.channelsoh.AcquiredChannelEnvironmentIssueId;
import gms.shared.frameworks.utilities.jpa.EntityConverter;

import javax.persistence.EntityManager;
import java.util.Objects;

public class AcquiredChannelEnvironmentIssueAnalogDaoConverter
  implements EntityConverter<AcquiredChannelEnvironmentIssueAnalogDao, AcquiredChannelEnvironmentIssueAnalog> {

  @Override
  public AcquiredChannelEnvironmentIssueAnalogDao fromCoi(AcquiredChannelEnvironmentIssueAnalog sohAnalog,
    EntityManager entityManager) {
    Objects.requireNonNull(sohAnalog);
    Objects.requireNonNull(entityManager);

    var compositeId = new AcquiredChannelEnvironmentIssueId(sohAnalog.getChannelName(),
      sohAnalog.getType(), sohAnalog.getStartTime());
    var channelDao = entityManager.getReference(ChannelDao.class, sohAnalog.getChannelName());
    compositeId.setChannel(channelDao);

    var sohAnalogDao = new AcquiredChannelEnvironmentIssueAnalogDao();
    sohAnalogDao.setId(compositeId);
    sohAnalogDao.setEndTime(sohAnalog.getEndTime());
    sohAnalogDao.setStatus(sohAnalog.getStatus());

    return sohAnalogDao;
  }

  @Override
  public AcquiredChannelEnvironmentIssueAnalog toCoi(
      AcquiredChannelEnvironmentIssueAnalogDao sohAnalogDao) {
    Objects.requireNonNull(sohAnalogDao);

    return AcquiredChannelEnvironmentIssueAnalog.from(
        sohAnalogDao.getId().getChannelName(),
        sohAnalogDao.getId().getType(),
        sohAnalogDao.getId().getStartTime(),
        sohAnalogDao.getEndTime(),
        sohAnalogDao.getStatus());
  }

}
