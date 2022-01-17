import React from 'react';

import { ReactQueryDevtool } from '../../src/ts/app/react-query-devtool';
import {
  Command,
  CommandPaletteContext,
  CommandType
} from '../../src/ts/components/common-ui/components/command-palette';
import { CommandPaletteContextData } from '../../src/ts/components/common-ui/components/command-palette/command-palette-context';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

describe('react query devtool', () => {
  let toggleOpenCommand: Command;
  const context: CommandPaletteContextData = {
    commandPaletteIsVisible: false,
    registerCommands: jest.fn().mockImplementation((commandsToRegister: Command[]) => {
      toggleOpenCommand = commandsToRegister.find(
        (c: Command) => c.commandType === CommandType.SHOW_REACT_QUERY_DEV_TOOLS
      );
    }),
    setCommandPaletteVisibility: jest.fn()
  };
  const Wrapper = Enzyme.mount(
    <CommandPaletteContext.Provider value={context}>
      <ReactQueryDevtool shouldRender />
    </CommandPaletteContext.Provider>
  );

  it('matches a snapshot', () => {
    expect(Wrapper).toMatchSnapshot();
  });

  it('sets a cookie to remember when opened', () => {
    toggleOpenCommand.action();
    expect(document.cookie).toBeTruthy();
  });

  it('removes a cookie to remember when closed', () => {
    expect(document.cookie).toBeTruthy();
    toggleOpenCommand.action();
    expect(document.cookie).toBeFalsy();
  });
});
