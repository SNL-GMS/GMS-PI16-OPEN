package gms.shared.stationdefinition.factory;

import gms.shared.stationdefinition.accessor.BridgedStationDefinitionAccessor;
import gms.shared.stationdefinition.accessor.EntityCachingStationDefinitionAccessor;
import gms.shared.stationdefinition.accessor.RequestCachingStationDefinitionAccessor;
import gms.shared.stationdefinition.accessor.StationDefinitionManager;
import gms.shared.stationdefinition.api.StationDefinitionAccessorInterface;
import gms.shared.stationdefinition.cache.RequestCache;
import gms.shared.stationdefinition.cache.VersionCache;
import gms.shared.stationdefinition.converter.DaoCalibrationConverter;
import gms.shared.stationdefinition.converter.DaoChannelConverter;
import gms.shared.stationdefinition.converter.DaoChannelGroupConverter;
import gms.shared.stationdefinition.converter.DaoResponseConverter;
import gms.shared.stationdefinition.converter.DaoStationConverter;
import gms.shared.stationdefinition.converter.DaoStationGroupConverter;
import gms.shared.stationdefinition.converter.FileFrequencyAmplitudePhaseConverter;
import gms.shared.stationdefinition.converter.util.assemblers.ChannelAssembler;
import gms.shared.stationdefinition.converter.util.assemblers.ChannelGroupAssembler;
import gms.shared.stationdefinition.converter.util.assemblers.ResponseAssembler;
import gms.shared.stationdefinition.converter.util.assemblers.StationAssembler;
import gms.shared.stationdefinition.converter.util.assemblers.StationGroupAssembler;
import gms.shared.stationdefinition.database.connector.factory.StationDefinitionDatabaseConnectorFactory;
import gms.shared.stationdefinition.repository.BridgedChannelGroupRepository;
import gms.shared.stationdefinition.repository.BridgedChannelRepository;
import gms.shared.stationdefinition.repository.BridgedResponseRepository;
import gms.shared.stationdefinition.repository.BridgedStationGroupRepository;
import gms.shared.stationdefinition.repository.BridgedStationRepository;
import gms.shared.stationdefinition.repository.util.StationDefinitionIdUtility;
import org.apache.commons.lang3.Validate;

import java.time.Instant;

public class StationDefinitionAccessorFactory {
  static final String OPERATIONAL_TIME_PERIOD_CONFIG = "global.operational-time-period";
  static final String OPERATIONAL_PERIOD_START = "operationalPeriodStart";
  static final String OPERATIONAL_PERIOD_END = "operationalPeriodEnd";

  private static volatile StationDefinitionAccessorFactory instance;

  private DaoStationGroupConverter daoStationGroupConverterInstance;
  private DaoStationConverter daoStationConverterInstance;
  private DaoChannelGroupConverter daoChannelGroupConverterInstance;
  private DaoChannelConverter daoChannelConverterInstance;
  private DaoResponseConverter daoResponseConverterInstance;
  private DaoCalibrationConverter daoCalibrationConverterInstance;
  private FileFrequencyAmplitudePhaseConverter fileFrequencyAmplitudePhaseConverterInstance;

  private StationGroupAssembler stationGroupAssemblerInstance;
  private StationAssembler stationAssemblerInstance;
  private ChannelGroupAssembler channelGroupAssemblerInstance;
  private ChannelAssembler channelAssemblerInstance;
  private ResponseAssembler responseAssemblerInstance;

  private BridgedStationGroupRepository bridgedStationGroupRepositoryInstance;
  private BridgedStationRepository bridgedStationRepositoryInstance;
  private BridgedChannelGroupRepository bridgedChannelGroupRepositoryInstance;
  private BridgedChannelRepository bridgedChannelRepositoryInstance;
  private BridgedResponseRepository bridgedResponseRepositoryInstance;

  private RequestCachingStationDefinitionAccessor stationDefinitionAccessorInstance;
  private BridgedStationDefinitionAccessor bridgedStationDefinitionAccessor;
  private EntityCachingStationDefinitionAccessor entityCachingStationDefinitionAccessor;

  private StationDefinitionIdUtility stationDefinitionIdUtilityInstance;

  private VersionCache versionCacheInstance;

  private final StationDefinitionDatabaseConnectorFactory stationDefinitionDatabaseConnectorFactory;

  private StationDefinitionAccessorFactory(
    StationDefinitionDatabaseConnectorFactory stationDefinitionDatabaseConnectorFactory) {
    this.stationDefinitionDatabaseConnectorFactory = stationDefinitionDatabaseConnectorFactory;
  }

  /**
   * Creates an IOC factory to build the station definition managers and their dependencies
   *
   * @param stationDefinitionDatabaseConnectorFactory an IOC factory that builds the station definition jpa repositories
   * used by the dependencies of the station definition managers
   * @return station group cache instance
   */
  public static StationDefinitionAccessorFactory create(
    StationDefinitionDatabaseConnectorFactory stationDefinitionDatabaseConnectorFactory) {
    Validate.notNull(stationDefinitionDatabaseConnectorFactory,
      "A StationDefinitionJpaRepositoryFactory must be provided.");
    if (instance == null) {
      synchronized (StationDefinitionAccessorFactory.class) {
        if (instance == null) {
          instance = new StationDefinitionAccessorFactory(stationDefinitionDatabaseConnectorFactory);
        }
      }
    }

    return instance;
  }

  private DaoStationGroupConverter getDaoStationGroupConverterInstance() {
    if (daoStationGroupConverterInstance == null) {
      daoStationGroupConverterInstance = DaoStationGroupConverter.create();
    }
    return daoStationGroupConverterInstance;
  }

  private DaoStationConverter getDaoStationConverterInstance() {
    if (daoStationConverterInstance == null) {
      daoStationConverterInstance = DaoStationConverter.create();
    }
    return daoStationConverterInstance;
  }

  private DaoChannelGroupConverter getDaoChannelGroupConverterInstance() {

    if (daoChannelGroupConverterInstance == null) {
      daoChannelGroupConverterInstance = DaoChannelGroupConverter
        .create(getDaoChannelConverterInstance());
    }
    return daoChannelGroupConverterInstance;
  }

  private DaoChannelConverter getDaoChannelConverterInstance() {
    if (daoChannelConverterInstance == null) {
      daoChannelConverterInstance = DaoChannelConverter
        .create(getDaoCalibrationConverterInstance(),
          getFileFrequencyAmplitudePhaseConverterInstance());
    }
    return daoChannelConverterInstance;
  }

  private DaoResponseConverter getDaoResponseConverterInstance() {

    if (daoResponseConverterInstance == null) {
      daoResponseConverterInstance = DaoResponseConverter.create();
    }
    return daoResponseConverterInstance;
  }

  private DaoCalibrationConverter getDaoCalibrationConverterInstance() {

    if (daoCalibrationConverterInstance == null) {
      daoCalibrationConverterInstance = DaoCalibrationConverter.create();
    }
    return daoCalibrationConverterInstance;
  }

  private FileFrequencyAmplitudePhaseConverter getFileFrequencyAmplitudePhaseConverterInstance() {

    if (fileFrequencyAmplitudePhaseConverterInstance == null) {
      fileFrequencyAmplitudePhaseConverterInstance = FileFrequencyAmplitudePhaseConverter.create();
    }
    return fileFrequencyAmplitudePhaseConverterInstance;
  }

  private StationGroupAssembler getStationGroupAssemblerInstance() {
    if (stationGroupAssemblerInstance == null) {
      stationGroupAssemblerInstance = StationGroupAssembler.create(
        getDaoStationGroupConverterInstance(), getDaoStationConverterInstance());
    }
    return stationGroupAssemblerInstance;
  }

  private StationAssembler getStationAssemblerInstance() {
    if (stationAssemblerInstance == null) {
      stationAssemblerInstance = StationAssembler.create(
        getDaoStationConverterInstance(),
        getDaoChannelGroupConverterInstance(),
        getDaoChannelConverterInstance());

    }
    return stationAssemblerInstance;
  }

  private ChannelGroupAssembler getChannelGroupAssemblerInstance() {

    if (channelGroupAssemblerInstance == null) {
      channelGroupAssemblerInstance = ChannelGroupAssembler.create(
        getDaoChannelGroupConverterInstance(),
        getDaoChannelConverterInstance());
    }
    return channelGroupAssemblerInstance;
  }

  private ChannelAssembler getChannelAssemblerInstance() {
    if (channelAssemblerInstance == null) {
      channelAssemblerInstance = ChannelAssembler.create(getDaoChannelConverterInstance(), getDaoResponseConverterInstance());
    }
    return channelAssemblerInstance;
  }

  private ResponseAssembler getResponseAssemblerInstance() {
    if (responseAssemblerInstance == null) {
      responseAssemblerInstance = ResponseAssembler.create(getDaoResponseConverterInstance(),
        getDaoCalibrationConverterInstance(),
        getFileFrequencyAmplitudePhaseConverterInstance());
    }

    return responseAssemblerInstance;
  }

  private VersionCache getVersionCacheInstance() {
    if (versionCacheInstance == null) {
      versionCacheInstance = VersionCache.create();
    }

    return versionCacheInstance;
  }

  private BridgedStationGroupRepository getBridgedStationGroupRepositoryInstance() {
    if (bridgedStationGroupRepositoryInstance == null) {
      bridgedStationGroupRepositoryInstance = BridgedStationGroupRepository
        .create(stationDefinitionDatabaseConnectorFactory.getNetworkDatabaseConnectorInstance(),
          stationDefinitionDatabaseConnectorFactory.getAffiliationDatabaseConnectorInstance(),
          stationDefinitionDatabaseConnectorFactory.getSiteDatabaseConnectorInstance(),
          getStationGroupAssemblerInstance());
    }
    return bridgedStationGroupRepositoryInstance;
  }

  private BridgedStationRepository getBridgedStationRepositoryInstance() {
    if (bridgedStationRepositoryInstance == null) {
      bridgedStationRepositoryInstance = BridgedStationRepository
        .create(stationDefinitionDatabaseConnectorFactory.getSiteDatabaseConnectorInstance(),
          stationDefinitionDatabaseConnectorFactory.getSiteChanDatabaseConnectorInstance(),
          getStationAssemblerInstance());
    }
    return bridgedStationRepositoryInstance;
  }

  private BridgedChannelGroupRepository getBridgedChannelGroupRepositoryInstance() {
    if (bridgedChannelGroupRepositoryInstance == null) {
      bridgedChannelGroupRepositoryInstance = BridgedChannelGroupRepository
        .create(stationDefinitionDatabaseConnectorFactory.getSiteDatabaseConnectorInstance(),
          stationDefinitionDatabaseConnectorFactory.getSiteChanDatabaseConnectorInstance(),
          getChannelGroupAssemblerInstance());
    }
    return bridgedChannelGroupRepositoryInstance;
  }

  public BridgedChannelRepository getBridgedChannelRepositoryInstance() {
    if (bridgedChannelRepositoryInstance == null) {
      bridgedChannelRepositoryInstance = BridgedChannelRepository
        .create(stationDefinitionDatabaseConnectorFactory.getBeamDatabaseConnectorInstance(),
          stationDefinitionDatabaseConnectorFactory.getSiteDatabaseConnectorInstance(),
          stationDefinitionDatabaseConnectorFactory.getSiteChanDatabaseConnectorInstance(),
          stationDefinitionDatabaseConnectorFactory.getSensorDatabaseConnectorInstance(),
          stationDefinitionDatabaseConnectorFactory.getWfdiscDatabaseConnectorInstance(),
          getChannelAssemblerInstance(),
          getStationDefinitionIdUtilityInstance(),
          getVersionCacheInstance());
    }
    return bridgedChannelRepositoryInstance;
  }

  private BridgedResponseRepository getBridgedResponseRepositoryInstance() {
    if (bridgedResponseRepositoryInstance == null) {
      bridgedResponseRepositoryInstance = BridgedResponseRepository.create(
        stationDefinitionDatabaseConnectorFactory.getWfdiscDatabaseConnectorInstance(),
        stationDefinitionDatabaseConnectorFactory.getSensorDatabaseConnectorInstance(),
        stationDefinitionDatabaseConnectorFactory.getInstrumentDatabaseConnectorInstance(),
        getStationDefinitionIdUtilityInstance(),
        getResponseAssemblerInstance());
    }

    return bridgedResponseRepositoryInstance;
  }

  public StationDefinitionIdUtility getStationDefinitionIdUtilityInstance() {
    if (stationDefinitionIdUtilityInstance == null) {
      stationDefinitionIdUtilityInstance = StationDefinitionIdUtility.create();
    }

    return stationDefinitionIdUtilityInstance;
  }

  public StationDefinitionAccessorInterface getBridgedStationDefinitionAccessorInstance() {
    if (bridgedStationDefinitionAccessor == null) {
      bridgedStationDefinitionAccessor = BridgedStationDefinitionAccessor
        .create(getBridgedStationGroupRepositoryInstance(),
          getBridgedStationRepositoryInstance(),
          getBridgedChannelGroupRepositoryInstance(),
          getBridgedChannelRepositoryInstance(),
          getBridgedResponseRepositoryInstance());
    }
    return bridgedStationDefinitionAccessor;
  }

  /**
   * Return requestCachingStationDefinitionAccessor instance for {@link StationDefinitionManager} chain of command
   * @return return {@link RequestCachingStationDefinitionAccessor}
   */
  public StationDefinitionAccessorInterface getRequestCacheInstance(Instant startTime, Instant endTime) {
    return getRequestCacheStationDefinitionAccessor(getEntityCacheInstance(startTime, endTime));
  }

  /**
   * Return entityCachingStationDefinitionAccessor instance for {@link StationDefinitionManager} chain of command
   * @return return {@link EntityCachingStationDefinitionAccessor}
   */
  public StationDefinitionAccessorInterface getEntityCacheInstance(Instant startTime, Instant endTime) {
    if (entityCachingStationDefinitionAccessor == null) {
      entityCachingStationDefinitionAccessor = getEntityCacheStationDefinitionAccessor(getBridgedStationDefinitionAccessorInstance(), startTime, endTime);
    }

    return entityCachingStationDefinitionAccessor;
  }

  /**
   * Request cache station definition accessor
   * @param delegate {@link StationDefinitionAccessorInterface} instance
   * @return instance of {@link RequestCachingStationDefinitionAccessor}
   */
  public StationDefinitionAccessorInterface getRequestCacheStationDefinitionAccessor(
    StationDefinitionAccessorInterface delegate) {
    if (stationDefinitionAccessorInstance ==  null) {
      stationDefinitionAccessorInstance = RequestCachingStationDefinitionAccessor.create(delegate,
        RequestCache.create());
    }

    return stationDefinitionAccessorInstance;
  }

  /**
   * Entity cache station definition accessor
   * @param delegate {@link StationDefinitionAccessorInterface} instance
   * @return instance of {@link EntityCachingStationDefinitionAccessor}
   */
  public EntityCachingStationDefinitionAccessor getEntityCacheStationDefinitionAccessor(
    StationDefinitionAccessorInterface delegate,
    Instant startTime,
    Instant endTime) {

    if (entityCachingStationDefinitionAccessor == null) {
      entityCachingStationDefinitionAccessor = EntityCachingStationDefinitionAccessor.create(delegate,
        getVersionCacheInstance(),
        startTime,
        endTime,
        getStationDefinitionIdUtilityInstance());
    }

    return entityCachingStationDefinitionAccessor;
  }
}
