import { UserProfileTypes } from '@gms/common-model';
import cloneDeep from 'lodash/cloneDeep';
import { MutateFunction, useMutation } from 'react-query';

import { queryCache } from '../queries/query-util';
import { userProfileQueryConfig } from '../queries/user-profile-query';
import { AudibleNotificationMutationArgs } from '../types';
import { buildMutationInjector } from './mutation-util';
import { setUserProfile } from './user-profile-mutation';

/**
 * Create, update, and delete notifications from a list.
 * pass an empty string for the filename to delete a notification
 *
 * @param audibleNotifications the original list of notifications
 * @param updatedNotifications the notifications to update. If the same
 * system message definition is found in the @param audiblenotifications, then this
 * will overwrite it.
 */
export const updateAudibleNotification = (
  audibleNotifications: UserProfileTypes.AudibleNotification[],
  updatedNotifications: UserProfileTypes.AudibleNotification[]
): UserProfileTypes.AudibleNotification[] => {
  const newNotificationMap = audibleNotifications ? cloneDeep(audibleNotifications) : [];
  updatedNotifications.forEach(notification => {
    const indexToRemove = newNotificationMap.findIndex(
      n => n.notificationType === notification.notificationType
    );
    if (indexToRemove === -1) {
      newNotificationMap.push(notification);
    } else if (notification.fileName) {
      newNotificationMap.splice(indexToRemove, 1, notification);
    } else {
      newNotificationMap.splice(indexToRemove, 1);
    }
  });
  return newNotificationMap;
};

/**
 * Updates the user profile using the audible notifications provided in the
 * mutationArgs. If the same system message definition is found, overwrites it.
 * Pass an empty filename to delete a notification for a system message definition.
 *
 * @param mutationArgs expects an object of the format:
 * {
 *   variables: {
 *     audibleNotificationsInput: AudibleNotification[]
 *   }
 * }
 */
export const setAudibleNotifications = async (mutationArgs: AudibleNotificationMutationArgs) => {
  const notifications = mutationArgs?.variables?.audibleNotificationsInput;
  const userProfile = queryCache.getQueryData<UserProfileTypes.UserProfile>(
    userProfileQueryConfig.queryKey
  );
  const updatedProfile = {
    ...userProfile,
    audibleNotifications: updateAudibleNotification(userProfile.audibleNotifications, notifications)
  };
  return setUserProfile({ variables: { userProfile: updatedProfile } });
};

/**
 * The configuration used to set up the audibleNotificationMutation. Note that this actually
 * calls the user profile mutation under the hood.
 * Stores the results in the userProfileQuery on success, causing subscribed components to update.
 */
export const audibleNotificationMutationConfig = {
  onSuccess: async (): Promise<unknown> =>
    queryCache.invalidateQueries(userProfileQueryConfig.queryKey)
};

/**
 * This is the easiest way to get the audibleNotificationMutation
 *
 * @returns the mutate function that sets the audible notifications in the user profile
 * on the server.
 */
export const useAudibleNotificationMutation = (): MutateFunction<
  UserProfileTypes.UserProfileCOI,
  unknown,
  AudibleNotificationMutationArgs,
  unknown
> => {
  const [mutate] = useMutation(setAudibleNotifications, audibleNotificationMutationConfig);
  return mutate;
};

/**
 * Used with compose to inject the setAudibleNotifications mutation function into the wrapped
 * component. Note that this needs to be called (don't forget the '()'). This is to maintain
 * consistency with the way graphql mutations are bound.
 * ie: compose(...otherStuff, withAudibleNotificationsMutation())(ExampleComponent);
 * ExampleComponent now contains a prop called 'setAudibleNotifications' that calls the mutation.
 */
export const withAudibleNotificationsMutation = () =>
  buildMutationInjector<UserProfileTypes.UserProfile, any, AudibleNotificationMutationArgs, any>(
    'setAudibleNotifications',
    setAudibleNotifications,
    audibleNotificationMutationConfig
  );
