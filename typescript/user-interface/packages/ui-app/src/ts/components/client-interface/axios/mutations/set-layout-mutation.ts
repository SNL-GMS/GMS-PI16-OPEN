/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserProfileTypes } from '@gms/common-model';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import { MutateFunction, useMutation } from 'react-query';

import { queryCache } from '../queries/query-util';
import { userProfileQueryConfig } from '../queries/user-profile-query';
import { convertUserProfileToCOI } from '../user-profile-util';
import { buildMutationInjector } from './mutation-util';
import { setUserProfile, userProfileMutationConfig } from './user-profile-mutation';

/**
 * Creates a new user profile that includes the new/updated layout
 *
 * @param currentProfile the current user profile
 * @param setLayoutInput the user input
 */
export const createNewProfileFromSetLayoutInput = (
  currentProfile: UserProfileTypes.UserProfile,
  setLayoutInput: UserProfileTypes.SetLayoutMutationArgs
): UserProfileTypes.UserProfileCOI => {
  const formerLayouts = cloneDeep(currentProfile.workspaceLayouts);
  const newLayouts = [
    setLayoutInput.workspaceLayoutInput,
    ...formerLayouts.filter(wl => wl.name !== setLayoutInput.workspaceLayoutInput.name)
  ];
  const defaultLayouts: { defaultAnalystLayoutName: string; defaultSohLayoutName: string } =
    setLayoutInput.saveAsDefaultLayoutOfType !== undefined
      ? {
          defaultAnalystLayoutName:
            setLayoutInput.saveAsDefaultLayoutOfType ===
            UserProfileTypes.DefaultLayoutNames.ANALYST_LAYOUT
              ? setLayoutInput.workspaceLayoutInput.name
              : currentProfile.defaultAnalystLayoutName,
          defaultSohLayoutName:
            setLayoutInput.saveAsDefaultLayoutOfType ===
            UserProfileTypes.DefaultLayoutNames.SOH_LAYOUT
              ? setLayoutInput.workspaceLayoutInput.name
              : currentProfile.defaultSohLayoutName
        }
      : {
          defaultAnalystLayoutName: currentProfile.defaultAnalystLayoutName,
          defaultSohLayoutName: currentProfile.defaultSohLayoutName
        };

  const newProfile = merge(convertUserProfileToCOI(currentProfile), {
    ...defaultLayouts,
    workspaceLayouts: newLayouts
  });
  return newProfile;
};

export const setLayout = async (newLayout: {
  variables: UserProfileTypes.SetLayoutMutationArgs;
}): Promise<UserProfileTypes.UserProfileCOI> => {
  const userProfile = queryCache.getQueryData<UserProfileTypes.UserProfile>(
    userProfileQueryConfig.queryKey
  );
  const updatedProfile = createNewProfileFromSetLayoutInput(userProfile, newLayout.variables);
  return setUserProfile({ variables: { userProfile: updatedProfile } });
};

/**
 * The configuration used to set up the audibleNotificationMutation. Note that this actually
 * calls the user profile mutation under the hood.
 * Stores the results in the userProfileQuery on success, causing subscribed components to update.
 */
export const setLayoutMutationConfig = {
  onSuccess: async (): Promise<unknown> =>
    queryCache.invalidateQueries(userProfileQueryConfig.queryKey)
};

/**
 * This is the easiest way to get the setLayoutMutation
 *
 * @returns the mutate function that sets the audible notifications in the user profile
 * on the server.
 */
export const useSetLayoutMutation = (): MutateFunction<
  UserProfileTypes.UserProfileCOI,
  unknown,
  {
    variables: UserProfileTypes.SetLayoutMutationArgs;
  },
  unknown
> => {
  const [mutate] = useMutation(setLayout, userProfileMutationConfig);
  return mutate;
};

/**
 * Used with compose to inject the setLayout mutation function into the wrapped
 * component. Note that this needs to be called (don't forget the '()'). This is to maintain
 * consistency with the way graphql mutations are bound.
 * ie: compose(...otherStuff, withSetLayoutMutation())(ExampleComponent);
 * ExampleComponent now contains a prop called 'setLayout' that calls the mutation.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const withSetLayoutMutation = () =>
  buildMutationInjector<
    UserProfileTypes.UserProfile,
    any,
    { variables: UserProfileTypes.SetLayoutMutationArgs },
    any
  >('setLayout', setLayout, userProfileMutationConfig);
