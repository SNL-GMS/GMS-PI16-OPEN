import { SohTypes } from '@gms/common-model';
import { createStore } from '@gms/ui-state';
import React from 'react';
import { Provider } from 'react-redux';

import { BaseDisplayContext } from '../../../../../src/ts/components/common-ui/components/base-display';
import {} from '../../../../../src/ts/components/data-acquisition-ui/client-interface/axios/queries/soh-configuration-query';
import {
  SohToolbar,
  SohToolbarProps
} from '../../../../../src/ts/components/data-acquisition-ui/shared/toolbars/soh-toolbar';
import { sohConfiguration } from '../../../../__data__/data-acquisition-ui/soh-params-data';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

jest.mock(
  '~components/data-acquisition-ui/client-interface/axios/queries/soh-configuration-query',
  () => ({
    ...jest.requireActual(
      '../../../../../src/ts/components/data-acquisition-ui/client-interface/axios/queries/soh-configuration-query'
    ),
    useSohConfigurationQuery: jest.fn(() => ({ data: sohConfiguration }))
  })
);

describe('Soh toolbar component', () => {
  const statusesToDisplay: Map<any, boolean> = new Map().set(SohTypes.SohStatusSummary.GOOD, true);
  const item: any = {
    dropdownOptions: {},
    value: {},
    custom: false,
    onChange: jest.fn()
  };
  const sohToolbarProps: SohToolbarProps = {
    statusesToDisplay,
    widthPx: 1000,
    leftItems: [item],
    rightItems: [],
    statusFilterText: '',
    setStatusesToDisplay: jest.fn(),
    toggleHighlight: jest.fn(),
    statusFilterTooltip: 'test tooltip'
  };

  const store = createStore();
  store.getState().dataAcquisitionWorkspaceState.data.sohStatus.isStale = false;

  const sohToolbar = Enzyme.mount(
    <Provider store={store}>
      <BaseDisplayContext.Provider
        value={{
          glContainer: { width: 150, height: 150 } as any,
          widthPx: 150,
          heightPx: 150
        }}
      >
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <SohToolbar {...sohToolbarProps} />
      </BaseDisplayContext.Provider>
    </Provider>
  );

  it('should be defined', () => {
    expect(SohToolbar).toBeDefined();
  });

  it('should match snapshot', () => {
    expect(sohToolbar).toMatchSnapshot();
  });
});
