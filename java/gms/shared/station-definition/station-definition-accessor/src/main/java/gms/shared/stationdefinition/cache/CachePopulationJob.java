package gms.shared.stationdefinition.cache;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import gms.shared.stationdefinition.accessor.StationDefinitionManager;
import gms.shared.stationdefinition.database.connector.factory.StationDefinitionDatabaseConnectorFactory;
import gms.shared.stationdefinition.factory.StationDefinitionAccessorFactory;
import gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider;
import gms.shared.utilities.javautilities.objectmapper.ObjectMapperFactory;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.LoggerFactory;

import javax.persistence.EntityManagerFactory;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static gms.shared.stationdefinition.accessor.StationDefinitionManager.STATION_GROUP_NAMES;
import static gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider.CONNECTION_POOL_SIZE_CONFIG_KEY;
import static gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider.HIBERNATE_C3P0_POOL_SIZE_KEY;
import static gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider.HIBERNATE_FLUSH_MODE;
import static gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider.JAVAX_PERSISTENCE_JDBC_URL;
import static gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider.JDBC_URL_CONFIG_KEY;
import static gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider.ORACLE_WALLET_LOCATION_CONFIG_KEY;
import static gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider.TNS_ENTRY_LOCATION_CONFIG_KEY;
import static gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider.TNS_LOCATION_PROPERTY_KEY;
import static gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider.WALLET_LOCATION_PROPERTY_KEY;


public class CachePopulationJob implements Job {

  public static final String JOB_IDENTITY = "CACHE_POPULATION_JOB";
  public static final String TRIGGER_IDENTITY = "CACHE_POPULATION_TRIGGER";
  private static final String PERSISTENCE_UNIT = "gms_station_definition";

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(CachePopulationJob.class));

  @Override
  public void execute(JobExecutionContext context) throws JobExecutionException {
    logger.info("Invoking cache repopulation job");
    JobDataMap dataMap = context.getJobDetail().getJobDataMap();
    String walletLocation = dataMap.getString(ORACLE_WALLET_LOCATION_CONFIG_KEY);
    String tnsLocation = dataMap.getString(TNS_ENTRY_LOCATION_CONFIG_KEY);
    String jdbcUrl = dataMap.getString(JDBC_URL_CONFIG_KEY);
    String connectionPoolSize = dataMap.getString(CONNECTION_POOL_SIZE_CONFIG_KEY);

    System.setProperty(WALLET_LOCATION_PROPERTY_KEY, walletLocation);
    System.setProperty(TNS_LOCATION_PROPERTY_KEY, tnsLocation);

    Map<String, String> propertyOverrides = Map.of(JAVAX_PERSISTENCE_JDBC_URL, jdbcUrl,
      HIBERNATE_C3P0_POOL_SIZE_KEY, connectionPoolSize,
      HIBERNATE_FLUSH_MODE, "FLUSH_AUTO");

    ObjectMapper objectMapper = ObjectMapperFactory.getJsonObjectMapper();
    TypeFactory typeFactory = objectMapper.getTypeFactory();
    JavaType namesListType = typeFactory.constructCollectionType(List.class, String.class);

    EntityManagerFactory entityManagerFactory =
      BridgedEntityManagerFactoryProvider
        .getEntityManagerFactory(PERSISTENCE_UNIT, propertyOverrides);

    try {
      List<String> stationGroupNames = objectMapper.readValue(dataMap.getString(STATION_GROUP_NAMES), namesListType);
      Duration periodStart = Duration.parse(dataMap.getString(StationDefinitionManager.OPERATIONAL_PERIOD_START));
      Duration periodEnd = Duration.parse(dataMap.getString(StationDefinitionManager.OPERATIONAL_PERIOD_END));
      logger.info("Repopulating cache with interval {} to {}", periodStart, periodEnd);
      StationDefinitionDatabaseConnectorFactory connectorFactory =
        StationDefinitionDatabaseConnectorFactory.create(entityManagerFactory);
      StationDefinitionAccessorFactory accessorFactory = StationDefinitionAccessorFactory.create(connectorFactory);
      Instant now = Instant.now();
      CachePopulator cachePopulator = CachePopulator.create(accessorFactory.getRequestCacheInstance(now.minus(periodStart),
        now.minus(periodEnd)));

      cachePopulator.populate(stationGroupNames, periodStart, periodEnd);
    } catch (JsonProcessingException e) {
      logger.error("Error reading station group names from job data", e);
      throw new JobExecutionException(e);
    } finally {
      logger.info("Closing entity manager factory");
      entityManagerFactory.close();
    }
  }

}
