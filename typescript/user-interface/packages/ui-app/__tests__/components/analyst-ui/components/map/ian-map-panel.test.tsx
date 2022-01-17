import { H1 } from '@blueprintjs/core';
import { createStore } from '@gms/ui-state';
import { mount } from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';

import { IANMapPanel } from '../../../../../src/ts/components/analyst-ui/components/map/ian-map-panel';
import { BaseDisplayContext } from '../../../../../src/ts/components/common-ui/components/base-display';
// eslint-disable-next-line jest/no-mocks-import
import { I08BO, TIXI } from '../../../../__data__/geojson-data';

jest.mock('../../../../../src/ts/components/common-ui/components/map', () => {
  const MockMap = () => {
    return <H1>Map</H1>;
  };
  return { Map: () => MockMap() };
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedStationsResult: any[] = [TIXI, I08BO];
const wrapper = mount(
  <Provider store={createStore()}>
    <BaseDisplayContext.Provider value={{ glContainer: {} as any, widthPx: 200, heightPx: 200 }}>
      <IANMapPanel stationsResult={mockedStationsResult} />
    </BaseDisplayContext.Provider>
  </Provider>
);

describe('ui ian map', () => {
  test('is defined', () => {
    expect(IANMapPanel).toBeDefined();
  });
  test('can mount map', () => {
    expect(wrapper).toMatchSnapshot();
  });
});
