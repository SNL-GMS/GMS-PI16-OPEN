import { TimeTypes } from '@gms/common-model';
import {
  convertDurationToSeconds,
  IS_MODE_SOH,
  isNumber,
  isObject,
  isString,
  MILLISECONDS_IN_SECOND,
  REGEX_ISO_DATE_TIME,
  Timer,
  toEpochSeconds,
  toOSDTime
} from '@gms/common-util';
import { isArrayOfObjects } from '@gms/common-util/src/ts/util/type-util';
import Axios, { AxiosTransformer } from 'axios';
import Immutable from 'immutable';
import moment from 'moment';
import msgpack from 'msgpack-lite';

/**
 * Defines a the properties of a FindReplaceMatcher
 */
interface FindAndReplaceMatcher {
  /** the matcher function that validates the value */
  matcher: (value: number | string) => boolean;
  /** the replace function that performs the value replace */
  replacer: (value: number | string) => number | string;
}

/**
 * Performs a replace on the provided object and key using the provided matchers.
 *
 * ! Modifies the object in place
 *
 * @param matchers the matchers used to find and replace
 * @param object the object to search
 * @param key the key indexed into the object
 */
const replace = (
  matchers: Immutable.Map<string, FindAndReplaceMatcher>,
  object: unknown,
  key: string
): void => {
  /* eslint-disable no-param-reassign */
  if (matchers.has(key)) {
    if (matchers.get(key).matcher(object[key])) {
      // transform the existing data with the provided replacer function
      object[key] = matchers.get(key).replacer(object[key]);
    } else {
      // eslint-disable-next-line no-console
      console.error(
        `Invalid Axios type transformation key:'${key}' value:'${object[key]}' did not match for serialize/deserialize`
      );
      // transform the existing data to `undefined` - was an invalid match for the matched key
      object[key] = undefined;
    }
  }
  /* eslint-enable no-param-reassign */
};

/**
 * Performs a find and replace on the provided object for the given matchers.
 * ! Modifies the object in place
 *
 * @param matchers the matchers used to find and replace, where key is the object key
 * @param object the object to search
 * @param key (optional) the key indexed into the object, will be undefined if
 * at the root of an object
 */
const findAndReplace = (
  matchers: Immutable.Map<string, FindAndReplaceMatcher>,
  object: unknown,
  key?: string
): void => {
  /* eslint-disable no-param-reassign */
  if (object) {
    // search the root object; key is undefined
    if (!key) {
      if (isArrayOfObjects(object)) {
        object.forEach(item => findAndReplace(matchers, item));
      } else if (isObject(object)) {
        Object.keys(object).forEach(k => findAndReplace(matchers, object, k));
      }
    } else if (object[key]) {
      if (isArrayOfObjects(object[key])) {
        object[key].forEach(item => findAndReplace(matchers, item));
      } else if (isObject(object[key])) {
        Object.keys(object[key]).forEach(k => findAndReplace(matchers, object[key], k));
      } else if (isString(object[key]) || isNumber(object[key])) {
        // perform replace for the provided matchers
        replace(matchers, object, key);
      }
    } else {
      // transform the existing data to `undefined`
      object[key] = undefined;
    }
  }
  /* eslint-enable no-param-reassign */
};

/**
 * The deserialize matchers - defines the key/values to search for and their unique replace func
 */
const deserializeMatchers: Immutable.Map<string, FindAndReplaceMatcher> = Immutable.Map([
  ...TimeTypes.JSON_INSTANCE_NAMES.map(key => [
    key,
    {
      matcher: value => REGEX_ISO_DATE_TIME.test(value),
      replacer: (value: string): number => toEpochSeconds(value)
    }
  ]),
  ...TimeTypes.JSON_DURATION_NAMES.map(key => [
    key,
    {
      matcher: value => moment.duration(value).isValid(),
      replacer: (value: string): number => convertDurationToSeconds(value)
    }
  ])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
] as any);

/**
 * The serialize matchers - defines the key/values to search for and their unique replace func
 */
const serializeMatchers: Immutable.Map<string, FindAndReplaceMatcher> = Immutable.Map([
  ...TimeTypes.JSON_INSTANCE_NAMES.map(key => [
    key,
    {
      key,
      matcher: value => isNumber(value),
      replacer: (value: number): number | string => {
        // TODO SOH should be updated to accept date/time strings
        // ! Special case - SOH uses milliseconds and expects the data to be passed as a number, do not serialize
        return IS_MODE_SOH ? value : toOSDTime(value);
      }
    }
  ]),
  ...TimeTypes.JSON_DURATION_NAMES.map(key => [
    key,
    {
      key,
      matcher: value => isNumber(value),
      replacer: (value: number): string =>
        moment.duration(value * MILLISECONDS_IN_SECOND).toISOString()
    }
  ])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
] as any);

/**
 * The Axios built-in response transformers.
 *
 * @returns returns the default Axios Response Transformers as an array
 */
export const axiosDefaultResponseTransformers = (): AxiosTransformer[] => {
  const { transformResponse } = Axios.defaults;
  // eslint-disable-next-line no-nested-ternary
  return !transformResponse
    ? []
    : transformResponse instanceof Array
    ? transformResponse
    : [transformResponse];
};

/**
 * The Axios built-in request transformers.
 *
 * @returns returns the default Axios Request Transformers as an array
 */
export const axiosDefaultRequestTransformers = (): AxiosTransformer[] => {
  const { transformRequest } = Axios.defaults;
  // eslint-disable-next-line no-nested-ternary
  return !transformRequest
    ? []
    : transformRequest instanceof Array
    ? transformRequest
    : [transformRequest];
};

/**
 * A custom Axios Transformer that decodes message pack encoded data. If the data
 * is not encoded, the value is just returned.
 *
 * @param data The data
 * @param headers The headers
 *
 * @return the transformed data from the configured transformer
 */
export const msgPackDecodeTransformer: AxiosTransformer = (
  data: unknown,
  headers?: unknown
): unknown => {
  if (
    headers &&
    Object.prototype.hasOwnProperty.call(headers, 'content-type') &&
    headers['content-type'] === 'application/msgpack'
  ) {
    Timer.start('[axios]: msgpack decode axios transformer');
    const decoded = msgpack.decode(Buffer.from(data as string));
    Timer.end('[axios]: msgpack decode axios transformer');
    return decoded;
  }
  return data;
};

/**
 * Creates a custom Axios Transformer that uses the provided `matchers` to
 * serialize or deserialize key/values within the data.
 *
 * @param matchers the find and replace matchers
 *
 * @return the Axios transformer
 */
const createTypeTransformer = (
  matchers: Immutable.Map<string, FindAndReplaceMatcher>
): AxiosTransformer => (data: unknown) => {
  findAndReplace(matchers, data); // modifies the actual data in place
  return data;
};

/**
 * A custom Axios type transformers for deserializing types.
 * ! Modifies the object in place for performance
 */
export const deserializeTypeTransformer: AxiosTransformer = createTypeTransformer(
  deserializeMatchers
);

/**
 * A custom Axios type transformers for serializing types.
 * ! Modifies the object in place for performance
 */
export const serializeTypeTransformer: AxiosTransformer = createTypeTransformer(serializeMatchers);

/**
 * The default Axios Response Transformers.
 */
export const defaultResponseTransformers: AxiosTransformer[] = [
  msgPackDecodeTransformer,
  deserializeTypeTransformer,
  ...axiosDefaultResponseTransformers()
];

/**
 * The default Axios Request Transformers.
 */
export const defaultRequestTransformers: AxiosTransformer[] = [
  serializeTypeTransformer,
  ...axiosDefaultRequestTransformers()
];
