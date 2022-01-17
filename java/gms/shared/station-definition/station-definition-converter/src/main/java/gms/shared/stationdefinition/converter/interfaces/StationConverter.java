package gms.shared.stationdefinition.converter.interfaces;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.converter.DaoChannelConverter;
import gms.shared.stationdefinition.converter.DaoChannelGroupConverter;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;

import java.util.Collection;
import java.util.List;
import java.util.function.BiFunction;

public interface StationConverter {

  /**
   * Converts a {@link SiteDao} reference station name into COI {@link Station} object
   * this is a faceted object
   *
   * @param referenceStation - reference station name
   * @return coi station
   */
  Station convert(String referenceStation);

  /**
   * Converts a single main {@link SiteDao} to a version reference {@link Station}
   *
   * @param siteDao - {@link SiteDao}
   * @return {@link Station}
   */
  Station convertToVersionReference(SiteDao siteDao);

  /**
   * Converts a single main {@link SiteDao} to a version reference {@link Station}
   *
   * @param siteDao - {@link SiteDao}
   * @return {@link Station}
   */
  Station convertToEntityReference(SiteDao siteDao);

  /**
   * Converts a list of {@link SiteDao}s and {@link SiteChanDao}s to a populated
   * {@link Station} with lists of {@link Channel} and {@link ChannelGroup} version references
   *
   * @param siteDaos - list of {@link SiteDao}
   * @param siteChanDaos - list of {@link SiteChanDao}
   * @param channelBiFunction - BiFunction that applies {@link DaoChannelConverter}
   * @param channelGroupBiFunction - BiFunction that applies {@link DaoChannelGroupConverter}
   * @return {@link Station}
   */
  Station convert(Collection<SiteDao> siteDaos, Collection<SiteChanDao> siteChanDaos,
                  BiFunction<SiteDao, SiteChanDao, Channel> channelBiFunction,
                  BiFunction<SiteDao, List<SiteChanDao>, ChannelGroup> channelGroupBiFunction);
}
