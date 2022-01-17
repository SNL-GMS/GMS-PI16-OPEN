import React from 'react';

import { StationNameCellRenderer } from '../../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/cell-renderers/station-cell-renderer';
import { StationStatisticsTableDataContext } from '../../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/types';
import { cellRendererProps, row } from './common-test-data';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

describe('Station Name cell renderer', () => {
  const stationNameCellRenderer = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StationStatisticsTableDataContext.Provider value={{ data: [row] }}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <StationNameCellRenderer {...cellRendererProps} />
    </StationStatisticsTableDataContext.Provider>
  );

  const nullStationNameCellRenderer = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StationStatisticsTableDataContext.Provider value={{ data: [] }}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <StationNameCellRenderer {...cellRendererProps} />
    </StationStatisticsTableDataContext.Provider>
  );

  it('StationNameCellRenderer can be created', () => {
    expect(stationNameCellRenderer).toMatchSnapshot();
  });
  it('can be created handle no data', () => {
    expect(nullStationNameCellRenderer).toMatchSnapshot();
  });
});
