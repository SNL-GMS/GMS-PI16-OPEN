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
  it('update updateInteractiveAnalysisStageIntervalStatus is defined', () => {
    expect(
      IanMutations.UpdateWorkflowAnalystStageMutation.interactiveStageStatusMutationConfig
    ).toBeDefined();
  });

  const startTime = 0;
  const args: IanQueryAndMutationTypes.UpdateInteractiveAnalysisStageIntervalStatusRequest = {
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

  it('interactiveStageStatusMutationConfig can call onSuccess', () => {
    expect(
      IanMutations.UpdateWorkflowAnalystStageMutation.interactiveStageStatusMutationConfig.onSuccess()
    ).toBeUndefined();
  });

  it('updateInteractiveAnalysisStageIntervalStatus makes a call to the server with the expected data', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, jest/valid-expect-in-promise, jest/valid-expect
    expect(
      IanMutations.UpdateWorkflowAnalystStageMutation.updateInteractiveAnalysisStageIntervalStatus(
        args
      )
    )
      .resolves.toBe(success)
      // eslint-disable-next-line no-console
      .catch(e => console.error(e));
  });

  it('makes a request to the server when the updateInteractiveAnalysisStageIntervalStatus mutation is called', () => {
    expectThatMutationHookMakesAxiosCall(
      IanMutations.UpdateWorkflowAnalystStageMutation.useStageIntervalStatusMutation,
      args
    );
  });
});
