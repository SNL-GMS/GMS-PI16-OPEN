import React from 'react';

import {
  ChannelLagCellRenderer,
  StationLagCellRenderer
} from '../../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/cell-renderers/lag-cell-renderer';
import { StationStatisticsTableDataContext } from '../../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/types';
import { cellRendererProps, row } from './common-test-data';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

describe('Lag cell renderer', () => {
  const channelLagCellRenderer = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StationStatisticsTableDataContext.Provider value={{ data: [row] }}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <ChannelLagCellRenderer {...cellRendererProps} />
    </StationStatisticsTableDataContext.Provider>
  );

  const stationLagCellRenderer = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StationStatisticsTableDataContext.Provider value={{ data: [row] }}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <StationLagCellRenderer {...cellRendererProps} />
    </StationStatisticsTableDataContext.Provider>
  );

  const nullStationLagCellRenderer = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StationStatisticsTableDataContext.Provider value={{ data: [] }}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <StationLagCellRenderer {...cellRendererProps} />
    </StationStatisticsTableDataContext.Provider>
  );

  it('ChannelLagCellRenderer can be created', () => {
    expect(channelLagCellRenderer).toMatchSnapshot();
  });

  it('StationLagCellRenderer can be created', () => {
    expect(stationLagCellRenderer).toMatchSnapshot();
  });

  it('can be created handle no data', () => {
    expect(nullStationLagCellRenderer).toMatchSnapshot();
  });
});
