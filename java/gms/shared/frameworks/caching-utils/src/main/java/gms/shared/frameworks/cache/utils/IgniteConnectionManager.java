package gms.shared.frameworks.cache.utils;

import com.google.common.base.Preconditions;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.apache.ignite.Ignite;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.Ignition;
import org.apache.ignite.configuration.CacheConfiguration;
import org.apache.ignite.configuration.IgniteConfiguration;
import org.apache.ignite.events.EventType;
import org.apache.ignite.logger.log4j.Log4JLogger;
import org.apache.ignite.spi.eventstorage.memory.MemoryEventStorageSpi;
import org.slf4j.LoggerFactory;

import javax.cache.Cache;
import java.io.Closeable;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * The {@link IgniteConnectionManager} is used to create {@link Cache} instances from an Ignite node. This way a client just
 * need to adhere to accessing the cache via the JCache API rather than using an Ignite-specific query mechanism.
 * <p>
 * The class implements the {@link Closeable} interface in order to allow us to close the Ignite node upon shutdown of a
 * given application or use try-with-resources when scoping down the access to an Ignite node specifically.
 */
public class IgniteConnectionManager {

  private static final String NAMESPACE_LOCATION = "/var/run/secrets/kubernetes.io/serviceaccount/namespace";
  private static final String CONFIG_IGNITE_INSTANCE_NAME = "ignite-instance-name";
  private static Ignite ignite;
  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(IgniteConnectionManager.class));
  private IgniteConnectionManager() {
  } //private constructor for sonarlint

  /**
   * Create {@link IgniteConnectionManager} that controls configuration of cache and registers creator as a server node
   * server nodes participate in the cluster to store data
   * <p>
   * Clients can simply call IgniteConnectionManager.getInstance().getOrCreateCache(CacheName.{name}); to retrieve data from
   * the cluster
   *
   * @param systemConfig - system config to setup cache cluster
   * @param cacheList - caches to create in the cluster.  The node calling this will host (some of) the data
   */
  public static synchronized void create(SystemConfig systemConfig, List<CacheInfo> cacheList) {
    logger.info("Initializing ignite cache");
    Objects.requireNonNull(cacheList);
      Objects.requireNonNull(systemConfig);
    Preconditions.checkState(ignite == null,
        "IgniteConnectionManager.create() should only be called one time, during application startup");
    createConfiguration(systemConfig, cacheList);
    Runtime.getRuntime().addShutdownHook(new Thread(() -> {
      if (ignite != null) {
        logger.info("Closing Ignite connections");
        close();
      }
    }));
  }

  private static IgniteConfiguration createConfiguration(SystemConfig systemConfig, List<CacheInfo> cacheList) {
    Map<String, Object> nodeAttributes = new HashMap<>();
    cacheList.forEach(cache -> nodeAttributes.put(cache.getNodeAttr(), true));
    var igniteLogger = new Log4JLogger();
    MemoryEventStorageSpi eventStorageSpi = new MemoryEventStorageSpi()
      .setExpireCount(60000);

    String igniteInstanceName = systemConfig.getValue(CONFIG_IGNITE_INSTANCE_NAME);

    IgniteConfiguration cfg = new IgniteConfiguration()
      .setIgniteInstanceName(igniteInstanceName)
      .setUserAttributes(nodeAttributes)
      .setGridLogger(igniteLogger)
      .setIncludeEventTypes(EventType.EVT_CACHE_OBJECT_PUT, EventType.EVT_CACHE_OBJECT_READ,
        EventType.EVT_CACHE_OBJECT_REMOVED, EventType.EVT_NODE_JOINED, EventType.EVT_NODE_LEFT)
      .setEventStorageSpi(eventStorageSpi);
    if (cacheList.isEmpty()) {
      cfg.setClientMode(true);
    }
    cfg.setCacheConfiguration(initializeCaches(cacheList).toArray(CacheConfiguration[]::new));
    ignite = Ignition.start(cfg);

    return cfg;
  }

  private static <T> Collection<CacheConfiguration> initializeCaches(List<CacheInfo> cacheList) {
    return cacheList.stream()
      .map(IgniteConnectionManager::createCacheFromCacheInfo)
      .collect(Collectors.toList());

  }

  private static <T, U> CacheConfiguration<T, U> createCacheFromCacheInfo(CacheInfo cache) {
    logger.info("Getting or creating cache: " + cache.getCacheName());
    CacheConfiguration<T, U> cacheCfg = new CacheConfiguration<>();
    cacheCfg.setName(cache.getCacheName());
    cacheCfg.setCacheMode(cache.getCacheMode());
    cacheCfg.setAtomicityMode(cache.getCacheAtomicityMode());
    cacheCfg.setOnheapCacheEnabled(cache.isOnHeap());
    cacheCfg.setNodeFilter(cache.getNodeFilter());
    if (cache.getEvictionPolicy().isPresent()) {
      cacheCfg.setEvictionPolicyFactory(cache.getEvictionPolicy().get());
    }
    return cacheCfg;
    //return ignite.getOrCreateCache(cacheCfg);
  }

  /**
   * retrieve a given {@link Cache} by the cacheName.
   *
   * @param cache name of the {@link Cache} instance to retrieve.
   * @param <K> the type of the key to retrieve a {@link Cache.Entry} instance.
   * @param <V> the type of the value of the retrieved {@link Cache.Entry} instance.
   * @return instance of {@link Cache} representing the requested Cache retrieved.  null if all server nodes are down
   */
  public static <K, V> IgniteCache<K, V> getOrCreateCache(CacheInfo cache) {
    Objects.requireNonNull(cache);
    Objects.requireNonNull(ignite, "Ignite has not been initialized.  Did you call create()?");
    return ignite.getOrCreateCache(createCacheFromCacheInfo(cache));
  }

  public static void close() {
    if(ignite != null)
      ignite.close();
    IgniteConnectionManager.ignite = null;
  }
  private static String getKubernetesNamespace() {
    var nameSpaceFile = Path.of(NAMESPACE_LOCATION);
    var namespace =  "default";
    try {
      namespace = Files.readString(nameSpaceFile);
    } catch (IOException e) {
      logger.error("could not load namespace from " + NAMESPACE_LOCATION, e);
    }
    logger.info("Ignite kubernetesIpFinder using namespace " + namespace);
    return namespace;
  }
}

