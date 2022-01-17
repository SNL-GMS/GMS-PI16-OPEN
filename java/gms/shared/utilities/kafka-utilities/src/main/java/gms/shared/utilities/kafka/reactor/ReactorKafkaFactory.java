package gms.shared.utilities.kafka.reactor;

import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.kafka.KafkaConfiguration;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Supplier;
import net.jodah.failsafe.Failsafe;
import net.jodah.failsafe.RetryPolicy;
import org.apache.kafka.clients.CommonClientConfigs;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRebalanceListener;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.KafkaException;
import org.apache.kafka.common.serialization.Deserializer;
import org.apache.kafka.common.serialization.Serializer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.kafka.receiver.KafkaReceiver;
import reactor.kafka.receiver.ReceiverOptions;
import reactor.kafka.receiver.ReceiverPartition;
import reactor.kafka.sender.KafkaSender;
import reactor.kafka.sender.SenderOptions;

/**
 * Factory for creating all the reactive Kafka objects for the system Factory can be created with
 * KafkaConfiguration or SystemConfig or nothing as some create functions pass in all the necessary
 * data but as the class was created by combining older factories their structures were maintained
 */
public class ReactorKafkaFactory {

  private KafkaConfiguration kafkaConfiguration;

  private static final Logger logger = LoggerFactory.getLogger(ReactorKafkaFactory.class);

  //config keys for creating consumer properties
  private static final String APPLICATION_ID = "application-id";
  private static final String KAFKA_BOOTSTRAP_SERVERS = "kafka-bootstrap-servers";
  private static final String KAFKA_KEY_DESERIALIZER = "kafka-key-deserializer";
  private static final String KAFKA_VALUE_DESERIALIZER = "kafka-value-deserializer";
  private static final String KAFKA_CONSUMER_SESSION_TIMEOUT = "kafka-consumer-session-timeout";
  private static final String KAFKA_CONSUMER_HEARTBEAT_INTERVAL = "kafka-consumer-heartbeat-interval";
  private static final String BATCH_SIZE_IN_SECONDS = "application-batch-size-in-seconds";


  /**
   * Constructor with kafkaConfiguration object
   *
   * @param kafkaConfiguration preloaded info for this kafka instance
   */

  public ReactorKafkaFactory(KafkaConfiguration kafkaConfiguration) {
    this.kafkaConfiguration = kafkaConfiguration;
  }

  /**
   * Constructor from systemConfig
   *
   * @param systemConfig object used to create kafkaConfiguretion for this Factory
   */

  public ReactorKafkaFactory(SystemConfig systemConfig) {

    this.kafkaConfiguration = KafkaConfiguration.create(systemConfig);
  }

  /**
   * Function used to create a base common config properties object for the dataInjector
   */

  public Properties createBaseConfig() {

    Properties props = new Properties();
    props.put(CommonClientConfigs.BOOTSTRAP_SERVERS_CONFIG,
        kafkaConfiguration.getBootstrapServers());
    props.put(CommonClientConfigs.CLIENT_ID_CONFIG, kafkaConfiguration.getApplicationId());
    props.put(CommonClientConfigs.GROUP_ID_CONFIG, kafkaConfiguration.getApplicationId());
    props.put(CommonClientConfigs.SESSION_TIMEOUT_MS_CONFIG,
        kafkaConfiguration.getSessionTimeout());
    props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, UUID.randomUUID().toString());
    props.put(ProducerConfig.TRANSACTION_TIMEOUT_CONFIG,
        kafkaConfiguration.getTransactionTimeout());
    props.put(ProducerConfig.ACKS_CONFIG, kafkaConfiguration.getAcks());
    props.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, kafkaConfiguration.getDeliveryTimeout());
    props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
    props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
    props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, kafkaConfiguration.getMaxPollInterval());
    props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, kafkaConfiguration.getMaxPollRecords());
    props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, kafkaConfiguration.getAutoCommit());
    props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG,
        kafkaConfiguration.getHeartbeatInterval());

    return props;

  }


  /**
   * Create a sender using the argument name and default string serializer
   *
   * @param senderName
   * @return
   */
  public KafkaSender<String, String> createSender(String senderName) {
    return createSender(senderName, new StringSerializer());
  }

  /**
   * Create a sendor with specified name and serializer of class T
   *
   * @param senderName
   * @param valueSerializer
   * @param <T>
   * @return
   */
  public <T> KafkaSender<String, T> createSender(String senderName,
      Serializer<T> valueSerializer) {
    return KafkaSender.create(senderOptions(senderName, valueSerializer));
  }




  /**
   * Build the Kafka Reactor SenderOptions
   *
   * @param senderName - every kafkasender needs a unique client-id
   * @param valueSerializer serializer for the data type T
   * @param <T>
   * @return SenderOptions
   */
  private <T> SenderOptions<String, T> senderOptions(String senderName,
      Serializer<T> valueSerializer) {
    Map<String, Object> props = Map.of(
        ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaConfiguration.getBootstrapServers(),
        ProducerConfig.CLIENT_ID_CONFIG, senderName,
        ProducerConfig.TRANSACTIONAL_ID_CONFIG, UUID.randomUUID().toString(),
        ProducerConfig.TRANSACTION_TIMEOUT_CONFIG, kafkaConfiguration.getTransactionTimeout(),
        ProducerConfig.ACKS_CONFIG, kafkaConfiguration.getAcks(),
        ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, kafkaConfiguration.getDeliveryTimeout(),
        ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);

    return SenderOptions.<String, T>create(props).withValueSerializer(valueSerializer);
  }

  /**
   * Build receiver options using the reactor kafkaConfiguration field
   *
   * @return ReceiverOptions
   */
  public ReceiverOptions<String, String> baseReceiverOptions() {
    Map<String, Object> props = new HashMap<>();
    props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaConfiguration.getBootstrapServers());
    props.put(ConsumerConfig.CLIENT_ID_CONFIG, kafkaConfiguration.getApplicationId());
    props.put(ConsumerConfig.GROUP_ID_CONFIG, kafkaConfiguration.getApplicationId());
    props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
    props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
    props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, kafkaConfiguration.getSessionTimeout());
    props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, kafkaConfiguration.getMaxPollInterval());
    props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, kafkaConfiguration.getMaxPollRecords());
    props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, kafkaConfiguration.getAutoCommit());
    props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG,
        kafkaConfiguration.getHeartbeatInterval());

    return ReceiverOptions.create(props);
  }

  /**
   * @param topics
   * @return ReceiverOptions with offset = earliest, batchSize = 10, commitInterval = 15
   * and the supplied topics
   */
  public ReceiverOptions<String, String> receiverOptions(Collection<String> topics) {
    return baseReceiverOptions()
        .consumerProperty(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest")
        .commitBatchSize(10)
        .commitInterval(Duration.ofSeconds(15L))
        .subscription(topics);
  }


  /**
   * Create a KafkaReceiver using the topic stored in the KafkaConfiguration field
   *
   * @return
   */
  public KafkaReceiver<String, String> createReceiver() {
    return KafkaReceiver.create(receiverOptions(
        Collections.singleton(kafkaConfiguration.getInputRsdfTopic())));
  }

  /**
   * Create KafkaReceiver object using system config values and a serializer of type T
   * Also uses the specified listeners
   * @param systemConfig
   * @param valueDeserializer
   * @param assignListeners
   * @param revokeListeners
   * @param <T>
   * @return KafkaReceiver built using the passed in args
   */
  public <T> KafkaReceiver<String, T> createReceiver(SystemConfig systemConfig,
      Deserializer<T> valueDeserializer,
      List<Consumer<Collection<ReceiverPartition>>> assignListeners,
      List<Consumer<Collection<ReceiverPartition>>> revokeListeners) {
    return createReceiver(
        systemConfig.getValue(APPLICATION_ID),
        systemConfig.getValue(KAFKA_BOOTSTRAP_SERVERS),
        systemConfig.getValue("input-topic"),
        valueDeserializer, assignListeners, revokeListeners);
  }

  /**
   *
   * @param applicationId
   * @param kafkaBootstrapServers
   * @param inputAceiTopic
   * @param valueDeserializer
   * @param assignListeners
   * @param revokeListeners
   * @param <T>
   * @return KafkaReceiver built using the passed in args
   */
  public <T> KafkaReceiver<String, T> createReceiver(String applicationId,
      String kafkaBootstrapServers, String inputAceiTopic,
      Deserializer<T> valueDeserializer,
      List<Consumer<Collection<ReceiverPartition>>> assignListeners,
      List<Consumer<Collection<ReceiverPartition>>> revokeListeners) {

    ReceiverOptions<String, T> receiverOptions = consumerProperties(applicationId,
        kafkaBootstrapServers,
        valueDeserializer);

    for (var listener : assignListeners) {
      receiverOptions = receiverOptions.addAssignListener(listener);
    }

    for (var listener : revokeListeners) {
      receiverOptions = receiverOptions.addRevokeListener(listener);
    }

    return KafkaReceiver.create(receiverOptions.subscription(List.of(inputAceiTopic)));
  }

  public <T> ReceiverOptions<String, T> consumerProperties(String applicationId,
      String bootstrapServers, Deserializer<T> valueDeserializer) {
    Map<String, Object> properties = new HashMap<>();
    properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
    properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
    properties.put(ConsumerConfig.CLIENT_ID_CONFIG, applicationId);
    properties.put(ConsumerConfig.GROUP_ID_CONFIG, applicationId);
    properties.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
    properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "true");
    properties.put(ConsumerConfig.RECONNECT_BACKOFF_MS_CONFIG, 1000);
    properties.put(ConsumerConfig.RECONNECT_BACKOFF_MAX_MS_CONFIG, 20000);

    return ReceiverOptions.<String, T>create(properties).withValueDeserializer(valueDeserializer);
  }


  /**
   * ConsumerRunner constructor with custom input topic
   *
   * @param systemConfig              - SystemConfig (mock)
   * @param inputTopic                - InputTopic to read
   * @param recordParser              - RecordParser for InputTopic
   * @param recordConsumer            - KafkaConsumer
   * @param consumerRebalanceListener - Partition rebalancing
   * @return KafkaConsumerRunner
   */
  public <T> KafkaConsumerRunner<T> createConsumerRunner(SystemConfig systemConfig,
      String inputTopic, Function<String, Optional<T>> recordParser,
      Consumer<Collection<T>> recordConsumer,
      Supplier<Optional<ConsumerRebalanceListener>> consumerRebalanceListener) {

    Properties consumerProperties = buildConsumerProperties(systemConfig);
    String subscriptionTopic = systemConfig.getValue(inputTopic);
    Duration pollingInterval = Duration
        .ofSeconds(systemConfig.getValueAsLong(BATCH_SIZE_IN_SECONDS));

    final RetryPolicy<Object> kafkaConnectionPolicy = new RetryPolicy<>()
        .withBackoff(50, 1000, ChronoUnit.MILLIS)
        .withMaxAttempts(100)
        .handle(KafkaException.class)
        .onFailedAttempt(e -> logger.warn("Failed connecting to kafka broker, will try again..."));

    org.apache.kafka.clients.consumer.Consumer<String, String> kafkaConsumer = Failsafe
        .with(kafkaConnectionPolicy).get(() -> new KafkaConsumer<>(consumerProperties));

    return KafkaConsumerRunner.create(kafkaConsumer, subscriptionTopic, pollingInterval,
        recordParser, recordConsumer, consumerRebalanceListener);
  }

  /**
   * Populates a {@link Properties} using well-known keys to retrieve values from {@link
   * SystemConfig} for use by the {@link Consumer}
   *
   * @param config System configuration access
   * @return Properties for the consumer
   */
  private Properties buildConsumerProperties(SystemConfig config) {
    // create properties to construct the consumer
    Properties properties = new Properties();
    properties.put(ConsumerConfig.GROUP_ID_CONFIG,
        config.getValue(APPLICATION_ID));
    properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,
        config.getValue(KAFKA_BOOTSTRAP_SERVERS));
    properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG,
        config.getValue(KAFKA_KEY_DESERIALIZER));
    properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG,
        config.getValue(KAFKA_VALUE_DESERIALIZER));
    properties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG,
        config.getValue(KAFKA_CONSUMER_SESSION_TIMEOUT));
    properties.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG,
        config.getValue(KAFKA_CONSUMER_HEARTBEAT_INTERVAL));

    //
    // We want more control over  commits to broker list to make sure we handled all messages
    //
    properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);

    return properties;
  }

  /////copied in from KafkaProducerFactory

  /**
   *
   * @param clientId
   * @param bootstrapServer
   * @param retries
   * @param retryBackoff
   * @param systemConfig
   * @return KafkaProducer built using params and serializers from the system config
   */
  public static KafkaProducer<String, String> getProducer(String clientId,
      String bootstrapServer,
      int retries,
      long retryBackoff, SystemConfig systemConfig) {

    KafkaConnectionConfiguration kafkaConfig = KafkaConnectionConfiguration.create(systemConfig);
    Properties props = new Properties();
    props.put(ProducerConfig.CLIENT_ID_CONFIG, clientId);
    props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServer);
    props.put(ProducerConfig.RETRIES_CONFIG, retries);
    props.put(ProducerConfig.RETRY_BACKOFF_MS_CONFIG, retryBackoff);
    props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, kafkaConfig.getKeySerializer());
    props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, kafkaConfig.getValueSerializer());
    props.put(ProducerConfig.RECONNECT_BACKOFF_MS_CONFIG, 1000);
    props.put(ProducerConfig.RECONNECT_BACKOFF_MAX_MS_CONFIG, 20000);

    return new KafkaProducer<>(props);
  }


}
