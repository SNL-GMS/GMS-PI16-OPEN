import { uuid } from '@gms/common-util/src/ts/common-util';
import { WithNonIdealStates } from '@gms/ui-core-components';
import { createStore } from '@gms/ui-state';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { SohOverviewComponent } from '../../../../../src/ts/components/data-acquisition-ui/components/soh-overview/soh-overview-component';
import { StationGroupsLayout } from '../../../../../src/ts/components/data-acquisition-ui/components/soh-overview/station-groups/station-groups-layout';
import { DataAcquisitionNonIdealStateDefs } from '../../../../../src/ts/components/data-acquisition-ui/shared/non-ideal-states';
import { stationAndStationGroupSohStatus } from '../../../../__data__/data-acquisition-ui/soh-overview-data';
import { sohConfiguration } from '../../../../__data__/data-acquisition-ui/soh-params-data';
import { reactQueryResult } from '../../../../__data__/test-util';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();
window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

// eslint-disable-next-line import/no-deprecated
const lodash = jest.requireActual('lodash');
lodash.uniqueId = () => '1';
const sohConfigurationQuery = reactQueryResult;
sohConfigurationQuery.data = sohConfiguration;

jest.mock('~components/data-acquisition-ui/client-interface/axios', () => ({
  Queries: {
    SohConfigurationQuery: {
      useSohConfigurationQuery: jest.fn(() => ({ data: sohConfiguration })),
      withSohConfigurationQuery: jest.fn(() => ({ data: sohConfiguration }))
    }
  }
}));

jest.mock(
  '~components/data-acquisition-ui/client-interface/axios/queries/soh-configuration-query',
  () => ({
    ...jest.requireActual(
      '../../../../../src/ts/components/data-acquisition-ui/client-interface/axios/queries/soh-configuration-query'
    ),
    useSohConfigurationQuery: jest.fn(() => ({ data: sohConfiguration }))
  })
);

describe('Soh Component', () => {
  beforeAll(() => {
    // Create a spy on console (console.log in this case) and provide some mocked implementation
    // In mocking global objects it's usually better than simple `jest.fn()`
    // because you can `un-mock` it in clean way doing `mockRestore`
    jest.spyOn(console, 'error').mockImplementation((msg: string) => {
      // eslint-disable-next-line jest/no-standalone-expect
      expect(msg).toEqual('got a failed promise');
    });
  });

  it('should be defined', () => {
    expect(StationGroupsLayout).toBeDefined();
  });

  uuid.asString = () => '1';

  const store = createStore();
  store.getState().dataAcquisitionWorkspaceState.data.sohStatus.isStale = false;

  const SohOverviewComponentWithProvider = props => (
    <Provider store={store}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <SohOverviewComponent {...props} />
    </Provider>
  );

  const mockAcknowledge = jest.fn().mockReturnValue(new Promise(jest.fn()));
  const SohOverviewComponentNonIdealState = WithNonIdealStates(
    [...DataAcquisitionNonIdealStateDefs.generalSohNonIdealStateDefinitions],
    SohOverviewComponentWithProvider
  );

  const sohOverviewOrNonIdealState: any = Enzyme.mount(
    <SohOverviewComponentNonIdealState
      sohStatus={{
        lastUpdated: 0,
        loading: false,
        error: undefined,
        isStale: false,
        stationAndStationGroupSoh: {
          stationGroups: [],
          stationSoh: [],
          isUpdateResponse: false
        }
      }}
      glContainer={undefined}
      sohConfigurationQuery={undefined}
    />
  );

  it('should render non ideal states and match snapshot', () => {
    expect(sohOverviewOrNonIdealState).toMatchSnapshot();
  });

  it('should show non-ideal state when the golden layout container is hidden', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    act(() => {
      sohOverviewOrNonIdealState.setProps({
        sohStatus: undefined,
        acknowledgeStationsByName: mockAcknowledge,
        glContainer: { isHidden: true, on: jest.fn(), off: jest.fn() },
        saveStationGroupSohStatus: undefined,
        mutate: undefined
      });
      sohOverviewOrNonIdealState.update();
    });
    expect(sohOverviewOrNonIdealState).toMatchSnapshot();
  });

  it('should show non-ideal state when there is no query', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    act(() => {
      sohOverviewOrNonIdealState.setProps({
        sohStatus: undefined,
        acknowledgeStationsByName: mockAcknowledge,
        glContainer: undefined,
        saveStationGroupSohStatus: undefined,
        mutate: undefined
      });
      sohOverviewOrNonIdealState.update();
    });

    expect(sohOverviewOrNonIdealState).toMatchSnapshot();
  });

  it('should show non-ideal state when there is no station group data', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    act(() => {
      sohOverviewOrNonIdealState.setProps({
        sohStatus: {
          loading: false,
          stationGroupSohStatus: []
        },
        sohConfigurationQuery,
        acknowledgeStationsByName: mockAcknowledge,
        glContainer: undefined,
        saveStationGroupSohStatus: undefined,
        mutate: undefined
      });
      sohOverviewOrNonIdealState.update();
    });
    expect(sohOverviewOrNonIdealState).toMatchSnapshot();
  });

  it('should match snapshot with basic props', () => {
    const realDateNow = Date.now.bind(global.Date);
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const dateNowStub = jest.fn(() => 1530518207007);
    global.Date.now = dateNowStub;

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    act(() => {
      sohOverviewOrNonIdealState.setProps({
        sohStatus: {
          loading: false,
          error: undefined,
          isStale: false,
          stationAndStationGroupSoh: stationAndStationGroupSohStatus
        },
        sohConfigurationQuery,
        acknowledgeStationsByName: mockAcknowledge,
        saveStationGroupSohStatus: undefined,
        mutate: undefined
      });
      sohOverviewOrNonIdealState.update();
    });
    expect(sohOverviewOrNonIdealState).toMatchSnapshot();
    global.Date.now = realDateNow;
  });
});
