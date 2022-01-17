import GoldenLayout from '@gms/golden-layout';
import { UserSessionTypes } from '@gms/ui-state';

export interface CommandRegistrarReduxProps {
  setAuthStatus(auth: UserSessionTypes.AuthStatus): void;
}

export interface CommandRegistrarBaseProps {
  glContainer?: GoldenLayout.Container;
}

export type CommandRegistrarProps = CommandRegistrarReduxProps & CommandRegistrarBaseProps;
