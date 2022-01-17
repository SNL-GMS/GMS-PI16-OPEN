import { UserProfileTypes } from '@gms/common-model';
import { IS_MODE_SOH } from '@gms/common-util';
import { AxiosError, AxiosResponse } from 'axios';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import { defaultConfig } from '~config/endpoint-configuration';

import { buildQueryInjector, defaultQuery } from './query-util';

/**
 * Sets the defaultLayoutName for use by the ui
 * after determining GMS UI Mode
 */
const handleUserProfileQueryResponse: (response: AxiosResponse) => UserProfileTypes.UserProfile = (
  response: AxiosResponse<UserProfileTypes.UserProfileCOI>
) => ({
  ...response.data,
  defaultLayoutName: IS_MODE_SOH
    ? response.data.defaultSohLayoutName
    : response.data.defaultAnalystLayoutName
});

/**
 * The user profile query configuration.
 * Pass to react-query's useQuery
 */
export const userProfileQueryConfig: UseQueryObjectConfig<
  UserProfileTypes.UserProfile,
  AxiosError
> = {
  queryKey: ['userProfile', defaultConfig.userProfile.services.getUserProfile.requestConfig],
  queryFn: defaultQuery(handleUserProfileQueryResponse),
  config: {
    staleTime: 1000 // ms
  }
};

/**
 * Make a query for the user profile, using the userProfileQueryConfig.
 * This is the easiest way to get the User Preferences.
 */
export const useUserProfileQuery = (): QueryResult<UserProfileTypes.UserProfile, unknown> =>
  useQuery<UserProfileTypes.UserProfile>(userProfileQueryConfig);

// QUERY_INJECTORS

/**
 * Use with compose to inject the user profile query into the component.
 * ie: compose(...otherStuff, withUserProfileQuery)(ExampleComponent);
 * ExampleComponent now contains the query results in a prop called userProfileQuery
 */
export const withUserProfileQuery = <T>() =>
  buildQueryInjector<T, UserProfileTypes.UserProfile, AxiosError>(
    'userProfileQuery',
    userProfileQueryConfig
  );
