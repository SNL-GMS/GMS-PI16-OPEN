/* eslint-disable @typescript-eslint/no-magic-numbers */
import { SohTypes } from '@gms/common-model';

import {
  convertToTypedArray,
  findMinAndMax
} from '../../../../../../src/ts/components/data-acquisition-ui/client-interface/axios/queries/historical-soh-utils';

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('Historical SOH Utils', () => {
  it('is functions exported', () => {
    expect(convertToTypedArray).toBeDefined();
    expect(findMinAndMax).toBeDefined();
  });

  it('is finding min and max correctly, no empty', () => {
    const minMax: SohTypes.MinAndMax = findMinAndMax([], []);
    expect(minMax.xMin).toEqual(undefined);
    expect(minMax.xMax).toEqual(undefined);
    expect(minMax.yMin).toEqual(undefined);
    expect(minMax.yMax).toEqual(undefined);
  });

  it('is finding min and max correctly, ordered data', () => {
    const minMax: SohTypes.MinAndMax = findMinAndMax(
      [0, 1, 2, 3, 4, 5, 6, 7],
      [0, 1, 2, 3, 4, 5, 6, 7]
    );

    expect(minMax.xMin).toEqual(0);
    expect(minMax.xMax).toEqual(7);
    expect(minMax.yMin).toEqual(0);
    expect(minMax.yMax).toEqual(7);
  });

  it('is finding min and max correctly, out of order data', () => {
    const minMax: SohTypes.MinAndMax = findMinAndMax(
      [0.1, 1.9, 2, 3.6],
      [11, 200, 300, 40, 2, 7, 9, 32]
    );

    expect(minMax.xMin).toEqual(0.1);
    expect(minMax.xMax).toEqual(3.6);
    expect(minMax.yMin).toEqual(2);
    expect(minMax.yMax).toEqual(300);
  });

  const uiHistoricalSohEmpty: SohTypes.UiHistoricalSoh = {
    stationName: 'test',
    calculationTimes: [0, 1, 2, 3],
    monitorValues: [],
    percentageSent: 100
  };

  it('convert to TypedArray of empty/undefined', async () => {
    expect(await convertToTypedArray(0, 3, uiHistoricalSohEmpty)).toEqual([]);
  });

  it('convert to TypedArray of bad data', async () => {
    const uiHistoricalSohBad: SohTypes.UiHistoricalSoh = {
      stationName: 'test',
      calculationTimes: [0, 1, 2],
      monitorValues: [
        {
          channelName: 'testChan0',
          values: {
            values: [10, 20, 30, 40],
            type: SohTypes.SohValueType.DURATION
          },
          average: 70
        },
        {
          channelName: 'testChan1',
          values: {
            values: [2, 7, 9, 32],
            type: SohTypes.SohValueType.DURATION
          },
          average: 26
        }
      ],
      percentageSent: 100
    };

    await expect(convertToTypedArray(0, 2, uiHistoricalSohBad)).rejects.toThrow(
      'Typed array conversion failed; requires equal length values 3 4'
    );
  });

  it('convert to TypedArray of defined with duration', async () => {
    const uiHistoricalSohDuration: SohTypes.UiHistoricalSoh = {
      stationName: 'test',
      calculationTimes: [0, 1, 2, 3],
      monitorValues: [
        {
          channelName: 'testChan0',
          values: {
            values: [10, 20, 30, 40],
            type: SohTypes.SohValueType.DURATION
          },
          average: 70.4
        },
        {
          channelName: 'testChan1',
          values: {
            values: [2, 7, 9, 32],
            type: SohTypes.SohValueType.DURATION
          },
          average: 26.4
        }
      ],
      percentageSent: 100
    };

    const result = [
      {
        average: 70,
        channelName: 'testChan0',
        type: SohTypes.SohValueType.DURATION,
        values: new Float32Array([0, 10, 33.33333206176758, 20, 66.66666412353516, 30, 100, 40])
      },
      {
        average: 26,
        channelName: 'testChan1',
        type: SohTypes.SohValueType.DURATION,
        values: new Float32Array([0, 2, 33.33333206176758, 7, 66.66666412353516, 9, 100, 32])
      }
    ];

    expect(await convertToTypedArray(0, 3, uiHistoricalSohDuration)).toEqual(result);
  });

  it('convert to TypedArray of defined with percent', async () => {
    const uiHistoricalSohPercent: SohTypes.UiHistoricalSoh = {
      stationName: 'test',
      calculationTimes: [0, 1, 2, 3],
      monitorValues: [
        {
          channelName: 'testChan0',
          values: {
            values: [10, 20, 30, 40],
            type: SohTypes.SohValueType.PERCENT
          },
          average: 70.4
        },
        {
          channelName: 'testChan1',
          values: {
            values: [2, 7, 9, 32],
            type: SohTypes.SohValueType.PERCENT
          },
          average: 26.4
        }
      ],
      percentageSent: 100
    };

    const result = [
      {
        average: 70.4,
        channelName: 'testChan0',
        type: SohTypes.SohValueType.PERCENT,
        values: new Float32Array([0, 10, 33.33333206176758, 20, 66.66666412353516, 30, 100, 40])
      },
      {
        average: 26.4,
        channelName: 'testChan1',
        type: SohTypes.SohValueType.PERCENT,
        values: new Float32Array([0, 2, 33.33333206176758, 7, 66.66666412353516, 9, 100, 32])
      }
    ];

    expect(await convertToTypedArray(0, 3, uiHistoricalSohPercent)).toEqual(result);
  });
});
