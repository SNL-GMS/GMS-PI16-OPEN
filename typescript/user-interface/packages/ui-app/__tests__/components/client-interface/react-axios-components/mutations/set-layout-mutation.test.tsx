import { UserProfileTypes } from '@gms/common-model';

import {
  createNewProfileFromSetLayoutInput,
  setLayout,
  setLayoutMutationConfig,
  useSetLayoutMutation,
  withSetLayoutMutation
} from '../../../../../src/ts/components/client-interface/axios/mutations/set-layout-mutation';
import { queryCache } from '../../../../../src/ts/components/client-interface/axios/queries/query-util';
import { userProfileQueryConfig } from '../../../../../src/ts/components/client-interface/axios/queries/user-profile-query';
import {
  expectThatCompositionInjectsAProp,
  expectThatMutationHookMakesAxiosCall
} from '../../../../utils/query-mutation-test-utils';

// mocks the module user-profile-mutation
jest.mock(
  '../../../../../src/ts/components/client-interface/axios/mutations/user-profile-mutation',
  () => ({
    setUserProfile: jest.fn().mockImplementation(async () => Promise.resolve('success'))
  })
);

// eslint-disable-next-line no-console
console.error = jest.fn();
Date.now = jest.fn().mockReturnValue(() => 1000);

const currentProfile: UserProfileTypes.UserProfile = {
  audibleNotifications: [],
  defaultAnalystLayoutName: 'testLayout',
  defaultSohLayoutName: UserProfileTypes.DefaultLayoutNames.SOH_LAYOUT,
  userId: 'fooman',
  workspaceLayouts: [
    {
      layoutConfiguration: 'abc123',
      name: UserProfileTypes.DefaultLayoutNames.ANALYST_LAYOUT,
      supportedUserInterfaceModes: [UserProfileTypes.UserMode.IAN]
    }
  ]
};
const setLayoutInput: UserProfileTypes.SetLayoutMutationArgs = {
  defaultLayoutName: UserProfileTypes.DefaultLayoutNames.SOH_LAYOUT,
  workspaceLayoutInput: {
    layoutConfiguration: 'xyz123',
    name: 'newLayout',
    supportedUserInterfaceModes: [UserProfileTypes.UserMode.IAN, UserProfileTypes.UserMode.SOH]
  }
};

describe('set layout mutation', () => {
  it('can create a new profile from a setLayout call', () => {
    const newProfile = createNewProfileFromSetLayoutInput(currentProfile, setLayoutInput);
    expect(newProfile.workspaceLayouts).toHaveLength(currentProfile.workspaceLayouts.length + 1);
  });

  it('setLayoutMutationConfig is defined', () => {
    expect(setLayoutMutationConfig).toBeDefined();
  });

  it('setLayoutMutationConfig on success invalidates the user profile query to force a re-fetch', async () => {
    queryCache.invalidateQueries = jest.fn();
    const numPreviousCalls = (queryCache.invalidateQueries as jest.Mock).mock?.calls.length;
    await setLayoutMutationConfig.onSuccess();
    const calls = (queryCache.invalidateQueries as jest.Mock).mock?.calls;
    expect(calls).toHaveLength(numPreviousCalls + 1);
  });

  it('setLayout sets the user profile', async () => {
    queryCache.getQueryData = jest.fn().mockReturnValue(currentProfile);
    const defaultProfile = queryCache.getQueryData<UserProfileTypes.UserProfile>(
      userProfileQueryConfig
    );
    expect(defaultProfile.workspaceLayouts).toHaveLength(1);
    const result = await setLayout({ variables: setLayoutInput });
    expect(result).toEqual('success');
  });

  it('can inject a prop called setLayout', () => {
    expectThatCompositionInjectsAProp(withSetLayoutMutation, 'setLayout');
  });

  it('makes a request to the server when the mutation is called', () => {
    const mutationArgs: {
      variables: UserProfileTypes.SetLayoutMutationArgs;
    } = {
      variables: setLayoutInput
    };
    expectThatMutationHookMakesAxiosCall(useSetLayoutMutation, mutationArgs);
  });
});
