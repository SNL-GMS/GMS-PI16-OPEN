import * as Redux from 'redux';

import { Actions } from './actions';
import {
  initialAnalystWorkspaceState,
  initialAppState,
  initialCommonWorkspaceState,
  initialDataAcquisitionWorkspaceState
} from './initial-state';
import { AppReducer } from './reducers';
import { AppState } from './types';

/**
 * Redux reducer for resetting the app state.
 *
 * @param state the state to set
 * @param action the redux action
 */
export const Reducer = (
  state: AppState = initialAppState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: Redux.Action<any> = undefined
): AppState => {
  if (Actions.resetAppState.test(action)) {
    return {
      analystWorkspaceState: initialAnalystWorkspaceState,
      commonWorkspaceState: initialCommonWorkspaceState,
      dataAcquisitionWorkspaceState: initialDataAcquisitionWorkspaceState,
      userSessionState: state.userSessionState,
      systemMessageState: state.systemMessageState
    };
  }
  return AppReducer(state, action);
};
