import { DataBySampleRate, DataByTime, DataClaimCheck } from './types';

const hasId = (data: unknown): data is { id: unknown } =>
  Object.prototype.hasOwnProperty.call(data, 'id');

/**
 * Return true if the data has an ID.
 *
 * @param data some kind of DataSegment data
 * @returns whether this data matches the DataClaimCheck interface
 */
export const isDataClaimCheck = (
  data: DataClaimCheck | DataBySampleRate | DataByTime
): data is DataClaimCheck => {
  return hasId(data) && typeof data.id === 'string' && !!data.id;
};

/**
 * Returns true if the data is of type Float32Array
 *
 * @param values the data to check
 */
export const isFloat32Array = (
  values:
    | Float32Array
    | number[]
    | {
        timeSecs: number;
        value: number;
      }[]
    | undefined
): values is Float32Array => values && ArrayBuffer.isView(values) && values instanceof Float32Array;

/**
 * Returns true if the data is by sample rate and casts the data appropriately.
 *
 * @param data the data to check
 */
export const isDataBySampleRate = (
  data: DataBySampleRate | DataByTime | DataClaimCheck
): data is DataBySampleRate =>
  (data as DataBySampleRate).startTimeSecs !== undefined &&
  (data as DataBySampleRate).sampleRate !== undefined &&
  (data as DataBySampleRate).values !== undefined;

/**
 * Returns true if the data is by time and casts the data appropriately.
 *
 * @param data the data to check
 */
export const isDataByTime = (
  data: DataBySampleRate | DataByTime | DataClaimCheck
): data is DataByTime => !isDataBySampleRate(data);
