/* eslint-disable react/jsx-props-no-spreading */

import { CheckboxSearchListTypes, ToolbarTypes } from '@gms/ui-core-components';
import { createStore } from '@gms/ui-state';
import Enzyme from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';

import {
  buildStationsDropdown,
  buildUpdatedListFunc,
  StationControls,
  useStationsDropdownControl
} from '../../../../../../../src/ts/components/analyst-ui/components/waveform/components/waveform-controls/stations-control';
import { waitForComponentToPaint } from '../../../../../../utils/general-utils';

const store = createStore();

describe('station control', () => {
  it('is defined', () => {
    expect(buildUpdatedListFunc).toBeDefined();
    expect(StationControls).toBeDefined();
    expect(buildStationsDropdown).toBeDefined();
    expect(useStationsDropdownControl).toBeDefined();
  });
  const stationControlList: CheckboxSearchListTypes.CheckboxItem[] = [
    {
      id: 'id1',
      name: 'id1',
      checked: true
    },
    {
      id: 'id2',
      name: 'id2',
      checked: false
    }
  ];
  const callBackMock = jest.fn();
  const wrapper = Enzyme.mount(
    <StationControls checkboxItems={stationControlList} setCheckboxItems={callBackMock} />
  );
  it('StationControls matches a snapshot when given basic props', () => {
    expect(wrapper).toMatchSnapshot();
  });
  it('buildUpdatedList matches a snapshot', () => {
    const updatedListFunc = buildUpdatedListFunc('id1', false);
    const updatedList = updatedListFunc(stationControlList);
    expect(updatedList[0].checked).toEqual(false);
    expect(updatedList).toMatchSnapshot();
  });
  it('buildStationsDropdown matches a snapshot', () => {
    expect(buildStationsDropdown(stationControlList, jest.fn(), 1)).toMatchSnapshot();
  });
  it('useStationsDropdownControl matches a snapshot', async () => {
    const TestComponent = () => {
      const stationsDropdownControl: ToolbarTypes.CustomItem = useStationsDropdownControl(1);
      return stationsDropdownControl.element;
    };
    store.getState().commonWorkspaceState.stationsVisibility = store
      .getState()
      .commonWorkspaceState.stationsVisibility.set('name', {
        visibility: true,
        station: { name: 'name' } as any
      });
    store.getState().commonWorkspaceState.stationsVisibility = store
      .getState()
      .commonWorkspaceState.stationsVisibility.set('name2', {
        visibility: true,
        station: { name: 'name2' } as any
      });
    const wrapperControl = Enzyme.mount(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );
    // This ensures that the axios request will have been called.
    await waitForComponentToPaint(wrapperControl);
    expect(wrapperControl).toMatchSnapshot();
  });
});
