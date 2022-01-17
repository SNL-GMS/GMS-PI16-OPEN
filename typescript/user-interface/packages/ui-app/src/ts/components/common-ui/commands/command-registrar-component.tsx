import { Timer } from '@gms/common-util';
import * as React from 'react';

import { CommandPaletteContext } from '../components/command-palette/command-palette-context';
import { CommandScope } from '../components/command-palette/types';
import { CommandRegistrarProps } from './types';
import { createWorkspaceCommands } from './workspace-commands';

/**
 * Registers Common UI commands with the command palette.
 * Does not render anything, but updates the registered commands in the CommandPalette context
 */
export const CommandRegistrarComponent: React.FunctionComponent<CommandRegistrarProps> = props => {
  Timer.start('Registering workspace commands');
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { registerCommands } = React.useContext(CommandPaletteContext);
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { setAuthStatus } = props;
  const workspaceCommands = createWorkspaceCommands(setAuthStatus);
  const commandSignature = workspaceCommands.map(c => c.displayText).join();
  React.useEffect(() => {
    registerCommands([...workspaceCommands], CommandScope.COMMON);
    // !FIX ESLINT Validate and check REACT HOOK dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commandSignature]);
  Timer.end('Registering workspace commands');
  return null; // this component just registers commands. It doesn't render anything.
};
