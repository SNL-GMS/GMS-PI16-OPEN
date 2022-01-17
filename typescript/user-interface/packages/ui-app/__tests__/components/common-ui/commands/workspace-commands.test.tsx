import { createWorkspaceCommands } from '../../../../src/ts/components/common-ui/commands/workspace-commands';
import { CommandType } from '../../../../src/ts/components/common-ui/components/command-palette/types';

describe('Workspace commands', () => {
  const setAuthStatus = jest.fn();
  const workspaceCommands = createWorkspaceCommands(setAuthStatus);
  it('match snapshot', () => {
    expect(workspaceCommands).toMatchSnapshot();
  });

  it('has a logout command', () => {
    const logoutCommand = workspaceCommands.find(c => c.commandType === CommandType.LOG_OUT);
    expect(logoutCommand).toBeDefined();
  });

  it('has a clear layout command', () => {
    const logoutCommand = workspaceCommands.find(c => c.commandType === CommandType.CLEAR_LAYOUT);
    expect(logoutCommand).toBeDefined();
  });

  it('has a show logs command', () => {
    const logoutCommand = workspaceCommands.find(c => c.commandType === CommandType.SHOW_LOGS);
    expect(logoutCommand).toBeDefined();
  });
});
