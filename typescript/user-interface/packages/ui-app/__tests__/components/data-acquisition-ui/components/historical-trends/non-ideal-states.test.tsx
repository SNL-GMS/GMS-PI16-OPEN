import { SohTypes } from '@gms/common-model';
import React from 'react';

import { validateNonIdealState } from '../../../../../src/ts/components/data-acquisition-ui/components/historical-trends/non-ideal-states';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

const monitorType = SohTypes.SohMonitorType.LAG;
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const startTime = 1606818240000;
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const endTime = 1606818240100;

describe('HistoricalTrends non-ideal-states', () => {
  it('is functions exported', () => {
    expect(validateNonIdealState).toBeDefined();
  });

  it('is loading', () => {
    const mockComponent = Enzyme.mount(
      <>{validateNonIdealState(monitorType, true, undefined, startTime, endTime)}</>
    );
    expect(mockComponent).toMatchSnapshot();
  });

  it('is not loading with undefined data', () => {
    const mockComponent = Enzyme.mount(
      <>{validateNonIdealState(monitorType, false, undefined, startTime, endTime)}</>
    );
    expect(mockComponent).toMatchSnapshot();
  });

  it('is not loading with no data 01', () => {
    const mockComponent = Enzyme.mount(
      <>
        {validateNonIdealState(
          monitorType,
          true,
          {
            stationName: undefined,
            calculationTimes: undefined,
            monitorValues: undefined,
            minAndMax: undefined,
            percentageSent: undefined
          },
          startTime,
          endTime
        )}
      </>
    );
    expect(mockComponent).toMatchSnapshot();
  });

  it('is not loading with no data 02', () => {
    const mockComponent = Enzyme.mount(
      <>
        {validateNonIdealState(
          monitorType,
          true,
          {
            stationName: 'testStation',
            calculationTimes: [],
            monitorValues: [],
            minAndMax: undefined,
            percentageSent: 0
          },
          startTime,
          endTime
        )}
      </>
    );
    expect(mockComponent).toMatchSnapshot();
  });
  it('Can handle bad start and end times', () => {
    const badStartTime = 3000;
    const badEndTime = 2000;
    const historicalSohByStation = {
      stationName: 'testStation',
      calculationTimes: [],
      monitorValues: [],
      minAndMax: undefined,
      percentageSent: 0
    };
    const mockComponent = Enzyme.mount(
      <>
        {validateNonIdealState(
          monitorType,
          false,
          historicalSohByStation,
          badStartTime,
          badEndTime
        )}
      </>
    );
    expect(mockComponent).toMatchSnapshot();
  });

  it('Can return undefined', () => {
    const mockComponent = Enzyme.mount(
      <>
        {validateNonIdealState(
          monitorType,
          false,
          {
            stationName: 'testStation',
            calculationTimes: [],
            monitorValues: [],
            minAndMax: undefined,
            percentageSent: 0
          },
          startTime,
          endTime
        )}
      </>
    );
    expect(mockComponent).toEqual({});
  });
});
