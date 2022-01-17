import { SystemMessageTypes } from '@gms/common-model';
import config from 'config';
import { PubSub } from 'graphql-subscriptions';
import * as Immutable from 'immutable';

import { KafkaConsumer } from '../kafka/kafka-consumer';
import { gatewayLogger as logger } from '../log/gateway-logger';
import { HttpClientWrapper, HttpResponse } from '../util/http-wrapper';
import * as systemMessageMockBackend from './system-message-mock-backend';

/**
 * The processor that handles system messages
 */
export class SystemMessageProcessor {
  /**
   * Returns the singleton instance of the system message processor.
   *
   * @returns the instance of the system message processor
   */
  public static Instance(): SystemMessageProcessor {
    if (SystemMessageProcessor.instance === undefined) {
      SystemMessageProcessor.instance = new SystemMessageProcessor();
      SystemMessageProcessor.instance.initialize();
    }
    return SystemMessageProcessor.instance;
  }

  /** The singleton instance */
  private static instance: SystemMessageProcessor;

  /** Settings */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly settings: any;

  /** KAFKA settings */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly kafkaSettings: any;

  /** Pubsub for apollo graphql */
  public readonly pubsub: PubSub = new PubSub();

  /** Http wrapper for client */
  public httpWrapper: HttpClientWrapper;

  /** constructor */
  private constructor() {
    this.settings = config.get('systemMessage');
    this.kafkaSettings = config.get('kafka');
    this.httpWrapper = new HttpClientWrapper();
  }

  /**
   * @returns a array of SystemMessagesDefinition
   */
  public async getSystemMessageDefinitions():
    | Promise<SystemMessageTypes.SystemMessageDefinition[]>
    | undefined {
    // Retrieve the request configuration for the service call
    const { requestConfig } = this.settings.backend.services.getSystemMessageDefinitions;

    logger.debug(
      `Calling get system message definitions query with request: ${JSON.stringify(requestConfig)}`
    );

    // passing 'test' since their request needs something, this will one day not be needed
    const response: HttpResponse<
      SystemMessageTypes.SystemMessageDefinition[]
    > = await this.httpWrapper.request<SystemMessageTypes.SystemMessageDefinition[]>(
      requestConfig,
      'test'
    );

    // Test if we got back a legit response
    if (response && response.data) {
      logger.info(`Returning system message definitions data size ${response.data.length}`);
      return response.data;
    }
    return undefined;
  }

  /**
   * Handle and consume messages for the registered KAFKA topics
   *
   * @param topic the topic
   * @param messages the messages
   */
  public consumeSystemMessages(
    topic: string,
    messages: Immutable.List<SystemMessageTypes.SystemMessage>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    new Promise<void>(resolve => {
      if (topic !== undefined || messages !== undefined) {
        if (topic === this.kafkaSettings.consumerTopics.systemMessagesTopic) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.pubsub
            .publish(this.settings.subscriptions.systemMessages, {
              systemMessages: messages
            })
            .catch(() => logger.error(`Failed to publish system message to subscription`));
        } else {
          logger.warn(`Received data for unknown topic: ${topic} ${messages.size}`);
        }
        resolve();
      }
    }).catch(error => {
      logger.warn(`Failed to consume system messages ${error}`);
    });
  }

  /**
   * Register the KAFKA consumer callbacks for topics.
   */
  public registerKafkaConsumerCallbacks(): void {
    logger.info(`registering the kafka consumer callbacks for system messages`);
    // register the callbacks for the topics
    KafkaConsumer.Instance().registerKafkaConsumerCallbackForTopics<
      SystemMessageTypes.SystemMessage
    >([this.kafkaSettings.consumerTopics.systemMessagesTopic], (topic, messages) =>
      this.consumeSystemMessages(topic, messages)
    );
  }

  /**
   * Loads seed data from the backend
   */
  private initializeBackend() {
    systemMessageMockBackend.initialize(this.httpWrapper.createHttpMockWrapper());
  }

  /**
   * Initializes the processor.
   */
  private initialize() {
    logger.info(
      'Initializing the system message processor - Mock Enable: %s',
      this.settings.backend.mock.enable
    );
    if (this.settings.backend.mock.enable) {
      this.initializeBackend();
    }
  }
}
