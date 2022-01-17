package gms.shared.cacheservice;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class CacheServiceTest {

  @Test
  void testRunVisor () {
    boolean runVisor = CacheService.parseArgs(new String[]{"visor"});
    assertTrue(runVisor, "Visor Service was not started");
  }
  @Test
  void testRunService () {
    boolean runVisor = CacheService.parseArgs(new String[]{});
    assertTrue(!runVisor, "Cache Service was not started");
  }
}