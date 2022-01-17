package gms.shared.stationdefinition.cache;

import gms.shared.frameworks.test.utils.containers.ZooTestContainer;
import gms.shared.stationdefinition.api.channel.util.ChannelsTimeRequest;
import gms.shared.stationdefinition.api.util.Request;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

import static org.junit.Assert.assertEquals;
@Disabled // zookeeper has been removed 8/5/2021
class RequestCacheTest extends ZooTestContainer {
  private static final Logger logger = LoggerFactory.getLogger(RequestCacheTest.class);

  public static final Request CHAN_TIME_REQ = ChannelsTimeRequest.builder()
    .setChannelNames(List.of("GENERIC_NAME"))
    .setEffectiveTime(Instant.EPOCH)
    .build();

  @BeforeAll
  static void setup() {
    try {
      CacheTestInitialization.setup(systemConfig);
    } catch(IllegalStateException e) {
      logger.info("IgniteCache already initialized.");
    }
  }

  @Test
  void testCache() {
    RequestCache requestCache = RequestCache.create();
    requestCache.put(CHAN_TIME_REQ, List.of(UtilsTestFixtures.STATION));
    Collection<Object> responseObjects = requestCache.retrieve(CHAN_TIME_REQ);
    assertEquals(UtilsTestFixtures.STATION, responseObjects.iterator().next());
  }
}
