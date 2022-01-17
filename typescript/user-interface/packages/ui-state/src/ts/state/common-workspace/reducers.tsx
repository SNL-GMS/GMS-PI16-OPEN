import Immutable from 'immutable';
import * as Redux from 'redux';

import { Actions, Internal } from './actions';
import {
  CommonWorkspaceState,
  GLDisplayState,
  SET_COMMAND_PALETTE_VISIBILITY,
  SET_GL_LAYOUT_STATE,
  SET_KEYPRESS_ACTION_QUEUE,
  SET_SELECTED_STATION_IDS,
  SET_STATIONS_VISIBILITY,
  StationVisibilityObject
} from './types';

/**
 * Set the visibility for the command palette to true or false.
 * Defaults to false.
 *
 * @param state
 * @param action
 */
const setCommandPaletteVisibility = (
  state = false,
  action: SET_COMMAND_PALETTE_VISIBILITY
): boolean => {
  if (Actions.setCommandPaletteVisibility.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * Redux reducer for setting the Key Action queue, which is consumed by component trees in the UI
 * to expose global hotkeys to the appropriate consumers
 *
 * @param state the state to set
 * @param action the redux action
 */
const setKeyPressActionQueue = (
  state: Immutable.Map<string, number> = Immutable.Map<string, number>(),
  action: SET_KEYPRESS_ACTION_QUEUE
): Immutable.Map<string, number> => {
  if (Actions.setKeyPressActionQueue.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

const setSelectedStationIds = (
  state: string[] = [],
  action: SET_SELECTED_STATION_IDS
): string[] => {
  if (Actions.setSelectedStationIds.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * Redux reducer for setting the stations and their visibility
 *
 * @param state the state to set
 * @param action the redux action
 */
const setStationsVisibility = (
  state: Immutable.Map<string, StationVisibilityObject> = Immutable.Map<
    string,
    StationVisibilityObject
  >(),
  action: SET_STATIONS_VISIBILITY
): Immutable.Map<string, StationVisibilityObject> => {
  if (Actions.setStationsVisibility.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * Redux reducer for tracking the state of the golden layout displays (open, closed, etc).
 *
 * @param state the state to set
 * @param action the redux action
 */
const setGlLayoutState = (
  state: Immutable.Map<string, GLDisplayState> = Immutable.Map<string, GLDisplayState>(),
  action: SET_GL_LAYOUT_STATE
): Immutable.Map<string, GLDisplayState> => {
  if (Internal.setGlLayoutState.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

export const Reducer: Redux.Reducer<CommonWorkspaceState, Redux.AnyAction> = Redux.combineReducers({
  commandPaletteIsVisible: setCommandPaletteVisibility,
  keyPressActionQueue: setKeyPressActionQueue,
  selectedStationIds: setSelectedStationIds,
  stationsVisibility: setStationsVisibility,
  glLayoutState: setGlLayoutState
});
