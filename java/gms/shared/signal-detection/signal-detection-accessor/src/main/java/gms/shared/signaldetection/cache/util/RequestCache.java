package gms.shared.signaldetection.cache.util;

import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.signaldetection.api.request.Request;
import gms.shared.signaldetection.api.response.SignalDetectionsWithChannelSegments;
import org.apache.ignite.IgniteCache;

import java.util.Optional;

import static gms.shared.signaldetection.cache.util.SignalDetectionCacheFactory.REQUEST_CACHE;

public class RequestCache {

  private final IgniteCache<Request, SignalDetectionsWithChannelSegments> detectionsWithSegmentsByRequest;


  private RequestCache(IgniteCache<Request, SignalDetectionsWithChannelSegments> detectionsWithSegmentsByRequest) {
    this.detectionsWithSegmentsByRequest = detectionsWithSegmentsByRequest;
  }

  /**
   * Creates a new RequestCache
   * @return a new {@link RequestCache}
   */
  public static RequestCache create() {
    return new RequestCache(IgniteConnectionManager.getOrCreateCache(REQUEST_CACHE));
  }

  /**
   * Retrieves the {@link SignalDetectionsWithChannelSegments} associated with the {@link Request}, if it has been
   * cached
   * @param request the {@link Request} to find the cached result for
   * @return
   */
  public Optional<SignalDetectionsWithChannelSegments> retrieve(Request request) {
    return Optional.ofNullable(detectionsWithSegmentsByRequest.get(request));
  }

  /**
   * Stores the provided {@link Request} with it's result
   * @param key the {@link Request} used to retrieve the result
   * @param result the {@link SignalDetectionsWithChannelSegments} from the {@link Request} to cache
   */
  public void cache(Request key, SignalDetectionsWithChannelSegments result) {
    detectionsWithSegmentsByRequest.put(key, result);
  }
}
