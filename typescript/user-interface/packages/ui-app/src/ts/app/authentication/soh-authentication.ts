import { API_LOGIN_CHECK_URI, API_LOGIN_URI, API_LOGOUT_URI } from '@gms/common-util';
import { UserSessionTypes } from '@gms/ui-state';
import { reload, Toaster } from '@gms/ui-util';
import Axios from 'axios';

import { Authenticator } from './types';

const toaster: Toaster = new Toaster();
/**
 * Returns the AuthState from the network result.
 *
 * @param result the result to process
 */
const getAuthStatusFromResult = (result): UserSessionTypes.AuthStatus => {
  // If username is defined, but was not authenticated - bad username
  if (result.data.userName && !result.data.authenticated) {
    toaster.toastWarn(`User name contained invalid characters.`);
  }
  return {
    authenticated: result.data.authenticated,
    userName: result.data.userName,
    authenticationCheckComplete: true,
    failedToConnect: false
  };
};

/**
 * Returns a failed connection AuthStatus.
 */
const getFailedToConnectAuthStatus = (): UserSessionTypes.AuthStatus => ({
  authenticated: false,
  userName: undefined,
  authenticationCheckComplete: false,
  failedToConnect: true
});

/**
 * Attempts to login to the server with the given credentials
 *
 * @param userName Plaintext username
 */
async function authenticateWith(userName: string): Promise<UserSessionTypes.AuthStatus> {
  return Axios.get(API_LOGIN_URI, {
    params: {
      userName
    }
  })
    .then(getAuthStatusFromResult)
    .catch(getFailedToConnectAuthStatus);
}

/**
 * Checks if the user is logged in.
 */
async function checkIsAuthenticated(): Promise<UserSessionTypes.AuthStatus> {
  return Axios.get(API_LOGIN_CHECK_URI)
    .then(getAuthStatusFromResult)
    .catch(getFailedToConnectAuthStatus);
}

/**
 * Checks if the user is logged in.
 *
 * @param callback redux action that updates the authorization status
 */
async function unAuthenticateWith(): Promise<UserSessionTypes.AuthStatus> {
  return Axios.get(API_LOGOUT_URI)
    .then(getAuthStatusFromResult)
    .catch(getFailedToConnectAuthStatus);
}

/**
 * Logs the user out of the system
 */
const logout = (setAuthStatus: (status: UserSessionTypes.AuthStatus) => void): void => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  unAuthenticateWith()
    .then(result => {
      setAuthStatus(result);
    })
    // eslint-disable-next-line no-console
    .catch(error => console.error(`Failed to un-authenticate: ${error}`));
  // TODO figure out how to avoid the need to reload the page
  reload();
};

export const sohAuthenticator: Authenticator = {
  authenticateWith,
  checkIsAuthenticated,
  unAuthenticateWith,
  logout
};
