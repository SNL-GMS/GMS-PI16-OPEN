package gms.shared.stationdefinition.accessor;

import static gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider.CONNECTION_POOL_SIZE_CONFIG_KEY;
import static gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider.JDBC_URL_CONFIG_KEY;
import static gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider.ORACLE_WALLET_LOCATION_CONFIG_KEY;
import static gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider.TNS_ENTRY_LOCATION_CONFIG_KEY;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.frameworks.configuration.Selector;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.control.ControlContext;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.api.StationDefinitionAccessorInterface;
import gms.shared.stationdefinition.api.StationDefinitionManagerInterface;
import gms.shared.stationdefinition.api.channel.util.ChannelGroupsTimeFacetRequest;
import gms.shared.stationdefinition.api.channel.util.ChannelGroupsTimeRangeRequest;
import gms.shared.stationdefinition.api.channel.util.ChannelsTimeFacetRequest;
import gms.shared.stationdefinition.api.channel.util.ChannelsTimeRangeRequest;
import gms.shared.stationdefinition.api.channel.util.ResponseTimeFacetRequest;
import gms.shared.stationdefinition.api.channel.util.ResponseTimeRangeRequest;
import gms.shared.stationdefinition.api.station.util.StationChangeTimesRequest;
import gms.shared.stationdefinition.api.station.util.StationGroupsTimeFacetRequest;
import gms.shared.stationdefinition.api.station.util.StationGroupsTimeRangeRequest;
import gms.shared.stationdefinition.api.station.util.StationsTimeFacetRequest;
import gms.shared.stationdefinition.api.station.util.StationsTimeRangeRequest;
import gms.shared.stationdefinition.cache.CachePopulationJob;
import gms.shared.stationdefinition.cache.CachePopulator;
import gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.coi.utils.CoiObjectMapperFactory;
import gms.shared.stationdefinition.database.connector.factory.StationDefinitionDatabaseConnectorFactory;
import gms.shared.stationdefinition.factory.StationDefinitionAccessorFactory;
import gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.shared.utilities.logging.TimingLogger;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import javax.persistence.EntityManagerFactory;

import org.quartz.CronScheduleBuilder;
import org.quartz.CronTrigger;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.TriggerBuilder;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.LoggerFactory;

public class StationDefinitionManager implements StationDefinitionManagerInterface {

  public static final String OPERATIONAL_PERIOD_START = "operationalPeriodStart";
  public static final String OPERATIONAL_PERIOD_END = "operationalPeriodEnd";
  public static final String JOB_GROUP = "STATION_DEFINITION_JOB_GROUP";
  public static final String STATION_GROUP_NAMES = "stationGroupNames";

  static final String STATION_GROUP_NAMES_CONFIG = "station-definition-manager.station-group-names";
  static final String OPERATIONAL_TIME_PERIOD_CONFIG = "global.operational-time-period";
  private static final String PERSISTENCE_UNIT = "gms_station_definition";

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(StationDefinitionManager.class));
  private static final TimingLogger<List<ChannelGroup>> timingLoggerChannelGroup = TimingLogger.create(logger);
  private static final TimingLogger<List<Channel>> timingLoggerChannel = TimingLogger.create(logger);
  private static final TimingLogger<List<StationGroup>> timingLoggerStationGroup = TimingLogger.create(logger);
  private static final TimingLogger<List<Station>> timingLoggerStation = TimingLogger.create(logger);
  private static final TimingLogger<List<Response>> timingLoggerReponse = TimingLogger.create(logger);
  private static final TimingLogger<List<Instant>> timingLoggerInstant = TimingLogger.create(logger);


  private final StationDefinitionAccessorInterface stationDefinitionAccessor;

  public StationDefinitionManager(StationDefinitionAccessorInterface stationDefinitionAccessor) {
    this.stationDefinitionAccessor = stationDefinitionAccessor;
  }

  public static StationDefinitionManager create(ControlContext context) {
    Objects.requireNonNull(context);

    final SystemConfig config = context.getSystemConfig();

    EntityManagerFactory entityManagerFactory =
      BridgedEntityManagerFactoryProvider.create().getEntityManagerFactory(PERSISTENCE_UNIT, config);

    final StationDefinitionDatabaseConnectorFactory stationDefinitionDatabaseConnectorFactory =
      StationDefinitionDatabaseConnectorFactory
        .create(entityManagerFactory);
    final StationDefinitionAccessorFactory stationDefinitionAccessorFactory = StationDefinitionAccessorFactory
      .create(stationDefinitionDatabaseConnectorFactory);


    try {
      StationDefinitionCacheFactory.setUpCache(config);
    } catch (IllegalStateException e){
      logger.warn("Cache already initialized: ", e);
    }

    ConfigurationConsumerUtility configurationConsumerUtility = context.getProcessingConfigurationConsumerUtility();
    Map<String, List<String>> stationGroupNames = configurationConsumerUtility.resolve(
      STATION_GROUP_NAMES_CONFIG,
      List.of(),
      Map.class);

    Map<String, String> operationalTimePeriod = configurationConsumerUtility.resolve(OPERATIONAL_TIME_PERIOD_CONFIG,
      List.of(Selector.from("TestType", "12-year-test")),
      Map.class);
    Duration periodStart = Duration.parse(operationalTimePeriod.get(OPERATIONAL_PERIOD_START));
    Duration periodEnd = Duration.parse(operationalTimePeriod.get(OPERATIONAL_PERIOD_END));
    Instant startTime = Instant.now().minus(periodStart);
    Instant endTime = Instant.now().minus(periodEnd);
    StationDefinitionAccessorInterface accessor =
      stationDefinitionAccessorFactory.getBridgedStationDefinitionAccessorInstance();

    CachePopulator cachePopulator = CachePopulator.create(accessor);

    cachePopulator.populate(stationGroupNames.get(STATION_GROUP_NAMES), periodStart, periodEnd);

    try {
      Scheduler scheduler = new StdSchedulerFactory().getScheduler();

      Runtime.getRuntime().addShutdownHook(new Thread(() -> {
        logger.info("Shutting down cache repopulation job");
        try {
          scheduler.shutdown();
        } catch (SchedulerException ex) {
          logger.error("Error shutting down scheduler", ex);
        }
      }));

      ObjectMapper objectMapper = CoiObjectMapperFactory.getJsonObjectMapper();

      String walletLocation = config.getValue(ORACLE_WALLET_LOCATION_CONFIG_KEY);
      String tnsLocation = config.getValue(TNS_ENTRY_LOCATION_CONFIG_KEY);
      String jdbcUrl = config.getValue(JDBC_URL_CONFIG_KEY);
      String connectionPoolSize = config.getValue(CONNECTION_POOL_SIZE_CONFIG_KEY);

      JobDetail cachePopulationJob = JobBuilder.newJob(CachePopulationJob.class)
        .withIdentity(CachePopulationJob.JOB_IDENTITY, JOB_GROUP)
        .usingJobData(OPERATIONAL_PERIOD_START, periodStart.toString())
        .usingJobData(OPERATIONAL_PERIOD_END, periodEnd.toString())
        .usingJobData(STATION_GROUP_NAMES, objectMapper.writeValueAsString(stationGroupNames.get(STATION_GROUP_NAMES)))
        .usingJobData(ORACLE_WALLET_LOCATION_CONFIG_KEY, walletLocation)
        .usingJobData(TNS_ENTRY_LOCATION_CONFIG_KEY, tnsLocation)
        .usingJobData(JDBC_URL_CONFIG_KEY, jdbcUrl)
        .usingJobData(CONNECTION_POOL_SIZE_CONFIG_KEY, connectionPoolSize)
        .build();

      CronTrigger cachePopulationTrigger = TriggerBuilder.newTrigger()
        .forJob(cachePopulationJob)
        .startNow()
        .withIdentity(CachePopulationJob.TRIGGER_IDENTITY)
        .withSchedule(CronScheduleBuilder.cronSchedule("0 0 * ? * * *"))
        .build();

      scheduler.scheduleJob(cachePopulationJob, cachePopulationTrigger);
      scheduler.start();
    } catch (SchedulerException e) {
      logger.error("Error acquiring cache repopulation scheduler", e);
    } catch (JsonProcessingException e) {
      logger.error("Error serializing station group job data", e);
    }


    Runtime.getRuntime().addShutdownHook(new Thread(entityManagerFactory::close));

    return new StationDefinitionManager(accessor);
  }

  @Override
  public List<StationGroup> findStationGroupsByName(StationGroupsTimeFacetRequest request) {
    Objects.requireNonNull(request);

    List<String> stationGroupNames = request.getStationGroupNames();
    Instant effectiveTime = request.getEffectiveTime().orElse(Instant.now());
    if (request.getFacetingDefinition().isPresent()) {
      return timingLoggerStationGroup.apply("findStationGroupsByName",
        () -> stationDefinitionAccessor.findStationGroupsByNameAndTime(stationGroupNames,
          effectiveTime, request.getFacetingDefinition().get()));

    } else {
      return timingLoggerStationGroup.apply("findStationGroupsByName",
        () -> stationDefinitionAccessor.findStationGroupsByNameAndTime(stationGroupNames, effectiveTime));
    }
  }

  @Override
  public List<StationGroup> findStationGroupsByNameAndTimeRange(StationGroupsTimeRangeRequest request) {
    Objects.requireNonNull(request);
    return timingLoggerStationGroup.apply("findStationGroupsByNameAndTimeRange",
      () -> stationDefinitionAccessor.findStationGroupsByNameAndTimeRange(request.getStationGroupNames(),
        request.getTimeRange().getStartTime(), request.getTimeRange().getEndTime()));
  }

  @Override
  public List<Station> findStationsByName(StationsTimeFacetRequest request) {
    Objects.requireNonNull(request);
    List<String> stationNames = request.getStationNames();
    Instant effectiveTime = request.getEffectiveTime().orElse(Instant.now());
    if (request.getFacetingDefinition().isPresent()) {
      return timingLoggerStation.apply("findStationsByName",
        () -> stationDefinitionAccessor.findStationsByNameAndTime(stationNames, effectiveTime,
          request.getFacetingDefinition().get()));
    } else {
      return timingLoggerStation.apply("findStationsByName",
        () -> stationDefinitionAccessor.findStationsByNameAndTime(stationNames, effectiveTime));
    }
  }

  @Override
  public List<Station> findStationsByNameAndTimeRange(StationsTimeRangeRequest request) {
    Objects.requireNonNull(request);
    return timingLoggerStation.apply("findStationsByNameAndTimeRange",
      () -> stationDefinitionAccessor.findStationsByNameAndTimeRange(request.getStationNames(),
        request.getTimeRange().getStartTime(), request.getTimeRange().getEndTime()));
  }

  @Override
  public List<Instant> determineStationChangeTimes(StationChangeTimesRequest request) {
    Objects.requireNonNull(request);
    return timingLoggerInstant.apply("determineStationChangeTimes",
      () -> stationDefinitionAccessor.determineStationChangeTimes(request.getStation(),
        request.getStartTime(),
        request.getEndTime()));
  }

  @Override
  public List<ChannelGroup> findChannelGroupsByName(ChannelGroupsTimeFacetRequest request) {
    Objects.requireNonNull(request);

    List<String> channelGroupNames = request.getChannelGroupNames();
    Instant effectiveTime = request.getEffectiveTime().orElse(Instant.now());
    if (request.getFacetingDefinition().isPresent()) {
      return timingLoggerChannelGroup.apply("findChannelGroupsByName",
        () -> stationDefinitionAccessor.findChannelGroupsByNameAndTime(channelGroupNames, effectiveTime,
          request.getFacetingDefinition().get()));
    } else {
      return timingLoggerChannelGroup.apply("findChannelGroupsByName",
        () -> stationDefinitionAccessor.findChannelGroupsByNameAndTime(channelGroupNames, effectiveTime));
    }
  }

  @Override
  public List<ChannelGroup> findChannelGroupsByNameAndTimeRange(ChannelGroupsTimeRangeRequest request) {
    Objects.requireNonNull(request);

    return timingLoggerChannelGroup.apply("findChannelGroupsByNameAndTimeRange",
      () -> stationDefinitionAccessor.findChannelGroupsByNameAndTimeRange(request.getChannelGroupNames(),
        request.getTimeRange().getStartTime(), request.getTimeRange().getEndTime()));
  }

  @Override
  public List<Channel> findChannels(ChannelsTimeFacetRequest request) {
    Objects.requireNonNull(request);

    Instant time = request.getEffectiveTime().orElse(Instant.now());
    return timingLoggerChannel.apply("findChannels",
      () -> request.getFacetingDefinition().isPresent() ?
        stationDefinitionAccessor.findChannelsByNameAndTime(request.getChannelNames(),
          time,
          request.getFacetingDefinition().get()) :
        stationDefinitionAccessor.findChannelsByNameAndTime(request.getChannelNames(), time));
  }

  @Override
  public List<Channel> findChannelsByNameAndTimeRange(ChannelsTimeRangeRequest request) {
    Objects.requireNonNull(request);

    return timingLoggerChannel.apply("findChannelsByNameAndTimeRange",
      () -> stationDefinitionAccessor.findChannelsByNameAndTimeRange(request.getChannelNames(),
        request.getTimeRange().getStartTime(), request.getTimeRange().getEndTime()));
  }

  @Override
  public List<Response> findResponsesById(ResponseTimeFacetRequest request) {
    Objects.requireNonNull(request);
    return timingLoggerReponse.apply("findReponsesById",
      () -> request.getFacetingDefinition().isPresent() ?
        stationDefinitionAccessor.findResponsesById(request.getResponseIds(),
          request.getEffectiveTime().orElse(Instant.now()),
          request.getFacetingDefinition().get()) :
        stationDefinitionAccessor.findResponsesById(request.getResponseIds(),
          request.getEffectiveTime().orElse(Instant.now())));
  }

  @Override
  public List<Response> findResponsesByIdAndTimeRange(ResponseTimeRangeRequest request) {
    Objects.requireNonNull(request);

    return timingLoggerReponse.apply("findResponsesByIdAndTimeRange",
      () -> stationDefinitionAccessor.findResponsesByIdAndTimeRange(request.getResponseIds(),
        request.getTimeRange().getStartTime(), request.getTimeRange().getEndTime()));
  }
}
