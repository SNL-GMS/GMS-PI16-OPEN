/* eslint-disable jest/expect-expect */
import { CommonTypes, SignalDetectionTypes } from '@gms/common-model/src/ts/common-model';

import { IanQueries } from '../../../../../../src/ts/components/analyst-ui/client-interface';
import { expectDummyQueryHookToMakeAxiosRequest } from '../../../../../utils/query-mutation-test-utils';

describe('SignalDetection Configuration Query', () => {
  const now = Date.now() / 1000;
  const timeRange: CommonTypes.TimeRange = {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    startTimeSecs: now - 3600,
    endTimeSecs: now
  };

  const signalDetectionQueryArgs: SignalDetectionTypes.SignalDetectionsByStationQueryArgs = {
    stationIds: ['AAK'],
    timeRange
  };
  it('provides a hook for accessing the signal detection query', () => {
    expect(IanQueries.SignalDetectionQuery.useSignalDetectionQuery).toBeDefined();
  });

  it('hook queries for signal detection configuration', async () => {
    const useTestHook = () =>
      IanQueries.SignalDetectionQuery.useSignalDetectionQuery(signalDetectionQueryArgs);
    await expectDummyQueryHookToMakeAxiosRequest(useTestHook);
  });

  it('call fetchSignalDetections should return empty array', async () => {
    expect(
      await IanQueries.SignalDetectionQuery.fetchSignalDetections(signalDetectionQueryArgs)
    ).toEqual([]);
  });
});
