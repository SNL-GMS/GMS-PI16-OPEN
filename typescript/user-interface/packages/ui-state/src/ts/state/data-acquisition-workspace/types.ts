import { ReferenceStationTypes, SohTypes } from '@gms/common-model';
import { createEnumTypeGuard } from '@gms/common-util';
import { ApolloError } from 'apollo-client';

import { ActionWithPayload } from '../util/action-helper';

export type SET_SELECTED_PROCESSING_STATION = ActionWithPayload<
  ReferenceStationTypes.ReferenceStation
>;

export type SET_UNMODIFIED_PROCESSING_STATION = ActionWithPayload<
  ReferenceStationTypes.ReferenceStation
>;

export type SET_SOH_STATUS = ActionWithPayload<SohStatus>;

export type SET_SELECTED_ACEI_TYPE = ActionWithPayload<SohTypes.AceiType>;

export enum KeyAction {}
// placeholder

// Placeholder for future SOH key actions
export const KeyActions: Map<string, KeyAction> = new Map([]);

/**
 * The SOH Status
 */
export interface SohStatus {
  /** timestamp of when the data was last updated */
  lastUpdated: number;
  /* true if the station soh is stale; false otherwise */
  isStale: boolean;
  /** true if the initial apollo query is still loading (has not completed) */
  loading: boolean;
  /** any error information that may have occurred on the initial apollo query */
  error: ApolloError;
  /** the station and station group SOH data */
  stationAndStationGroupSoh: SohTypes.StationAndStationGroupSoh;
}

export interface DataAcquisitionWorkspaceState {
  selectedAceiType: SohTypes.AceiType;
  selectedProcessingStation: ReferenceStationTypes.ReferenceStation;
  unmodifiedProcessingStation: ReferenceStationTypes.ReferenceStation;
  data: {
    sohStatus: SohStatus;
  };
}

export const isDataAcquisitionKeyAction = createEnumTypeGuard(KeyAction);
