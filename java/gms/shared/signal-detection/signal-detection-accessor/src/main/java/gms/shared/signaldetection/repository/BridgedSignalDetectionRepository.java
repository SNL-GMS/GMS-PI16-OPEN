package gms.shared.signaldetection.repository;

import com.google.common.base.Functions;
import gms.shared.signaldetection.api.SignalDetectionRepositoryInterface;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisConverterId;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signaldetection.coi.detection.SignalDetectionId;
import gms.shared.signaldetection.converter.detection.SignalDetectionConverterInterface;
import gms.shared.signaldetection.converter.detection.SignalDetectionHypothesisConverterInterface;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnector;
import gms.shared.signaldetection.database.connector.util.SignalDetectionHypothesisArrivalIdComponents;
import gms.shared.signaldetection.database.connector.util.SignalDetectionIdUtility;
import gms.shared.signaldetection.manager.config.SignalDetectionBridgeDefinition;
import gms.shared.stationdefinition.api.channel.ChannelRepositoryInterface;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.dao.css.StationChannelTimeKey;
import gms.shared.stationdefinition.dao.css.WfTagDao;
import gms.shared.stationdefinition.dao.css.WfTagKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import gms.shared.stationdefinition.repository.util.StationDefinitionIdUtility;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.ChannelSegmentDescriptor;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.google.common.base.Preconditions.checkState;

/**
 * Bridged signal detection repository for querying legacy objects from previous and current stages
 * in order to build signal detection objects
 */
public class BridgedSignalDetectionRepository implements SignalDetectionRepositoryInterface {
  private static final Logger logger = LoggerFactory.getLogger(BridgedSignalDetectionRepository.class);

  static final String NULL_EMPTY_MESSAGE = "cannot be null or empty when creating repository";
  static final String EMPTY_PREVIOUS_STAGE_CONNECTORS = "Previous stage database connectors " + NULL_EMPTY_MESSAGE;
  static final String EMPTY_BRIDGE_DEFINITION = "Signal detection bridge definition " + NULL_EMPTY_MESSAGE;
  static final String EMPTY_CHANNEL_REPOSITORY = "Bridged channel repository " + NULL_EMPTY_MESSAGE;
  static final String EMPTY_SIGNAL_DETECTION_ID_UTILITY = "Signal detection id utility " + NULL_EMPTY_MESSAGE;
  static final String EMPTY_STATION_DEFINITION_ID_UTILITY = "Station definition id utility " + NULL_EMPTY_MESSAGE;
  static final String EMPTY_SIGNAL_DETECTION_HYPOTHESIS_CONVERTER = "Signal detection hypothesis converter " + NULL_EMPTY_MESSAGE;
  static final String EMPTY_SIGNAL_DETECTION_CONVERTER = "Signal detection converter " + NULL_EMPTY_MESSAGE;
  static final String EMPTY_CURRENT_STAGE_CONNECTOR = "Current stage connector map does not contain key: %s";

  private final SignalDetectionBridgeDefinition signalDetectionBridgeDefinition;
  private final ChannelRepositoryInterface bridgedChannelRepository;
  private final SignalDetectionConverterInterface signalDetectionConverter;
  private final SignalDetectionHypothesisConverterInterface signalDetectionHypothesisConverter;
  private final SignalDetectionIdUtility signalDetectionIdUtility;

  private final Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> currentStageDatabaseConnectors;
  private final Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> previousStageDatabaseConnectors;

  private BridgedSignalDetectionRepository(SignalDetectionBridgeDefinition signalDetectionBridgeDefinition,
    ChannelRepositoryInterface bridgedChannelRepository,
    Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> currentStageDatabaseConnectors,
    Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> previousStageDatabaseConnectors,
    SignalDetectionIdUtility signalDetectionIdUtility,
    SignalDetectionHypothesisConverterInterface signalDetectionHypothesisConverter,
    SignalDetectionConverterInterface signalDetectionConverter) {
    this.signalDetectionBridgeDefinition = signalDetectionBridgeDefinition;
    this.bridgedChannelRepository = bridgedChannelRepository;
    this.currentStageDatabaseConnectors = currentStageDatabaseConnectors;
    this.previousStageDatabaseConnectors = previousStageDatabaseConnectors;

    this.signalDetectionIdUtility = signalDetectionIdUtility;

    // create signal detection converter using feature measurement and hypothesis converters
    this.signalDetectionHypothesisConverter = signalDetectionHypothesisConverter;
    this.signalDetectionConverter = signalDetectionConverter;
  }

  public static BridgedSignalDetectionRepository create(SignalDetectionBridgeDefinition signalDetectionBridgeDefinition,
    ChannelRepositoryInterface bridgedChannelRepository,
    Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> currentStageDatabaseConnectors,
    Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> previousStageDatabaseConnectors,
    SignalDetectionIdUtility signalDetectionIdUtility,
    SignalDetectionHypothesisConverterInterface signalDetectionHypothesisConverter,
    SignalDetectionConverterInterface signalDetectionConverter) {

    Objects.requireNonNull(signalDetectionBridgeDefinition, EMPTY_BRIDGE_DEFINITION);
    Objects.requireNonNull(bridgedChannelRepository, EMPTY_CHANNEL_REPOSITORY);
    Objects.requireNonNull(currentStageDatabaseConnectors, EMPTY_CURRENT_STAGE_CONNECTOR);
    Objects.requireNonNull(previousStageDatabaseConnectors, EMPTY_PREVIOUS_STAGE_CONNECTORS);
    Objects.requireNonNull(signalDetectionIdUtility, EMPTY_SIGNAL_DETECTION_ID_UTILITY);
    Objects.requireNonNull(signalDetectionHypothesisConverter, EMPTY_SIGNAL_DETECTION_HYPOTHESIS_CONVERTER);
    Objects.requireNonNull(signalDetectionConverter, EMPTY_SIGNAL_DETECTION_CONVERTER);

    return new Builder()
      .setSignalDetectionBridgeDefinition(signalDetectionBridgeDefinition)
      .setBridgedChannelRepository(bridgedChannelRepository)
      .setCurrentStageDatabaseConnectors(currentStageDatabaseConnectors)
      .setPreviousStageDatabaseConnectors(previousStageDatabaseConnectors)
      .setSignalDetectionIdUtility(signalDetectionIdUtility)
      .setSignalDetectionHypothesisConverter(signalDetectionHypothesisConverter)
      .setSignalDetectionConverter(signalDetectionConverter)
      .createBridgedSignalDetectionRepository();
  }

  @Override
  public List<SignalDetection> findByIds(List<SignalDetectionId> ids, WorkflowDefinitionId stageId) {
    List<WorkflowDefinitionId> orderedStages = signalDetectionBridgeDefinition.getOrderedStages();
    int stageIndex = orderedStages.indexOf(stageId);
    WorkflowDefinitionId previousStage = stageIndex == 0 ? null :
      orderedStages.get(stageIndex - 1);

    SignalDetectionDatabaseConnector currentStageDatabaseConnector = currentStageDatabaseConnectors.get(stageId);
    SignalDetectionDatabaseConnector previousStageDatabaseConnector = previousStage == null ?
      null :
      currentStageDatabaseConnectors.get(previousStage);
    // create arids using from id utility and signal detection objects
    Collection<Long> arids = ids.stream()
      .map(sd -> signalDetectionIdUtility.getAridForSignalDetectionUUID(sd.getId()))
      .collect(Collectors.toList());

    Map<Long, ArrivalDao> currentStageArrivals = currentStageDatabaseConnector.findArrivals(arids).stream()
      .collect(Collectors.toMap(ArrivalDao::getId, Functions.identity()));
    Map<Long, ArrivalDao> previousStageArrivals = previousStageDatabaseConnector != null ? previousStageDatabaseConnector.findArrivals(arids).stream()
      .collect(Collectors.toMap(ArrivalDao::getId, Functions.identity())) : Map.of();

    String monitoringOrg = signalDetectionBridgeDefinition.getMonitoringOrganization();
    return currentStageArrivals.entrySet().stream()
      .map(entry -> {
        Map<WorkflowDefinitionId, ArrivalDao> arrivalsByStage = new HashMap<>();
        arrivalsByStage.put(stageId, entry.getValue());

        if (previousStageArrivals.containsKey(entry.getKey())) {
          arrivalsByStage.put(previousStage, previousStageArrivals.get(entry.getKey()));
        }

        return arrivalsByStage;
      })
      .filter(arrivalsByStage -> arrivalsByStage.values().stream()
        .map(ArrivalDao::getArrivalKey)
        .map(StationChannelTimeKey::getStationCode)
        .count() == 1)
      .map(arrivalsByStage -> {
        ArrivalDao currentStageArrival = arrivalsByStage.get(stageId);
        var station = StationDefinitionIdUtility.getStationEntityForSta(currentStageArrival.getArrivalKey().getStationCode());
        return signalDetectionConverter.convert(arrivalsByStage, station, monitoringOrg);
      })
      .filter(Optional::isPresent)
      .map(Optional::get)
      .collect(Collectors.toList());
  }

  @Override
  public List<SignalDetectionHypothesis> findHypothesesByIds(List<SignalDetectionHypothesisId> ids) {

    // get the stage ids and arids from from the hypothesis ids
    return ids.stream()
      .map(hypothesisId -> signalDetectionIdUtility.getArrivalIdComponentsFromSignalDetectionHypothesisId(hypothesisId.getId()))
      .collect(Collectors.groupingBy(SignalDetectionHypothesisArrivalIdComponents::getStageId,
        Collectors.mapping(SignalDetectionHypothesisArrivalIdComponents::getArid, Collectors.toList())))
      .entrySet()
      .stream()
      .map(entry -> buildHypothesesFromStageIdAndArids(entry.getKey(), entry.getValue()))
      .flatMap(List::stream)
      .collect(Collectors.toList());
  }

  @Override
  public List<SignalDetection> findByStationsAndTime(List<Station> stations,
    Instant startTime, Instant endTime, WorkflowDefinitionId stageId, List<SignalDetection> excludedSignalDetections) {

    int stageIndex = signalDetectionBridgeDefinition.getOrderedStages().indexOf(stageId);
    WorkflowDefinitionId previousStage = stageIndex == 0 ? null :
      signalDetectionBridgeDefinition.getOrderedStages().get(stageIndex - 1);
    List<SignalDetectionDatabaseConnector> databaseConnectors = initializeDatabaseConnectors(stageId);
    SignalDetectionDatabaseConnector currentStageDatabaseConnector = databaseConnectors.get(0);
    SignalDetectionDatabaseConnector previousStageDatabaseConnector = databaseConnectors.size() > 1 ?
      databaseConnectors.get(1) : null;

    // get lead/lag duration from the bridge definition
    var leadDuration = signalDetectionBridgeDefinition.getMeasuredWaveformLeadDuration();
    var lagDuration = signalDetectionBridgeDefinition.getMeasuredWaveformLagDuration();

    // create excluded arids using from id utility and signal detection objects
    Collection<Long> excludedArids = excludedSignalDetections.stream()
      .map(sd -> signalDetectionIdUtility.getAridForSignalDetectionUUID(sd.getId().getId()))
      .collect(Collectors.toList());

    return stations.stream()
      .map(station -> {
        try {
          Map<Long, ArrivalDao> currentStageArrivals =
            currentStageDatabaseConnector.findArrivals(List.of(station.getName()),
              excludedArids,
              startTime,
              endTime,
              leadDuration,
              lagDuration).stream()
              .collect(Collectors.toMap(ArrivalDao::getId, Functions.identity()));
          Map<Long, ArrivalDao> previousStageArrivals = previousStageDatabaseConnector != null ?
            previousStageDatabaseConnector.findArrivals(List.of(station.getName()),
              excludedArids,
              startTime,
              endTime,
              leadDuration,
              lagDuration).stream()
              .collect(Collectors.toMap(ArrivalDao::getId, Functions.identity())) : Map.of();

          return currentStageArrivals.entrySet().stream()
            .map(entry -> {
              Map<WorkflowDefinitionId, ArrivalDao> arrivalsByStage = new HashMap<>();
              arrivalsByStage.put(stageId, entry.getValue());

              if (previousStage != null && previousStageArrivals.containsKey(entry.getKey())) {
                arrivalsByStage.put(previousStage, previousStageArrivals.get(entry.getKey()));
              }

              return arrivalsByStage;
            })
            .map(arrivalsByStage -> signalDetectionConverter.convert(arrivalsByStage,
              station,
              signalDetectionBridgeDefinition.getMonitoringOrganization()))
            .filter(Optional::isPresent)
            .map(Optional::get)
            .collect(Collectors.toList());
        } catch (Exception ex) {
          logger.error("Error retrieving signal detections", ex);
          return List.<SignalDetection>of();
        }
      })
      .flatMap(List::stream)
      .collect(Collectors.toList());
  }

  /**
   * Build hypotheses from stage id and arid from hypothesis id components
   *
   * @param stageId {@link WorkflowDefinitionId} for stage
   * @param arids long id representing arrival
   * @return list of {@link SignalDetectionHypothesis}
   */
  private List<SignalDetectionHypothesis> buildHypothesesFromStageIdAndArids(WorkflowDefinitionId stageId,
    List<Long> arids) {

    List<WorkflowDefinitionId> orderedStages = signalDetectionBridgeDefinition.getOrderedStages();
    int stageIndex = orderedStages.indexOf(stageId);
    WorkflowDefinitionId previousStage = stageIndex == 0 ? null : orderedStages.get(stageIndex - 1);
    List<SignalDetectionDatabaseConnector> databaseConnectors = initializeDatabaseConnectors(stageId);
    SignalDetectionDatabaseConnector currentStageDatabaseConnector = databaseConnectors.get(0);
    SignalDetectionDatabaseConnector previousStageDatabaseConnector = databaseConnectors.size() > 1 ?
      databaseConnectors.get(1) : null;

    List<ArrivalDao> currentArrivals = currentStageDatabaseConnector.findArrivals(arids);
    Map<Long, ArrivalDao> previousStageArrivals = previousStageDatabaseConnector == null ? Map.of() :
      previousStageDatabaseConnector.findArrivals(arids).stream()
        .collect(Collectors.toMap(ArrivalDao::getId, Functions.identity()));

    Map<Long, Long> wfidsByArid = currentStageDatabaseConnector.findWftags(arids).stream()
      .map(WfTagDao::getWfTagKey)
      .collect(Collectors.toMap(WfTagKey::getId, WfTagKey::getWfId));

    Map<Long, WfdiscDao> wfdiscsByWfid = currentStageDatabaseConnector.findWfdiscs(wfidsByArid.values()).stream()
      .collect(Collectors.toMap(WfdiscDao::getId, Functions.identity()));

    return currentArrivals.stream()
      .map(arrival -> {
        Optional<UUID> parentId;
        if (previousStageArrivals.containsKey(arrival.getId())) {
          parentId = Optional.of(signalDetectionIdUtility
            .getOrCreateSignalDetectionHypothesisIdFromAridAndStageId(arrival.getId(), previousStage));
        } else {
          parentId = Optional.empty();
        }

        if (wfidsByArid.containsKey(arrival.getId()) && wfdiscsByWfid.containsKey(wfidsByArid.get(arrival.getId()))) {
          var wfdisc = wfdiscsByWfid.get(wfidsByArid.get(arrival.getId()));
          var channel = bridgedChannelRepository.loadChannelFromWfdisc(wfdisc.getId(),
            TagName.ARID,
            arrival.getId(),
            wfdisc.getTime(),
            wfdisc.getEndTime());

          var descriptor = ChannelSegmentDescriptor.from(channel.toBuilder()
              .setData(Optional.empty())
              .build(),
            wfdisc.getTime().minus(signalDetectionBridgeDefinition.getMeasuredWaveformLeadDuration()),
            wfdisc.getEndTime().plus(signalDetectionBridgeDefinition.getMeasuredWaveformLagDuration()),
            wfdisc.getLoadDate());

          String stageName = stageId.getName();
          var converterId = SignalDetectionHypothesisConverterId.from(stageName,
            signalDetectionIdUtility.getOrCreateSignalDetectionIdfromArid(arrival.getId()),
            parentId);
          return signalDetectionHypothesisConverter.convert(converterId,
            arrival,
            signalDetectionBridgeDefinition.getMonitoringOrganization(),
            StationDefinitionIdUtility.getStationEntityForSta(arrival.getArrivalKey().getStationCode()),
            channel,
            ChannelSegment.builder().setId(descriptor).build());
        } else {
          return Optional.<SignalDetectionHypothesis>empty();
        }
      })
      .filter(Optional::isPresent)
      .map(Optional::get)
      .collect(Collectors.toList());
  }

  /**
   * Initialize database connectors (previous and current) for the given stageId
   *
   * @param stageId {@link WorkflowDefinitionId}
   * @return list of {@link SignalDetectionDatabaseConnector}s
   */
  private List<SignalDetectionDatabaseConnector> initializeDatabaseConnectors(WorkflowDefinitionId stageId) {
    checkState(currentStageDatabaseConnectors.containsKey(stageId), EMPTY_CURRENT_STAGE_CONNECTOR, stageId);

    // get the current and previous connectors if they exist
    boolean previousStageConnectorExists = previousStageDatabaseConnectors.containsKey(stageId);
    SignalDetectionDatabaseConnector currentStageDatabaseConnector = currentStageDatabaseConnectors.get(stageId);
    SignalDetectionDatabaseConnector previousStageDatabaseConnector = previousStageConnectorExists
      ? previousStageDatabaseConnectors.get(stageId) : null;

    return previousStageConnectorExists ? List.of(currentStageDatabaseConnector, previousStageDatabaseConnector) :
      List.of(currentStageDatabaseConnector);
  }

  /**
   * Create list of channel segment descriptors using channels and delta durations
   *
   * @param channels list of input {@link Channel}
   * @param leadDelta start delta
   * @param lagDelta end delta
   * @return list of {@link ChannelSegmentDescriptor}s
   */
  List<ChannelSegmentDescriptor> createChannelSegmentDescriptors(List<Channel> channels,
    Duration leadDelta, Duration lagDelta) {

    return channels.stream()
      .map(chan -> {
        Instant startTime = chan.getEffectiveAt().orElseThrow();
        Instant endTime = chan.getEffectiveUntil().orElseThrow();

        // set the delta bounds for start and end times
        Instant startTimeLower = startTime.minus(leadDelta);
        Instant endTimeUpper = endTime.plus(lagDelta);

        return ChannelSegmentDescriptor.from(
          chan,
          startTimeLower,
          endTimeUpper,
          startTime
        );
      })
      .collect(Collectors.toList());
  }

  public static class Builder {
    private SignalDetectionBridgeDefinition signalDetectionBridgeDefinition;
    private ChannelRepositoryInterface bridgedChannelRepository;
    private Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> currentStageDatabaseConnectors;
    private Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> previousStageDatabaseConnectors;
    private SignalDetectionIdUtility signalDetectionIdUtility;
    private SignalDetectionHypothesisConverterInterface signalDetectionHypothesisConverter;
    private SignalDetectionConverterInterface signalDetectionConverter;

    public Builder setSignalDetectionBridgeDefinition(SignalDetectionBridgeDefinition signalDetectionBridgeDefinition) {
      this.signalDetectionBridgeDefinition = signalDetectionBridgeDefinition;
      return this;
    }

    public Builder setBridgedChannelRepository(ChannelRepositoryInterface bridgedChannelRepository) {
      this.bridgedChannelRepository = bridgedChannelRepository;
      return this;
    }

    public Builder setCurrentStageDatabaseConnectors(Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> currentStageDatabaseConnectors) {
      this.currentStageDatabaseConnectors = currentStageDatabaseConnectors;
      return this;
    }

    public Builder setPreviousStageDatabaseConnectors(Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> previousStageDatabaseConnectors) {
      this.previousStageDatabaseConnectors = previousStageDatabaseConnectors;
      return this;
    }

    public Builder setSignalDetectionIdUtility(SignalDetectionIdUtility signalDetectionIdUtility) {
      this.signalDetectionIdUtility = signalDetectionIdUtility;
      return this;
    }

    public Builder setSignalDetectionHypothesisConverter(SignalDetectionHypothesisConverterInterface signalDetectionHypothesisConverter) {
      this.signalDetectionHypothesisConverter = signalDetectionHypothesisConverter;
      return this;
    }

    public Builder setSignalDetectionConverter(SignalDetectionConverterInterface signalDetectionConverter) {
      this.signalDetectionConverter = signalDetectionConverter;
      return this;
    }

    public BridgedSignalDetectionRepository createBridgedSignalDetectionRepository() {
      return new BridgedSignalDetectionRepository(signalDetectionBridgeDefinition, bridgedChannelRepository, currentStageDatabaseConnectors, previousStageDatabaseConnectors, signalDetectionIdUtility, signalDetectionHypothesisConverter, signalDetectionConverter);
    }
  }
}
