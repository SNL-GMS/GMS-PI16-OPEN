/* eslint-disable jest/expect-expect */
import {
  useUserProfileQuery,
  withUserProfileQuery
} from '../../../../../src/ts/components/client-interface/axios/queries/user-profile-query';
import {
  expectQueryHookToMakeAxiosRequest,
  expectThatCompositionInjectsAProp
} from '../../../../utils/query-mutation-test-utils';

jest.mock('@gms/common-util', () => ({
  ...jest.requireActual('@gms/common-util'),
  IS_MODE_SOH: true,
  IS_MODE_IAN: false
}));
describe('User Profile Query', () => {
  it('provides a hook for accessing the User Profile', () => {
    expect(useUserProfileQuery).toBeDefined();
  });

  it('hook queries for User Profile', async () => {
    await expectQueryHookToMakeAxiosRequest(useUserProfileQuery);
  });

  it('can inject a prop called userProfileQuery', () => {
    expectThatCompositionInjectsAProp(withUserProfileQuery, 'userProfileQuery');
  });
});
