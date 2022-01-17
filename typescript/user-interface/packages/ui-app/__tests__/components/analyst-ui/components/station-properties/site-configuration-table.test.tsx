import { ChannelTypes, StationTypes } from '@gms/common-model';
import { toEpochSeconds } from '@gms/common-util';
import { mount } from 'enzyme';
import * as React from 'react';

import { SiteConfigurationTable } from '../../../../../src/ts/components/analyst-ui/components/station-properties/site-configuration-table';
import { siteColumnsToDisplay } from '../../../../../src/ts/components/analyst-ui/components/station-properties/station-properties-utils';

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

describe('Site Configuration Table', () => {
  const station: StationTypes.Station = {
    name: 'STA',
    effectiveAt: toEpochSeconds('2021-04-20T16:11:31.118870Z'),
    effectiveUntil: toEpochSeconds('2021-04-20T16:11:31.118870Z'),
    relativePositionsByChannel: new Map<string, ChannelTypes.RelativePosition>([
      [
        'Real Channel Name One',
        {
          northDisplacementKm: 50.0,
          eastDisplacementKm: 5.0,
          verticalDisplacementKm: 10.0
        }
      ],
      [
        'Real Channel Name Two',
        {
          northDisplacementKm: 50.0,
          eastDisplacementKm: 5.0,
          verticalDisplacementKm: 10.0
        }
      ]
    ]),
    channelGroups: [{} as any],
    allRawChannels: [{} as any],
    description: 'This is a test station',
    location: {
      latitudeDegrees: 35.647,
      longitudeDegrees: 100.0,
      depthKm: 50.0,
      elevationKm: 10.0
    },
    type: StationTypes.StationType.SEISMIC_1_COMPONENT
  };
  const wrapper = mount(
    <SiteConfigurationTable
      onRowSelection={jest.fn()}
      station={station}
      columnsToDisplay={siteColumnsToDisplay}
    />
  );
  test('can mount', () => {
    expect(wrapper).toBeDefined();
  });
  test('matches snapshot', () => {
    expect(wrapper).toMatchSnapshot();
  });
});
