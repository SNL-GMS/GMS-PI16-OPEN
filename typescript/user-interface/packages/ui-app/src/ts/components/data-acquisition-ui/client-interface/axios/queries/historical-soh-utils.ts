import { SohTypes } from '@gms/common-model';
import { setDecimalPrecisionAsNumber, Timer, uuid } from '@gms/common-util';
import * as d3 from 'd3';
import max from 'lodash/max';
import min from 'lodash/min';

/**
 * Converts two arrays (the x-axis values and the y-axis values) into
 * a single typed array (Float32Array). The Float32Array contains both x and y values
 * in the following format: `x, y, x, y, x, y`.
 *
 * NOTE: The conversion to typed arrays provides better memory management. It also
 * allows Weavess to have better performance because it no longer needs to perform
 * this pre-processing, i.e. it requires the Float32Array for WebGL.
 *
 * @param startTime the start time
 * @param endTime the end time
 * @param xValues the x-axis values (in most case time)
 * @param yValues the y-axis values
 */
const convertToFloat32Array = async (
  startTime: number,
  endTime: number,
  xValues: number[],
  yValues: number[]
): Promise<Float32Array> => {
  if (xValues.length !== yValues.length) {
    throw new Error(
      `Typed array conversion failed; requires equal length values ${xValues.length} ${yValues.length}`
    );
  }

  const convert = new Promise<Float32Array>(resolve => {
    const id = uuid.asString();
    Timer.start(`[historical soh util]: convert to float 32 array ${id}`);

    const domain = [startTime, endTime];
    const rangeLow = 0;
    const rangeHigh = 100;
    const timeToGlScale = d3.scaleLinear().domain(domain).range([rangeLow, rangeHigh]);

    const values: Float32Array = new Float32Array(xValues.length * 2);

    let n = 0;
    xValues.forEach((xValue, idx) => {
      // eslint-disable-next-line no-plusplus
      values[n++] = timeToGlScale(xValue);
      // eslint-disable-next-line no-plusplus
      values[n++] = yValues[idx];
    });
    Timer.end(`[historical soh util]: convert to float 32 array ${id}`);

    resolve(values);
  });

  return convert;
};

/**
 * Formats the average based on the value type.
 *
 * @param average the average to round
 * @param sohValueType the value type used to determine the correct precision when rounding
 */
const formatAverage = (average: number, sohValueType: SohTypes.SohValueType): number => {
  // Percentages go to one decimal place and seconds go to whole integers.
  if (sohValueType === SohTypes.SohValueType.DURATION) {
    return setDecimalPrecisionAsNumber(average, 0);
  }
  return setDecimalPrecisionAsNumber(average, 1);
};

/**
 * Converts the provided channel date to a typed array.
 *
 * @param startTime the start time
 * @param endTime the end time
 * @param calculationTimes the calculation times (x-axis values)
 * @param monitorValue the monitor value
 */
const convertChannelToTypedArray = async (
  startTime: number,
  endTime: number,
  calculationTimes: number[],
  monitorValue: SohTypes.MonitorValue
): Promise<SohTypes.MonitorValueAsTypedArray> => {
  const id = uuid.asString();
  Timer.start(`[historical soh util]: convert to typed array ${monitorValue.channelName} ${id}`);
  const data: SohTypes.MonitorValueAsTypedArray = {
    channelName: monitorValue.channelName,
    // get values for monitor type requested
    values: await convertToFloat32Array(
      startTime,
      endTime,
      calculationTimes,
      monitorValue.values.values
    ),
    average: formatAverage(monitorValue.average, monitorValue.values.type),
    type: monitorValue.values.type
  };
  Timer.end(`[historical soh util]: convert to typed array ${monitorValue.channelName} ${id}`);
  return data;
};

/**
 * Converts the provided data to typed arrays.
 *
 * The conversion to typed arrays provides better memory management.
 *
 * @param startTime the start time
 * @param endTime the end time
 * @param uiHistoricalSoh the SOh historical data
 */
export const convertToTypedArray = async (
  startTime: number,
  endTime: number,
  uiHistoricalSoh: SohTypes.UiHistoricalSoh
): Promise<SohTypes.MonitorValueAsTypedArray[]> => {
  const id = uuid.asString();
  Timer.start(`[historical soh util]: convert to typed array ${id}`);
  // loop through each channel and convert to typed array
  const monitorValues = Promise.all(
    uiHistoricalSoh.monitorValues.map(async monitorValue =>
      convertChannelToTypedArray(startTime, endTime, uiHistoricalSoh.calculationTimes, monitorValue)
    )
  );
  Timer.end(`[historical soh util]: convert to typed array ${id}`);
  return monitorValues;
};

/**
 * Determines the min and max values for the x-axis and y-axis.
 *
 * @param xValues the x-axis values to calculate the min and max
 * @param yValues the y-axis values to calculate the min and max
 */
export const findMinAndMax = (xValues: number[], yValues: number[]): SohTypes.MinAndMax => {
  const minMax: SohTypes.MinAndMax = {
    xMin: min(xValues),
    xMax: max(xValues),
    yMin: min(yValues),
    yMax: max(yValues)
  };
  return minMax;
};
