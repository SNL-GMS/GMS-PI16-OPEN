package gms.dataacquisition.component.test.utils;

import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.kafka.reactor.KafkaConsumerRunner;
import gms.shared.utilities.kafka.reactor.ReactorKafkaFactory;
import org.apache.kafka.clients.consumer.ConsumerRebalanceListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collection;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Abstract template for a kafka consumer application, leveraging a DI ExecutorService for handling
 * message polling and consumption in parallel.
 *
 * @param <T> The type of records to be parsed and consumed
 */
public abstract class AbstractKafkaConsumerApplication<T> {

  private static final int THREAD_POOL_SIZE = 20;
  private static final String INPUT_TOPIC = "input-topic";

  private static final Logger logger = LoggerFactory
      .getLogger(AbstractKafkaConsumerApplication.class);

  private SystemConfig systemConfig;
  private ExecutorService executorService;
  private KafkaConsumerRunner<T> consumerRunner;
  private String inputTopic;

  /**
   * Setup and execution method for starting asynchronous message polling, parsing, and
   * consumption.
   */
  public final void run() {
    getLogger().info("Starting KafkaConsumerApplication {}", getComponentName());

    getLogger().info("Adding shutdown hooks...");
    Runtime.getRuntime().addShutdownHook(new Thread(this::shutdownAndAwaitTermination));

    try {
      getLogger().info("Initializing application state...");
      initialize();

      getLogger().info("Establishing kafka connection...");

      var kafkaFactory = new ReactorKafkaFactory(systemConfig);

      consumerRunner = kafkaFactory
          .createConsumerRunner(systemConfig, inputTopic, this::parseMessage, this::consumeRecords,
              this::getConsumerRebalanceListener);

      getLogger().info("Beginning message consumption...");
      executorService.execute(consumerRunner);

      getLogger().info("KafkaConsumerApplication {} started successfully", getComponentName());
    } catch (Exception e) {
      getLogger().error("Error running KafkaConsumerApplication. Shutting Down...", e);
      System.exit(1);
    }
  }

  /**
   * Initializes application state before starting message consumption. Protected to allow extending
   * initialization to subclass fields. It is important to always call the parent class' initialize
   * in subclass overrides to ensure this state is properly set.
   */
  protected void initialize() {
    if (this.systemConfig == null) {
      getLogger().info("Retrieving system configuration...");
      this.systemConfig = SystemConfig.create(getComponentName());
    }
    getLogger().info("Initializing executor service...");
    this.executorService = Executors.newFixedThreadPool(getThreadPoolSize());
    this.inputTopic = INPUT_TOPIC;
  }

  protected void setSystemConfig(SystemConfig systemConfig) {
    this.systemConfig = systemConfig;
  }

  protected void setInputTopic(String inputTopic) {
    this.inputTopic = inputTopic;
  }

  protected final Logger getLogger() {
    return logger;
  }

  protected final KafkaConsumerRunner<T> getConsumerRunner() {
    return consumerRunner;
  }

  /**
   * Subclass access to system configuration
   *
   * @return SystemConfig access
   */
  protected final SystemConfig getSystemConfig() {
    return systemConfig;
  }

  /**
   * Subclass access to executor service
   *
   * @return The ExecutorService used to run jobs
   */
  protected final ExecutorService getExecutorService() {
    return executorService;
  }

  /**
   * Simple thread pool size configuration with defaults. Override in subclass to adjust.
   *
   * @return Size of the thread pool executor service.
   */
  protected static int getThreadPoolSize() {
    return THREAD_POOL_SIZE;
  }

  /**
   * The name of the application component, used to retrieve system configuration
   *
   * @return Name of the component
   */
  protected abstract String getComponentName();

  /**
   * Parses a message string into a record. Used by {@link KafkaConsumerRunner} to parse messages.
   *
   * @param messageString String representation of a record message
   * @return The parsed record, or {@link Optional#empty()} if an error occurred
   */
  protected abstract Optional<T> parseMessage(String messageString);

  /**
   * Consumes records parsed from kafka messages. Used by {@link KafkaConsumerRunner} to consume
   * records.
   *
   * @param records Records parsed from polled messages
   */
  protected abstract void consumeRecords(Collection<T> records);

  /**
   * Define custom actions to take when the set of partitions assigned to the consumer changes.
   *
   * @return an {@link Optional} implementation of {@link ConsumerRebalanceListener}
   */
  protected Optional<ConsumerRebalanceListener> getConsumerRebalanceListener() {
    return Optional.empty();
  }

  protected void shutdownAndAwaitTermination() {
    if (consumerRunner != null) {
      getLogger().info("Shutting down KafkaConsumerRunner...");
      consumerRunner.shutdown();
    }

    if (executorService != null) {
      getLogger().info("Shutting down ExecutorService...");
      getExecutorService().shutdown();
      try {
        // Wait a while for existing tasks to terminate
        if (!getExecutorService().awaitTermination(60, TimeUnit.SECONDS)) {
          getExecutorService().shutdownNow(); // Cancel currently executing tasks
          // Wait a while for tasks to respond to being cancelled
          if (!getExecutorService().awaitTermination(60, TimeUnit.SECONDS)) {
            getLogger().error("Executor Service did not terminate");
          }
        }
      } catch (InterruptedException ie) {
        // (Re-)Cancel if current thread also interrupted
        getExecutorService().shutdownNow();
        // Preserve interrupt status
        Thread.currentThread().interrupt();
      }
    }

  }
}
