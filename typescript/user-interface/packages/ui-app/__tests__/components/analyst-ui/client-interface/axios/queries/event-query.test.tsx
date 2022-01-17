/* eslint-disable jest/expect-expect */
import { CommonTypes } from '@gms/common-model/src/ts/common-model';

import { IanQueries } from '../../../../../../src/ts/components/analyst-ui/client-interface';
import { expectDummyQueryHookToMakeAxiosRequest } from '../../../../../utils/query-mutation-test-utils';

describe('Event Configuration Query', () => {
  const now = Date.now() / 1000;
  const timeRange: CommonTypes.TimeRange = {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    startTimeSecs: now - 3600,
    endTimeSecs: now
  };
  it('provides a hook for accessing the event query', () => {
    expect(IanQueries.EventQuery.useEventQuery).toBeDefined();
  });

  it('hook queries for event configuration', async () => {
    const useTestHook = () => IanQueries.EventQuery.useEventQuery(timeRange);
    await expectDummyQueryHookToMakeAxiosRequest(useTestHook);
  });

  it('call fetchEvents should return empty array', async () => {
    expect(await IanQueries.EventQuery.fetchEvents(timeRange)).toEqual([]);
  });
});
