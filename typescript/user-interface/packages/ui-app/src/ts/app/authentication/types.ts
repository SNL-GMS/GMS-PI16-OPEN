import { UserSessionTypes } from '@gms/ui-state';

export interface Authenticator {
  authenticateWith(userName: string): Promise<UserSessionTypes.AuthStatus>;
  checkIsAuthenticated(): Promise<UserSessionTypes.AuthStatus>;
  unAuthenticateWith(): Promise<UserSessionTypes.AuthStatus>;
  logout(setAuthStatus: (status: UserSessionTypes.AuthStatus) => void): void;
}

export interface LoginRequestParams {
  userName: string;
}
