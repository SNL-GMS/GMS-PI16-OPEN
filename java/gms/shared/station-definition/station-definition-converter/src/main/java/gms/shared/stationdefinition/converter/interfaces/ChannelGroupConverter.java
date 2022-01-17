package gms.shared.stationdefinition.converter.interfaces;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;

import java.util.Collection;
import java.util.function.BiFunction;

public interface ChannelGroupConverter {

  /**
   * Converts a {@link SiteDao}, and a passed list of {@link SiteChanDao} into a {@link ChannelGroup}.
   * {@link Channel}s in the {@link ChannelGroup} will be version references.
   *
   * @param siteDao The Site for the ChannelGroup
   * @param siteChanDaos The channels in the channel group, as specified by ChannelConverter
   * @return The {@link ChannelGroup} representing the provided CSS data
   */
  ChannelGroup convert(SiteDao siteDao, Collection<SiteChanDao> siteChanDaos,
                       BiFunction<SiteDao, SiteChanDao, Channel> channelBiFunction);

  /**
   * Converts a site and a set  of channels to a {@link ChannelGroup} version reference
   *
   * @param siteDao The site representing the basic metadata for the channel group
   * @return The {@link ChannelGroup} version reference
   */
  ChannelGroup convertToVersionReference(SiteDao siteDao);

  /**
   * Converts a {@link SiteDao}, and a passed list of {@link SiteChanDao} into a {@link ChannelGroup}.
   * {@link Channel}s in the {@link ChannelGroup} will be version references.
   *
   * @param siteDao The Site for the ChannelGroup
   * @param siteChanDaos The channels in the channel group, as specified by ChannelConverter
   * @return The {@link ChannelGroup} representing the provided CSS data
   */
  ChannelGroup convert(SiteDao siteDao, Collection<SiteChanDao> siteChanDaos);
}
