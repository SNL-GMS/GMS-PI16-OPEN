import { CommonTypes, WorkflowTypes } from '@gms/common-model';
import Immutable from 'immutable';
import isEqual from 'lodash/isEqual';
import { batch } from 'react-redux';
import { Dispatch } from 'redux';

import { InternalOperations } from '../../common-workspace/operations';
import { AppState } from '../../types';
import * as AnalystWorkspaceActions from '../actions';
import * as AnalystWorkspaceOperations from '../operations';
import { AnalystWorkspaceState, WaveformDisplayMode, WaveformSortType } from '../types';
import { Actions } from './actions';

const setOpenInterval = (
  timeRange: CommonTypes.TimeRange,
  stationGroup: WorkflowTypes.StationGroup,
  openIntervalName: string,
  openActivityNames: string[],
  analysisMode: WorkflowTypes.AnalysisMode
) => (dispatch: Dispatch, getState: () => AppState): void => {
  const state: AnalystWorkspaceState = getState().analystWorkspaceState;

  const hasCurrentIntervalChanged =
    state.workflowState?.openIntervalName !== openIntervalName ||
    !isEqual(state.workflowState?.timeRange, timeRange);

  batch(() => {
    dispatch(Actions.setTimeRange(timeRange));
    dispatch(Actions.setStationGroup(stationGroup));
    dispatch(Actions.setOpenIntervalName(openIntervalName));
    dispatch(Actions.setOpenActivityNames(openActivityNames));
    dispatch(Actions.setAnalysisMode(analysisMode));
    // clear out the following
    // if the processing stage interval id (or time interval) has changed
    if (hasCurrentIntervalChanged) {
      dispatch(AnalystWorkspaceActions.Actions.setSelectedSdIds([]));
      dispatch(AnalystWorkspaceActions.Internal.setOpenEventId(undefined));
      dispatch(AnalystWorkspaceActions.Actions.setSelectedEventIds([]));
      dispatch(AnalystWorkspaceActions.Actions.setSdIdsToShowFk([]));
      AnalystWorkspaceOperations.Operations.setMode(WaveformDisplayMode.DEFAULT);
      dispatch(AnalystWorkspaceActions.Internal.setMeasurementModeEntries(Immutable.Map()));
      dispatch(AnalystWorkspaceActions.Actions.setSelectedSortType(WaveformSortType.stationName));
      InternalOperations.resetStationsVisibility(dispatch, getState);
      // clear waveform caches
      if (state.waveformClient) {
        state.waveformClient.stopAndClear();
      }
    }
  });
};

const setClosedInterval = (activityName: string, isStageInterval: boolean) => (
  dispatch: Dispatch,
  getState: () => AppState
): void => {
  const state: AnalystWorkspaceState = getState().analystWorkspaceState;

  batch(() => {
    // Only want to clear the state if they do not have multiple activities open
    if (state.workflowState?.openActivityNames.length <= 1 || isStageInterval) {
      dispatch(Actions.setTimeRange(undefined));
      dispatch(Actions.setStationGroup(undefined));
      dispatch(Actions.setOpenIntervalName(undefined));
      dispatch(Actions.setOpenActivityNames([]));
      dispatch(Actions.setAnalysisMode(undefined));

      dispatch(AnalystWorkspaceActions.Actions.setSelectedSdIds([]));
      dispatch(AnalystWorkspaceActions.Internal.setOpenEventId(undefined));
      dispatch(AnalystWorkspaceActions.Actions.setSelectedEventIds([]));
      dispatch(AnalystWorkspaceActions.Actions.setSdIdsToShowFk([]));
      AnalystWorkspaceOperations.Operations.setMode(WaveformDisplayMode.DEFAULT);
      dispatch(AnalystWorkspaceActions.Internal.setMeasurementModeEntries(Immutable.Map()));
      dispatch(AnalystWorkspaceActions.Actions.setSelectedSortType(WaveformSortType.stationName));
      InternalOperations.resetStationsVisibility(dispatch, getState);
      // clear waveform caches
      if (state.waveformClient) {
        state.waveformClient.stopAndClear();
      }
    } else {
      const ids = state.workflowState?.openActivityNames.filter(name => name !== activityName);
      dispatch(Actions.setOpenActivityNames(ids));
    }
  });
};

/**
 * Redux operations (public).
 */
export const Operations = {
  setOpenInterval,
  setClosedInterval
};
