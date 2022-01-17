package gms.shared.frameworks.cache.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.frameworks.test.utils.containers.ZooTestContainer;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import javax.cache.configuration.Factory;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.cache.CacheMode;
import org.apache.ignite.cache.eviction.lru.LruEvictionPolicy;
import org.apache.ignite.cache.eviction.lru.LruEvictionPolicyFactory;
import org.apache.ignite.configuration.CacheConfiguration;
import org.junit.Ignore;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

@Disabled
  //zookeeper has been removed 8/5/2021
class IgniteConnectionManagerTest extends ZooTestContainer {
  @BeforeAll
  static void setIgniteHome() {
    try {
      Path tempIgniteDirectory = Files.createTempDirectory("ignite-work");
      System.setProperty("IGNITE_HOME", tempIgniteDirectory.toString());
    } catch (IOException e) {
      e.printStackTrace();
    }
  }

  //    -----example of setting EvictionPolicy-----
  public static CacheInfo DATA_WITH_EVICTION_POLICY = new CacheInfo("data", CacheMode.LOCAL,
      CacheAtomicityMode.ATOMIC,
      true, Optional.of(new LruEvictionPolicyFactory<>(8)));

  //    -----example of setting no EvictionPolicy-----
  public static CacheInfo DATA = new CacheInfo("data", CacheMode.LOCAL,
      CacheAtomicityMode.ATOMIC,
      true, Optional.empty());

  @Test
  void testPassingNullConfigToCacheFactoryThrowsError() {
    assertThrows(NullPointerException.class, () -> IgniteConnectionManager.create(null,null));
  }

  @Test
  void testEvictionPolicy () {
    IgniteConnectionManager.create(systemConfig, List.of(DATA_WITH_EVICTION_POLICY));
    IgniteCache<String, String> cache = IgniteConnectionManager.getOrCreateCache(DATA_WITH_EVICTION_POLICY);
    CacheConfiguration configuration = cache.getConfiguration(CacheConfiguration.class);
    Factory ep = configuration.getEvictionPolicyFactory();
    LruEvictionPolicy policy = (LruEvictionPolicy)ep.create();
    assertEquals(DATA_WITH_EVICTION_POLICY.getEvictionPolicy().get().getMaxSize(), policy.getMaxSize());
    IgniteConnectionManager.close();
  }

  @Test
  void testMultipleCreateError() {
    IgniteConnectionManager.create(systemConfig, List.of(DATA));
    assertThrows(java.lang.IllegalStateException.class, () -> IgniteConnectionManager.create(systemConfig, List.of(DATA)));
    IgniteConnectionManager.close();
  }
  @Test
  void testConnectionClose() {
    IgniteConnectionManager.create(systemConfig, List.of(DATA));
    IgniteCache<String, String> cache = IgniteConnectionManager.getOrCreateCache(DATA);

    IgniteConnectionManager.close();
    assertThrows(java.lang.IllegalStateException.class, () ->cache.put("Hello", "world?"));
  }
  @Test
  void testCacheCreation() {
    IgniteConnectionManager.create(systemConfig, List.of(DATA));
    IgniteCache<String, String> cache = IgniteConnectionManager.getOrCreateCache(DATA);
    assertEquals(DATA.getCacheName(), cache.getName());
    assertEquals(0, cache.size());

    cache.put("station", "Terrapin");
    assertEquals(1, cache.size());
    assertTrue( cache.containsKey("station"));
    assertEquals("Terrapin", cache.get("station"));
    IgniteConnectionManager.close();
  }
  
}
