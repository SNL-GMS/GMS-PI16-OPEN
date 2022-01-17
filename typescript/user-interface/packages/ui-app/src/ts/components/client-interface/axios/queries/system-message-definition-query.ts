import { SystemMessageTypes } from '@gms/common-model';
import { AxiosError } from 'axios';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import { defaultConfig } from '~config/endpoint-configuration';

import { buildQueryInjector } from './query-util';

/**
 * The system message definition query configuration.
 * Pass to react-query's useQuery
 */
export const systemMessageDefinitionConfig: UseQueryObjectConfig<
  SystemMessageTypes.SystemMessageDefinition[],
  AxiosError
> = {
  queryKey: [
    'systemMessageDefinitions',
    defaultConfig.systemMessage.services.getSystemMessageDefinitions.requestConfig
  ],
  config: {
    staleTime: Infinity, // ms
    refetchOnWindowFocus: false
  }
};

// QUERY HOOKS
/**
 * Make a query for the system message definitions, using the userProfileQueryConfig.
 * This is the easiest way to get the user profile.
 */
export const useSystemMessageDefinitionQuery = (): QueryResult<
  SystemMessageTypes.SystemMessageDefinition[],
  unknown
> => useQuery<SystemMessageTypes.SystemMessageDefinition[]>(systemMessageDefinitionConfig);

/**
 * Use with compose to inject the user profile query into the component.
 * ie: compose(...otherStuff, withSystemMessageDefinitions)(ExampleComponent);
 * ExampleComponent now contains the query results in a prop called systemMessageDefinitionsQuery
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const withSystemMessageDefinitions = <T>() =>
  buildQueryInjector<T, SystemMessageTypes.SystemMessageDefinition[], AxiosError>(
    'systemMessageDefinitionsQuery',
    systemMessageDefinitionConfig
  );
