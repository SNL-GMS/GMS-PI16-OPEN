import { ConfigurationTypes } from '@gms/common-model';
import { convertDurationToMilliseconds, convertDurationToSeconds } from '@gms/common-util';

import { getLogLevel } from '../log/gateway-logger';
import { ConfigurationProcessor } from './configuration-processor';

// GraphQL Resolvers
export const resolvers = {
  // Query resolvers
  Query: {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    uiAnalystConfiguration: () => {
      const logLevel = getLogLevel();
      // disable because the linter will automatically reformat this line to be too long
      /* eslint-disable max-len */
      const analystConfiguration: ConfigurationTypes.ProcessingAnalystConfiguration = ConfigurationProcessor.Instance().getAnalystConfiguration();
      const sohConfiguration: ConfigurationTypes.SohConfiguration = ConfigurationProcessor.Instance().getSohConfiguration();
      const commonConfiguration: ConfigurationTypes.ProcessingCommonConfiguration = ConfigurationProcessor.Instance().getCommonConfiguration();
      const sohParams = sohConfiguration.stationSohMonitoringDisplayParameters;
      /* eslint-enable max-len */

      return {
        logLevel,
        defaultNetwork: analystConfiguration.defaultNetwork,
        defaultFilters: analystConfiguration.defaultFilters,
        sohStationGroupNames: ConfigurationProcessor.Instance().getStationGroupNamesWithPriorities(),
        redisplayPeriod: convertDurationToMilliseconds(sohParams.redisplayPeriod),
        reprocessingPeriod: convertDurationToSeconds(
          sohConfiguration.stationSohControlConfiguration.reprocessingPeriod
        ),
        acknowledgementQuietDuration: convertDurationToMilliseconds(
          sohParams.acknowledgementQuietDuration
        ),
        availableQuietDurations: sohParams.availableQuietDurations.map(
          convertDurationToMilliseconds
        ),
        sohStationStaleTimeMS: convertDurationToMilliseconds(sohParams.sohStationStaleDuration),
        sohHistoricalDurations: sohParams.sohHistoricalDurations.map(convertDurationToMilliseconds),
        systemMessageLimit: commonConfiguration.systemMessageLimit
      };
    }
  }
};
