package gms.shared.stationdefinition.converter.util.assemblers;

import com.google.common.base.Functions;
import com.google.common.collect.Range;
import com.google.common.collect.RangeMap;
import com.google.common.collect.Table;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.converter.interfaces.ChannelConverter;
import gms.shared.stationdefinition.converter.interfaces.ChannelGroupConverter;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.SiteKey;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Objects;
import java.util.Optional;
import java.util.function.BiFunction;
import java.util.stream.Collectors;

public class ChannelGroupAssembler {

  private final ChannelGroupConverter channelGroupConverter;
  private final ChannelConverter channelConverter;

  private ChannelGroupAssembler(ChannelGroupConverter channelGroupConverter,
    ChannelConverter channelConverter) {
    this.channelGroupConverter = channelGroupConverter;
    this.channelConverter = channelConverter;
  }

  public static ChannelGroupAssembler create(ChannelGroupConverter channelGroupConverter,
    ChannelConverter channelConverter) {

    Objects.requireNonNull(channelGroupConverter);
    Objects.requireNonNull(channelConverter);
    return new ChannelGroupAssembler(channelGroupConverter, channelConverter);
  }

  public List<ChannelGroup> buildAll(List<SiteDao> sites, List<SiteChanDao> siteChans, Instant effectiveAt) {
    Objects.requireNonNull(sites);
    Objects.requireNonNull(siteChans);
    Objects.requireNonNull(effectiveAt);

    Table<String, String, NavigableMap<Instant, SiteChanDao>> siteChansByStaChanTime =
      AssemblerUtils.buildVersionTable(Functions.compose(SiteChanKey::getStationCode, SiteChanDao::getId),
        Functions.compose(SiteChanKey::getChannelCode, SiteChanDao::getId),
        Functions.compose(SiteChanKey::getOnDate, SiteChanDao::getId),
        siteChans);


    return sites.stream()
      .map(site -> buildForTime(site, siteChansByStaChanTime,
        effectiveAt, channelConverter::convertToVersionReference))
      .filter(Optional::isPresent)
      .map(Optional::get)
      .collect(Collectors.toList());
  }

  public List<ChannelGroup> buildAllForTimeRange(List<SiteDao> sites, List<SiteChanDao> siteChans,
    Instant startTime, Instant endTime) {
    Objects.requireNonNull(sites);
    Objects.requireNonNull(siteChans);
    Objects.requireNonNull(startTime);
    Objects.requireNonNull(endTime);

    Table<String, String, RangeMap<Instant, SiteChanDao>> siteChansByTimeRangeTable =
      AssemblerUtils.buildVersionRangeTable(Functions.compose(SiteChanKey::getStationCode, SiteChanDao::getId),
        Functions.compose(SiteChanKey::getChannelCode, SiteChanDao::getId),
        Functions.compose(SiteChanKey::getOnDate, SiteChanDao::getId),
        SiteChanDao::getOffDate,
        siteChans);

    return sites.stream()
      .map(site -> buildForTimeRange(
        site, siteChansByTimeRangeTable, channelConverter::convertToEntityReference)
      )
      .filter(Optional::isPresent)
      .map(Optional::get)
      .collect(Collectors.toList());
  }

  private Optional<ChannelGroup> buildForTimeRange(SiteDao site,
    Table<String, String, RangeMap<Instant, SiteChanDao>> siteChansByTimeRangeTable,
    BiFunction<SiteDao, SiteChanDao, Channel> channelConverter) {

    SiteKey id = site.getId();
    String stationCode = id.getStationCode();
    Range<Instant> siteTimeRange = Range.closed(site.getId().getOnDate(), site.getOffDate());

    List<SiteChanDao> siteChansForChannelGroup = siteChansByTimeRangeTable.row(stationCode).values().stream()
      .flatMap(instantSiteChanDaoRangeMap -> instantSiteChanDaoRangeMap.subRangeMap(siteTimeRange)
          .asDescendingMapOfRanges()
          .entrySet()
          .stream()
      )
      .filter(Objects::nonNull)
      .map(Map.Entry::getValue)
      .collect(Collectors.toList());

    if (siteChansForChannelGroup.isEmpty()) {
      return Optional.empty();
    }

    return Optional.of(channelGroupConverter.convert(site, siteChansForChannelGroup, channelConverter));
  }

  private Optional<ChannelGroup> buildForTime(SiteDao site,
    Table<String, String, NavigableMap<Instant, SiteChanDao>> siteChansByStaChanTime,
    Instant effectiveAt,
    BiFunction<SiteDao, SiteChanDao, Channel> channelConverter) {

    SiteKey id = site.getId();
    String stationCode = id.getStationCode();
    Range<Instant> siteTimeRange = Range.closed(site.getId().getOnDate(), site.getOffDate());

    List<SiteChanDao> siteChansForChannelGroup = siteChansByStaChanTime.row(stationCode).values().stream()
      .map(instantSiteChanDaoNavigableMap -> {
        Map.Entry<Instant, SiteChanDao> chanDao = instantSiteChanDaoNavigableMap.floorEntry(effectiveAt);

        return findSiteChanDao(chanDao, siteTimeRange);
      })
      .filter(Objects::nonNull)
      .map(Map.Entry::getValue)
      .collect(Collectors.toList());

    if (siteChansForChannelGroup.isEmpty()) {
      return Optional.<ChannelGroup>empty();
    }

    return Optional.of(channelGroupConverter.convert(site, siteChansForChannelGroup, channelConverter));
  }

  private Map.Entry<Instant, SiteChanDao> findSiteChanDao(Map.Entry<Instant, SiteChanDao> chanDao, Range<Instant> timeRange) {
    if (chanDao != null) {
      var siteChanDao = chanDao.getValue();
      Instant chanOnDate = siteChanDao.getId().getOnDate();
      Instant chanOffDate = siteChanDao.getOffDate();

      // overlap between channel time ranges and the overall site time range needs to form the channel group
      boolean siteChannelConnected = timeRange.isConnected(Range.closed(chanOnDate, chanOffDate));

      return siteChannelConnected ? chanDao : null;
    } else {
      return null;
    }
  }
}
