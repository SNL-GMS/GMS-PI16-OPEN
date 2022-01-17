package gms.shared.stationdefinition.converter;

import com.google.common.base.Functions;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableTable;
import com.google.common.collect.Table;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelDataType;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.ChannelOrientationType;
import gms.shared.stationdefinition.coi.channel.ChannelTypes;
import gms.shared.stationdefinition.coi.channel.ChannelTypesParser;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.channel.RelativePosition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationType;
import gms.shared.stationdefinition.converter.interfaces.StationConverter;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.enums.StaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Optional;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.stream.Collectors;

public class DaoStationConverter implements StationConverter {
  private static final Logger logger = LoggerFactory.getLogger(DaoStationConverter.class);

  private DaoStationConverter() {
  }

  /**
   * creates and validates a new {@link DaoStationConverter}
   *
   * @return a {@link DaoStationConverter}
   */
  public static DaoStationConverter create() {
    return new DaoStationConverter();
  }

  @Override
  public Station convert(String referenceStation) {
    Objects.requireNonNull(referenceStation, "Reference station must not be null.");

    return Station.builder()
      .setName(referenceStation)
      .build();
  }

  /**
   * Converts a single main SiteDao to a {@link Station} version reference
   *
   * @param siteDao - {@link SiteDao}
   * @return {@link Station}
   */
  @Override
  public Station convertToVersionReference(SiteDao siteDao) {
    Objects.requireNonNull(siteDao);

    return Station.builder()
      .setName(siteDao.getReferenceStation())
      .setEffectiveAt(siteDao.getId().getOnDate())
      .build();
  }

  @Override
  public Station convertToEntityReference(SiteDao siteDao) {
    Objects.requireNonNull(siteDao);

    return Station.createEntityReference(siteDao.getReferenceStation());
  }

  /**
   * Converts a list of SiteDaos and SiteChanDaos to a populated {@link Station}
   * with {@link Channel} and {@link ChannelGroup} version reference lists
   *
   * @param siteDaos - list of {@link SiteDao}
   * @param siteChanDaos - list of {@link SiteChanDao}
   * @return {@link Station}
   */
  @Override
  public Station convert(Collection<SiteDao> siteDaos, Collection<SiteChanDao> siteChanDaos,
    BiFunction<SiteDao, SiteChanDao, Channel> channelBiFunction,
    BiFunction<SiteDao, List<SiteChanDao>, ChannelGroup> channelGroupBiFunction) {

    Objects.requireNonNull(siteDaos);
    Objects.requireNonNull(siteChanDaos);
    Objects.requireNonNull(channelBiFunction);
    Objects.requireNonNull(channelGroupBiFunction);

    Preconditions.checkState(!siteDaos.isEmpty(), "SiteDaos cannot be empty");
    Preconditions.checkState(!siteChanDaos.isEmpty(), "SiteChanDaos cannot be empty");

    // Create the list of Channel version references
    List<Channel> channels = siteDaos.stream()
      .flatMap(siteDao -> siteChanDaos.stream()
        .filter(siteChanDao -> siteChanDao.getId().getStationCode()
          .equals(siteDao.getId().getStationCode()))
        .map(siteChanDao -> channelBiFunction.apply(siteDao, siteChanDao)))
      .collect(Collectors.toList());

    Map<String, List<SiteChanDao>> siteChansByStation = siteChanDaos.stream()
      .collect(Collectors.groupingBy(Functions.compose(SiteChanKey::getStationCode, SiteChanDao::getId)));

    // Create the list of ChannelGroup version refs
    Map<String, ChannelGroup> channelGroupMap = new HashMap<>();
    for (SiteDao siteDao : siteDaos) {
      List<SiteChanDao> matchingSiteChanDaos = siteChansByStation.get(siteDao.getId().getStationCode());

      if (matchingSiteChanDaos != null && !matchingSiteChanDaos.isEmpty()) {
        ChannelGroup channelGroup = channelGroupBiFunction.apply(siteDao, matchingSiteChanDaos);
        channelGroupMap.put(channelGroup.getName(), channelGroup);
      }
    }

    Optional<SiteDao> mainSiteDaoOptional = getMainSiteDao(siteDaos);
    SiteDao mainSiteDao;
    try {
      mainSiteDao = mainSiteDaoOptional.orElseThrow();
    } catch (NoSuchElementException e) {
      logger.error("MainSiteDao does not exist, could not create station", e);
      return null;
    }

    Map<String, RelativePosition> relativePositionMap = new HashMap<>();

    for (SiteDao siteDao : siteDaos) {

      if (siteChansByStation.containsKey(siteDao.getId().getStationCode()) &&
        !siteChansByStation.get(siteDao.getId().getStationCode()).isEmpty()) {

        RelativePosition relativePosition = RelativePosition.from(siteDao.getDegreesNorth(),
          siteDao.getDegreesEast(), 0);

        //get associated channel group
        ChannelGroup channelGroup = channelGroupMap.get(siteDao.getId().getStationCode());

        String channelGroupEmpty = String.format(
          "Channel group necessary for site %s is not present.", siteDao.getId().getStationCode());

        Preconditions.checkState(channelGroup != null, channelGroupEmpty);

        //map relative positions
        for (Channel channel : channelGroup.getChannels()) {
          relativePositionMap.put(channel.getName(), relativePosition);
        }
      }
    }
    List<ChannelTypes> channelTypes = siteChanDaos.stream()
      .map(siteChan -> ChannelTypesParser.parseChannelTypes(siteChan.getId().getChannelCode()))
      .filter(Optional::isPresent)
      .map(Optional::get)
      .collect(Collectors.toList());
    StaType staType = mainSiteDao.getStaType();
    StationType stationType = stationTypeFromChannelsTypes(channelTypes, staType);

    //TODO continue to hardcode depth to 0?
    Location location = Location.from(mainSiteDao.getLatitude(), mainSiteDao.getLongitude(),
      0, mainSiteDao.getElevation());

    try {

      Instant newEndDate = mainSiteDao.getOffDate();
      //this should be done in the jpa converter, but there are side effects of setting it to null, needs to be set to Optional.emtpy()
      if(newEndDate.equals(Instant.MAX)){
        newEndDate = null;
      }
      Station.Data stationData = Station.Data.builder()
        .setType(stationType)
        .setDescription(mainSiteDao.getStationName())
        .setRelativePositionsByChannel(relativePositionMap)
        .setLocation(location)
        .setEffectiveUntil(newEndDate)
        .setChannelGroups(channelGroupMap.values())
        .setAllRawChannels(channels)
        .build();

      return Station.builder()
        .setName(mainSiteDao.getReferenceStation())
        .setEffectiveAt(mainSiteDao.getId().getOnDate())
        .setData(stationData)
        .build();
    } catch (IllegalArgumentException e) {
      logger.error("IllegalArgumentException for station {}", mainSiteDao.getStationName(), e);
      return null;
    }
  }

  private StationType stationTypeFromChannelsTypes(List<ChannelTypes> channelTypesList, StaType staType) {
    Table<StaType, ChannelDataType, StationType> stationTypeTable = ImmutableTable.<StaType, ChannelDataType, StationType>builder()
      .put(StaType.ARRAY_STATION, ChannelDataType.HYDROACOUSTIC, StationType.HYDROACOUSTIC_ARRAY)
      .put(StaType.ARRAY_STATION, ChannelDataType.INFRASOUND, StationType.INFRASOUND_ARRAY)
      .put(StaType.ARRAY_STATION, ChannelDataType.SEISMIC, StationType.SEISMIC_ARRAY)
      .put(StaType.SINGLE_STATION, ChannelDataType.HYDROACOUSTIC, StationType.HYDROACOUSTIC)
      .put(StaType.SINGLE_STATION, ChannelDataType.INFRASOUND, StationType.INFRASOUND)
      .put(StaType.SINGLE_STATION, ChannelDataType.WEATHER, StationType.WEATHER)
      .build();

    List<ChannelDataType> channelDataTypes = channelTypesList.stream()
      .map(ChannelTypes::getDataType)
      .distinct()
      .sorted()
      .collect(Collectors.toList());

    if (channelDataTypes.size() == 0) {
      return StationType.UNKNOWN;
    }
    //This uses the enumberation order to derive the station type for stations with mixed types
    //for example, a station with weather and infrasound will be labeled as infrasound
    ChannelDataType channelDataType = channelDataTypes.get(0);

    if (staType.equals(StaType.SINGLE_STATION) && channelDataType.equals(ChannelDataType.SEISMIC)) {
      Map<ChannelOrientationType, Long> orientationCounts = channelTypesList.stream()
        .map(ChannelTypes::getOrientationType)
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
      //after grouping by orientation, if we have multiple orientations, we have more than a 1 component
      if (orientationCounts.size() == 1) {
        return StationType.SEISMIC_1_COMPONENT;
      } else {
        return StationType.SEISMIC_3_COMPONENT;
      }
    } else {
      return stationTypeTable.get(staType, channelDataType);
    }
  }

  static Optional<SiteDao> getMainSiteDao(Collection<SiteDao> siteDaos) {

    return siteDaos.stream()
      .filter(siteDao -> siteDao.getReferenceStation().equals(siteDao.getId().getStationCode()))
      .findFirst();
  }
}