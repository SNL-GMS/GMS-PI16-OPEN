package gms.shared.frameworks.osd.repository.rawstationdataframe.converter;

import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;
import gms.shared.frameworks.osd.dao.channel.ChannelDao;
import gms.shared.frameworks.osd.dao.channelsoh.AcquiredChannelEnvironmentIssueBooleanDao;
import gms.shared.frameworks.osd.dao.channelsoh.AcquiredChannelEnvironmentIssueId;
import gms.shared.frameworks.utilities.jpa.EntityConverter;

import javax.persistence.EntityManager;
import java.util.Objects;

public class AcquiredChannelEnvironmentIssueBooleanDaoConverter
  implements EntityConverter<AcquiredChannelEnvironmentIssueBooleanDao, AcquiredChannelEnvironmentIssueBoolean> {

  @Override
  public AcquiredChannelEnvironmentIssueBooleanDao fromCoi(AcquiredChannelEnvironmentIssueBoolean aceiBoolean,
    EntityManager entityManager) {
    Objects.requireNonNull(aceiBoolean);
    Objects.requireNonNull(entityManager);

    var compositeId = new AcquiredChannelEnvironmentIssueId(aceiBoolean.getChannelName(),
      aceiBoolean.getType(), aceiBoolean.getStartTime());
    var channelDao = entityManager.getReference(ChannelDao.class, aceiBoolean.getChannelName());
    compositeId.setChannel(channelDao);

    var sohBooleanDao = new AcquiredChannelEnvironmentIssueBooleanDao();
    sohBooleanDao.setId(compositeId);
    sohBooleanDao.setEndTime(aceiBoolean.getEndTime());
    sohBooleanDao.setStatus(aceiBoolean.getStatus());

    return sohBooleanDao;
  }

  @Override
  public AcquiredChannelEnvironmentIssueBoolean toCoi(AcquiredChannelEnvironmentIssueBooleanDao aceiBooleanDao) {
    Objects.requireNonNull(aceiBooleanDao);

    return AcquiredChannelEnvironmentIssueBoolean.from(
      aceiBooleanDao.getId().getChannelName(),
      aceiBooleanDao.getId().getType(),
      aceiBooleanDao.getId().getStartTime(),
      aceiBooleanDao.getEndTime(),
      aceiBooleanDao.isStatus());
  }
}
