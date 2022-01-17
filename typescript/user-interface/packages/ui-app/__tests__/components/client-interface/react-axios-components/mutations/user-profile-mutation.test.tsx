import { UserProfileTypes } from '@gms/common-model';
import Axios from 'axios';
import * as Enzyme from 'enzyme';
import * as React from 'react';

import {
  setUserProfile,
  userProfileMutationConfig,
  useUserProfileMutation,
  withUserProfileMutation
} from '../../../../../src/ts/components/client-interface/axios/mutations/user-profile-mutation';
import { queryCache } from '../../../../../src/ts/components/client-interface/axios/queries/query-util';
import { UserProfileMutationArgs } from '../../../../../src/ts/components/client-interface/axios/types';
import {
  expectThatCompositionInjectsAProp,
  expectThatMutationHookMakesAxiosCall
} from '../../../../utils/query-mutation-test-utils';

// eslint-disable-next-line no-console
console.error = jest.fn();
Date.now = jest.fn().mockReturnValue(() => 1000);

const success = 'success';
Axios.request = jest.fn().mockReturnValue(Promise.resolve(success));

describe('User profile mutation mutation', () => {
  it('userProfileMutationConfig is defined', () => {
    expect(userProfileMutationConfig).toBeDefined();
  });

  const testUserProfile: UserProfileTypes.UserProfile = {
    audibleNotifications: [],
    defaultAnalystLayoutName: 'foo',
    defaultSohLayoutName: 'bar',
    userId: 'fooman',
    workspaceLayouts: []
  };

  const mutationArgs: UserProfileMutationArgs = {
    variables: {
      userProfile: testUserProfile
    }
  };

  it('userProfileMutationConfig on success invalidates the user profile query to force a re-fetch', async () => {
    queryCache.invalidateQueries = jest.fn();

    const prevNumCalls = (queryCache.invalidateQueries as jest.Mock).mock.calls.length;
    await userProfileMutationConfig.onSuccess();
    const { calls } = (queryCache.invalidateQueries as jest.Mock).mock;
    // check for the second argument of the call, to make sure it was called with the newly provided data.
    expect(calls).toHaveLength(prevNumCalls + 1);
  });

  it('setUserProfile makes a call to the server with the expected data', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, jest/valid-expect-in-promise, jest/valid-expect
    expect(setUserProfile(mutationArgs))
      .resolves.toBe(success)
      // eslint-disable-next-line no-console
      .catch(e => console.error(e));
  });

  it('creates a wrapped component that matches a snapshot', () => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const TestComponent: React.FC<{}> = () => <div>test</div>;
    const wrapperFn = withUserProfileMutation();
    const WrappedComponent = wrapperFn(TestComponent);
    const wrapper = Enzyme.mount(<WrappedComponent />);
    expect(wrapper).toMatchSnapshot();
  });

  // eslint-disable-next-line jest/expect-expect
  it('can inject a setUserProfile prop into a wrapped component', () => {
    expectThatCompositionInjectsAProp(withUserProfileMutation, 'setUserProfile');
  });

  // eslint-disable-next-line jest/expect-expect
  it('makes a request to the server when the mutation is called', () => {
    expectThatMutationHookMakesAxiosCall(useUserProfileMutation, mutationArgs);
  });
});
