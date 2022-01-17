package gms.shared.waveform.repository;

import com.google.common.collect.LinkedListMultimap;
import com.google.common.collect.Multimap;
import gms.shared.stationdefinition.api.StationDefinitionManagerInterface;
import gms.shared.stationdefinition.api.channel.util.ChannelsTimeFacetRequest;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.repository.util.StationDefinitionIdUtility;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.shared.waveform.api.WaveformRepositoryInterface;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.ChannelSegmentDescriptor;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.converter.ChannelSegmentConverter;
import org.apache.commons.lang3.Validate;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static gms.shared.stationdefinition.facet.FacetingTypes.CHANNEL_TYPE;

/**
 * A {@link WaveformRepositoryInterface} implementation that uses a bridged database
 */
public class BridgedWaveformRepository implements WaveformRepositoryInterface {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(BridgedWaveformRepository.class));

  private final WfdiscDatabaseConnector wfdiscDatabaseConnector;
  private final StationDefinitionManagerInterface stationDefinitionManager;
  private final ChannelSegmentConverter converter;

  private BridgedWaveformRepository(
    WfdiscDatabaseConnector wfdiscDatabaseConnector,
    StationDefinitionManagerInterface stationDefinitionManager,
    ChannelSegmentConverter converter) {
    this.wfdiscDatabaseConnector = wfdiscDatabaseConnector;
    this.stationDefinitionManager = stationDefinitionManager;
    this.converter = converter;
  }

  /**
   * Creates a {@link BridgedWaveformRepository} from the provided Jpa Repositories for Waveforms
   * from the file location defined by the {@link WfdiscDatabaseConnector}
   *
   * @param wfdiscDatabaseConnector The repository for retrieving waveform file locations
   * @return a BridgedWaveformRepository for retrieving Waveforms from a bridged database
   */
  public static BridgedWaveformRepository create(
    WfdiscDatabaseConnector wfdiscDatabaseConnector,
    StationDefinitionManagerInterface stationDefinitionAccessor,
    ChannelSegmentConverter converter) {
    Objects.requireNonNull(wfdiscDatabaseConnector);
    Objects.requireNonNull(stationDefinitionAccessor);
    Objects.requireNonNull(converter);
    return new BridgedWaveformRepository(wfdiscDatabaseConnector, stationDefinitionAccessor, converter);
  }

  @Override
  public Collection<ChannelSegment<Waveform>> findByChannelsAndTimeRange(
    Set<Channel> channels, Instant startTime, Instant endTime) {

    Instant transactionStart = Instant.now();
    //load wfdisc associated with channels and timerange parameter list
    List<SiteChanKey> siteChanList = channels.stream()
      .map(siteChan -> StationDefinitionIdUtility.getCssKeyFromName(siteChan.getName()))
      .collect(Collectors.toList());

    UUID transactionId = UUID.randomUUID();
    String channelNames = channels.stream()
      .map(Channel::getName)
      .collect(Collectors.joining(", "));
    logger.debug("Retrieving channel segments in transaction {} for channels {}",
      transactionId, channelNames);
    Instant wfdiscStart = Instant.now();
    List<WfdiscDao> wfDiscDaos = wfdiscDatabaseConnector.findWfdiscsByNameAndTimeRange(
      siteChanList, startTime, endTime);
    Instant wfdiscEnd = Instant.now();
    logger.debug("Retrieving wfdiscs for transaction {} took {} ms",
      transactionId,
      Duration.between(wfdiscStart, wfdiscEnd).toMillis());

    //stores stationChannel code to channel names to be used in populating ChannelsTimeFacetRequest for a specific wfdisc
    Map<String, String> staChanCodeChannelMap = channels.stream()
      .collect(
        Collectors.toMap(StationDefinitionIdUtility::getStationChannelCodeFromChannel,
          Channel::getName));
    Multimap<Channel, WfdiscDao> channelWfdiscDaoMultimap = LinkedListMultimap.create();

    wfDiscDaos.stream()
      //create a pair of wfdisc to ChannelsTimeFacetRequest
      .map(wfdiscDao -> {
        String staChanCode = StationDefinitionIdUtility.createStationChannelCode(
          wfdiscDao.getStationCode(), wfdiscDao.getChannelCode());
        return Pair.of(wfdiscDao, ChannelsTimeFacetRequest.builder().
          setChannelNames(List.of(staChanCodeChannelMap.get(staChanCode)))
          .setEffectiveTime(wfdiscDao.getTime())
          .setFacetingDefinition(
            FacetingDefinition.builder()
              .setPopulated(true)
              .setClassType(CHANNEL_TYPE.getValue())
              .build())
          .build());
      })
      .map(wfdiscDaoRequestPair -> {
        //populates channelWfdiscDaoMultimap to be passed to converter...return value 'x' is not used
        Instant channelStart = Instant.now();
        List<Channel> channelList = stationDefinitionManager
          .findChannels(wfdiscDaoRequestPair.getRight());
        Instant channelEnd = Instant.now();
        String wfdiscChannelNames = wfdiscDaoRequestPair.getValue().getChannelNames().stream()
          .collect(Collectors.joining(", "));
        logger.debug("Transaction {}: retrieving channel for {} took {} ms",
          transactionId,
          wfdiscChannelNames,
          Duration.between(channelStart, channelEnd).toMillis());

        if (channelList.isEmpty()) {
          logger.info("No matching channels found for " + wfdiscDaoRequestPair.getRight());
          return wfdiscDaoRequestPair;
        }
        Channel received = channelList.get(0);
        channelWfdiscDaoMultimap.put(Channel.createVersionReference(
          received.getName(), received.getEffectiveAt().get()),
          wfdiscDaoRequestPair.getLeft());
        return wfdiscDaoRequestPair;
      }).collect(Collectors.toList());

    Instant convertStart = Instant.now();
    List<ChannelSegment<Waveform>> channelSegments = channelWfdiscDaoMultimap.keySet().stream()
      .map(channel ->
        converter.convert(channel,
          new ArrayList<>(channelWfdiscDaoMultimap.get(channel)),
          startTime,
          endTime))
      .collect(Collectors.toList());
    Instant convertEnd = Instant.now();

    logger.debug("Transaction {}: channel segment conversion took {} ms",
      transactionId,
      Duration.between(convertStart, convertEnd).toMillis());
    return channelSegments;
  }

  @Override
  public Collection<ChannelSegment<Waveform>> findByChannelNamesAndSegmentDescriptor(
    Collection<ChannelSegmentDescriptor> channelSegmentDescriptors) {

    channelSegmentDescriptors.forEach(csd -> {
      Validate.isTrue(csd.getStartTime().isBefore(csd.getEndTime()),
        "ChannelSegmentDescriptor startTime must be before the ChannelSegmentDescriptor endTime");
      Validate.isTrue(csd.getChannel().getEffectiveAt().isPresent(),
        "Channels must have an effectiveDate (must be version reference)");
      Validate.isTrue(csd.getChannel().getEffectiveAt().get().isBefore(csd.getEndTime()),
        "The Channel effectiveAt Date must be before the ChannelSegmentDescriptor endTime");
    });

    return channelSegmentDescriptors.stream()
      .map(csd -> {
        //make this a faceting request -- ChannelTimeFacetingRequest
        ChannelsTimeFacetRequest request = ChannelsTimeFacetRequest.builder()
          .setChannelNames(List.of(csd.getChannel().getName()))
          .setEffectiveTime(csd.getChannel().getEffectiveAt().orElseThrow())
          .setFacetingDefinition(FacetingDefinition.builder()
            .setPopulated(true)
            .setClassType(CHANNEL_TYPE.getValue())
            .build())
          .build();
        List<Channel> channels = stationDefinitionManager.findChannels(request);
        if (channels.isEmpty()) {
          logger.info("Could not build channel segment for {} at {}: no Channel found",
            csd.getChannel().getName(),
            csd.getChannel().getEffectiveAt().orElseThrow());
          return null;
        }

        if (channels.size() > 1) {
          logger.info("Duplicate channels found for channel {} at {}", csd.getChannel().getName(),
            csd.getChannel().getEffectiveAt().orElseThrow());
          return null;
        }
        return Pair.of(csd, channels.get(0));
      })
      .filter(Objects::nonNull)
      .map(pair -> {
        Instant dataStartTime = Collections.max(List.of(
          pair.getValue().getEffectiveAt().orElseThrow(),
          pair.getKey().getStartTime()));

        Instant dataEndTime = Collections.min(List.of(
          pair.getValue().getEffectiveUntil().orElse(pair.getKey().getEndTime()),
          pair.getKey().getEndTime()));

        List<WfdiscDao> wfdiscs = wfdiscDatabaseConnector.findWfdiscsByNameTimeRangeAndCreationTime(
          List.of(StationDefinitionIdUtility.getCssKey(pair.getValue())),
          dataStartTime,
          dataEndTime,
          pair.getKey().getCreationTime())
          .stream()
          .collect(Collectors.toList());

        if (wfdiscs.isEmpty()) {
          return Optional.<ChannelSegment<Waveform>>empty();
        }
        var versionRef = Channel.createVersionReference(pair.getValue().getName(), pair.getValue().getEffectiveAt().get());
        return Optional.ofNullable(converter.convert(versionRef, wfdiscs, dataStartTime, pair.getKey().getEndTime()));
      })
      .filter(Optional::isPresent)
      .map(Optional::get)
      .collect(Collectors.toList());
  }
}
