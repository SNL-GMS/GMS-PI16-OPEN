package gms.shared.signaldetection.cache.util;

import gms.shared.frameworks.cache.utils.CacheInfo;
import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.systemconfig.SystemConfig;
import org.apache.commons.lang3.Validate;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.cache.CacheMode;
import java.util.List;
import java.util.Optional;

public class SignalDetectionCacheFactory {

  public static final CacheInfo REQUEST_CACHE = new CacheInfo("signal-detection-request",
    CacheMode.LOCAL, CacheAtomicityMode.ATOMIC, true, Optional.empty());
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

  private static final List<CacheInfo> CACHE_INFO_LIST = List.of(REQUEST_CACHE,
    ARID_SIGNAL_DETECTION_ID_CACHE,
    SIGNAL_DETECTION_ID_ARID_CACHE,
    ARRIVAL_ID_SIGNAL_DETECTION_HYPOTHESIS_ID,
    SIGNAL_DETECTION_HYPOTHESIS_ID_ARRIVAL_ID);

  private SignalDetectionCacheFactory() {
    // prevent instantiation
  }

  public static void setUpCache(SystemConfig systemConfig) {
    Validate.notNull(systemConfig,"SystemConfig is required");
    IgniteConnectionManager.create(systemConfig, CACHE_INFO_LIST);
  }
}
