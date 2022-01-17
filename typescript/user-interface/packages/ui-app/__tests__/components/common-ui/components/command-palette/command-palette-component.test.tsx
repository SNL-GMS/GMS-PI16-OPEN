import { Client } from '@gms/ui-apollo';
import DefaultClient from 'apollo-boost';
import React from 'react';
import { ApolloProvider } from 'react-apollo';

import { CommandPaletteComponent } from '../../../../../src/ts/components/common-ui/components/command-palette/command-palette-component';
import { CommandPaletteComponentProps } from '../../../../../src/ts/components/common-ui/components/command-palette/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

// eslint-disable-next-line import/no-deprecated
const lodash = jest.requireActual('lodash');
lodash.uniqueId = () => '1';

describe('Command Palette Component', () => {
  const client: Client = new DefaultClient<any>();

  it('should be defined', () => {
    expect(CommandPaletteComponent).toBeDefined();
  });

  const props: CommandPaletteComponentProps = {
    commandPaletteIsVisible: true,
    keyPressActionQueue: undefined,
    setCommandPaletteVisibility: jest.fn(),
    setKeyPressActionQueue: jest.fn()
  };

  it('matches a snapshot', () => {
    const wrapper = Enzyme.mount(
      <ApolloProvider client={client}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <CommandPaletteComponent {...props} />
      </ApolloProvider>
    );
    expect(wrapper).toMatchSnapshot();
  });
});
