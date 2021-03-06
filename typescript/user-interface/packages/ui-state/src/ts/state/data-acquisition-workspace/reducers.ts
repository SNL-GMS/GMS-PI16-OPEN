import { ReferenceStationTypes, SohTypes } from '@gms/common-model';
import * as Redux from 'redux';

import { Actions } from './actions';
import {
  DataAcquisitionWorkspaceState,
  SET_SELECTED_ACEI_TYPE,
  SET_SELECTED_PROCESSING_STATION,
  SET_SOH_STATUS,
  SET_UNMODIFIED_PROCESSING_STATION,
  SohStatus
} from './types';

const setSelectedProcessingStation = (
  state: ReferenceStationTypes.ReferenceStation = null,
  action: SET_SELECTED_PROCESSING_STATION
): ReferenceStationTypes.ReferenceStation => {
  if (Actions.setSelectedProcessingStation.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

const setUnmodifiedProcessingStation = (
  state: ReferenceStationTypes.ReferenceStation = null,
  action: SET_UNMODIFIED_PROCESSING_STATION
): ReferenceStationTypes.ReferenceStation => {
  if (Actions.setUnmodifiedProcessingStation.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

const setSohStatus = (state: SohStatus = null, action: SET_SOH_STATUS): SohStatus => {
  if (Actions.setSohStatus.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

const setSelectedAceiType = (
  state: SohTypes.AceiType = null,
  action: SET_SELECTED_ACEI_TYPE
): SohTypes.AceiType => {
  if (Actions.setSelectedAceiType.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

export const Reducer: Redux.Reducer<
  DataAcquisitionWorkspaceState,
  Redux.AnyAction
> = Redux.combineReducers({
  selectedAceiType: setSelectedAceiType,
  selectedProcessingStation: setSelectedProcessingStation,
  unmodifiedProcessingStation: setUnmodifiedProcessingStation,
  data: Redux.combineReducers({
    sohStatus: setSohStatus
  })
});
