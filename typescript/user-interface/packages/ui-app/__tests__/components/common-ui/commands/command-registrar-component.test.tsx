import { MILLISECONDS_IN_SECOND, SECONDS_IN_MINUTES } from '@gms/common-util';
import React from 'react';
import { act } from 'react-dom/test-utils';

// eslint-disable-next-line max-len
import { CommandRegistrarComponent } from '../../../../src/ts/components/common-ui/commands/command-registrar-component';
import { CommandPaletteContext } from '../../../../src/ts/components/common-ui/components/command-palette/command-palette-context';
import { commandPaletteContextData } from '../../../__data__/common-ui/command-palette-context-data';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// eslint-disable-next-line import/no-deprecated
const lodash = jest.requireActual('lodash');
lodash.uniqueId = () => '1';

Date.now = jest.fn().mockReturnValue(() => MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTES);

const TIME_TO_WAIT_MS = 2000;

const waitForComponentToPaint = async (wrapper: any) => {
  // fixes React warning that "An update to Component inside a test was not wrapped in act(...)."
  // this has something to do with use state or apollo and needs 100ms to figure itself out
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, TIME_TO_WAIT_MS));
    wrapper.update();
  });
};

describe('Common Command Registrar Component', () => {
  const wrapper = Enzyme.mount(
    <CommandPaletteContext.Provider value={commandPaletteContextData}>
      <CommandRegistrarComponent setAuthStatus={jest.fn()} />
    </CommandPaletteContext.Provider>
  );

  it('registers commands after component updates', async () => {
    await waitForComponentToPaint(wrapper);
    wrapper.update();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(commandPaletteContextData.registerCommands).toHaveBeenCalledTimes(1);
  });
});
