package gms.shared.signaldetection.database.connector.util;

import com.google.common.base.Preconditions;
import gms.shared.frameworks.cache.utils.CacheInfo;
import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.cache.CacheMode;

import java.util.Optional;
import java.util.UUID;

public class SignalDetectionIdUtility {


  public static final CacheInfo ARID_SIGNAL_DETECTION_ID_CACHE = new CacheInfo("arid-signal-detection-id-cache",
    CacheMode.LOCAL, CacheAtomicityMode.ATOMIC, true, Optional.empty());
  public static final CacheInfo SIGNAL_DETECTION_ID_ARID_CACHE = new CacheInfo("signal-detection-id-arid-cache",
    CacheMode.LOCAL, CacheAtomicityMode.ATOMIC, true, Optional.empty());

  public static final CacheInfo ARRIVAL_ID_SIGNAL_DETECTION_HYPOTHESIS_ID =
    new CacheInfo("arrival-id-signal-detection-hypothesis-id", CacheMode.LOCAL,
      CacheAtomicityMode.ATOMIC, true, Optional.empty());
  public static final CacheInfo SIGNAL_DETECTION_HYPOTHESIS_ID_ARRIVAL_ID =
    new CacheInfo("signal-detection-hypothesis-id-arrival-id-cache", CacheMode.LOCAL,
      CacheAtomicityMode.ATOMIC, true, Optional.empty());

  private final IgniteCache<Long, UUID> aridSignalDetectionMap;
  private final IgniteCache<UUID, Long> signalDetectionAridMap;
  private final IgniteCache<SignalDetectionHypothesisArrivalIdComponents, UUID> arrivalIdComponentsSignalDetectionHypothesisIdMap;
  private final IgniteCache<UUID, SignalDetectionHypothesisArrivalIdComponents> signalDetectionHypothesisIdArrivalIdComponentsMap;


  private SignalDetectionIdUtility(IgniteCache<Long, UUID> aridSignalDetectionMap,
    IgniteCache<UUID, Long> signalDetectionAridMap,
    IgniteCache<SignalDetectionHypothesisArrivalIdComponents, UUID> arrivalIdComponentsSignalDetectionHypothesisIdMap,
    IgniteCache<UUID, SignalDetectionHypothesisArrivalIdComponents> signalDetectionHypothesisIdArrivalIdComponentsMap) {

    this.aridSignalDetectionMap = aridSignalDetectionMap;
    this.signalDetectionAridMap = signalDetectionAridMap;
    this.arrivalIdComponentsSignalDetectionHypothesisIdMap = arrivalIdComponentsSignalDetectionHypothesisIdMap;
    this.signalDetectionHypothesisIdArrivalIdComponentsMap = signalDetectionHypothesisIdArrivalIdComponentsMap;
  }

  // for testing only
  public static SignalDetectionIdUtility create(IgniteCache<Long, UUID> aridSignalDetectionMap,
    IgniteCache<UUID, Long> signalDetectionAridMap,
    IgniteCache<SignalDetectionHypothesisArrivalIdComponents, UUID> arrivalIdComponentsSignalDetectionHypothesisIdMap,
    IgniteCache<UUID, SignalDetectionHypothesisArrivalIdComponents> signalDetectionHypothesisIdArrivalIdComponentsMap) {

    return new SignalDetectionIdUtility(aridSignalDetectionMap, signalDetectionAridMap,
      arrivalIdComponentsSignalDetectionHypothesisIdMap, signalDetectionHypothesisIdArrivalIdComponentsMap);
  }

  public static SignalDetectionIdUtility create() {

    IgniteCache<Long, UUID> aridSignalDetectionMap =
      IgniteConnectionManager.getOrCreateCache(ARID_SIGNAL_DETECTION_ID_CACHE);
    IgniteCache<UUID, Long> signalDetectionAridMap =
      IgniteConnectionManager.getOrCreateCache(SIGNAL_DETECTION_ID_ARID_CACHE);
    IgniteCache<SignalDetectionHypothesisArrivalIdComponents, UUID> arrivalIdComponentsSignalDetectionHypothesisIdMap =
      IgniteConnectionManager.getOrCreateCache(ARRIVAL_ID_SIGNAL_DETECTION_HYPOTHESIS_ID);
    IgniteCache<UUID, SignalDetectionHypothesisArrivalIdComponents> signalDetectionHypothesisIdArrivalIdComponentsMap =
      IgniteConnectionManager.getOrCreateCache(SIGNAL_DETECTION_HYPOTHESIS_ID_ARRIVAL_ID);

    return new SignalDetectionIdUtility(aridSignalDetectionMap, signalDetectionAridMap,
      arrivalIdComponentsSignalDetectionHypothesisIdMap, signalDetectionHypothesisIdArrivalIdComponentsMap);
  }

  /**
   * Find the UUID of SignalDetection for a given arid, returns null if no value is found
   *
   * @param arid Long Arrival Id
   * @return UUID
   */
  public UUID getSignalDetectionForArid(long arid) {
    return aridSignalDetectionMap.get(arid);
  }

  /**
   * Find Arrival Id for a given SignalDetection UUID, returns null if no value is found
   *
   * @param uuid SignalDetection UUID
   * @return arid
   */
  public long getAridForSignalDetectionUUID(UUID uuid) {
    return signalDetectionAridMap.get(uuid);
  }

  /**
   * Find SignalDetectionHypothesis UUID for given Arrival Id and Stage Id, returns null if no value is found
   *
   * @param arid Long Arrival Id
   * @param stageId String Stage Id
   * @return SignalDetectionHypothesis UUID
   */
  public UUID getSignalDetectionHypothesisIdForAridAndStageId(long arid, WorkflowDefinitionId stageId) {
    var id = SignalDetectionHypothesisArrivalIdComponents.create(stageId, arid);
    return arrivalIdComponentsSignalDetectionHypothesisIdMap.get(id);
  }

  /**
   * Find Arrival Id and Stage Id for a given SignalDetectionHypothesis UUID, returns null if no value is found
   *
   * @param uuid SignalDetectionHypothesis UUID
   * @return SignalDetectionHypothesisArrivalIdComponents class containing arid and stageid
   */
  public SignalDetectionHypothesisArrivalIdComponents getArrivalIdComponentsFromSignalDetectionHypothesisId(UUID uuid) {
    return signalDetectionHypothesisIdArrivalIdComponentsMap.get(uuid);
  }

  /**
   * Add mapping between Signal detection hypothesis UUID and stageId and arid
   *
   * @param uuid SignalDetectionHypothesis UUID
   * @param arid Long Arrival Id
   */
  public void addAridAndStageIdForSignalDetectionHypothesisUUID(long arid, WorkflowDefinitionId stageId, UUID uuid) {
    Preconditions.checkNotNull(stageId);
    Preconditions.checkNotNull(uuid);
    var id = SignalDetectionHypothesisArrivalIdComponents.create(stageId, arid);
    arrivalIdComponentsSignalDetectionHypothesisIdMap.put(id, uuid);
    signalDetectionHypothesisIdArrivalIdComponentsMap.put(uuid, id);
  }

  /**
   * Add mapping between Signal detection UUID and arid
   *
   * @param uuid SignalDetectionHypothesis UUID
   * @param arid Long Arrival Id
   */
  public void addAridForSignalDetectionUUID(long arid, UUID uuid) {
    aridSignalDetectionMap.put(arid, uuid);
    signalDetectionAridMap.put(uuid, arid);
  }

  /**
   * Find the UUID of SignalDetection for a given arid, creates and returns a new uuid if no value is found in map
   *
   * @param arid Long Arrival Id
   * @return UUID
   */
  public UUID getOrCreateSignalDetectionIdfromArid(long arid) {
    var uuid = getSignalDetectionForArid(arid);

    if (uuid == null) {
      var aridString = Long.toString(arid);
      uuid = UUID.nameUUIDFromBytes(aridString.getBytes());
    }

    aridSignalDetectionMap.put(arid, uuid);
    signalDetectionAridMap.put(uuid, arid);

    return uuid;
  }

  /**
   * Find SignalDetectionHypothesis UUID for given Arrival Id and Stage Id, creates and returns a new uuid if no value is found in map
   *
   * @param arid Long Arrival Id
   * @param stageId String Stage Id
   * @return SignalDetectionHypothesis UUID
   */
  public UUID getOrCreateSignalDetectionHypothesisIdFromAridAndStageId(long arid, WorkflowDefinitionId stageId) {

    var uuid = getSignalDetectionHypothesisIdForAridAndStageId(arid, stageId);

    if (uuid == null) {
      var aridString = Long.toString(arid);
      uuid = UUID.nameUUIDFromBytes((aridString + stageId).getBytes());
    }

    var id = SignalDetectionHypothesisArrivalIdComponents.create(stageId, arid);
    arrivalIdComponentsSignalDetectionHypothesisIdMap.put(id, uuid);
    signalDetectionHypothesisIdArrivalIdComponentsMap.put(uuid, id);

    return uuid;
  }

}