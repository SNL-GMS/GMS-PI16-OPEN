import { Displays } from '@gms/common-model';
import { areListsSame, Timer } from '@gms/common-util';
import Immutable from 'immutable';
import clone from 'lodash/clone';
import { batch } from 'react-redux';
import { Dispatch } from 'redux';

import { AppState } from '../types';
import { Actions, Internal as InternalActions } from './actions';
import { CommonWorkspaceState, GLDisplayState, StationVisibilityObject } from './types';

// return true if the visibility has changed, false otherwise
const commandPaletteVisibilityHasChanged = (visibility: boolean, currentVisibility: boolean) =>
  visibility !== currentVisibility;

/**
 * Redux operation to set the visibility of the command palette
 *
 * @param visibility the true/false state of whether or not the command palette should be visible
 */
const setCommandPaletteVisibility = (visibility: boolean) => (
  dispatch: Dispatch,
  getState: () => AppState
): void => {
  const state: CommonWorkspaceState = getState().commonWorkspaceState;

  if (commandPaletteVisibilityHasChanged(visibility, state.commandPaletteIsVisible)) {
    dispatch(Actions.setCommandPaletteVisibility(visibility));
  }
};

/**
 * @param ids new set of selected ids
 * @returns whether they are the same, irrespective of order
 */
export const idsHaveChanged = (ids: string[]): ((getState: () => AppState) => boolean) => (
  getState: () => AppState
): boolean => {
  Timer.start('[common workspace operations] idsHaveChanged');
  // Sorting to ensure actual different selections ex: [2, 1] [1, 2] are not really different
  const state: CommonWorkspaceState = getState().commonWorkspaceState;
  const equal = !areListsSame(ids, state.selectedStationIds);
  Timer.end('[common workspace operations] idsHaveChanged');
  return equal;
};

/**
 * Overwrites the selected stations in the Redux state.
 *
 * @param ids the ids to set
 */
const setSelectedStationIds = (ids: string[]) => (dispatch: Dispatch): void => {
  // TODO: this always evaluates to true because it just returns a function and never calls it
  if (idsHaveChanged(ids)) {
    dispatch(Actions.setSelectedStationIds(ids));
  }
};

/**
 * Checks for null and undefined of the replacement station visibility map
 *
 * @param stationsVisibilityMap
 * @returns boolean false if input is undefined or null
 */
export const stationsVisibilityMapIsDefined = (
  stationsVisibilityMap: Immutable.Map<string, StationVisibilityObject>
): boolean => {
  return typeof stationsVisibilityMap !== 'undefined' && stationsVisibilityMap !== null;
};

/**
 * Overwrites the StationsVisibility Map in the Redux state.
 *
 * @param stationsVisibilityMap a map from station names (string) to StationVisibilityObjects
 */
const setStationsVisibility = (
  stationsVisibilityMap: Immutable.Map<string, StationVisibilityObject>
) => (dispatch: Dispatch): void => {
  if (stationsVisibilityMapIsDefined(stationsVisibilityMap)) {
    dispatch(Actions.setStationsVisibility(stationsVisibilityMap));
  }
};

/**
 * Internal function for setting station visibility to false for all stations in the visibility list.
 * If station visibility list is empty or undefined, this is a no-op.
 *
 * @param dispatch the redux Dispatch function
 * @param getState the getState function to access the redux state
 */
const resetStationsVisibility = (dispatch: Dispatch, getState: () => AppState): void => {
  const { stationsVisibility } = getState().commonWorkspaceState;
  let stationsVisibilityReset = Immutable.Map<string, StationVisibilityObject>();
  if (stationsVisibility?.size) {
    stationsVisibility.toArray().forEach(value => {
      const newStationVisibilityObject = clone(value[1]);
      newStationVisibilityObject.visibility = false;
      stationsVisibilityReset = stationsVisibilityReset.set(value[0], newStationVisibilityObject);
    });
    dispatch(Actions.setStationsVisibility(stationsVisibilityReset));
  }
};

/**
 * Sets a single display's state in the glLayoutState tracked in Redux.
 *
 * @param displayName a string uniquely identifying a golden layout display
 * @param displayState the state of the display (open, closed, etc)
 * @returns a dispatch function that dispatches the state update.
 */
const setGlDisplayState = (displayName: string, displayState: GLDisplayState) => (
  dispatch: Dispatch,
  getState: () => AppState
): void => {
  if (displayName && displayState && Displays.isValidDisplayName(displayName)) {
    batch(() => {
      const { glLayoutState } = getState().commonWorkspaceState;
      const newLayoutState = glLayoutState.set(displayName, displayState);
      if (displayName === Displays.IanDisplays.WAVEFORM) {
        resetStationsVisibility(dispatch, getState);
      }
      dispatch(InternalActions.setGlLayoutState(newLayoutState));
    });
  } else if (displayName && !Displays.isValidDisplayName(displayName)) {
    throw new Error(`Invalid display name: ${displayName} is not a name of a known display.`);
  }
};

export const InternalOperations = {
  resetStationsVisibility
};

export const Operations = {
  setCommandPaletteVisibility,
  setSelectedStationIds,
  setStationsVisibility,
  setGlDisplayState
};
