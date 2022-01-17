package gms.shared.stationdefinition.cache;

import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.stationdefinition.api.util.Request;
import org.apache.ignite.IgniteCache;

import java.util.Collection;
import java.util.List;

import static gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory.REQUEST_CACHE;

/**
 * RequestCache for caching station definition requests as the first layer of caching
 */
public class RequestCache {

  private final IgniteCache<Request, Collection<Object>> requestCache;

  private RequestCache(IgniteCache<Request, Collection<Object>> requestCache) {
    this.requestCache = requestCache;
  }

  public static RequestCache create() {
    return new RequestCache(IgniteConnectionManager.getOrCreateCache(REQUEST_CACHE));
  }

  public Collection<Object> retrieve(Request request) {
    return requestCache.containsKey(request) ? requestCache.get(request) : List.of();
  }

  public void put(Request key, Collection<Object> value) {
    requestCache.put(key, value);
  }
}
