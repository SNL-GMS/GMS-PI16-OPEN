import { UserProfileTypes } from '@gms/common-model';
import { MutateFunction, useMutation } from 'react-query';

import { defaultConfig } from '~config/endpoint-configuration';

import { queryCache } from '../queries/query-util';
import { userProfileQueryConfig } from '../queries/user-profile-query';
import { UserProfileMutationArgs } from '../types';
import { convertUserProfileToCOI } from '../user-profile-util';
import { buildMutationInjector, callMutation } from './mutation-util';

export const setUserProfile = async (
  mutationArgs: UserProfileMutationArgs
): Promise<UserProfileTypes.UserProfileCOI> => {
  const newUserProfileToStore = convertUserProfileToCOI(mutationArgs.variables.userProfile);

  const result = await callMutation(
    defaultConfig.userProfile.services.setUserProfile.requestConfig,
    newUserProfileToStore
  );
  return result.data;
};

/**
 * The configuration used to set up the userProfileMutation.
 * Stores the results in the userProfileQuery on success, causing subscribed components to update.
 */
export const userProfileMutationConfig = {
  onSuccess: async (): Promise<unknown> =>
    queryCache.invalidateQueries(userProfileQueryConfig.queryKey)
};

/**
 * This is the easiest way to get the audibleNotificationMutation
 *
 * @returns the mutate function that sets the audible notifications in the user profile
 * on the server.
 */
export const useUserProfileMutation = (): MutateFunction<
  UserProfileTypes.UserProfileCOI,
  unknown,
  UserProfileMutationArgs,
  unknown
> => {
  const [mutate] = useMutation(setUserProfile, userProfileMutationConfig);
  return mutate;
};

/**
 * Used with compose to inject the setUserProfile mutation function into the wrapped
 * component. Note that this needs to be called (don't forget the '()'). This is to maintain
 * consistency with the way graphql mutations are bound.
 * ie: compose(...otherStuff, withUserProfileMutation())(ExampleComponent);
 * ExampleComponent now contains a prop called 'setUserProfile' that calls the mutation.
 */
export const withUserProfileMutation = () =>
  buildMutationInjector<UserProfileTypes.UserProfile, any, UserProfileMutationArgs, any>(
    'setUserProfile',
    setUserProfile,
    userProfileMutationConfig
  );
