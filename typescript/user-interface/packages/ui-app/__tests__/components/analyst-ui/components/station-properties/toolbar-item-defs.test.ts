import { StationTypes } from '@gms/common-model';

import { getToolbarItemDefs } from '../../../../../src/ts/components/analyst-ui/components/station-properties/toolbar-item-defs';

describe('toolbar item defs', () => {
  test('has a getToolbarItemDefs function defined', () => {
    expect(getToolbarItemDefs).toBeDefined();
  });
  test('has a getToolbarItemDefs function that matches snapshots', () => {
    const effectiveAtTime: any = ['selectedEffectiveAt'];
    const selectedStation: any = {
      name: 'name',
      type: StationTypes.StationType.WEATHER,
      location: {
        latitudeDegrees: 10,
        longitudeDegrees: 10,
        depthKm: 100,
        description: 'description ',
        elevationKm: 100
      }
    };
    const selectedEffectiveAt = 'selectedEffectiveAt';
    expect(
      getToolbarItemDefs(
        effectiveAtTime,
        selectedStation,
        'stations name',
        selectedEffectiveAt,
        jest.fn(),
        jest.fn(),
        jest.fn()
      )
    ).toMatchSnapshot();
  });
  test('has a getToolbarItemDefs function that matches snapshots with empty station', () => {
    const effectiveAtTime: any = ['selectedEffectiveAt'];
    // empty station
    const selectedStation: any = {
      name: 'name'
    };
    const selectedEffectiveAt = 'selectedEffectiveAt';
    expect(
      getToolbarItemDefs(
        effectiveAtTime,
        selectedStation,
        'stations name',
        selectedEffectiveAt,
        jest.fn(),
        jest.fn(),
        jest.fn()
      )
    ).toMatchSnapshot();
  });
  test('has a getToolbarItemDefs function that matches snapshots with null station', () => {
    const effectiveAtTime: any = ['selectedEffectiveAt'];
    expect(
      getToolbarItemDefs(effectiveAtTime, null, null, null, jest.fn(), jest.fn(), jest.fn())
    ).toMatchSnapshot();
  });
});
