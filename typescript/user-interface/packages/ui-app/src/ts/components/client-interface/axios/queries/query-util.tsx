/* eslint-disable react/prop-types */
import { Timer } from '@gms/common-util';
import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import * as React from 'react';
import { QueryControls } from 'react-apollo';
import {
  QueryCache,
  QueryFunction,
  QueryKey,
  QueryResult,
  useQuery,
  UseQueryObjectConfig
} from 'react-query';

import { defaultRequestTransformers, defaultResponseTransformers } from '../axios-transformers';

/**
 * Defines type for the handler for axios queries.
 */
export type AxiosQueryHandler = (
  response: AxiosResponse,
  key?: string,
  requestConfig?: AxiosRequestConfig
) => unknown;

/**
 * Default query handler for React Query using Axios underneath.
 */
const defaultHandleQuery: AxiosQueryHandler = (response: AxiosResponse) => response.data;

/**
 * Default query implementation for React Query using Axios underneath.
 *
 * @param handleQuery (optional) query handler - allows for intercepting the data before returning and caching
 */
export function defaultQuery(handleQuery: AxiosQueryHandler = defaultHandleQuery) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (key: string, requestConfig: AxiosRequestConfig): Promise<any> => {
    try {
      Timer.start(`[axios]: query ${key} ${JSON.stringify(requestConfig.data)}`);
      const response = await Axios.request({
        ...requestConfig,
        // apply the default response transformers; unless the request config specifies its own
        transformResponse: requestConfig.transformResponse ?? defaultResponseTransformers,
        // apply the default request transformers; unless the request config specifies its own
        transformRequest: requestConfig.transformRequest ?? defaultRequestTransformers
      });
      Timer.end(`[axios]: query ${key} ${JSON.stringify(requestConfig.data)}`);
      return handleQuery(response, key, requestConfig);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(
        `Failed Axios request: ${JSON.stringify(requestConfig)} : ${JSON.stringify(e)}`
      );
      throw e;
    }
  };
}

/**
 * The ReactQuery Cache used by the whole project
 */
export const queryCache = new QueryCache({
  defaultConfig: {
    queries: {
      queryFn: defaultQuery()
    }
  }
});

/**
 * Wraps the child component and injects (into a prop with the given propName)
 * the results of the query
 * represented by the provided queryConfig.
 *
 * @param propName the string name of the prop that should be injected
 * @param queryConfig the configuration for this query
 */
export function withQuery<TResult, TError>(
  propName: string,
  queryConfig: UseQueryObjectConfig<TResult, TError>
): React.FunctionComponent {
  return function InjectedWithQuery(props) {
    const result = useQuery<TResult, TError>(queryConfig);

    /**
     * We store the child in a variable so we can check its type with the
     * isValidElement type guard below.
     */
    const { children } = props;
    const additionalProps = {
      [propName]: result
    };
    /**
     * Verify that the children are indeed a React Element (not just a node)
     */
    if (React.isValidElement(children)) {
      /**
       * React.cloneElement is used to inject the new props into the child. This injects the
       * acknowledgeStationsByName function as a prop into the child.
       * CloneElement should be reasonably performant.
       * See https://stackoverflow.com/questions/54922160/react-cloneelement-in-list-performance
       */
      return <>{React.cloneElement(children, additionalProps)}</>;
    }
    // eslint-disable-next-line no-console
    console.error('WithQuery requires a valid React node as a child');
    return null;
  };
}

/**
 * A higher-higher order component that builds a builder for a query. Used
 * to build a function to use with compose to inject query results into the provided
 * react component.
 * Usage:
 * exampleQueryInjector = buildQueryInjector({
 *   queryKey: 'example',
 *   queryFn: () => {
 *     const { data } = await Axios.get(MOCK_ENDPOINT_ROOT + '/userProfile');
 *     return data;
 *   }
 * })
 * compose(something, exampleQueryInjector);
 *
 * @param queryConfig a definition of the query, including
 * queryKey: a serializable object that serves as the key (order matters in the case of an array)
 * queryFn: the function that actually makes the query call
 * config?: any ReactQuery configuration needed
 */
export function buildQueryInjector<TWrapped, TResult, TError>(
  propName: string,
  queryConfig: UseQueryObjectConfig<TResult, TError>
): (
  Component: React.ComponentClass | React.FunctionComponent
) => React.FunctionComponent<TWrapped & { [x: string]: QueryResult<TResult, TError> }> {
  const QueryInjector = withQuery<TResult, TError>(propName, queryConfig);
  // eslint-disable-next-line react/display-name
  return Component => props => (
    <QueryInjector>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...props} />
    </QueryInjector>
  );
}

/**
 * Checks if a query is in a loading state.
 *
 * @param query either a react-apollo or react-query query
 * @returns true if the query is loading
 */
export const isQueryLoading = (
  query: QueryControls<unknown, Record<string, AxiosError>> & QueryResult<unknown, AxiosError>
): boolean => query.loading || query.isLoading;

type StructuredQueryKey = [string, AxiosRequestConfig];

function isStructuredQueryKey(qKey: QueryKey): qKey is StructuredQueryKey {
  if (
    Array.isArray(qKey) &&
    qKey.length === 2 &&
    typeof qKey[0] === 'string' &&
    qKey[1] &&
    Object.prototype.hasOwnProperty.call(qKey[1], 'url')
  ) {
    return true;
  }
  return false;
}

/**
 * Creates a queryConfig with the provided data that may be provided to ReactQuery's
 * fetch/query functions.
 *
 * @throws if the baseConfig does not have a queryKey of the format [string, AxiosRequestConfig]
 * @param baseConfig the default configuration onto which we will add the data. Expects
 * to have a queryKey of the structure: [string, AxiosRequestConfig]
 * @param data the data to add to the AxiosRequestConfig in the baseConfig.
 */
export function createQueryConfig<TData>(
  baseConfig: UseQueryObjectConfig<TData, AxiosError>,
  data: unknown,
  queryFn?: QueryFunction<TData>
): UseQueryObjectConfig<TData, AxiosError> {
  const newConfig = cloneDeep(baseConfig);

  const qKey = newConfig.queryKey;
  if (isStructuredQueryKey(qKey)) {
    const requestWithData = cloneDeep(qKey[1]);
    requestWithData.data = data;
    newConfig.queryKey = [qKey[0], requestWithData];
    if (queryFn) {
      newConfig.queryFn = queryFn;
    }
    return newConfig;
  }
  throw Error(
    'createQueryConfig expects to have a baseConfig with a queryKey of type [string, AxiosRequestConfig]'
  );
}
