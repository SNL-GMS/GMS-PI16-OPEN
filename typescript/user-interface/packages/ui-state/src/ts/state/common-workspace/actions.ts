import Immutable from 'immutable';

import { ActionCreator, actionCreator } from '../util/action-helper';
import { ActionTypes, GLDisplayState, KeyAction, StationVisibilityObject } from './types';

const setCommandPaletteVisibility: ActionCreator<boolean> = actionCreator(
  'SET_COMMAND_PALETTE_VISIBILITY'
);

const setKeyPressActionQueue: ActionCreator<Immutable.Map<KeyAction, number>> = actionCreator(
  ActionTypes.SET_KEYPRESS_ACTION_QUEUE
);

const setSelectedStationIds: ActionCreator<string[]> = actionCreator('SET_SELECTED_STATION_IDS');

const setStationsVisibility: ActionCreator<Immutable.Map<
  string,
  StationVisibilityObject
>> = actionCreator(ActionTypes.SET_STATIONS_VISIBILITY);

const setGlLayoutState: ActionCreator<Immutable.Map<string, GLDisplayState>> = actionCreator(
  ActionTypes.SET_GL_LAYOUT_STATE
);

/**
 * Redux internal actions: should only be called by `operations`. (private - but not strictly forced)
 */
export const Internal = {
  setGlLayoutState
};

export const Actions = {
  setCommandPaletteVisibility,
  setKeyPressActionQueue,
  setSelectedStationIds,
  setStationsVisibility
};
