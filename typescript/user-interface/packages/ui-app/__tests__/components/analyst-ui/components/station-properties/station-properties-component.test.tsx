import { CommonWorkspaceActions, createStore } from '@gms/ui-state';
import { mount } from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';

import { StationPropertiesComponent } from '../../../../../src/ts/components/analyst-ui/components/station-properties';

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

describe('station-properties-panel', () => {
  test('can mount', () => {
    expect(StationPropertiesComponent).toBeDefined();
  });
  test('matches snapshot', () => {
    const store = createStore();
    store.dispatch(CommonWorkspaceActions.setSelectedStationIds(['targetEntity.id']));
    const wrapper = mount(
      <Provider store={store}>
        <StationPropertiesComponent />
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });
  test('matches snapshot 1 station', () => {
    const store = createStore();
    store.dispatch(CommonWorkspaceActions.setSelectedStationIds(['station1']));
    const wrapper = mount(
      <Provider store={store}>
        <StationPropertiesComponent />
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });
  test('matches snapshot multiple stations', () => {
    const store = createStore();
    store.dispatch(CommonWorkspaceActions.setSelectedStationIds(['station1', 'station2']));
    const wrapper = mount(
      <Provider store={store}>
        <StationPropertiesComponent />
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });
  test('matches snapshot no stations', () => {
    const store = createStore();
    const wrapper = mount(
      <Provider store={store}>
        <StationPropertiesComponent />
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });
});
