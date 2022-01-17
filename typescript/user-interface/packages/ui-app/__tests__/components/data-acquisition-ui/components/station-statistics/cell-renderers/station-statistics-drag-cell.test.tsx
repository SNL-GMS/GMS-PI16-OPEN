import { uuid } from '@gms/common-util';
import uniqueId from 'lodash/uniqueId';
import React from 'react';

import {
  findClosestRow,
  StationStatisticsDragCell,
  StationStatisticsDragCellProps
  // eslint-disable-next-line max-len
} from '../../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/cell-renderers/station-statistics-drag-cell';
import { StationStatisticsContext } from '../../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/station-statistics-context';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

uuid.asString = jest.fn().mockImplementation(uniqueId);

describe('Soh Drag Cell', () => {
  const dragCellProps: StationStatisticsDragCellProps = {
    stationId: 'AAA'
  };

  const wrapper = Enzyme.mount(
    <StationStatisticsContext.Provider
      value={{
        updateIntervalSecs: 1,
        quietTimerMs: 1,
        selectedStationIds: ['AAA'],
        setSelectedStationIds: jest.fn(),
        acknowledgeSohStatus: jest.fn(),
        sohStationStaleTimeMS: 30000
      }}
    >
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <StationStatisticsDragCell {...dragCellProps} />
    </StationStatisticsContext.Provider>
  );

  it('is defined', () => {
    expect(wrapper).toBeDefined();
  });

  it('Matches snapshot', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('Can find closest HTMLElement', () => {
    const closestElement = 'someClass';
    const element: Element = document.createElement('drag');
    const dragElement: any = {
      target: element
    };
    dragElement.target.closest = jest.fn(() => closestElement);
    const result = findClosestRow(dragElement);
    expect(result).toEqual(closestElement);
  });
  it('Find closest returns undefined', () => {
    const element: any = {
      className: 'someClass'
    };
    const result = findClosestRow(element);
    expect(result).toBeUndefined();
  });
});
