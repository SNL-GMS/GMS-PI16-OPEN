import { CommonTypes, WorkflowTypes } from '@gms/common-model';

import { ActionWithPayload } from '../../util/action-helper';

export enum ActionTypes {
  SET_TIME_RANGE = 'SET_TIME_RANGE',
  SET_STATION_GROUP = 'SET_STATION_GROUP',
  SET_OPEN_INTERVAL_NAME = 'SET_OPEN_INTERVAL_NAME',
  SET_OPEN_ACTIVITY_NAMES = 'SET_OPEN_ACTIVITY_NAMES',
  SET_ANALYSIS_MODE = 'SET_ANALYSIS_MODE'
}

export interface WorkflowState {
  timeRange: CommonTypes.TimeRange;
  stationGroup: WorkflowTypes.StationGroup;
  openIntervalName: string; // e.x AL1
  openActivityNames: string[]; // e.x Event Review
  analysisMode: WorkflowTypes.AnalysisMode;
}

export type SET_TIME_RANGE = ActionWithPayload<CommonTypes.TimeRange>;
export type SET_STATION_GROUP = ActionWithPayload<WorkflowTypes.StationGroup>;
export type SET_OPEN_INTERVAL_NAME = ActionWithPayload<string>;
export type SET_OPEN_ACTIVITY_NAMES = ActionWithPayload<string[]>;
export type SET_ANALYSIS_MODE = ActionWithPayload<string>;
