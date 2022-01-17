import { CommonTypes, WorkflowTypes } from '@gms/common-model';

import { ActionCreator, actionCreator } from '../../util/action-helper';
import { ActionTypes } from './types';

const setTimeRange: ActionCreator<CommonTypes.TimeRange> = actionCreator(
  ActionTypes.SET_TIME_RANGE
);

const setStationGroup: ActionCreator<WorkflowTypes.StationGroup> = actionCreator(
  ActionTypes.SET_STATION_GROUP
);

const setOpenIntervalName: ActionCreator<string> = actionCreator(
  ActionTypes.SET_OPEN_INTERVAL_NAME
);

const setOpenActivityNames: ActionCreator<string[]> = actionCreator(
  ActionTypes.SET_OPEN_ACTIVITY_NAMES
);

const setAnalysisMode: ActionCreator<WorkflowTypes.AnalysisMode> = actionCreator(
  ActionTypes.SET_ANALYSIS_MODE
);
export const Actions = {
  setTimeRange,
  setStationGroup,
  setOpenIntervalName,
  setOpenActivityNames,
  setAnalysisMode
};
