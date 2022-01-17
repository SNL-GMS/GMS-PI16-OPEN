/* eslint-disable jest/expect-expect */
import {
  fetchStationGroups,
  useStationGroupQuery
} from '../../../../../src/ts/components/client-interface/axios/queries/station-group-query';
import { expectQueryHookToMakeAxiosRequest } from '../../../../utils/query-mutation-test-utils';

describe('Station Group Query', () => {
  const effectiveTime = new Date('Jan 1, 2021').getTime() / 1000;

  it('provides a hook for accessing the station group query', () => {
    expect(useStationGroupQuery).toBeDefined();
    expect(fetchStationGroups).toBeDefined();
  });

  it('hook queries for station group query', async () => {
    const useTestHook = () => useStationGroupQuery(['station group 1'], effectiveTime);
    await expectQueryHookToMakeAxiosRequest(useTestHook);
  });
});
