import React from 'react';

import {
  ChannelTimelinessCellRenderer,
  StationTimelinessCellRenderer
} from '../../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/cell-renderers/timeliness-cell-renderer';
import { StationStatisticsTableDataContext } from '../../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/types';
import { cellRendererProps, row } from './common-test-data';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

describe('Timeliness cell renderer', () => {
  const channelTimelinessCellRenderer = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StationStatisticsTableDataContext.Provider value={{ data: [row] }}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <ChannelTimelinessCellRenderer {...cellRendererProps} />
    </StationStatisticsTableDataContext.Provider>
  );

  const stationMissingCellRenderer = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StationStatisticsTableDataContext.Provider value={{ data: [row] }}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <StationTimelinessCellRenderer {...cellRendererProps} />
    </StationStatisticsTableDataContext.Provider>
  );

  const nullStationTimelinessCellRenderer = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StationStatisticsTableDataContext.Provider value={{ data: [] }}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <StationTimelinessCellRenderer {...cellRendererProps} />
    </StationStatisticsTableDataContext.Provider>
  );

  it('ChannelTimelinessCellRenderer can be created', () => {
    expect(channelTimelinessCellRenderer).toMatchSnapshot();
  });

  it('StationTimelinessCellRenderer can be created', () => {
    expect(stationMissingCellRenderer).toMatchSnapshot();
  });
  it('can be created handle no data', () => {
    expect(nullStationTimelinessCellRenderer).toMatchSnapshot();
  });
});
