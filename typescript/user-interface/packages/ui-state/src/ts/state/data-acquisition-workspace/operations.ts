import isEqual from 'lodash/isEqual';
import { batch } from 'react-redux';

import { CommonWorkspaceOperations } from '../common-workspace';
import { idsHaveChanged } from '../common-workspace/operations';
import { AppState } from '../types';
import { Actions } from './actions';
import { DataAcquisitionWorkspaceState, SohStatus } from './types';

const getSohStatusWithClearedChannelData = (state: DataAcquisitionWorkspaceState) => {
  // clear out the channel data
  const { sohStatus } = state.data;
  sohStatus.stationAndStationGroupSoh.stationSoh.forEach(s => {
    // eslint-disable-next-line no-param-reassign
    s.channelSohs = undefined;
  });
  return sohStatus;
};

/**
 * dispatches the sohStatuses and ids provided
 *
 * @param dispatch the dispatch function to use
 * @param state the current state in redux
 * @param sohStatus the sohStatus to dispatch
 * @param ids the ids to dispatch
 */
const batchSohStatusAndSelectionDispatches = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  state: DataAcquisitionWorkspaceState,
  sohStatus: SohStatus,
  ids: string[]
) => {
  // batch the dispatches - this will only result in one combined re-render, not two
  batch(() => {
    if (!isEqual(state.data.sohStatus, sohStatus)) {
      dispatch(Actions.setSohStatus(sohStatus));
    }

    CommonWorkspaceOperations.setSelectedStationIds(ids);
  });
};

/**
 * Redux operation for the selected stations.
 *
 * @param ids the ids to set
 */
const setSelectedStationIds = (ids: string[]) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  dispatch: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getState: () => AppState
): void => {
  const state: DataAcquisitionWorkspaceState = getState().dataAcquisitionWorkspaceState;

  if (idsHaveChanged(ids)) {
    const sohStatus = getSohStatusWithClearedChannelData(state);
    batchSohStatusAndSelectionDispatches(dispatch, state, sohStatus, ids);
  }
};

// Reserved for future redux operations
export const Operations = {
  setSelectedStationIds
};
