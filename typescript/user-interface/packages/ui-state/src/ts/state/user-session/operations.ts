import isEqual from 'lodash/isEqual';
import { batch } from 'react-redux';

import { Actions as AppActions } from '../actions';
import { AppState } from '../types';
import { Internal } from './actions';
import { AuthStatus } from './types';

/**
 * Redux operation for setting the authentication status.
 *
 * @param event the event to set
 * @param authStatus
 */
const setAuthStatus = (authStatus: AuthStatus) => (
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  dispatch: any,
  getState: () => AppState
): void => {
  const state: AppState = getState();
  if (!isEqual(state.userSessionState.authorizationStatus, authStatus)) {
    if (!authStatus.userName && !authStatus.authenticated) {
      batch(() => {
        // reset the application state
        dispatch(AppActions.resetAppState());

        // update the authentication status
        dispatch(Internal.setAuthStatus(authStatus));
      });
    } else {
      batch(() => {
        // update the authentication status
        dispatch(Internal.setAuthStatus(authStatus));
      });
    }
  }
};

/**
 * Redux operations (public).
 */
export const Operations = {
  setAuthStatus
};
