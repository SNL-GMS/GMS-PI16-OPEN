import { CommonTypes } from '@gms/common-model';
import * as React from 'react';

import { DayBoundaryIndicator } from '../../../../../src/ts/components/analyst-ui/components/workflow/day-boundary-indicator';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

const timeRange: CommonTypes.TimeRange = { startTimeSecs: 0, endTimeSecs: 10000 };
const dayBoundaryIndicator = Enzyme.mount(<DayBoundaryIndicator timeRange={timeRange} />);

describe('Daily boundary indicator', () => {
  it('should be defined', () => {
    expect(dayBoundaryIndicator).toBeDefined();
  });

  it('should match snapshot', () => {
    expect(dayBoundaryIndicator).toMatchSnapshot();
  });

  it('should scroll', () => {
    const spy = jest.spyOn(
      dayBoundaryIndicator.find(DayBoundaryIndicator).instance(),
      'scrollDayIndicator'
    );

    dayBoundaryIndicator.find(DayBoundaryIndicator).instance().scrollDayIndicator(5);

    expect(spy).toBeCalled();
  });
});
