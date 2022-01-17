/* eslint-disable jest/expect-expect */
import { useQueryStationGroups } from '../../../../../src/ts/components/client-interface/axios/queries/station-groups-definition-query';
import { expectQueryHookToMakeAxiosRequest } from '../../../../utils/query-mutation-test-utils';

describe('Station Definition Query', () => {
  it('provides a hook for accessing the station definition query', () => {
    expect(useQueryStationGroups).toBeDefined();
  });

  it('hook queries for station definition query', async () => {
    const stationDefinitionQueryInput = 'ALL_1';
    const useTestHook = () => useQueryStationGroups(stationDefinitionQueryInput);
    await expectQueryHookToMakeAxiosRequest(useTestHook);
  });

  it('hook queries for station definition by Station Groups, names times', async () => {
    const stationDefinitionQueryInput = 'ALL_1';
    const effectiveTime = new Date('Jan 1, 2021').getTime() / 1000;
    const useTestHook = () => useQueryStationGroups(stationDefinitionQueryInput, effectiveTime);
    await expectQueryHookToMakeAxiosRequest(useTestHook);
  });
});
