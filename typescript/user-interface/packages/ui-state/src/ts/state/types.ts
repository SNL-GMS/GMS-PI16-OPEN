import { AnalystWorkspaceState } from './analyst-workspace/types';
import { CommonWorkspaceState } from './common-workspace/types';
import { DataAcquisitionWorkspaceState } from './data-acquisition-workspace/types';
import { SystemMessageState } from './system-message/types';
import { UserSessionState } from './user-session/types';
import { Action } from './util/action-helper';

export type RESET_APP_STATE = Action;

/** The application state */
export interface AppState {
  analystWorkspaceState: AnalystWorkspaceState;
  dataAcquisitionWorkspaceState: DataAcquisitionWorkspaceState;
  userSessionState: UserSessionState;
  commonWorkspaceState: CommonWorkspaceState;
  systemMessageState: SystemMessageState;
}
