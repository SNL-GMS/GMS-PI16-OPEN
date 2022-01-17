package gms.shared.stationdefinition.converter;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.converter.interfaces.ChannelConverter;
import gms.shared.stationdefinition.converter.interfaces.ChannelGroupConverter;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;

import java.time.Instant;
import java.util.Collection;
import java.util.Objects;
import java.util.function.BiFunction;
import java.util.stream.Collectors;

public class DaoChannelGroupConverter implements ChannelGroupConverter {

  public static final String SITE_DAO_NULL = "SiteDao must not be null";

  private final DaoChannelConverter channelConverter;

  private DaoChannelGroupConverter(DaoChannelConverter channelConverter) {
    this.channelConverter = channelConverter;
  }

  /**
   * Creates a new {@link DaoChannelGroupConverter}
   *
   * @param channelConverter - {@link ChannelConverter}
   * @return a {@link DaoChannelGroupConverter}
   */
  public static DaoChannelGroupConverter create(DaoChannelConverter channelConverter) {
    Objects.requireNonNull(channelConverter);
    return new DaoChannelGroupConverter(channelConverter);
  }

  /**
   * Converts a {@link SiteDao}, and a passed list of {@link SiteChanDao} into a {@link ChannelGroup}.
   * {@link Channel}s in the {@link ChannelGroup} will be version references
   * NOTE: The depth is currently ignored and set to "0" as a hardcoded value.
   *
   * @param siteDao The Site for the ChannelGroup
   * @param siteChanDaos The channels in the channel group, as specified by ChannelConverter
   * @return The {@link ChannelGroup} representing the
   * provided CSS data
   */
  @Override
  public ChannelGroup convert(SiteDao siteDao, Collection<SiteChanDao> siteChanDaos,
    BiFunction<SiteDao, SiteChanDao, Channel> channelBiFunction) {

    Objects.requireNonNull(siteDao, SITE_DAO_NULL);
    Objects.requireNonNull(siteChanDaos, "List of SiteChanDaos must not be null");
    Objects.requireNonNull(channelBiFunction, "Channel BiFunction must not be null");

    Preconditions.checkState(!siteChanDaos.isEmpty(), "SiteChanDaos cannot be empty");

    final Collection<Channel> channels = siteChanDaos.stream()
      .map(siteChanDao -> channelBiFunction.apply(siteDao, siteChanDao))
      .collect(Collectors.toList());

    return getChannelGroup(siteDao, channels);
  }

  private ChannelGroup getChannelGroup(SiteDao siteDao, Collection<Channel> channels) {
    Instant newEndDate = siteDao.getOffDate();
    //this should be done in the jpa converter, but there are side effects of setting it to null, needs to be set to Optional.emtpy()
    if(newEndDate.equals(Instant.MAX)){
      newEndDate = null;
    }
    final ChannelGroup.Data newGroupData = ChannelGroup.Data.builder()
      .setDescription(siteDao.getStationName())
      .setLocation(Location.from(siteDao.getLatitude(), siteDao.getLongitude(),
        0, siteDao.getElevation()))
      .setEffectiveUntil(newEndDate)
      .setType(ChannelGroup.ChannelGroupType.PHYSICAL_SITE)
      .setChannels(channels)
      .build();

    return ChannelGroup.builder()
      .setName(siteDao.getId().getStationCode())
      .setEffectiveAt(siteDao.getId().getOnDate())
      .setData(newGroupData)
      .build();
  }

  /**
   * Converts a {@link SiteDao}, and a passed list of {@link SiteChanDao} into a {@link ChannelGroup}.
   * {@link Channel}s in the {@link ChannelGroup} will be version references
   * NOTE: The depth is currently ignored and set to "0" as a hardcoded value.
   *
   * @param siteDao The Site for the ChannelGroup
   * @param siteChanDaos The channels in the channel group, as specified by ChannelConverter
   * @return The {@link ChannelGroup} representing the
   * provided CSS data
   */
  @Override
  public ChannelGroup convert(SiteDao siteDao, Collection<SiteChanDao> siteChanDaos) {

    Objects.requireNonNull(siteDao, SITE_DAO_NULL);
    Objects.requireNonNull(siteChanDaos, "List of SiteChanDaos must not be null");

    Preconditions.checkState(!siteChanDaos.isEmpty(), "SiteChanDaos cannot be empty");

    final Collection<Channel> channels = siteChanDaos.stream()
      .map(siteChanDao -> channelConverter.convertToVersionReference(siteDao, siteChanDao))
      .collect(Collectors.toList());

    return getChannelGroup(siteDao, channels);
  }

  /**
   * Converts a Site into a {@link ChannelGroup} version reference.
   * NOTE: The depth is currently ignored and set to "0" as a hardcoded value.
   *
   * @param siteDao The Site for the ChannelGroup
   * @return The {@link ChannelGroup} representing the provided CSS data as a version reference
   */
  @Override
  public ChannelGroup convertToVersionReference(SiteDao siteDao) {

    Objects.requireNonNull(siteDao, SITE_DAO_NULL);

    return ChannelGroup
      .createVersionReference(siteDao.getId().getStationCode(), siteDao.getId().getOnDate());
  }
}
