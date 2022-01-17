import { UserProfileTypes } from '@gms/common-model';
import cloneDeep from 'lodash/cloneDeep';

export const convertUserProfileToCOI = (
  currentProfile: UserProfileTypes.UserProfile
): UserProfileTypes.UserProfileCOI => {
  const newProfile: UserProfileTypes.UserProfileCOI = {
    audibleNotifications: undefined,
    defaultAnalystLayoutName: undefined,
    defaultSohLayoutName: undefined,
    userId: undefined,
    workspaceLayouts: undefined
  };
  // we use cloneDeep to ensure that changes to the new layout don't mutate the old one. Without it, the
  // workspaces are the same, and changes to a layout could change the original user profile.
  Object.keys(newProfile).forEach(key => {
    newProfile[key] = cloneDeep(currentProfile[key]);
  });
  return newProfile;
};
