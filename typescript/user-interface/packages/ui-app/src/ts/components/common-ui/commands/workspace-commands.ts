import { UserSessionTypes } from '@gms/ui-state';

import { authenticator } from '~app/authentication';
import {
  clearLayout,
  showLogPopup
} from '~components/workspace/components/golden-layout/golden-layout-util';

import { Command, CommandType } from '../components/command-palette/types';

/**
 * Creates workspace commands, including
 *   logout
 *   clear layout
 *   show logs
 */
export const createWorkspaceCommands = (
  setAuthStatus: (auth: UserSessionTypes.AuthStatus) => void
): Command[] => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { logout } = authenticator;
  const commands = [
    logout && {
      commandType: CommandType.LOG_OUT,
      searchTags: ['quit', 'exit', 'logout', 'log out'],
      action: () => logout(setAuthStatus)
    },
    {
      commandType: CommandType.CLEAR_LAYOUT,
      searchTags: ['clear', 'reset', 'layout', 'workspace'],
      action: clearLayout
    },
    {
      commandType: CommandType.SHOW_LOGS,
      searchTags: ['logs'],
      action: showLogPopup
    }
  ];
  return [...commands];
};
