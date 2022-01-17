package gms.shared.frameworks.systemconfig;

import io.etcd.jetcd.ByteSequence;
import io.etcd.jetcd.Client;
import io.etcd.jetcd.ClientBuilder;
import io.etcd.jetcd.KV;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.time.temporal.ChronoUnit;

public class EtcdClientManager {

  private static final Logger logger = LoggerFactory.getLogger(EtcdClientManager.class);

  private KV keyValueClient;
  private final String endpoints;
  private final String username;
  private final String password;

  EtcdClientManager(String endpoints, String username, String password) {
    this.endpoints = endpoints;
    this.username = username;
    this.password = password;
  }

  KV getEtcdClient() {
    if (this.keyValueClient == null) {
      this.keyValueClient = initializeEtcdClient();
    }
    return this.keyValueClient;
  }

  public void reset() {
    logger.info("Resetting Etcd KV Client");
    if (this.keyValueClient != null) {
      this.keyValueClient.close();
    }
    this.keyValueClient = null;
  }

  private KV initializeEtcdClient() {
    ClientBuilder etcdBuilder = Client.builder()
      .endpoints(endpoints)
      .retryDelay(50)
      .retryMaxDelay(1000)
      .retryChronoUnit(ChronoUnit.MILLIS)
      .retryMaxDuration("PT10M");

    if (null != username && null != password) {
      etcdBuilder = etcdBuilder.user(ByteSequence.from(username, StandardCharsets.US_ASCII))
        .password(ByteSequence.from(password, StandardCharsets.US_ASCII));
    }

    var etcdClient = etcdBuilder.build();
    var client = etcdClient.getKVClient();
    logger.info("Created etcd connection with endpoints '{}'", endpoints);
    return client;
  }

  @Override
  public String toString() {
    return String.format("Etcd: endpoints=%s", this.endpoints);
  }

}
