import React from 'react';

import {
  ChannelEnvironmentCellRenderer,
  StationEnvironmentCellRenderer
} from '../../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/cell-renderers/environment-cell-renderer';
import { StationStatisticsTableDataContext } from '../../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/types';
import { cellRendererProps, row } from './common-test-data';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

describe('Environment cell renderer', () => {
  const channelEnvironmentCellRenderer = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StationStatisticsTableDataContext.Provider value={{ data: [row] }}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <ChannelEnvironmentCellRenderer {...cellRendererProps} />
    </StationStatisticsTableDataContext.Provider>
  );

  const stationEnvironmentCellRenderer = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StationStatisticsTableDataContext.Provider value={{ data: [row] }}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <StationEnvironmentCellRenderer {...cellRendererProps} />
    </StationStatisticsTableDataContext.Provider>
  );

  const nullStationEnvironmentCellRenderer = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StationStatisticsTableDataContext.Provider value={{ data: [] }}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <StationEnvironmentCellRenderer {...cellRendererProps} />
    </StationStatisticsTableDataContext.Provider>
  );

  it('ChannelEnvironmentCellRenderer can be created', () => {
    expect(channelEnvironmentCellRenderer).toMatchSnapshot();
  });

  it('StationEnvironmentCellRenderer can be created', () => {
    expect(stationEnvironmentCellRenderer).toMatchSnapshot();
  });

  it('can be created handle no data', () => {
    expect(nullStationEnvironmentCellRenderer).toMatchSnapshot();
  });
});
