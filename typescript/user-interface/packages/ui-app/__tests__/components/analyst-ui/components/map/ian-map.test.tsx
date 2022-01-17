import { H1 } from '@blueprintjs/core';
import { createStore } from '@gms/ui-state';
import { mount } from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';

import { IANMap } from '../../../../../src/ts/components/analyst-ui/components/map';
import * as Queries from '../../../../../src/ts/components/client-interface';

jest.mock('../../../../../src/ts/components/analyst-ui/components/map/ian-map-panel', () => {
  const MockMap = () => {
    return <H1>Map</H1>;
  };
  return { IANMapPanel: () => MockMap() };
});

describe('ui ian map', () => {
  const mockQueries = {
    Queries: {
      StationQueryUtil: {
        useDefaultStationGroupStationQuery: jest.fn(() => {
          return {};
        }),
        useStationGroupStationQuery: jest.fn(() => {
          return {};
        }),
        useAllStationsQuery: jest.fn(() => {
          return {};
        })
      }
    }
  };
  Object.assign(Queries, mockQueries);
  test('is defined', () => {
    expect(IANMap).toBeDefined();
  });
  test('has defined queries DefaultStationGroupStationQuery', () => {
    expect(Queries.Queries.StationQueryUtil.useDefaultStationGroupStationQuery).toBeDefined();
  });
  test('can mount map', () => {
    const wrapper = mount(
      <Provider store={createStore()}>
        <IANMap />
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('calls station groups', () => {
    const wrapper = mount(
      <Provider store={createStore()}>
        <IANMap />
      </Provider>
    );
    expect(wrapper).toBeDefined();
    expect(mockQueries.Queries.StationQueryUtil.useAllStationsQuery).toHaveBeenCalled();
    expect(
      mockQueries.Queries.StationQueryUtil.useDefaultStationGroupStationQuery
    ).not.toHaveBeenCalled();
  });
});
