import { mount } from 'enzyme';
import * as React from 'react';

import { StationPropertiesPanel } from '../../../../../src/ts/components/analyst-ui/components/station-properties';
import { getOnEffectiveTimeChange } from '../../../../../src/ts/components/analyst-ui/components/station-properties/station-properties-panel';
import * as StationsQuery from '../../../../../src/ts/components/client-interface/axios/queries/stations-definition-query';
import { BaseDisplayContext } from '../../../../../src/ts/components/common-ui/components/base-display/base-display-context';

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

describe('station-properties-panel', () => {
  test('can mount', () => {
    expect(StationPropertiesPanel).toBeDefined();
    expect(getOnEffectiveTimeChange).toBeDefined();
  });
  test('OnEffectiveTimeChange calls functions with correct data', () => {
    const func1 = jest.fn();
    const func2 = jest.fn();
    const effectiveTimes: string[] = ['1234'];
    const OnEffectiveTimeChange = getOnEffectiveTimeChange(func1, func2, effectiveTimes);
    OnEffectiveTimeChange('1234');
    // set the lock for searching for data
    expect(func1).toHaveBeenCalledWith(true);
    // index of effective time
    expect(func2).toHaveBeenCalledWith(0);
  });
  test('matches snapshot', () => {
    Object.assign(StationsQuery, {
      useStationsQuery: jest.fn(() => {
        return {
          status: 'success',
          data: [
            {
              station: 'station',
              name: 'test',
              channelGroups: [{ name: 'channelGroupName' }]
            }
          ]
        };
      })
    });
    const wrapper = mount(
      <BaseDisplayContext.Provider
        value={{
          glContainer: {} as any,
          widthPx: 100,
          heightPx: 100
        }}
      >
        <StationPropertiesPanel selectedStation="test" effectiveAtTimes={['some time']} />
      </BaseDisplayContext.Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });
  test('matches snapshot with [] station data', () => {
    Object.assign(StationsQuery, {
      useStationsQuery: jest.fn(() => {
        return {
          status: 'success',
          data: []
        };
      })
    });
    const wrapper = mount(
      <BaseDisplayContext.Provider
        value={{
          glContainer: {} as any,
          widthPx: 100,
          heightPx: 100
        }}
      >
        <StationPropertiesPanel selectedStation="test" effectiveAtTimes={['some time']} />
      </BaseDisplayContext.Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });
});
