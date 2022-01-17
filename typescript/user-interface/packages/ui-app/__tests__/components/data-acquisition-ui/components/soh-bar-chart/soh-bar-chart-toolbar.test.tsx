import { SohTypes } from '@gms/common-model';
import { uuid } from '@gms/common-util';
import { DropdownItem } from '@gms/ui-core-components/lib/components/ui-widgets/toolbar/types';
import { createStore } from '@gms/ui-state';
import uniqueId from 'lodash/uniqueId';
import React from 'react';
import { Provider } from 'react-redux';

import { BaseDisplayContext } from '../../../../../src/ts/components/common-ui/components/base-display';
import {
  Toolbar,
  ToolbarProps
} from '../../../../../src/ts/components/data-acquisition-ui/components/soh-bar-chart/soh-bar-chart-toolbar';
import { initialFiltersToDisplay } from '../../../../../src/ts/components/data-acquisition-ui/shared/toolbars/soh-toolbar';
import {
  makeLagSortingDropdown,
  SOHLagOptions
} from '../../../../../src/ts/components/data-acquisition-ui/shared/toolbars/soh-toolbar-items';
import { sohConfiguration } from '../../../../__data__/data-acquisition-ui/soh-params-data';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

jest.mock(
  '~components/data-acquisition-ui/client-interface/axios/queries/soh-configuration-query',
  () => ({
    ...jest.requireActual(
      '../../../../../src/ts/components/data-acquisition-ui/client-interface/axios/queries/soh-configuration-query'
    ),
    useSohConfigurationQuery: jest.fn(() => ({ data: sohConfiguration }))
  })
);

uuid.asString = jest.fn().mockImplementation(uniqueId);

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('Toolbar class', () => {
  const sortDropdown: DropdownItem = makeLagSortingDropdown(SOHLagOptions.LAG_HIGHEST, jest.fn());
  // see https://stackoverflow.com/questions/57805917/mocking-refs-in-react-function-component
  const mockUseRef = (obj: any) => () =>
    Object.defineProperty({}, 'current', {
      get: () => obj,
      // eslint-disable-next-line no-empty,@typescript-eslint/no-empty-function
      set: () => {}
    });
  const ref: any = mockUseRef({ refFunction: jest.fn() });
  const station: SohTypes.UiStationSoh = {
    id: '1',
    uuid: '1',
    needsAcknowledgement: true,
    needsAttention: true,
    sohStatusSummary: undefined,
    stationGroups: [],
    statusContributors: [],
    time: undefined,
    stationName: '1',
    allStationAggregates: [],
    channelSohs: [
      {
        channelName: 'adsf',
        channelSohStatus: undefined,
        allSohMonitorValueAndStatuses: [
          {
            monitorType: SohTypes.SohMonitorType.LAG,
            value: 10,
            valuePresent: true,
            status: SohTypes.SohStatusSummary.GOOD,
            hasUnacknowledgedChanges: true,
            contributing: false,
            quietUntilMs: 1,
            thresholdBad: 3,
            thresholdMarginal: 3
          },
          {
            monitorType: SohTypes.SohMonitorType.LAG,
            value: 11,
            valuePresent: true,
            status: SohTypes.SohStatusSummary.GOOD,
            hasUnacknowledgedChanges: true,
            contributing: false,
            quietUntilMs: 1,
            thresholdBad: 3,
            thresholdMarginal: 3
          }
        ]
      },
      {
        channelName: 'adsf2',
        channelSohStatus: undefined,
        allSohMonitorValueAndStatuses: [
          {
            monitorType: SohTypes.SohMonitorType.LAG,
            value: 10,
            valuePresent: true,
            status: SohTypes.SohStatusSummary.GOOD,
            hasUnacknowledgedChanges: true,
            contributing: false,
            quietUntilMs: 1,
            thresholdBad: 3,
            thresholdMarginal: 3
          },
          {
            monitorType: SohTypes.SohMonitorType.LAG,
            value: 11,
            valuePresent: true,
            status: SohTypes.SohStatusSummary.GOOD,
            hasUnacknowledgedChanges: true,
            contributing: false,
            quietUntilMs: 1,
            thresholdBad: 3,
            thresholdMarginal: 3
          }
        ]
      }
    ]
  };

  const toolbarProps: ToolbarProps = {
    statusesToDisplay: initialFiltersToDisplay,
    setStatusesToDisplay: jest.fn(),
    sortDropdown,
    forwardRef: ref,
    station,
    monitorType: SohTypes.SohMonitorType.LAG
  };

  const store = createStore();
  store.getState().dataAcquisitionWorkspaceState.data.sohStatus.isStale = false;

  const toolbar = Enzyme.mount(
    <Provider store={store}>
      <BaseDisplayContext.Provider
        value={{
          glContainer: { width: 150, height: 150 } as any,
          widthPx: 150,
          heightPx: 150
        }}
      >
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Toolbar {...toolbarProps} />
      </BaseDisplayContext.Provider>
    </Provider>
  );
  it('should be defined', () => {
    expect(Toolbar).toBeDefined();
  });
  it('should match snapshot', () => {
    expect(toolbar).toMatchSnapshot();
  });
});
