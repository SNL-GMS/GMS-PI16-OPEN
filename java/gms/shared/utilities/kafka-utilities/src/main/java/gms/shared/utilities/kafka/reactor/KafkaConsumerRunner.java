package gms.shared.utilities.kafka.reactor;

import static java.util.Collections.singleton;
import static java.util.stream.Collectors.toList;

import java.time.Duration;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.StreamSupport;
import org.apache.kafka.clients.consumer.ConsumerRebalanceListener;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.common.errors.WakeupException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class KafkaConsumerRunner<T> implements Runnable {

  private static final Logger logger = LoggerFactory.getLogger(KafkaConsumerRunner.class);

  private final AtomicBoolean closed = new AtomicBoolean(false);
  private final org.apache.kafka.clients.consumer.Consumer<String, String> messagePoller;
  private final String subscriptionTopic;
  private final Duration pollingInterval;
  private final Function<String, Optional<T>> recordParser;
  private final Consumer<Collection<T>> recordConsumer;
  private final Supplier<Optional<ConsumerRebalanceListener>> consumerRebalanceListener;

  private KafkaConsumerRunner(
      org.apache.kafka.clients.consumer.Consumer<String, String> messagePoller,
      String subscriptionTopic, Duration pollingInterval,
      Function<String, Optional<T>> recordParser,
      Consumer<Collection<T>> recordConsumer,
      Supplier<Optional<ConsumerRebalanceListener>> consumerRebalanceListener) {
    this.messagePoller = messagePoller;
    this.subscriptionTopic = subscriptionTopic;
    this.pollingInterval = pollingInterval;
    this.recordParser = recordParser;
    this.recordConsumer = recordConsumer;
    this.consumerRebalanceListener = consumerRebalanceListener;
  }

  public static <T> KafkaConsumerRunner<T> create(
      org.apache.kafka.clients.consumer.Consumer<String, String> messagePoller,
      String subscriptionTopic, Duration pollingInterval,
      Function<String, Optional<T>> recordParser,
      Consumer<Collection<T>> recordConsumer,
      Supplier<Optional<ConsumerRebalanceListener>> consumerRebalanceListener) {
    return new KafkaConsumerRunner<>(messagePoller, subscriptionTopic, pollingInterval,
        recordParser, recordConsumer, consumerRebalanceListener);
  }

  @Override
  public void run() {
    try {
      final Set<String> subscriptionTopicList = singleton(subscriptionTopic);
      if (consumerRebalanceListener.get().isEmpty()) {
        messagePoller.subscribe(subscriptionTopicList);
      } else {
        messagePoller
            .subscribe(subscriptionTopicList, consumerRebalanceListener.get().orElseThrow());
      }
      while (!closed.get()) {
        ConsumerRecords<String, String> recordStrings = messagePoller.poll(pollingInterval);
        List<T> records = parseRecords(recordStrings);
        recordConsumer.accept(records);
        messagePoller.commitSync();
      }
    } catch (WakeupException e) {
      logger.info("wakeup triggered", e);
      // Ignore exception if closing
      if (!closed.get()) {
        throw e;
      }
    } finally {
      messagePoller.close();
    }

  }

  /**
   * Parses ConsumerRecords of string-representation records into an ordered list of typed records.
   * Ordering was deliberately maintained in order to preserve the order the messages arrived.
   *
   * @param recordStrings Collection of records represented as strings polled from the
   *                      messagePoller
   * @return List of parsed records
   */
  private List<T> parseRecords(ConsumerRecords<String, String> recordStrings) {
    return StreamSupport.stream(recordStrings.records(subscriptionTopic).spliterator(), false)
        .map(ConsumerRecord::value)
        .map(recordParser)
        .flatMap(Optional::stream)
        .collect(toList());
  }

  /**
   * Shutdown hook which can be called from a separate thread
   */
  public void shutdown() {
    closed.set(true);
    messagePoller.wakeup();
  }

  /**
   * Get the message poller
   *
   * @return the message poller, an instance of {@link org.apache.kafka.clients.consumer.Consumer}
   */
  public org.apache.kafka.clients.consumer.Consumer<String, String> getMessagePoller() {
    return messagePoller;
  }
}
