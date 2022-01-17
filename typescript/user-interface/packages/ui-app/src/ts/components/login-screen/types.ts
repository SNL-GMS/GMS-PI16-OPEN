import { UserSessionTypes } from '@gms/ui-state';
// eslint-disable-next-line import/no-extraneous-dependencies
import History from 'history';

/** The login screen state */
export interface LoginScreenState {
  username: string;
}

/**
 * The login screen redux props.
 * Note: these props are mapped in from Redux state
 */
export interface LoginScreenReduxProps {
  location: History.Location;
  authenticated: boolean;
  authenticationCheckComplete: boolean;
  failedToConnect: boolean;
  setAuthStatus(auth: UserSessionTypes.AuthStatus): void;
}

export interface Authenticator {
  authenticateWith(userName: string): Promise<UserSessionTypes.AuthStatus>;
  checkIsAuthenticated(): Promise<UserSessionTypes.AuthStatus>;
  unAuthenticateWith(): Promise<UserSessionTypes.AuthStatus>;
}

export interface LoginScreenBaseProps {
  authenticator: Authenticator;
}

export type LoginScreenProps = LoginScreenReduxProps & LoginScreenBaseProps;
