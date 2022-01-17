import { SohTypes } from '@gms/common-model';
import { DataAcquisitionWorkspaceTypes } from '@gms/ui-state';

export const sohStatus: DataAcquisitionWorkspaceTypes.SohStatus = {
  lastUpdated: 0,
  loading: false,
  error: undefined,
  isStale: false,
  stationAndStationGroupSoh: {
    isUpdateResponse: false,
    stationGroups: [],
    stationSoh: ['ABC', 'TEST'].map((stationName, index) => ({
      id: stationName,
      uuid: stationName,
      needsAcknowledgement: !!index,
      needsAttention: !!index,
      sohStatusSummary: undefined,
      stationGroups: [],
      statusContributors: [],
      time: undefined,
      stationName,
      allStationAggregates: [],
      channelSohs: [
        {
          channelName: 'adsf',
          channelSohStatus: undefined,
          allSohMonitorValueAndStatuses: [
            {
              monitorType: SohTypes.SohMonitorType.LAG,
              value: 10,
              valuePresent: true,
              status: SohTypes.SohStatusSummary.GOOD,
              hasUnacknowledgedChanges: !!index,
              contributing: false,
              quietUntilMs: 1,
              thresholdBad: 3,
              thresholdMarginal: 3
            },
            {
              monitorType: SohTypes.SohMonitorType.LAG,
              value: 11,
              valuePresent: true,
              status: SohTypes.SohStatusSummary.GOOD,
              hasUnacknowledgedChanges: !!index,
              contributing: false,
              quietUntilMs: 1,
              thresholdBad: 3,
              thresholdMarginal: 3
            }
          ]
        }
      ]
    }))
  }
};
