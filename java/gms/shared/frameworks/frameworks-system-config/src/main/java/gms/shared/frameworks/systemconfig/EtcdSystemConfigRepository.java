package gms.shared.frameworks.systemconfig;

import io.etcd.jetcd.ByteSequence;
import io.etcd.jetcd.KeyValue;
import io.etcd.jetcd.kv.GetResponse;
import net.jodah.failsafe.Failsafe;
import net.jodah.failsafe.RetryPolicy;
import org.apache.commons.lang3.Validate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Class providing retrieval of system configuration values from one or more etcd servers.
 *
 * <p>If an invalid endpoint is specified, this object will be still be valid but will return no
 * configuration values. A warning will be logged for this case.
 */
public class EtcdSystemConfigRepository implements SystemConfigRepository {

  private static final Logger logger = LoggerFactory.getLogger(EtcdSystemConfigRepository.class);

  private final EtcdClientManager etcdClientManager;
  private final RetryPolicy<Optional<String>> etcdGetRetryPolicy;

  /**
   * Instantiate a EtcdSystemConfigRepository
   */
  private EtcdSystemConfigRepository(String endpoints, String username, String password) {
    this.etcdClientManager = new EtcdClientManager(endpoints, username, password);
    this.etcdGetRetryPolicy = new RetryPolicy<Optional<String>>()
      .handle(ExecutionException.class, TimeoutException.class)
      .onRetry(event -> {
        logger.warn("Error retrieving System Config: {}. Retrying...", event.getLastFailure().getMessage());
        if (event.getLastFailure() instanceof TimeoutException) {
          etcdClientManager.reset();
        }
      })
      .withBackoff(1, 30, ChronoUnit.SECONDS)
      .withMaxAttempts(-1);
  }

  /**
   * Etcd-specific implementation of get.  Performs retries if etcd is unavailable.
   *
   * @param key key name to return the value for from this repository
   * @return value of key if present, null if not found.
   */
  @Override
  public Optional<String> get(String key) {
    return Failsafe.with(etcdGetRetryPolicy).get(() -> fetchEtcd(key));
  }

  private Optional<String> fetchEtcd(String key) throws ExecutionException, TimeoutException, InterruptedException {
    logger.debug("requesting kv for key {}", key);
    CompletableFuture<GetResponse> responseFuture = etcdClientManager.getEtcdClient().get(ByteSequence.from(key, StandardCharsets.UTF_8));

    logger.debug("retrieving response future");
    var response = responseFuture.get(10, TimeUnit.SECONDS);

    logger.debug("found {} kvs", response.getCount());
    if (response.getCount() > 1) {
      logger.warn("Etcd returned {} possible values for key {}. Returning first one.",
        response.getCount(), key);
    }

    return response.getKvs().stream()
      .map(KeyValue::getValue)
      .map(byteSequence -> byteSequence.toString(StandardCharsets.UTF_8))
      .findFirst();
  }


  /**
   * Get the name of this system configuration repository as a string.
   *
   * @return name of the form "etcd:endpoints"
   */
  @Override
  public String toString() {
    return this.etcdClientManager.toString();
  }

  /**
   * Return a builder for an EtcdSystemConfigurationRepository.
   */
  public static Builder builder() {
    return new EtcdSystemConfigRepository.Builder();
  }

  /**
   * Builder for an EtcdSystemConfigurationRepository connected to one or more etcd servers.
   */
  public static class Builder {

    private static final String DEFAULT_ETCD_ENDPOINTS = "http://etcd:2379";

    private String endpoints;
    private String username;
    private String password;

    /**
     * Constructor
     */
    public Builder() {
      setDefaults();
    }

    /**
     * Set the endpoints for the EtcdSystemConfigurationRepository under construction.
     *
     * @param endpoints one or more etcd server:port endpoints (comma-separated)
     */
    public Builder setEndpoints(String endpoints) {
      this.endpoints = endpoints;
      return this;
    }

    /**
     * Set the access credentials for the EtcdSystemConfigurationRepository under construction.
     *
     * @param username username to use when connecting to etcd servers
     * @param password password to use when connecting to etcd servers
     */
    public Builder setCredentials(String username, String password) {
      this.username = username;
      this.password = password;
      return this;
    }

    /**
     * Finish construction of a new EtcdSystemConfigRepository
     *
     * @return newly constructed EtcdSystemConfigRepository
     */
    public EtcdSystemConfigRepository build() {
      Validate.notBlank(endpoints, "Etcd endpoints cannot be empty");
      Validate.notBlank(username, "Etcd username cannot be empty");
      Validate.notBlank(password, "Etcd password cannot be empty");

      return new EtcdSystemConfigRepository(endpoints, username, password);
    }

    private void setDefaults() {
      this.endpoints = Optional.ofNullable(System.getenv("GMS_ETCD_ENDPOINTS"))
          .orElse(DEFAULT_ETCD_ENDPOINTS);
      this.username = Optional.ofNullable(System.getenv("ETCD_GMS_USER"))
          .orElseThrow(() -> new IllegalStateException("Unable to retrieve ETCD_GMS_USER"));
      // Etcd requires a password, but this is for read-only access as the gms user
      this.password = Optional.ofNullable(System.getenv("ETCD_GMS_PASSWORD"))
          .orElseThrow(() -> new IllegalStateException("Unable to retrieve ETCD_GMS_PASSWORD"));
    }
  }
}
