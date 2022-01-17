import { SohTypes } from '@gms/common-model';
import { convertSecondsToDuration, MILLISECONDS_IN_SECOND, toOSDTime } from '@gms/common-util';
import config from 'config';
import { PubSub } from 'graphql-subscriptions';
import * as Immutable from 'immutable';

import { UserContext } from '../cache/types';
import { ConfigurationProcessor } from '../configuration/configuration-processor';
import { KafkaConsumer } from '../kafka/kafka-consumer';
import { KafkaProducer } from '../kafka/kafka-producer';
import { gatewayLogger as logger } from '../log/gateway-logger';
import { ProcessingStationProcessor } from '../station/processing-station/processing-station-processor';
import { HttpClientWrapper, HttpResponse } from '../util/http-wrapper';
import * as sohMockBackend from './soh-mock-backend';
import {
  createAcknowledgedStatusChange,
  createEmptyStationSoh,
  createStationGroupSohStatus
} from './soh-util';
import * as model from './types';

/** Delay between the initial connection to kafka and publishing the first set of SOH */
const QUARTER_SECOND_MS = 250;
const HALF_SECOND_MS = 500;

/**
 * The processor that handles and reformats SOH data. Keeps track of Acknowledge/quieting.
 */
export class SohProcessor {
  /**
   * Returns the singleton instance of the cache processor.
   *
   * @returns the instance of the cache processor
   */
  public static Instance(): SohProcessor {
    if (SohProcessor.instance === undefined) {
      SohProcessor.instance = new SohProcessor();
      SohProcessor.instance.initialize();
    }
    return SohProcessor.instance;
  }

  /** The singleton instance */
  private static instance: SohProcessor;

  /** Settings */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly settings: any;

  /** KAFKA settings */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly kafkaSettings: any;

  /* The kafka message consumed helps when to publish */
  private lastKafkaMessageTimestamp = 0;

  private kafkaQueuedSohData: Immutable.Map<string, SohTypes.UiStationSoh> = Immutable.Map<
    string,
    SohTypes.UiStationSoh
  >();

  private latestQueuedSohData: Immutable.Map<string, SohTypes.UiStationSoh> = Immutable.Map<
    string,
    SohTypes.UiStationSoh
  >();

  private stationGroups: SohTypes.StationGroupSohStatus[] = [];

  /** Pubsub for apollo graphql */
  public readonly pubsub: PubSub = new PubSub();

  /** Delay between publishing new SOH to the UI */
  /** Default is 20 seconds will be read from Configuration SOH Update Interval */
  public BATCHING_DELAY_MS: number = undefined;

  /** Quiet interval from Configuration in milliseconds */
  public DEFAULT_QUIET_INTERVAL_MS: number = undefined;

  /** Http wrapper for client */
  public httpWrapper: HttpClientWrapper;

  /** Map that tracks which stations have been acknowledged */
  public isStationAcknowledged: Map<string, boolean>;

  private constructor() {
    this.settings = config.get('performanceMonitoring');
    this.kafkaSettings = config.get('kafka');
    this.httpWrapper = new HttpClientWrapper();
  }

  /**
   * Returns Station and Station Group SOH from the provided station SOH data.
   *
   * @param stationSohs the station SOH data
   * TODO - Optimize when possible
   */
  public getUiStationAndStationGroupSOH(
    stationSohs: SohTypes.UiStationSoh[],
    isUpdateResponse: boolean
  ): SohTypes.StationAndStationGroupSoh {
    return {
      stationGroups: this.stationGroups,
      stationSoh: this.stationGroups.length === 0 ? [] : stationSohs,
      isUpdateResponse
    };
  }

  /**
   * Gets the most recent (latest) SOH entry for all stations.
   */
  public getSohForAllStations(): SohTypes.UiStationSoh[] {
    return Array.from(this.kafkaQueuedSohData.values());
  }

  /**
   * Returns the most recent (latest) for all Station and StationGroup SOH.
   */
  public getStationAndGroupSohWithEmptyChannels(): SohTypes.StationAndStationGroupSoh {
    const uiStationSohs: SohTypes.UiStationSoh[] = this.getSohForAllStations();
    // Blank out the channelSohs for each station soh
    const updatedSohs = uiStationSohs.map(soh => ({
      ...soh,
      channelSohs: []
    }));
    const stationGroupAndStations: SohTypes.StationAndStationGroupSoh = {
      stationGroups: this.stationGroups,
      stationSoh: updatedSohs,
      isUpdateResponse: false
    };
    return stationGroupAndStations;
  }

  /**
   * Retrieve UiStationSoh for station name
   */
  public getSohForStation(stationName: string): SohTypes.UiStationSoh | undefined {
    if (stationName && this.kafkaQueuedSohData.has(stationName)) {
      return this.kafkaQueuedSohData.get(stationName);
    }
    return undefined;
  }

  /**
   * Check if need to send batched SOH Status Changes to UIs
   */
  public checkToSendSohStatusChanges(): void {
    // Check to see if we haven't had any data for 1/2 second or the update interval has expired
    // before sending the SOH Station data to UI subscribers
    const now = Date.now();
    if (!this.hasUiDataToSend() || now - this.lastKafkaMessageTimestamp < HALF_SECOND_MS) {
      return;
    }

    // Call method to publish the latest StationSoh entries
    this.publishUiStationAndStationSoh(this.getLatestStationAndGroupSohWithEmptyChannels());

    // Okay clear the latest StationSoh that were queued since sending
    this.clearLatestSohForAllStations();

    // Reset timestamps since just published
    this.lastKafkaMessageTimestamp = now;
  }

  /**
   * Quiet a given list of channel monitor pairs
   *
   * @param userContext context for user
   * @param channelMonitorsToQuiet an array of ChannelMonitorInputs
   * @returns StationAndStationGroups
   */
  public publishQuietChannelMonitorStatuses(
    userContext: UserContext,
    channelMonitorsToQuiet: SohTypes.ChannelMonitorInput[]
  ): void {
    channelMonitorsToQuiet.forEach(channelMonitorToQuiet => {
      logger.info(
        `Publishing soh quiet for channel(s): ${channelMonitorToQuiet.channelMonitorPairs
          .map(c => `${c.channelName}/${c.monitorType}`)
          .join(',')}` +
          ` by ${userContext.userName}${
            channelMonitorToQuiet.comment !== undefined ? ` : ${channelMonitorToQuiet.comment}` : ''
          }`
      );

      channelMonitorToQuiet.channelMonitorPairs.forEach(sohStatusChange => {
        // If there is not a quite timer already in place for the channel monitor pair, then add one
        // Using the default quiet interval. If a pair is quieted for a week, don't want it to be overwritten.
        const quietedUntilTime =
          (Date.now() + Number(channelMonitorToQuiet.quietDurationMs)) / MILLISECONDS_IN_SECOND;
        const quietedSohStatusChange: model.QuietedSohStatusChange = {
          stationName: channelMonitorToQuiet.stationName,
          sohMonitorType: sohStatusChange.monitorType,
          channelName: sohStatusChange.channelName,
          comment: channelMonitorToQuiet.comment,
          quietUntil: toOSDTime(quietedUntilTime),
          quietDuration: convertSecondsToDuration(
            channelMonitorToQuiet.quietDurationMs / MILLISECONDS_IN_SECOND
          ),
          quietedBy: userContext.userName
        };

        // Publish quiet channel changes called from UI mutation
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.publishQuietedChange(quietedSohStatusChange).catch(() =>
          logger.error(`Failed to publish quieted change with SOH producer`)
        );
      });
    });
  }

  /**
   * Acknowledges soh statuses for the provided station names.
   *
   * @param userContext the user context
   * @param stationNames the stations names to acknowledge SOH status
   * @param comment (optional) the comment for the acknowledgement
   */
  public publishAcknowledgeSohStatus(
    userContext: UserContext,
    stationNames: string[],
    comment?: string
  ): boolean {
    logger.info(
      `Publishing soh acknowledgment for station(s): ${stationNames.join(',')}` +
        ` by ${userContext.userName}${comment !== undefined ? ` : ${comment}` : ''}`
    );

    stationNames.forEach(stationName => {
      const stationSoh = this.getSohForStation(stationName);
      // Build the list of unacknowledged monitor/status pairs
      const uiStationSohs: model.SohStatusChange[] = [];
      stationSoh.channelSohs.forEach(channelSoh => {
        channelSoh.allSohMonitorValueAndStatuses.forEach(mvs => {
          if (mvs.hasUnacknowledgedChanges) {
            uiStationSohs.push({
              firstChangeTime: stationSoh.time,
              sohMonitorType: mvs.monitorType,
              changedChannel: channelSoh.channelName
            });
          }
        });
      });

      // Acknowledged all unacknowledged changes for the station
      if (uiStationSohs.length > 0) {
        const newAcknowledged = createAcknowledgedStatusChange(
          userContext.userName,
          stationName,
          uiStationSohs,
          comment
        );
        // eslint-disable-next-line no-void
        void this.publishAcknowledgedChange(newAcknowledged).catch(() =>
          logger.error(`Failed to publish acknowledged change with SOH producer`)
        );
      }
    });

    return true;
  }

  /**
   * Calls OSD Historical SOH endpoint for varies SOH monitors types.
   *
   * @param historicalSohInput Input is station name, start time, end time
   *  and SohMonitorType list example: MISSING, LAG
   * @returns UiHistoricalSoh
   */
  public async getHistoricalSohData(
    historicalSohInput: SohTypes.UiHistoricalSohInput
  ): Promise<SohTypes.UiHistoricalSoh> | undefined {
    // Handle undefined input time range
    if (!historicalSohInput) {
      throw new Error('Unable to retrieve historical soh data due to input');
    }

    // Handle undefined input channel ID list
    if (!historicalSohInput.stationName) {
      throw new Error(`Unable to retrieve historical soh data due to stationName`);
    }

    // Retrieve the request configuration for the service call
    const { requestConfig } = this.settings.backend.services.getHistoricalSohData;

    logger.debug(
      `Calling get Historical Soh query: ${JSON.stringify(
        historicalSohInput
      )} request: ${JSON.stringify(requestConfig)}`
    );

    const response: HttpResponse<SohTypes.UiHistoricalSoh> = await this.httpWrapper.request<
      SohTypes.UiHistoricalSoh
    >(requestConfig, historicalSohInput);

    // Test if we got back a legit response
    if (response && response.data) {
      if (response.data.monitorValues) {
        logger.debug(`Returning historical soh data size ${response.data.monitorValues.length}`);
      }
      return response.data;
    }
    return undefined;
  }

  /**
   * Calls OSD Historical SOH endpoint for acei data.
   *
   * @param historicalAceiInput Input is station name, start time, end time
   *  and ACEI type
   * @returns UiHistoricalAcei
   */
  public async getHistoricalAceiData(
    historicalAceiInput: SohTypes.UiHistoricalAceiInput
  ): Promise<SohTypes.UiHistoricalAcei[]> | undefined {
    // Handle undefined input
    if (!historicalAceiInput) {
      throw new Error('Unable to retrieve historical acei data due to input');
    }

    // Handle undefined input station name
    if (!historicalAceiInput.stationName) {
      throw new Error(`Unable to retrieve historical soh data due to missing stationName`);
    }
    // TODO: Request OSD Java to accept start and end time as numbers like what is done
    // TODO: with historical SOH
    // TODO: Also at the same time fix type input field to match monitorType return definition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const historicalAceiInputOSD: any = {
      stationName: historicalAceiInput.stationName,
      startTime: toOSDTime(historicalAceiInput.startTime / 1000),
      endTime: toOSDTime(historicalAceiInput.endTime / 1000),
      type: historicalAceiInput.type
    };
    // Retrieve the request configuration for the service call
    const { requestConfig } = this.settings.backend.services.getHistoricalAceiData;

    logger.debug(
      `Calling get Historical acei query: ${JSON.stringify(
        historicalAceiInputOSD
      )} request: ${JSON.stringify(requestConfig)}`
    );

    const response: HttpResponse<SohTypes.UiHistoricalAcei[]> = await this.httpWrapper.request<
      SohTypes.UiHistoricalAcei[]
    >(requestConfig, historicalAceiInputOSD);

    // Test if we got back a legit response
    if (response && response.data) {
      if (response.data.length > 0) {
        logger.debug(`Returning historical acei issues data size ${response.data.length}`);
      }
      return response.data;
    }
    return [];
  }

  /**
   * Handle and consume messages for the Ui soh KAFKA Topics
   *
   * @param topic the topic
   * @param messages the messages
   */
  public consumeUiStationSohKafkaMessages(
    topic: string,
    messages: Immutable.List<SohTypes.StationAndStationGroupSoh>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    new Promise<void>(resolve => {
      if (topic !== undefined || messages !== undefined) {
        logger.debug(`Consuming messages ${messages.size} for topic '${topic}'`);
        if (topic === this.kafkaSettings.consumerTopics.uiStationSoh) {
          // Last time got messages from Kafka consumer, helps when to publish
          this.lastKafkaMessageTimestamp = Date.now();

          // Build a list of timing point B messages and send them to the Kafka producer
          const now = Date.now();
          messages.forEach(stationAndStationGroupSoh => {
            try {
              const { isUpdateResponse } = stationAndStationGroupSoh;
              // See if this is a response to an ack or quiet notification
              if (stationAndStationGroupSoh.isUpdateResponse) {
                logger.info(
                  `processing update response message for station ` +
                    `${stationAndStationGroupSoh.stationSoh[0].stationName}`
                );
              }

              this.stationGroups = stationAndStationGroupSoh.stationGroups;
              stationAndStationGroupSoh.stationSoh.forEach(s => {
                // Add the UiStationSoh to the queue to be sent to the UI.
                // If this is a new UiStationSoh entry based on the UUID.
                // If it is a duplicate or an update response to Ack/Quiet don't log the Timing Point B
                if (this.addSohForStation(s, isUpdateResponse) && !isUpdateResponse) {
                  logger.timing(
                    `Timing point B: SOH object ${s.uuid} received in UI Backend at ` +
                      `${toOSDTime(now / MILLISECONDS_IN_SECOND)} SSAM creation time ${toOSDTime(
                        s.time / 1000
                      )}`
                  );
                }
              });
              // If this is an update response message send it immediately to be more responsive.
              // Also sending only the update response message allows the UI to filter it and not
              // log Timing Pt C messages. If not filtered will skew the results.
              if (isUpdateResponse) {
                const responseMessage: SohTypes.StationAndStationGroupSoh = {
                  stationGroups: stationAndStationGroupSoh.stationGroups,
                  stationSoh: this.clearChannelSohs(stationAndStationGroupSoh.stationSoh),
                  isUpdateResponse: true
                };
                this.publishUiStationAndStationSoh(responseMessage);
              }
            } catch (error) {
              logger.warn(`Error processing StationAndStationGroupSoh message: ${error}`);
              logger.warn(
                `StationAndStationGroupSoh json: ${JSON.stringify(
                  stationAndStationGroupSoh,
                  undefined,
                  2
                )}`
              );
            }
          });

          // Log the timestamp of each StationGroup message
          if (messages && messages.size > 0) {
            const sg = messages.get(0).stationGroups[0];
            logger.debug(
              `StationGroup ${sg.stationGroupName}  creation time ${toOSDTime(sg.time / 1000)}`
            );
          }
        } else {
          logger.warn(`Received data for unknown topic: ${topic} ${messages.size}`);
        }
        resolve();
      }
    }).catch(error => {
      logger.warn(`Failed to consume UI Station SOH messages ${error}`);
    });
  }

  /**
   * Sends (produces) the message to acknowledged an SOH change to KAFKA.
   */
  public readonly publishAcknowledgedChange = async (
    acknowledge: model.AcknowledgedSohStatusChange
  ): Promise<void> => {
    // Publish on acknowledgement on topic
    await KafkaProducer.Instance().send(this.kafkaSettings.producerTopics.acknowledgedTopic, [
      { value: JSON.stringify(acknowledge) }
    ]);
  };

  /**
   * Sends (produces) the message to quiet an SOH change to KAFKA.
   */
  public readonly publishQuietedChange = async (
    quieted: model.QuietedSohStatusChange
  ): Promise<void> => {
    // Publish on quiet channel on topic
    await KafkaProducer.Instance().send(this.kafkaSettings.producerTopics.quietedTopic, [
      { value: JSON.stringify(quieted) }
    ]);
  };

  /**
   * Register the KAFKA consumer callbacks for topics.
   */
  public registerKafkaConsumerCallbacks(): void {
    // register the UI station SOH callbacks for the topics
    KafkaConsumer.Instance().registerKafkaConsumerCallbackForTopics<
      SohTypes.StationAndStationGroupSoh
    >([this.kafkaSettings.consumerTopics.uiStationSoh], (topic, messages) =>
      this.consumeUiStationSohKafkaMessages(topic, messages)
    );
  }

  /**
   * Is there any UiStationSoh entries queued to send
   */
  private hasUiDataToSend(): boolean {
    return this.latestQueuedSohData.size > 0;
  }

  /**
   * Publishing the StationAndStationGroupSoh to the UI via the subscription
   *
   * @param stationAndStationGroup StationAndStationGroupSoh
   */
  private publishUiStationAndStationSoh(
    stationAndStationGroup: SohTypes.StationAndStationGroupSoh
  ): void {
    // Publish changes (executes a promise)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    new Promise<void>(resolve => {
      const settings = config.get('performanceMonitoring');
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.pubsub
        .publish(settings.subscriptions.channels.sohStatus, {
          sohStatus: stationAndStationGroup
        })
        .catch(e => logger.error('Failed to publish SOH data: ', e));
      resolve();
    }).catch(error => {
      logger.warn(`Failed to publish Station SOH messages ${error}`);
    });
  }

  /**
   * Returns the most recent (latest) Station and StationGroup SOH.
   */
  private getLatestStationAndGroupSohWithEmptyChannels(): SohTypes.StationAndStationGroupSoh {
    const uiStationSohs: SohTypes.UiStationSoh[] = this.getLatestSohForAllStations();
    // Blank out the channelSohs for each station soh
    const updatedSohs = this.clearChannelSohs(uiStationSohs);
    return {
      stationGroups: this.stationGroups,
      stationSoh: updatedSohs,
      isUpdateResponse: false
    };
  }

  /**
   * Returns UiStationSoh entries with the channel soh cleared out
   */
  // eslint-disable-next-line class-methods-use-this
  private clearChannelSohs(uiStationSohs: SohTypes.UiStationSoh[]): SohTypes.UiStationSoh[] {
    // Blank out the channelSohs for each station soh
    return uiStationSohs.map(soh => ({
      ...soh,
      channelSohs: []
    }));
  }

  /**
   * Gets the most recent (latest) SOH entry for all stations.
   */
  private getLatestSohForAllStations(): SohTypes.UiStationSoh[] {
    return Array.from(this.latestQueuedSohData.values());
  }

  /**
   * Clear the most recent (latest) SOH entry for all stations.
   */
  private clearLatestSohForAllStations(): void {
    this.latestQueuedSohData = Immutable.Map<string, SohTypes.UiStationSoh>();
  }

  /**
   * Add UiStationSoh to the map
   *
   * @param uiStationSoh latest UiStationSoh to add to queue
   * @param isUpdateResponse need to update the cache and queue
   *                         if this is an update from an ack or quiet
   * @return boolean if added to queue and map. If UiStationSoh UUID is already
   * in the map do not add it.
   */
  private addSohForStation(
    uiStationSoh: SohTypes.UiStationSoh,
    isUpdateResponse: boolean
  ): boolean {
    if (uiStationSoh) {
      // Check if this is a repeated UiStationSoh based on the UUID
      const mapUiStationSoh = this.kafkaQueuedSohData.get(uiStationSoh.stationName);
      if (isUpdateResponse || !mapUiStationSoh || mapUiStationSoh.uuid !== uiStationSoh.uuid) {
        this.kafkaQueuedSohData = this.kafkaQueuedSohData.set(
          uiStationSoh.stationName,
          uiStationSoh
        );
        // Add the UiStationSoh to the queue if not an update response from Ack or Quiet.
        // If it is an update response only replace an older UiStationSoh entry.
        if (!isUpdateResponse || this.latestQueuedSohData.has(uiStationSoh.stationName)) {
          this.latestQueuedSohData = this.latestQueuedSohData.set(
            uiStationSoh.stationName,
            uiStationSoh
          );
        }
        // Return true if not an update response
        return !isUpdateResponse;
      }
      // If we have already seen the UiStaionSoh entry log a warning and return false.
      logger.warn(`Duplicate UiStationSoh UUID ${uiStationSoh.uuid} found, dropping entry!`);
    }
    return false;
  }

  /**
   * Loads seed data from the backend
   */
  private initializeBackend() {
    sohMockBackend.initialize(this.httpWrapper.createHttpMockWrapper());
    sohMockBackend.getStationSohData().forEach(s => this.addSohForStation(s, false));
  }

  /**
   * Pushes new SOH data to client at the configured interval
   */
  private initializePublishingSohToClient() {
    setTimeout(() => {
      this.checkToSendSohStatusChanges();
    }, QUARTER_SECOND_MS);

    setInterval(() => {
      this.checkToSendSohStatusChanges();
    }, QUARTER_SECOND_MS);
  }

  /**
   * Initializes the processor.
   */
  private initialize() {
    logger.info(
      'Initializing the Data Acquisition SOH processor - Mock Enable: %s',
      this.settings.backend.mock.enable
    );

    // Load the Analyst Config intervals;
    this.BATCHING_DELAY_MS = ConfigurationProcessor.Instance().getSohUpdateIntervalForUser();
    this.DEFAULT_QUIET_INTERVAL_MS = ConfigurationProcessor.Instance().getSohDefaultQuietInterval();
    logger.info(
      `Initialize SOH Processor using BATCHING_DELAY_MS ${this.BATCHING_DELAY_MS} ` +
        `and DEFAULT_QUIET_INTERVAL_MS ${this.DEFAULT_QUIET_INTERVAL_MS}`
    );

    this.stationGroups = createStationGroupSohStatus(
      ConfigurationProcessor.Instance().getStationGroupNamesWithPriorities()
    );
    logger.info(
      `Initialize SOH Processor created stationGroup count: ${this.stationGroups.length}`
    );

    // populate map with empties
    const stations = ProcessingStationProcessor.Instance().getSohProcessingStations();
    stations.forEach(station => {
      this.addSohForStation(createEmptyStationSoh(station.name), false);
    });
    logger.info(`Initialize SOH Processor finished creating empty SOH Stations.`);
    if (this.settings.backend.mock.enable) {
      this.initializeBackend();
    }
    // TODO - initialize blank/empty stations with no real SOH data
    this.initializePublishingSohToClient();
    logger.info(`Finished initialization of SOH Processor.`);
  }
}
