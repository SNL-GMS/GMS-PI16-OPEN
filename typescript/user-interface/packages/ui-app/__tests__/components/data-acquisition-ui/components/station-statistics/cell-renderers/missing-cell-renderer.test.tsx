import React from 'react';

import {
  ChannelMissingCellRenderer,
  StationMissingCellRenderer
} from '../../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/cell-renderers/missing-cell-renderer';
import { StationStatisticsTableDataContext } from '../../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/types';
import { cellRendererProps, row } from './common-test-data';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

describe('Missing cell renderer', () => {
  const channelMissingCellRenderer = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StationStatisticsTableDataContext.Provider value={{ data: [row] }}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <ChannelMissingCellRenderer {...cellRendererProps} />
    </StationStatisticsTableDataContext.Provider>
  );

  const stationMissingCellRenderer = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StationStatisticsTableDataContext.Provider value={{ data: [row] }}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <StationMissingCellRenderer {...cellRendererProps} />
    </StationStatisticsTableDataContext.Provider>
  );

  const nullStationMissingCellRenderer = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StationStatisticsTableDataContext.Provider value={{ data: [] }}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <StationMissingCellRenderer {...cellRendererProps} />
    </StationStatisticsTableDataContext.Provider>
  );

  it('ChannelMissingCellRenderer can be created', () => {
    expect(channelMissingCellRenderer).toMatchSnapshot();
  });

  it('StationMissingCellRenderer can be created', () => {
    expect(stationMissingCellRenderer).toMatchSnapshot();
  });

  it('can be created handle no data', () => {
    expect(nullStationMissingCellRenderer).toMatchSnapshot();
  });
});
