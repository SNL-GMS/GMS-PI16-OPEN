/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import { deleteCookie, isCookieSet, setCookie } from '@gms/ui-util';
import * as React from 'react';
import { ReactQueryDevtoolsPanel } from 'react-query-devtools';

import { CommandPaletteContext } from '~components/common-ui/components/command-palette/command-palette-context';
import {
  Command,
  CommandScope,
  CommandType
} from '~components/common-ui/components/command-palette/types';

const DEV_TOOLS_COOKIE_ID = 'gms-react-query-devtool-status';

/**
 * Configures the React Query Dev Tool.
 * ONLY ENABLED FOR NODE_ENV === 'development' or MOCK === 'true' or SHOW_DEVTOOLS === 'true'
 */
export const ReactQueryDevtool: React.FunctionComponent<{
  shouldRender: boolean;
}> = props => {
  const initialState = isCookieSet(DEV_TOOLS_COOKIE_ID);
  const [isOpen, setIsOpen] = React.useState(initialState);
  const toggleDevTools = React.useCallback(() => {
    const current = isCookieSet(DEV_TOOLS_COOKIE_ID);
    if (!current) {
      // we will be opening it, so set the cookie
      setCookie(DEV_TOOLS_COOKIE_ID, 'isOpen');
    } else {
      deleteCookie(DEV_TOOLS_COOKIE_ID, 'isOpen');
    }
    setIsOpen(currentState => !currentState);
  }, []);
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { registerCommands } = React.useContext(CommandPaletteContext);
  const devToolsCommands: Command[] = React.useMemo(
    () => [
      {
        commandType: CommandType.SHOW_REACT_QUERY_DEV_TOOLS,
        // A list of strings that should be searched for this command
        searchTags: ['dev', 'query', 'mutation', 'tools', 'devtools'],
        // the function to call when the command is executed.
        action: toggleDevTools
      }
    ],
    [toggleDevTools]
  );

  const commandSignature = devToolsCommands.map(c => c.displayText).join();
  React.useEffect(() => {
    if (props.shouldRender) {
      registerCommands(devToolsCommands, CommandScope.DEV);
    }
  }, [commandSignature, devToolsCommands, props.shouldRender, registerCommands]);

  return isOpen && <ReactQueryDevtoolsPanel />;
};
