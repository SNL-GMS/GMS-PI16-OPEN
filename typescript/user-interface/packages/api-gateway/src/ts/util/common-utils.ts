import { getRandomInRange, getSecureRandomNumber } from '@gms/common-util';

// Constants used in random lat/lon
const LAT_RANGE = 90;
const LON_RANGE = 180;
const FIXED_DECIMAL = 3;
const OFFSET_MIN = 0.1;
const OFFSET_MAX = 2;
const RES_RANGE = 4;

/**
 * Returns a random latitude from -90 to 90
 */
export function getRandomLatitude(): number {
  return getRandomInRange(-LAT_RANGE, LAT_RANGE, FIXED_DECIMAL);
}

/**
 * Returns a random longitude from -180 to 180
 */
export function getRandomLongitude(): number {
  return getRandomInRange(-LON_RANGE, LON_RANGE, FIXED_DECIMAL);
}
/**
 * Gets random residual between -4 and 4
 */
export function getRandomResidual(): number {
  return getRandomInRange(-RES_RANGE, RES_RANGE, FIXED_DECIMAL);
}
/**
 * Returns a small offset used in randomizing event location around a station
 */
export function getRandomOffset(): number {
  const sign = getSecureRandomNumber() < OFFSET_MAX ? -1 : 1;
  return getRandomInRange(OFFSET_MIN, OFFSET_MAX, FIXED_DECIMAL) * sign;
}

/**
 * Checks if the object is empty by checking how many keys are present
 *
 * @param object object to check for empty
 * @returns a boolean
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function isObjectEmpty(object: any): boolean {
  return Object.keys(object).length <= 0;
}

/**
 * Walk thru the double array calling fixNaNValues for each row
 *
 * @param values the values
 */
export function fixNaNValuesDoubleArray(values: number[][]): void {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  values.forEach(fixNanValues);
}

/**
 * Walks the array and replaces any NaN values with undefined
 *
 * @param values array of numbers
 */
export function fixNanValues(values: number[]): void {
  values.forEach((val, index) => {
    // eslint-disable-next-line no-restricted-globals
    if (val !== undefined && isNaN(val)) {
      // eslint-disable-next-line no-param-reassign
      values[index] = undefined;
    }
  });
}

/**
 * Replaces an item in the array if the items id is already in the list
 *
 * @param list array of items
 * @param itemToReplaceWithOrAdd item to updated by id in the list
 */
export function replaceByIdOrAddToList<T extends { id: string }>(
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  collection: any,
  itemToReplaceWithOrAdd: T
): T[] {
  const list = collection as T[];
  const indexToReplace = list.findIndex(item => item.id === itemToReplaceWithOrAdd.id);
  if (indexToReplace >= 0) {
    list[indexToReplace] = itemToReplaceWithOrAdd;
  } else {
    list.push(itemToReplaceWithOrAdd);
  }
  return list;
}
