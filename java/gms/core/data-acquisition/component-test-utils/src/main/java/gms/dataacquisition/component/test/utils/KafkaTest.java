package gms.dataacquisition.component.test.utils;

import gms.shared.frameworks.injector.FluxFactory;
import gms.shared.frameworks.injector.InjectableType;
import gms.shared.frameworks.injector.Modifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;
import java.util.function.Supplier;

@Testcontainers
public abstract class KafkaTest {

  private static final AtomicInteger initialized = new AtomicInteger(0);

  private static final Logger logger = LoggerFactory.getLogger(KafkaTest.class);

  private final Map<InjectableType, Flux<Object>> dataGenerators = new HashMap<>();
  private final List<AbstractKafkaConsumerApplication<?>> kafkaConsumers = new ArrayList<>();

  private String bootstrapServersString;

  protected int initialDelay = 0;


  @Container
  public static final KafkaContainer kafka =
      new KafkaContainer(
          DockerImageName.parse("confluentinc/cp-kafka:5.4.3")
              .asCompatibleSubstituteFor("confluentinc/cp-kafka"))
          .withEmbeddedZookeeper()
          .withStartupAttempts(5)
          .waitingFor(Wait.forLogMessage(".*Awaiting socket connections on 0.0.0.0:9093.*\\n", 1));

  /**
   * Create network, start ZooKeeper and Kafka
   */
  protected void initialize() {
    logger.info("Initializing component test");

    initialized.set(0);

    Runtime.getRuntime().addShutdownHook(new Thread() {
      @Override
      public void run() {
        //Try to always run cleanup
        cleanup();
      }
    });

    if (!kafka.isRunning()) {
      kafka.start();
    }

    bootstrapServersString = kafka.getBootstrapServers();

    initialized.set(1);
    logger.info("Initialization complete");
  }

  /**
   * Remove the network and containers
   */
  protected void cleanup() {

    if (initialized.get() == 1) {
      kafka.close();
      logger.info("Cleanup complete");
    }
  }

  /**
   * Start the consumers and data generators
   */
  protected void run() {
    kafkaConsumers.forEach(AbstractKafkaConsumerApplication::run);
    Flux.fromIterable(this.dataGenerators.keySet())
        .parallel()
        .runOn(Schedulers.boundedElastic())
        .map(this.dataGenerators::get)
        .doOnNext(Flux::blockLast)
        .sequential()
        .blockLast();
  }

  /**
   * Add a data generator
   *
   * @param injectableType      the type of data to inject
   * @param generationFrequency frequency with which to inject data
   * @param batchCount          number of batches to inject
   * @param batchSize           number of items in each batch
   * @param supplier            a function that creates data to be injected
   * @param modifier            a data modifier
   * @param consumer            a function that does something with the data that is created e.g.
   *                            produce to a Kafka topic
   */
  protected void addDataGenerator(InjectableType injectableType, Duration generationFrequency,
      int batchCount, int batchSize, Supplier<Object> supplier, Modifier modifier,
      Consumer<Iterable<Object>> consumer) {
    dataGenerators.put(injectableType,
        FluxFactory.createBoundedFlux(
            batchCount,
            initialDelay,
            generationFrequency,
            batchSize,
            supplier,
            modifier,
            consumer,
            e -> logger.error(e.getMessage(), e))
            .doOnComplete(
                () -> logger.info("Processed data for {}", injectableType)));
  }

  /**
   * Add a consumer
   *
   * @param kafkaConsumer an instance of {@link AbstractKafkaConsumerApplication}
   */
  protected void addKafkaConsumer(AbstractKafkaConsumerApplication<Object> kafkaConsumer) {
    kafkaConsumers.add(kafkaConsumer);
  }

  /**
   * Get the Logger
   *
   * @return the current Logger
   */
  protected Logger getLogger() {
    return logger;
  }

  /**
   * Get the Kafka bootstrap server string e.g. localhost:53412
   *
   * @return the boostrap server connection string
   */
  protected String getBootstrapServersString() {
    return bootstrapServersString;
  }

}
