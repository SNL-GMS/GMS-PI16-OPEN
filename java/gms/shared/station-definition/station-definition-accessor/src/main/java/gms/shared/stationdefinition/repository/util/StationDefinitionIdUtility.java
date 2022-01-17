package gms.shared.stationdefinition.repository.util;

import com.google.common.base.Preconditions;
import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.dao.css.NetworkDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteKey;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import org.apache.commons.lang3.Validate;
import org.apache.ignite.IgniteCache;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;

import static gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory.CHANNEL_RECORD_ID_WFID_CACHE;
import static gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory.RECORD_ID_WFID_CHANNEL_CACHE;
import static gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory.WFID_RESPONSE_CACHE;

public class StationDefinitionIdUtility {

  private static final String COI_ID_STRING_DELIMITER = ".";
  private static final String NULL_OBJECT_ERROR = "Cannot create CSS Key from a null object";

  private Map<UUID, String> channelNamesByResponseId = new HashMap<>();

  private final IgniteCache<DerivedChannelIdComponents, Channel> wfidRecordIdChannelMap;
  private final IgniteCache<Channel, DerivedChannelIdComponents> channelWfidRecordIdMap;
  private final IgniteCache<Long, Response> wfidResponseMap;

  private StationDefinitionIdUtility(IgniteCache<DerivedChannelIdComponents, Channel> wfidAridChannelMap,
    IgniteCache<Channel, DerivedChannelIdComponents> channelWfidAridMap,
    IgniteCache<Long, Response> wfidResponseMap) {

    this.wfidRecordIdChannelMap = wfidAridChannelMap;
    this.channelWfidRecordIdMap = channelWfidAridMap;
    this.wfidResponseMap = wfidResponseMap;
  }

  //for testing only
  public static StationDefinitionIdUtility create(
    IgniteCache<DerivedChannelIdComponents, Channel> wfidRecordIdChannelMap,
    IgniteCache<Channel, DerivedChannelIdComponents> channelWfidRecordIdMap,
    IgniteCache<Long, Response> wfidResponseMap) {

    return new StationDefinitionIdUtility(wfidRecordIdChannelMap, channelWfidRecordIdMap, wfidResponseMap);
  }

  public static StationDefinitionIdUtility create() {

    IgniteCache<DerivedChannelIdComponents, Channel> wfidRecordIdChannelMap =
      IgniteConnectionManager.getOrCreateCache(RECORD_ID_WFID_CHANNEL_CACHE);

    IgniteCache<Channel, DerivedChannelIdComponents> channelWfidRecordIdMap =
      IgniteConnectionManager.getOrCreateCache(CHANNEL_RECORD_ID_WFID_CACHE);

    IgniteCache<Long, Response> wfidResponseMap =
      IgniteConnectionManager.getOrCreateCache(WFID_RESPONSE_CACHE);

    return new StationDefinitionIdUtility(wfidRecordIdChannelMap, channelWfidRecordIdMap, wfidResponseMap);
  }

  /***
   * This utility will use the station group name from the COI {@link StationGroup} name to reference a CSS {@link NetworkDao}
   * @param stationGroup
   * @return the name field of the {@link StationGroup}
   */
  public static String getCssKey(StationGroup stationGroup) {
    Validate.notNull(stationGroup, NULL_OBJECT_ERROR);

    return stationGroup.getName();
  }

  /**
   * Gets the station entity for the provided sta
   *
   * @param sta The Sta for the station
   * @return a {@link Station}k entity reference
   */
  public static Station getStationEntityForSta(String sta) {
    Objects.requireNonNull(sta, "Cannot map station from null sta");
    Preconditions.checkState(!sta.isBlank() && !sta.isEmpty(), "Cannot map station from empty sta");

    return Station.createEntityReference(sta);
  }

  /***
   * This utility will use the station code from the COI {@link Station} name to build a CSS {@link SiteKey}
   * @param station
   * @return a {@link SiteKey} built from the COI {@link Station} instance
   */
  public static SiteKey getCssKey(Station station) {
    Validate.notNull(station, NULL_OBJECT_ERROR);

    return new SiteKey(station.getName(), station.getEffectiveAt()
      .orElseThrow(() -> new IllegalStateException("Cannot create SiteKey from entity reference")));
  }

  /***
   * COI {@link ChannelGroup} names are in the form of "{STATION}.{CHANNEL_GROUP}".
   * This utility will parse out the station code from the COI {@link ChannelGroup} name to build a CSS {@link SiteKey}
   * @param channelGroup
   * @return a {@link SiteKey} CSS entity key filled out from the COI instance
   */
  public static SiteKey getCssKey(ChannelGroup channelGroup) {
    Validate.notNull(channelGroup, NULL_OBJECT_ERROR);

    final String[] channelGroupParts = splitCoiIdString(channelGroup.getName(), 2);
    final String stationCode = channelGroupParts[0];
    return new SiteKey(stationCode, channelGroup.getEffectiveAt()
      .orElseThrow(() -> new IllegalStateException("Cannot create SiteKey from entity reference")));
  }

  /***
   * COI Channel names are in the form of "{STATION}.{CHANNEL_GROUP}.{CHANNEL}".
   * This utility will parse out the station and channel codes from the COI {@link Channel} name to build a CSS {@link SiteChanKey}
   * @param channel
   * @return a {@link SiteChanKey} CSS entity key filled out from the COI instance
   */
  //Todo this might need to be changed
  public static SiteChanKey getCssKey(Channel channel) {
    Validate.notNull(channel, NULL_OBJECT_ERROR);

    final String name = channel.getName();
    final String stationCode = parseStationCode.apply(name);
    final String channelCode = parseChannelCode.apply(name);
    return new SiteChanKey(stationCode, channelCode, channel.getEffectiveAt()
      .orElseThrow(() -> new IllegalStateException("Cannot create SiteChanKey from entity reference")));
  }

  public static SiteChanKey getCssKeyFromName(String channelName) {

    final String stationCode = parseStationCode.apply(channelName);
    final String channelCode = parseChannelCode.apply(channelName);
    return new SiteChanKey(stationCode, channelCode, Instant.now());
  }

  public static String[] splitCoiIdString(String coiIdString, int expectedParts) {
    Validate.isTrue(coiIdString.contains(COI_ID_STRING_DELIMITER),
      String.format("COI ID string, '%s', does not contain expected delimiter '%s'", coiIdString,
        COI_ID_STRING_DELIMITER));
    final String[] idStringParts = coiIdString.split("\\" + COI_ID_STRING_DELIMITER);
    Validate.isTrue(idStringParts.length >= expectedParts,
      String.format("COI ID string, '%s', should contain %s instances of delimiter '%s'",
        coiIdString, expectedParts - 1, COI_ID_STRING_DELIMITER));
    return idStringParts;
  }

  /**
   * splits channel name into component parts.  Does not use getCssKey since this could be an entity reference
   *
   * @param channel channel to get component parts from
   * @return stationCode.channelCode string
   */
  public static String getStationChannelCodeFromChannel(Channel channel) {
    String stationCode = parseStationCode.apply(channel.getName());
    String channelCode = parseChannelCode.apply(channel.getName());
    return createStationChannelCode(stationCode, channelCode);
  }

  /**
   * splits channel name into component parts and gets the reference station name
   * Does not use getCssKey since this could be an entity reference
   *
   * @param channel channel to get component parts from
   * @return referenceStation string
   */
  public static String getReferenceStationNameFromChannel(Channel channel) {
    final String[] channelParts = splitCoiIdString(channel.getName(), 3);

    // referenceStationName
    return channelParts[0];
  }

  //create a string to use as a key to find SiteChans
  public static String createStationChannelCode(String stationCode, String channelCode) {
    return stationCode + COI_ID_STRING_DELIMITER + channelCode;
  }

  public void storeResponseIdChannelNameMapping(UUID responseId, String channelName) {
    channelNamesByResponseId.put(responseId, channelName);
  }

  /**
   * Gets the station and channel codes corresponding to the provided response ID
   *
   * @param responseId the response ID to convert to CSS
   * @return a {@link SiteChanKey} corresponding to the ResponseId
   */
  public Optional<String> getChannelForResponseId(UUID responseId) {
    return Optional.ofNullable(channelNamesByResponseId.get(responseId));
  }

  /**
   * Find channel version for given Arrival Id and Wfdisc Id, returns null if no value is found
   *
   * @param tagName TagName type of record: arid, orid, erid, etc.
   * @param recordId Long Record Id
   * @param wfid Long Wfdisc Id
   * @return Channel
   */
  public Channel getDerivedChannelForWfidRecordId(TagName tagName, long recordId, long wfid) {

    var id = DerivedChannelIdComponents.create(tagName, recordId, wfid);
    return wfidRecordIdChannelMap.get(id);
  }

  /**
   * Find Arrival Id and Wfdisc Id for given channel version, returns null if no value is found
   *
   * @param channel Channel with channel version
   * @return DerivedChannelIdComponents with Arid and Wfid
   */
  public DerivedChannelIdComponents getWfidRecordIdFromChannel(Channel channel) {
    return channelWfidRecordIdMap.get(channel);
  }

  /**
   * Store mapping between a wfid and arid to a channel version
   *
   * @param channel Channel with channel version
   * @param tagName TagName type of record: arid, orid, erid, etc.
   * @param recordId Long Record Id
   * @param wfid Long Wfdisc Id
   */
  public void storeWfidRecordIdChannelMapping(TagName tagName, long recordId, long wfid, Channel channel) {
    var id = DerivedChannelIdComponents.create(tagName, recordId, wfid);

    var channelVersionRef = Channel.createVersionReference(channel.getName(), channel.getEffectiveAt().orElseThrow());
    wfidRecordIdChannelMap.put(id, channelVersionRef);
    channelWfidRecordIdMap.put(channelVersionRef, id);
  }

  /**
   * Retrieve an {@link Optional}&lt;{@link Response}&gt; if it can be found given a wfdisc ID
   * otherwise return an empty {@link Optional}
   *
   * @param wfid provided {@link gms.shared.stationdefinition.dao.css.WfdiscDao} ID
   * @return {@link Optional}&lt;{@link Response}&gt;
   */
  public Optional<Response> getResponseForWfid(long wfid) {
    return Optional.ofNullable(wfidResponseMap.get(wfid));
  }

  /**
   * Store a {@link gms.shared.stationdefinition.dao.css.WfdiscDao} ID and {@link Response} mapping
   *
   * @param wfid provided {@link gms.shared.stationdefinition.dao.css.WfdiscDao} ID
   * @param response provided {@link Response}
   */
  public void storeWfidResponseMapping(long wfid, Response response) {
    wfidResponseMap.put(wfid, response);
  }

  private static final Function<String, String> parseStationCode = channelName -> {
    String channelDef = channelName.split("/")[0];
    return channelDef.contains("beam")?
      channelName.split("\\.")[0]:
      channelName.split("\\.")[1];
  };

  private static final Function<String, String> parseChannelCode = channelName ->
    channelName.split("/")[0].split("\\.")[2];

}
