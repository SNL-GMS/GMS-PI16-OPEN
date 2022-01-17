import { SohTypes } from '@gms/common-model';
import { MILLISECONDS_IN_SECOND, setDecimalPrecisionAsNumber, Timer, uuid } from '@gms/common-util';
import { UILogger } from '@gms/ui-apollo';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import flatMap from 'lodash/flatMap';
import uniq from 'lodash/uniq';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import {
  AxiosQueryHandler,
  buildQueryInjector,
  defaultQuery
} from '~components/client-interface/axios/queries/query-util';
import { defaultConfig } from '~config/endpoint-configuration';

import { convertToTypedArray, findMinAndMax } from './historical-soh-utils';

// QUERY

/**
 * Handler for historical SOH query data. Converts the data to a
 * preferred format before returning and caching in react query.
 *
 * @param startTime the start time
 * @param endTime the end time
 * @param uiHistoricalSoh the SOH historical data
 */
export const handleHistoricalSohByStationQuery = async (
  startTime: number,
  endTime: number,
  uiHistoricalSoh: SohTypes.UiHistoricalSoh
): Promise<SohTypes.UiHistoricalSohAsTypedArray> => {
  const { stationName } = uiHistoricalSoh;

  if (uiHistoricalSoh.calculationTimes.length > 0) {
    Timer.start('[historical soh]: handle historical SOH by station query response');

    // convert the times to seconds from milliseconds
    const calculationTimes: number[] = uiHistoricalSoh.calculationTimes.map(
      time => time / MILLISECONDS_IN_SECOND
    );

    const uiHistoricalSohAsSeconds: SohTypes.UiHistoricalSoh = {
      ...uiHistoricalSoh,
      calculationTimes,
      monitorValues: uiHistoricalSoh.monitorValues.map<SohTypes.MonitorValue>(mv =>
        mv.values.type === SohTypes.SohValueType.DURATION
          ? {
              ...mv,
              average: mv.average / MILLISECONDS_IN_SECOND,
              values: {
                ...mv.values,
                values: mv.values.values.map<number>(v => v / MILLISECONDS_IN_SECOND)
              }
            }
          : mv
      )
    };

    const monitorValues: SohTypes.MonitorValueAsTypedArray[] = await convertToTypedArray(
      startTime / MILLISECONDS_IN_SECOND,
      endTime / MILLISECONDS_IN_SECOND,
      uiHistoricalSohAsSeconds
    );

    // Ensure that monitor values are all sorted by channel name
    monitorValues.sort((a, b) => a.channelName.toString().localeCompare(b.channelName.toString()));

    const minAndMax: SohTypes.MinAndMax = findMinAndMax(
      uiHistoricalSohAsSeconds.calculationTimes,
      flatMap(uiHistoricalSohAsSeconds.monitorValues.map(v => v.values.values))
    );

    const percentageSent: number = setDecimalPrecisionAsNumber(
      uiHistoricalSohAsSeconds.percentageSent,
      1
    );

    Timer.end('[historical soh]: handle historical SOH by station query response');
    return { stationName, calculationTimes, monitorValues, percentageSent, minAndMax };
  }

  return {
    stationName,
    calculationTimes: [],
    monitorValues: [],
    percentageSent: 0,
    minAndMax: { xMax: 0, yMax: 0, xMin: 0, yMin: 0 }
  };
};

// TODO: move to query-util and make config a generic type, would be too big of a change for
// this more
interface RequestConfig extends AxiosRequestConfig {
  data: { historicalSohInput: SohTypes.UiHistoricalSohInput; maxQueryIntervalSize: number };
}

/**
 * The custom historical SOH query using Axios underneath.
 * This will chunk up the interval (if necessary) to all for smaller requests.
 *
 * @param key the unique key for the query
 * @param requestConfig the request configuration for the query request
 */
export const historicalSohQuery = async (
  key,
  requestConfig: RequestConfig
): Promise<SohTypes.UiHistoricalSohAsTypedArray> => {
  try {
    const id = uuid.asString();
    const { historicalSohInput } = requestConfig.data;
    const { maxQueryIntervalSize } = requestConfig.data;

    const { samplesPerChannel } = historicalSohInput;

    Timer.start(`[axios]: historicalSohQuery (chunked) ${id}`);
    const range = historicalSohInput.endTime - historicalSohInput.startTime;
    const completeChunk = Math.floor(range / maxQueryIntervalSize);
    const partialChunk = range % maxQueryIntervalSize;

    const ranges = Array<number>(completeChunk).fill(maxQueryIntervalSize);
    if (partialChunk > 0) {
      ranges.push(partialChunk);
    }

    const chunks: SohTypes.UiHistoricalSohInput[] = ranges.map((value, idx) => ({
      ...historicalSohInput,
      startTime: historicalSohInput.startTime + ranges.slice(0, idx).reduce((a, b) => a + b, 0),
      endTime: historicalSohInput.startTime + ranges.slice(0, idx + 1).reduce((a, b) => a + b, 0),
      samplesPerChannel: Math.ceil(samplesPerChannel / ranges.length)
    }));

    const handleQuery: AxiosQueryHandler = async (resp: AxiosResponse) =>
      handleHistoricalSohByStationQuery(
        historicalSohInput.startTime,
        historicalSohInput.endTime,
        resp.data
      );

    const responses = (
      await Promise.all<SohTypes.UiHistoricalSohAsTypedArray>(
        chunks.map(async data => {
          const result = await defaultQuery(handleQuery)(key, { ...requestConfig, data });
          return result;
        })
      )
    )
      // remove any responses that returned no results
      .filter(r => r.calculationTimes.length > 0);

    if (responses.length > 0) {
      // sort the returned results
      responses.sort((a, b) =>
        // eslint-disable-next-line no-nested-ternary
        a.calculationTimes[0] < b.calculationTimes[0]
          ? -1
          : a.calculationTimes[0] > b.calculationTimes[0]
          ? 1
          : 0
      );

      const monitorValues = flatMap(responses.map(r => r.monitorValues));
      const channelNames = uniq(flatMap(monitorValues.map(m => m.channelName)));

      const response: SohTypes.UiHistoricalSohAsTypedArray = {
        stationName: historicalSohInput.stationName,
        calculationTimes: flatMap(responses.map(r => r.calculationTimes)),
        monitorValues: channelNames.map(channelName => {
          const channelMonitorValues = monitorValues.filter(mv => mv.channelName === channelName);

          const type: SohTypes.SohValueType = channelMonitorValues
            .map(mv => mv.type)
            .reduce(a => a);

          const values: Float32Array = channelMonitorValues
            .map(mv => mv.values)
            .reduce((a, b) => {
              const v = new Float32Array(a.length + b.length);
              v.set(a);
              v.set(b, a.length);
              return v;
            });

          const average: number =
            channelMonitorValues.map(mv => mv.average).reduce((a, b) => a + b) /
            channelMonitorValues.length;

          return {
            channelName,
            values,
            type,
            average
          };
        }),
        percentageSent: setDecimalPrecisionAsNumber(
          responses.map(r => r.percentageSent).reduce((a, b) => a + b) / responses.length,
          1
        ),
        minAndMax: responses
          .map(r => r.minAndMax)
          .reduce((a, b) => ({
            xMin: Math.min(a.xMin, b.xMin),
            xMax: Math.max(a.xMax, b.xMax),
            yMin: Math.min(a.yMin, b.yMin),
            yMax: Math.max(a.yMax, b.yMax)
          }))
      };
      Timer.end(`[axios]: historicalSohQuery (chunked) ${id}`);

      return response;
    }
    return {
      stationName: historicalSohInput.stationName,
      calculationTimes: [],
      minAndMax: {
        xMin: -Infinity,
        xMax: Infinity,
        yMin: -Infinity,
        yMax: Infinity
      },
      monitorValues: [],
      percentageSent: 0
    };
  } catch (e) {
    UILogger.Instance().error(
      `Failed Axios request: ${JSON.stringify(requestConfig)} : ${JSON.stringify(e)}`
    );
    throw e;
  }
};

// CONFIG

/**
 * The historical SOH query configuration.
 * Pass to react-query's useQuery
 *
 * @param historicalSohInput the historical soh input
 */
export const historicalSohByStationConfig = (
  historicalSohInput: SohTypes.UiHistoricalSohInput,
  maxQueryIntervalSize: number
): UseQueryObjectConfig<SohTypes.UiHistoricalSohAsTypedArray, AxiosError> => ({
  queryKey: [
    'historicalByStationIdTimeAndSohMonitorTypes',
    {
      ...defaultConfig.historicalSoh.services.historicalByStationIdTimeAndSohMonitorTypes
        .requestConfig,
      data: { historicalSohInput, maxQueryIntervalSize }
    }
  ],
  queryFn: historicalSohQuery,
  config: {
    staleTime: Infinity,
    refetchOnWindowFocus: false
  }
});

// QUERY HOOKS

/**
 * Make a query for the historical SOH definitions, using the historicalSohByStationConfig.
 * This is the easiest way to get the historical SOH data.
 *
 * @param historicalSohInput the historical soh input
 */
export const useHistoricalSohByStationQuery = (
  historicalSohInput: SohTypes.UiHistoricalSohInput,
  maxQueryIntervalSize: number
): QueryResult<SohTypes.UiHistoricalSohAsTypedArray, unknown> =>
  useQuery<SohTypes.UiHistoricalSohAsTypedArray>(
    historicalSohByStationConfig(historicalSohInput, maxQueryIntervalSize)
  );

// QUERY_INJECTORS

/**
 * Use with compose to inject the historical SOH query into the component.
 * ie: compose(...otherStuff, withHistoricalSohByStationDefinitions)(ExampleComponent);
 * ExampleComponent now contains the query results in a prop called historicalSohByStationQuery
 *
 * @param historicalSohInput the historical soh input
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const withHistoricalSohByStationDefinitions = <T>(
  historicalSohInput: SohTypes.UiHistoricalSohInput,
  maxQueryIntervalSize: number
) =>
  buildQueryInjector<T, SohTypes.UiHistoricalSohAsTypedArray, AxiosError>(
    'historicalSohByStationDefinitionsQuery',
    historicalSohByStationConfig(historicalSohInput, maxQueryIntervalSize)
  );
