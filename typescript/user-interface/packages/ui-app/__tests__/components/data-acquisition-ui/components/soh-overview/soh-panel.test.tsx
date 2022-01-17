import { uuid } from '@gms/common-util';
import { createStore } from '@gms/ui-state';
import React from 'react';
import { Provider } from 'react-redux';

import { BaseDisplayContext } from '../../../../../src/ts/components/common-ui/components/base-display';
import {
  SohOverviewContext,
  SohOverviewContextData
} from '../../../../../src/ts/components/data-acquisition-ui/components/soh-overview/soh-overview-context';
import { SohOverviewPanel } from '../../../../../src/ts/components/data-acquisition-ui/components/soh-overview/soh-overview-panel';
import { stationAndStationGroupSohStatus } from '../../../../__data__/data-acquisition-ui/soh-overview-data';
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

let idCount = 0;
// eslint-disable-next-line no-plusplus
uuid.asString = jest.fn().mockImplementation(() => ++idCount);

// eslint-disable-next-line import/no-deprecated
const lodash = jest.requireActual('lodash');
lodash.uniqueId = () => '1';

const contextValues: SohOverviewContextData = {
  stationSoh: stationAndStationGroupSohStatus.stationSoh,
  stationGroupSoh: stationAndStationGroupSohStatus.stationGroups,
  acknowledgeSohStatus: jest.fn(),
  glContainer: undefined,
  quietTimerMs: 5000,
  updateIntervalSecs: 5,
  selectedStationIds: [],
  setSelectedStationIds: jest.fn(),
  sohStationStaleTimeMS: 30000
};

describe('Soh Panel', () => {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  Date.now = jest.fn().mockReturnValue(1573244087715);
  const setState = jest.fn();
  const useStateSpy = jest.spyOn(React, 'useState');
  const mock: any = init => [init, setState];
  useStateSpy.mockImplementation(mock);

  const store = createStore();
  store.getState().dataAcquisitionWorkspaceState.data.sohStatus.isStale = false;

  const sohPanel = Enzyme.mount(
    <Provider store={store}>
      <SohOverviewContext.Provider value={contextValues}>
        <BaseDisplayContext.Provider
          value={{
            glContainer: { width: 150, height: 150 } as any,
            widthPx: 150,
            heightPx: 150
          }}
        >
          <SohOverviewPanel />
        </BaseDisplayContext.Provider>
      </SohOverviewContext.Provider>
    </Provider>
  );

  it('should be defined', () => {
    expect(sohPanel).toBeDefined();
  });

  it('should match snapshot', () => {
    expect(sohPanel).toMatchSnapshot();
  });
});
