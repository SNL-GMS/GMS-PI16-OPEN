/* eslint-disable jest/expect-expect */
import { WorkflowTypes } from '@gms/common-model';
import { epochSecondsNow } from '@gms/common-util';
import Axios from 'axios';

import {
  IanMutations,
  IanQueryAndMutationTypes
} from '../../../../../../src/ts/components/analyst-ui/client-interface';
import { expectThatMutationHookMakesAxiosCall } from '../../../../../utils/query-mutation-test-utils';

// eslint-disable-next-line no-console
console.error = jest.fn();
Date.now = jest.fn().mockReturnValue(() => 1000);

const success = 'success';
Axios.request = jest.fn().mockReturnValue(Promise.resolve(success));

describe('Update QcMask mutation', () => {
  it('update activityStatusMutationConfig is defined', () => {
    expect(IanMutations.UpdateWorkflowActivityMutation.updateActivityIntervalStatus).toBeDefined();
  });

  const startTime = 0;
  const args: IanQueryAndMutationTypes.UpdateActivityIntervalStatusRequest = {
    activityIntervalId: {
      startTime,
      definitionId: {
        name: 'Event Review'
      }
    },
    stageIntervalId: {
      startTime,
      definitionId: {
        name: 'AL1'
      }
    },
    status: WorkflowTypes.IntervalStatus.IN_PROGRESS,
    userName: 'joe',
    time: epochSecondsNow()
  };

  it('activityStatusMutationConfig can call onSuccess', () => {
    expect(
      IanMutations.UpdateWorkflowActivityMutation.activityStatusMutationConfig.onSuccess()
    ).toBeUndefined();
  });

  it('updateActivityIntervalStatus makes a call to the server with the expected data', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, jest/valid-expect-in-promise, jest/valid-expect
    expect(IanMutations.UpdateWorkflowActivityMutation.updateActivityIntervalStatus(args))
      .resolves.toBe(success)
      // eslint-disable-next-line no-console
      .catch(e => console.error(e));
  });

  it('makes a request to the server when the updateActivityIntervalStatus mutation is called', () => {
    expectThatMutationHookMakesAxiosCall(
      IanMutations.UpdateWorkflowActivityMutation.useActivityIntervalStatusMutation,
      args
    );
  });
});
