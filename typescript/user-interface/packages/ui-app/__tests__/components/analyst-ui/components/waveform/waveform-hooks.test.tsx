import { CheckboxSearchListTypes } from '@gms/ui-core-components';
import { CommonWorkspaceActions, CommonWorkspaceTypes, createStore } from '@gms/ui-state';
import * as Enzyme from 'enzyme';
import Immutable from 'immutable';
import * as React from 'react';
import { Provider } from 'react-redux';

import { data } from '../../../../../src/ts/components/analyst-ui/components/station-properties/mock-station-data';
import {
  getStationsVisibilityMapWithFalseVisibility,
  useStationDefinitionResult,
  useStationsVisibilityFromCheckboxState
} from '../../../../../src/ts/components/analyst-ui/components/waveform/waveform-hooks';
import { waitForComponentToPaint } from '../../../../utils/general-utils';

const { station } = data;
const validMap: Immutable.Map<string, CommonWorkspaceTypes.StationVisibilityObject> = Immutable.Map<
  string,
  CommonWorkspaceTypes.StationVisibilityObject
>([[station.name, { visibility: true, station }]]);

jest.mock(
  '../../../../../src/ts/components/client-interface/axios/queries/station-query-util.tsx',
  () => ({
    useStationGroupStationQuery: () => ({ data: [station] }),
    useAllStationsQuery: () => ({ data: [station] })
  })
);

jest.mock('react-redux', () => {
  const actualRedux = jest.requireActual('react-redux');
  return {
    ...actualRedux,
    useDispatch: jest.fn(() => jest.fn())
  };
});

describe('waveform-hooks', () => {
  test('functions are defined', () => {
    expect(getStationsVisibilityMapWithFalseVisibility).toBeDefined();
    expect(useStationDefinitionResult).toBeDefined();
    expect(useStationsVisibilityFromCheckboxState).toBeDefined();
  });

  const expectUseStationsVisibilityFromCheckboxStateHookToMatchSnapshot = async () => {
    const getUpdatedCheckboxItemsList = jest.fn(
      (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        previousList: CheckboxSearchListTypes.CheckboxItem[]
      ): CheckboxSearchListTypes.CheckboxItem[] => {
        return [
          { name: 'name', id: 'name', checked: false },
          { name: 'name2', id: 'name2', checked: true }
        ];
      }
    );
    const TestComponent: React.FC = () => {
      const checkboxItemsList: CheckboxSearchListTypes.CheckboxItem[] = [
        { name: 'name', id: 'name', checked: true },
        { name: 'name2', id: 'name2', checked: true }
      ];
      let stationsVisibility: Immutable.Map<
        string,
        CommonWorkspaceTypes.StationVisibilityObject
      > = Immutable.Map<string, CommonWorkspaceTypes.StationVisibilityObject>();
      stationsVisibility = stationsVisibility.set('name', {
        visibility: true,
        station: { name: 'name' } as any
      });
      const setStationsVisibilityFromCheckboxState = useStationsVisibilityFromCheckboxState(
        checkboxItemsList,
        stationsVisibility
      );
      setStationsVisibilityFromCheckboxState(getUpdatedCheckboxItemsList);
      return null;
    };

    const store = createStore();
    store.dispatch(CommonWorkspaceActions.setStationsVisibility(validMap));

    // Mounting may call the request, if React decides to run it soon.
    const wrapper = Enzyme.mount(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    // This ensures that the axios request will have been called.
    await waitForComponentToPaint(wrapper);
    expect(getUpdatedCheckboxItemsList).toHaveBeenCalledTimes(1);
  };
  it('useStationsVisibilityFromCheckboxState matches the snapshot', async () => {
    await expectUseStationsVisibilityFromCheckboxStateHookToMatchSnapshot();
    expect(useStationsVisibilityFromCheckboxState).toBeDefined();
  });

  describe('getStationsVisibilityMapWithFalseVisibility', () => {
    test('with valid input, creates a new map with visibility set to false', () => {
      const result = getStationsVisibilityMapWithFalseVisibility(validMap);
      let allFalse = true;
      result.forEach(val => {
        if (val.visibility) {
          allFalse = false;
        }
      });
      expect(allFalse).toBeTruthy();
    });
  });

  describe('useStationDefinitionResult', () => {
    const expectHooksToMatchSnapshot = async (useHook: () => any) => {
      const TestComponent: React.FC = () => {
        const query = useHook();
        return <div>{JSON.stringify(query.data)}</div>;
      };

      const store = createStore();
      store.dispatch(CommonWorkspaceActions.setStationsVisibility(validMap));

      // Mounting may call the request, if React decides to run it soon.
      const wrapper = Enzyme.mount(
        <Provider store={store}>
          <TestComponent />
        </Provider>
      );

      // This ensures that the axios request will have been called.
      await waitForComponentToPaint(wrapper);
      expect(wrapper).toMatchSnapshot();
    };

    // eslint-disable-next-line jest/expect-expect
    it('mounts and matches basic snapshot', async () => {
      const startTimeSeconds = 2453;
      const useTestHook = () => useStationDefinitionResult(startTimeSeconds);
      await expectHooksToMatchSnapshot(useTestHook);
    });
  });
});
