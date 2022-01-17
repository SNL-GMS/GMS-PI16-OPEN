/* eslint-disable jest/expect-expect */
/* eslint-disable import/first */

const setUserProfile = jest.fn().mockImplementation(async () => Promise.resolve('success'));

// mocks the module user-profile-mutation
jest.mock(
  '../../../../../src/ts/components/client-interface/axios/mutations/user-profile-mutation',
  () => ({
    setUserProfile
  })
);

import { UserProfileTypes } from '@gms/common-model';
import { SystemMessageType } from '@gms/common-model/lib/system-message/types';
import { AudibleNotification } from '@gms/common-model/lib/user-profile/types';

import {
  audibleNotificationMutationConfig,
  setAudibleNotifications,
  updateAudibleNotification,
  useAudibleNotificationMutation,
  withAudibleNotificationsMutation
} from '../../../../../src/ts/components/client-interface/axios/mutations/set-audible-notifications-mutation';
import { queryCache } from '../../../../../src/ts/components/client-interface/axios/queries/query-util';
import { AudibleNotificationMutationArgs } from '../../../../../src/ts/components/client-interface/axios/types';
import {
  expectThatCompositionInjectsAProp,
  expectThatMutationHookMakesAxiosCall
} from '../../../../utils/query-mutation-test-utils';

// eslint-disable-next-line no-console
console.error = jest.fn();
Date.now = jest.fn().mockReturnValue(() => 1000);

const testUserProfile: UserProfileTypes.UserProfile = {
  audibleNotifications: [],
  defaultAnalystLayoutName: 'foo',
  defaultSohLayoutName: 'bar',
  userId: 'fooman',
  workspaceLayouts: []
};
queryCache.getQueryData = jest.fn().mockReturnValue(testUserProfile);
describe('audible notification mutation', () => {
  it('successfully updates an empty list of audible notifications when given a new notification', () => {
    const old: AudibleNotification[] = [];
    const add: AudibleNotification[] = [
      {
        fileName: 'test1.file',
        notificationType: SystemMessageType.CHANNEL_MONITOR_TYPE_QUIETED
      },
      {
        fileName: 'test2.file',
        notificationType: SystemMessageType.STATION_CAPABILITY_STATUS_CHANGED
      }
    ];
    const notifications = updateAudibleNotification(old, add);
    expect(notifications).toEqual(add);
  });
  it('successfully updates an filled list of audible notifications when given a new notification', () => {
    const old: AudibleNotification[] = [
      {
        fileName: 'test1.file',
        notificationType: SystemMessageType.CHANNEL_MONITOR_TYPE_QUIETED
      },
      {
        fileName: 'test2.file',
        notificationType: SystemMessageType.STATION_CAPABILITY_STATUS_CHANGED
      }
    ];
    const add: AudibleNotification[] = [
      {
        fileName: 'test3.file',
        notificationType: SystemMessageType.CHANNEL_MONITOR_TYPE_QUIETED
      }
    ];
    const notifications = updateAudibleNotification(old, add);
    expect(notifications.find(n => n.fileName === 'test1.file')).toBeFalsy();
    expect(notifications.find(n => n.fileName === 'test2.file')).toBeTruthy();
    expect(notifications.find(n => n.fileName === 'test3.file')).toBeTruthy();
  });
  it('successfully removes an audible notification from a list', () => {
    const old: AudibleNotification[] = [
      {
        fileName: 'test1.file',
        notificationType: SystemMessageType.CHANNEL_MONITOR_TYPE_QUIETED
      },
      {
        fileName: 'test2.file',
        notificationType: SystemMessageType.STATION_CAPABILITY_STATUS_CHANGED
      }
    ];
    const remove: AudibleNotification[] = [
      {
        fileName: '',
        notificationType: SystemMessageType.CHANNEL_MONITOR_TYPE_QUIETED
      }
    ];
    const notifications = updateAudibleNotification(old, remove);
    expect(notifications.find(n => n.fileName === 'test1.file')).toBeFalsy();
    expect(notifications.find(n => n.fileName === 'test2.file')).toBeTruthy();
  });

  it('audibleNotificationMutationConfig is defined', () => {
    expect(audibleNotificationMutationConfig).toBeDefined();
  });
  it('audibleNotificationMutationConfig on success invalidates query to request updated data', async () => {
    queryCache.invalidateQueries = jest.fn();
    const prevNumCalls = (queryCache.invalidateQueries as jest.Mock).mock?.calls?.length ?? 0;
    await audibleNotificationMutationConfig.onSuccess();
    const { calls } = (queryCache.invalidateQueries as jest.Mock).mock;
    expect(calls).toHaveLength(prevNumCalls + 1);
  });

  it('makes a request to the server when the mutation is called', () => {
    const addNotifications: AudibleNotification[] = [
      {
        fileName: 'test1.file',
        notificationType: SystemMessageType.CHANNEL_MONITOR_TYPE_QUIETED
      },
      {
        fileName: 'test2.file',
        notificationType: SystemMessageType.STATION_CAPABILITY_STATUS_CHANGED
      }
    ];
    const mutationArgs: AudibleNotificationMutationArgs = {
      variables: {
        audibleNotificationsInput: addNotifications
      }
    };
    expectThatMutationHookMakesAxiosCall(useAudibleNotificationMutation, mutationArgs);
  });

  it('setAudibleNotifications sets a notification in a user profile', async () => {
    const addNotifications: AudibleNotification[] = [
      {
        fileName: 'test1.file',
        notificationType: SystemMessageType.CHANNEL_MONITOR_TYPE_QUIETED
      },
      {
        fileName: 'test2.file',
        notificationType: SystemMessageType.STATION_CAPABILITY_STATUS_CHANGED
      }
    ];
    const mutationArgs: AudibleNotificationMutationArgs = {
      variables: {
        audibleNotificationsInput: addNotifications
      }
    };

    await setAudibleNotifications(mutationArgs);
    const userProfileSet: UserProfileTypes.UserProfile =
      setUserProfile.mock.calls[0][0].variables.userProfile;
    expect(setUserProfile).toHaveBeenCalled();
    expect(userProfileSet.audibleNotifications).toHaveLength(
      addNotifications.length + testUserProfile.audibleNotifications.length
    );
  });

  it('can inject a prop into a component', () => {
    expectThatCompositionInjectsAProp(withAudibleNotificationsMutation, 'setAudibleNotifications');
  });
});
