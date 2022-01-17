import { isIanMode } from '@gms/common-util';
import { UserSessionTypes } from '@gms/ui-state';
import { deleteCookie, getCookie, setCookie, Toaster } from '@gms/ui-util';
import xssFilters from 'xss-filters';

import { Authenticator, LoginRequestParams } from './types';

const AUTH_COOKIE_ID = 'IAN-user-auth';
const toaster: Toaster = new Toaster();

/**
 * Returns a failed connection AuthStatus.
 */
const getFailedToConnectAuthStatus = (): UserSessionTypes.AuthStatus => ({
  authenticated: false,
  userName: undefined,
  authenticationCheckComplete: false,
  failedToConnect: true
});

const mockAuthRequest = async (
  params: LoginRequestParams,
  mockAuth = true
): Promise<UserSessionTypes.AuthStatus> =>
  new Promise<UserSessionTypes.AuthStatus>((resolve, reject) => {
    if (isIanMode()) {
      resolve({
        authenticated: mockAuth,
        userName: params.userName,
        authenticationCheckComplete: true,
        failedToConnect: false
      });
    }
    reject();
  });

/**
 * TODO: Add validation/sanitization to whatever service eventually manages user session
 * ! IMPORTANT: This is not sufficient, and sanitization must happen on any service
 * ! that accepts user input
 * This is helpful for giving the user immediate feedback
 */
function checkUserName(userName: string): boolean {
  const safeUserName = xssFilters.inHTMLData(userName);
  if (userName !== safeUserName) {
    toaster.toastWarn(`User name contained invalid characters.`);
    return false;
  }
  return true;
}

/**
 * Attempts to login to the server with the given credentials
 *
 * @param userName Plaintext username
 */
async function authenticateWith(userName: string): Promise<UserSessionTypes.AuthStatus> {
  const userNameIsGood = checkUserName(userName);
  // If user name is not good don't set the cookie
  if (userNameIsGood) {
    setCookie(AUTH_COOKIE_ID, userName);
  }
  // Return authorized if userNameIsGood = true
  return mockAuthRequest(
    {
      userName
    },
    userNameIsGood
  ).catch(getFailedToConnectAuthStatus);
}

/**
 * Checks if the user is logged in.
 */
async function checkIsAuthenticated(): Promise<UserSessionTypes.AuthStatus> {
  const userName = getCookie(AUTH_COOKIE_ID);
  if (userName) {
    return mockAuthRequest({
      userName
    }).catch(getFailedToConnectAuthStatus);
  }
  return mockAuthRequest({ userName }, false);
}

/**
 * Checks if the user is logged in.
 *
 * @param callback redux action that updates the authorization status
 */
async function unAuthenticateWith(userName = 'default'): Promise<UserSessionTypes.AuthStatus> {
  deleteCookie(AUTH_COOKIE_ID, userName);
  return mockAuthRequest(
    {
      userName
    },
    false
  ).catch(getFailedToConnectAuthStatus);
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
    .catch(error => console.error(`Failed to un - authenticate: ${error}`));
};

export const ianAuthenticator: Authenticator = {
  authenticateWith,
  checkIsAuthenticated,
  unAuthenticateWith,
  logout
};
