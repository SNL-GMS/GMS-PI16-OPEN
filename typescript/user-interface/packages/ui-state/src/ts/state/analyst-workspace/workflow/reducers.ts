import { CommonTypes, WorkflowTypes } from '@gms/common-model';
import * as Redux from 'redux';

import { Actions } from './actions';
import * as Types from './types';

const setTimeRange = (
  state: CommonTypes.TimeRange = null,
  action: Types.SET_TIME_RANGE
): CommonTypes.TimeRange => {
  if (Actions.setTimeRange.test(action)) {
    return action.payload ? action.payload : null;
  }

  return state;
};

const setStationGroup = (
  state: WorkflowTypes.StationGroup = null,
  action: Types.SET_STATION_GROUP
): WorkflowTypes.StationGroup => {
  if (Actions.setStationGroup.test(action)) {
    return action.payload ? action.payload : null;
  }

  return state;
};

const setOpenIntervalName = (
  state: string = null,
  action: Types.SET_OPEN_INTERVAL_NAME
): string => {
  if (Actions.setOpenIntervalName.test(action)) {
    return action.payload ? action.payload : null;
  }

  return state;
};

const setOpenActivityNames = (
  state: string[] = [],
  action: Types.SET_OPEN_ACTIVITY_NAMES
): string[] => {
  if (Actions.setOpenActivityNames.test(action)) {
    return action.payload ? action.payload : [];
  }

  return state;
};

const setAnalysisMode = (
  state: WorkflowTypes.AnalysisMode = null,
  action: Types.SET_ANALYSIS_MODE
): WorkflowTypes.AnalysisMode => {
  if (Actions.setAnalysisMode.test(action)) {
    return action.payload ? action.payload : null;
  }

  return state;
};

export const Reducer: Redux.Reducer<Types.WorkflowState, Redux.AnyAction> = Redux.combineReducers({
  timeRange: setTimeRange,
  stationGroup: setStationGroup,
  openIntervalName: setOpenIntervalName,
  openActivityNames: setOpenActivityNames,
  analysisMode: setAnalysisMode
});
