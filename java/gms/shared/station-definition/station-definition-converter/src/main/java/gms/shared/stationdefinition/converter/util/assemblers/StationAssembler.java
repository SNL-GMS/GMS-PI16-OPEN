package gms.shared.stationdefinition.converter.util.assemblers;

import com.google.common.base.Functions;
import com.google.common.collect.Table;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.converter.interfaces.ChannelConverter;
import gms.shared.stationdefinition.converter.interfaces.ChannelGroupConverter;
import gms.shared.stationdefinition.converter.interfaces.StationConverter;
import gms.shared.stationdefinition.converter.util.TemporalMap;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.SiteKey;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Objects;
import java.util.Optional;
import java.util.function.BiFunction;
import java.util.stream.Collectors;


public class StationAssembler {

  private final StationConverter stationConverter;
  private final ChannelGroupConverter channelGroupConverter;
  private final ChannelConverter channelConverter;

  private StationAssembler(StationConverter stationConverter, ChannelGroupConverter channelGroupConverter,
                           ChannelConverter channelConverter) {
    this.stationConverter = stationConverter;
    this.channelGroupConverter = channelGroupConverter;
    this.channelConverter = channelConverter;
  }

  public static StationAssembler create(StationConverter stationConverter, ChannelGroupConverter channelGroupConverter,
                                        ChannelConverter channelConverter) {
    Objects.requireNonNull(stationConverter);
    Objects.requireNonNull(channelGroupConverter);
    Objects.requireNonNull(channelConverter);

    return new StationAssembler(stationConverter, channelGroupConverter, channelConverter);
  }

    /**
     * Build converters for either the version references or the entity references
     * Time range will be using entityRefs and the Time query will use versionRefs
     * @param sites - List of {@link SiteDao}
     * @param siteChans - List of {@link SiteChanDao}
     * @param effectiveTime - effective time for the versions
     */
  private List<Station> createStationsHelper(List<SiteDao> sites, List<SiteChanDao> siteChans, Instant effectiveTime,
                           BiFunction<SiteDao, SiteChanDao, Channel> channelBiFunction,
                           BiFunction<SiteDao, List<SiteChanDao>, ChannelGroup> channelGroupBiFunction) {

    Map<String, List<String>> stationCodesByReferenceStation = sites.stream()
            .collect(Collectors.groupingBy(SiteDao::getReferenceStation,
                    Collectors.mapping(Functions.compose(SiteKey::getStationCode, SiteDao::getId), Collectors.toList())));
    TemporalMap<String, SiteDao> sitesByStationCode = sites.stream()
            .collect(TemporalMap.collector(Functions.compose(SiteKey::getStationCode, SiteDao::getId),
                    Functions.compose(SiteKey::getOnDate, SiteDao::getId)));

    Table<String, String, NavigableMap<Instant, SiteChanDao>> siteChansByStationAndChannel =
            AssemblerUtils.buildVersionTable(Functions.compose(SiteChanKey::getStationCode, SiteChanDao::getId),
                    Functions.compose(SiteChanKey::getChannelCode, SiteChanDao::getId),
                    Functions.compose(SiteChanKey::getOnDate, SiteChanDao::getId),
                    siteChans);

    return stationCodesByReferenceStation.entrySet().stream()
            .flatMap(stationCodes ->
                    sitesByStationCode.getVersions(stationCodes.getKey()).stream()
                            .map(mainSite -> {
                              List<SiteDao> sitesForVersion = stationCodes.getValue().stream()
                                      .map(stationCode -> sitesByStationCode.getVersionFloor(stationCode, effectiveTime))
                                      .filter(Optional::isPresent)
                                      .map(Optional::get)
                                      .collect(Collectors.toList());
                              List<SiteChanDao> siteChansForVersion = stationCodes.getValue().stream()
                                      .flatMap(stationCode -> siteChansByStationAndChannel.row(stationCode).entrySet().stream()
                                              .map(channelCodeVersions -> channelCodeVersions.getValue().floorEntry(effectiveTime))
                                              .filter(Objects::nonNull)
                                              .map(Map.Entry::getValue))
                                      .collect(Collectors.toList());

                              if (sitesForVersion.isEmpty() || siteChansForVersion.isEmpty()) {
                                return Optional.<Station>empty();
                              }

                              return Optional.ofNullable(stationConverter.convert(sitesForVersion, siteChansForVersion,
                                      channelBiFunction, channelGroupBiFunction));
                            }))
            .filter(Optional::isPresent)
            .map(Optional::get)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
  }

    /**
     * Build list of {@link Station} for the entire time range of the query
     * @param stationNames - list of station names for the reference station
     * @param sites - list of {@link SiteDao}s
     * @param siteChans - list of {@link SiteChanDao}s
     * @return list of {@link Station}s
     */
  public List<Station> buildAllForTimeRange(List<String> stationNames, List<SiteDao> sites,
                                            List<SiteChanDao> siteChans, Instant startTime) {

      BiFunction<SiteDao, SiteChanDao, Channel> channelFunc = channelConverter::convertToEntityReference;

      BiFunction<SiteDao, List<SiteChanDao>, ChannelGroup> channelGroupFunc = (siteDao, siteChanDaos) ->
              channelGroupConverter.convert(siteDao, siteChanDaos, channelFunc);

      List<Station> stationList = new ArrayList<>();
      for (String stationName : stationNames) {
          // filter sublist of SiteDaos using station name
          List<SiteDao> stationSiteDaos = sites.stream()
                  .filter(site -> site.getReferenceStation().equals(stationName))
                  .collect(Collectors.toList());

          // get sublist of SiteChanDaos using StationCode
          List<SiteChanDao> stationSiteChanDaos = stationSiteDaos.stream()
                  .map(site -> site.getId().getStationCode())
                  .flatMap(code -> siteChans.stream()
                          .filter(siteChan -> siteChan.getId().getStationCode().equals(code)))
                  .collect(Collectors.toList());

          // create list of site effective times to send to the helper
          List<Instant> siteOnDates = new ArrayList<>(List.of(startTime));   // start time needs to be first element (AAK in 1990 but startTime is 1989)
          siteOnDates.addAll(stationSiteDaos.stream()
                  .filter(site -> site.getReferenceStation().equals(site.getId().getStationCode()))
                  .filter(site -> site.getId().getOnDate().isAfter(startTime))// grab site for onDate < startTime, else use the onDate
                  .map(mainSite -> mainSite.getId().getOnDate())
                  .collect(Collectors.toList()));  // make this immutable

          stationList.addAll(siteOnDates.stream()
                  .map(effectiveAt -> createStationsHelper(stationSiteDaos, stationSiteChanDaos,
                          effectiveAt, channelFunc, channelGroupFunc))
                  .flatMap(List::stream)
                  .collect(Collectors.toList()));
      }
    return stationList;
  }

    public List<Station> buildAllForTime(List<SiteDao> sites, List<SiteChanDao> siteChans, Instant effectiveAt) {
      Objects.requireNonNull(sites, "Cannot build stations from null sites");
      Objects.requireNonNull(siteChans, "Cannot build stations from null site chans");
      Objects.requireNonNull(effectiveAt, "Cannot build stations from null effective time");

      BiFunction<SiteDao, SiteChanDao, Channel> channelFunc = channelConverter::convertToVersionReference;

      BiFunction<SiteDao, List<SiteChanDao>, ChannelGroup> channelGroupFunc = (site, siteChannels) ->
              channelGroupConverter.convert(site, siteChannels, channelFunc);

      return createStationsHelper(sites, siteChans, effectiveAt, channelFunc, channelGroupFunc);
  }
}
