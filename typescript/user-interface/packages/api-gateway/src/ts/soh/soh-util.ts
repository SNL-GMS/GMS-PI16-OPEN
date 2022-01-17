import { ConfigurationTypes, SohTypes } from '@gms/common-model';
import { epochSecondsNow, MILLISECONDS_IN_SECOND, toOSDTime, uuid4 } from '@gms/common-util';

import { ProcessingStationProcessor } from '../station/processing-station/processing-station-processor';
import { AcknowledgedSohStatusChange, SohStatusChange } from './types';

export const LIKELY_HOOD_OF_DATE_CHANGE = 0.75;

/**
 * Creates a base status change to be modified later
 */
export const createAcknowledgedStatusChange = (
  userName: string,
  stationName: string,
  unacknowledgedChanges: SohStatusChange[],
  comment?: string
): AcknowledgedSohStatusChange => ({
  acknowledgedAt: toOSDTime(Date.now() / MILLISECONDS_IN_SECOND),
  acknowledgedBy: userName,
  comment,
  id: uuid4(),
  acknowledgedStation: stationName,
  acknowledgedChanges: unacknowledgedChanges
});

const getStationGroups = (stationName: string): SohTypes.StationSohCapabilityStatus[] => {
  const groups = ProcessingStationProcessor.Instance().getSohStationGroupNames(stationName);
  return groups.map(g => ({
    groupName: g.name,
    stationName,
    sohStationCapability: SohTypes.SohStatusSummary.NONE
  }));
};

export const createEmptyStationSoh = (stationName: string): SohTypes.UiStationSoh => ({
  id: stationName,
  uuid: uuid4(),
  stationName,
  sohStatusSummary: SohTypes.SohStatusSummary.NONE,
  needsAcknowledgement: false,
  needsAttention: false,
  time: epochSecondsNow(),
  statusContributors: [],
  stationGroups: getStationGroups(stationName),
  channelSohs: [],
  allStationAggregates: []
});

export const createStationGroupSohStatus = (
  stationGroupConfig: ConfigurationTypes.SOHStationGroupNameWithPriority[]
): SohTypes.StationGroupSohStatus[] => {
  const stationGroupSohMap = stationGroupConfig.map(sgc => ({
    stationGroupName: sgc.name,
    time: Date.now(), // change to timeMs
    groupCapabilityStatus: SohTypes.SohStatusSummary.NONE,
    id: sgc.name,
    priority: sgc.priority
  }));
  return stationGroupSohMap;
};
