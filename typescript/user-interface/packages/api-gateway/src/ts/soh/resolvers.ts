// GraphQL Resolvers
import { SohTypes } from '@gms/common-model';
import config from 'config';

import { UserContext } from '../cache/types';
import { SohProcessor } from './soh-processor';

// Load configuration settings
const settings = config.get('performanceMonitoring');

export const resolvers = {
  // Query Resolvers
  Query: {
    // Returns the station and station Group SOH information by time range
    stationAndStationGroupSoh: (): SohTypes.StationAndStationGroupSoh =>
      SohProcessor.Instance().getStationAndGroupSohWithEmptyChannels(),

    // Returns the historical acei information by station and time range
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    historicalAceiByStation: async (_, { queryInput }) =>
      SohProcessor.Instance().getHistoricalAceiData(queryInput),

    // Returns the populated UiChannelSoh for a station
    channelSohForStation: (
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      _,
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      { stationName }
    ): { channelSohs: SohTypes.ChannelSoh[]; stationName: string; uuid: string } => {
      const stationSoh = SohProcessor.Instance().getSohForStation(stationName);
      if (!stationSoh) {
        return {
          channelSohs: [],
          stationName,
          uuid: undefined
        };
      }
      return {
        channelSohs: stationSoh.channelSohs,
        stationName: stationSoh.stationName,
        uuid: stationSoh.id
      };
    }
  },

  // Mutation Resolvers
  Mutation: {
    // Acknowledges the SOH status for the provided station names
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    acknowledgeSohStatus: (_, { stationNames, comment }, userContext: UserContext) => {
      SohProcessor.Instance().publishAcknowledgeSohStatus(userContext, stationNames, comment);
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    quietChannelMonitorStatuses: (
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      _,
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      { channelMonitorsToQuiet },
      userContext: UserContext
    ) => {
      // eslint-disable-next-line no-console
      console.log(`inside resolve quiet channels`);
      SohProcessor.Instance().publishQuietChannelMonitorStatuses(
        userContext,
        channelMonitorsToQuiet
      );
      return { stationGroups: [], stationSoh: [], isUpdateResponse: false };
    }
  },

  // Subscription Resolvers
  Subscription: {
    // SOH Status subscription - returns the latest updated SOH data
    sohStatus: {
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      subscribe: () =>
        SohProcessor.Instance().pubsub.asyncIterator(settings.subscriptions.channels.sohStatus)
    }
  },

  // Field Resolvers
  // TODO: Fix the time field names so not needed to convert to epoch seconds to theUI
  UiStationSoh: {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    time: (uiStationSoh: SohTypes.UiStationSoh) => uiStationSoh.time / 1000
  },
  StationGroupSohStatus: {
    time: (stationGroup: SohTypes.StationGroupSohStatus): number => stationGroup.time / 1000
  }
};
