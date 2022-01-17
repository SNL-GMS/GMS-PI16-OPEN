import { PubSub } from 'graphql-subscriptions';
import flatMap from 'lodash/flatMap';

import { UserContext } from '../../cache/types';
import { gatewayLogger as logger } from '../../log/gateway-logger';
import { ProcessingStationProcessor } from './processing-station-processor';
import * as processingModel from './types';

/**
 * Resolvers for the waveform API gateway
 */

// Create the publish/subscribe API for GraphQL subscriptions
export const pubsub = new PubSub();

// GraphQL Resolvers
logger.info('Creating GraphQL resolvers for the processing station API...');
export const resolvers = {
  // Query resolvers
  Query: {
    // Retrieve the default set of stations configured to be included in the waveform display
    defaultProcessingStations: (
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      _,
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      __,
      userContext: UserContext
    ): processingModel.ProcessingStation[] => {
      logger.info(`Getting default processing stations. User: ${userContext.userName}`);
      return ProcessingStationProcessor.Instance().getDefaultProcessingStations();
    }
  },

  // Field resolver for Processing Station
  ProcessingStation: {
    // Returns only acquired (raw) channels. The station.channels contains derived channels as well as acquired
    channels: (station: processingModel.ProcessingStation): processingModel.ProcessingChannel[] =>
      flatMap<processingModel.ProcessingChannel>(
        station.channelGroups.map<processingModel.ProcessingChannel[]>(cg => cg.channels)
      )
  },

  // Field resolver for Processing Station
  ProcessingChannel: {
    // Returns displayable name for channel
    displayName: (channel: processingModel.ProcessingChannel): string => {
      // channel name is stationName.siteName.channelName (i.e PDAR.PD01.SHZ)
      // strip it down and return a display name of 'PD01 SHZ' (station is usually independent in UI displays)
      const names: string[] = channel.name.split('.');
      if (names && names.length === 3) {
        return `${names[1]} ${names[2]}`;
      }
      return channel.name;
    }
  }
};
