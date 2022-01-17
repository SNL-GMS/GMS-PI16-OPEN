import { EventTypes } from '@gms/common-model';
import Immutable from 'immutable';
import isEqual from 'lodash/isEqual';
import { Dispatch } from 'redux';

import { AppState } from '../types';
import { Actions, Internal } from './actions';
import { AnalystWorkspaceState, WaveformDisplayMode, WaveformSortType } from './types';

/**
 * Redux operation for setting the mode.
 *
 * @param mode the mode to set
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-unused-vars
const setMode = (mode: WaveformDisplayMode) => (dispatch: Dispatch, getState: () => AppState) => {
  dispatch(Internal.setMode(mode));
};

/**
 * Redux operation for setting the measurement mode entries.
 *
 * @param entries the measurement mode entries to set
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const setMeasurementModeEntries = (entries: Immutable.Map<string, boolean>) => (
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  dispatch: Dispatch,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getState: () => AppState
) => {
  dispatch(Internal.setMeasurementModeEntries(entries));
};

/**
 * Redux operation for setting the selected location solution.
 *
 * @param locationSolutionSetId the location solution set id
 * @param locationSolutionId the location solution id
 */
const setSelectedLocationSolution = (locationSolutionSetId: string, locationSolutionId: string) => (
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  dispatch: Dispatch,
  getState: () => AppState
): void => {
  const state: AnalystWorkspaceState = getState().analystWorkspaceState;

  if (state.location.selectedLocationSolutionSetId !== locationSolutionSetId) {
    dispatch(Internal.setSelectedLocationSolutionSetId(locationSolutionSetId));
  }

  if (state.location.selectedLocationSolutionId !== locationSolutionId) {
    dispatch(Internal.setSelectedLocationSolutionId(locationSolutionId));
  }
};

/**
 * Redux operation for setting the selected preferred location solution.
 *
 * @param preferredLocationSolutionSetId the preferred location solution set id
 * @param preferredLocationSolutionId the preferred location solution id
 */
const setSelectedPreferredLocationSolution = (
  preferredLocationSolutionSetId: string,
  preferredLocationSolutionId: string
) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  dispatch: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getState: () => AppState
): void => {
  const state: AnalystWorkspaceState = getState().analystWorkspaceState;

  if (state.location.selectedPreferredLocationSolutionSetId !== preferredLocationSolutionSetId) {
    dispatch(Internal.setSelectedPreferredLocationSolutionSetId(preferredLocationSolutionSetId));
  }

  if (state.location.selectedPreferredLocationSolutionId !== preferredLocationSolutionId) {
    dispatch(Internal.setSelectedPreferredLocationSolutionId(preferredLocationSolutionId));
  }
};

/**
 * Redux operation for setting the current open event id.
 *
 * @param event the event to set
 * @param latestLocationSolutionSet
 * @param preferredLocationSolutionId
 */
const setOpenEventId = (
  event: EventTypes.Event | undefined,
  latestLocationSolutionSet: EventTypes.LocationSolutionSet | undefined,
  preferredLocationSolutionId: string | undefined
  // eslint-disable-next-line complexity
) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  dispatch: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getState: () => AppState
): void => {
  const state: AnalystWorkspaceState = getState().analystWorkspaceState;

  if (state.workflowState.timeRange && event) {
    if (state.openEventId !== event.id) {
      dispatch(Internal.setOpenEventId(event.id));

      if (!isEqual(state.selectedEventIds, [event.id])) {
        dispatch(Actions.setSelectedEventIds([event.id]));
      }

      if (state.selectedSortType !== WaveformSortType.distance) {
        dispatch(Actions.setSelectedSortType(WaveformSortType.distance));
      }

      // set the default (latest) location solution
      dispatch(
        setSelectedLocationSolution(
          latestLocationSolutionSet ? latestLocationSolutionSet.id : undefined,
          latestLocationSolutionSet ? latestLocationSolutionSet.locationSolutions[0].id : undefined
        )
      );

      // set the default (latest) preferred location solution
      dispatch(
        setSelectedPreferredLocationSolution(
          latestLocationSolutionSet.id,
          preferredLocationSolutionId
        )
      );
    }
  } else {
    if (state.openEventId !== undefined && state.openEventId !== null) {
      dispatch(Internal.setOpenEventId(undefined));
    }

    if (state.selectedEventIds.length !== 0) {
      dispatch(Actions.setSelectedEventIds([]));
    }

    if (state.selectedSortType !== WaveformSortType.stationName) {
      dispatch(Actions.setSelectedSortType(WaveformSortType.stationName));
    }

    if (state.measurementMode.entries.size !== 0) {
      dispatch(Internal.setMeasurementModeEntries(Immutable.Map()));
    }

    // update the selected location and preferred location solutions
    dispatch(setSelectedLocationSolution(undefined, undefined));
    dispatch(setSelectedPreferredLocationSolution(undefined, undefined));
  }

  if (state.selectedSdIds.length !== 0) {
    dispatch(Actions.setSelectedSdIds([]));
  }

  if (state.sdIdsToShowFk.length !== 0) {
    dispatch(Actions.setSdIdsToShowFk([]));
  }

  if (state.measurementMode.mode !== WaveformDisplayMode.DEFAULT) {
    dispatch(setMode(WaveformDisplayMode.DEFAULT));
  }
};

/**
 * Redux operations (public).
 */
export const Operations = {
  setOpenEventId,
  setMode,
  setMeasurementModeEntries,
  setSelectedLocationSolution,
  setSelectedPreferredLocationSolution
};
