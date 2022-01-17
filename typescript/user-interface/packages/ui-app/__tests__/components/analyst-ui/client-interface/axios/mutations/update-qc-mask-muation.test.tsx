/* eslint-disable jest/expect-expect */
import { QcMaskTypes } from '@gms/common-model';
import Axios from 'axios';
import * as Enzyme from 'enzyme';
import * as React from 'react';

import { IanMutations } from '../../../../../../src/ts/components/analyst-ui/client-interface';
import { QueryUtils } from '../../../../../../src/ts/components/client-interface/axios/queries';
import {
  expectThatCompositionInjectsAProp,
  expectThatMutationHookMakesAxiosCall
} from '../../../../../utils/query-mutation-test-utils';

// eslint-disable-next-line no-console
console.error = jest.fn();
Date.now = jest.fn().mockReturnValue(() => 1000);

const success = 'success';
Axios.request = jest.fn().mockReturnValue(Promise.resolve(success));

describe('Update QcMask mutation', () => {
  it('update qcMaskMutationConfig is defined', () => {
    expect(IanMutations.UpdateQcMaskMutation.qcMaskMutationConfig).toBeDefined();
  });

  const mutationArgs: QcMaskTypes.UpdateQcMaskMutationArgs = {
    maskId: 'foo',
    input: {
      timeRange: {
        startTimeSecs: 0,
        endTimeSecs: 100
      },
      category: 'foo',
      type: 'foo',
      rationale: 'foo'
    }
  };

  it('qcMaskMutationConfig on success invalidates the qcMask query to force a re-fetch', async () => {
    QueryUtils.queryCache.invalidateQueries = jest.fn();

    const prevNumCalls = (QueryUtils.queryCache.invalidateQueries as jest.Mock).mock.calls.length;
    await IanMutations.UpdateQcMaskMutation.qcMaskMutationConfig.onSuccess();
    const { calls } = (QueryUtils.queryCache.invalidateQueries as jest.Mock).mock;
    // check for the second argument of the call, to make sure it was called with the newly provided data.
    expect(calls).toHaveLength(prevNumCalls + 1);
  });

  it('updateQcMasks makes a call to the server with the expected data', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, jest/valid-expect-in-promise, jest/valid-expect
    expect(IanMutations.UpdateQcMaskMutation.updateQcMasks(mutationArgs))
      .resolves.toBe(success)
      // eslint-disable-next-line no-console
      .catch(e => console.error(e));
  });

  it('updates a wrapped component that matches a snapshot', () => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const TestComponent: React.FC<{}> = () => <div>test</div>;
    const wrapperFn = IanMutations.UpdateQcMaskMutation.withUpdateQcMaskMutation();
    const WrappedComponent = wrapperFn(TestComponent);
    const wrapper = Enzyme.mount(<WrappedComponent />);
    expect(wrapper).toMatchSnapshot();
  });

  it('can inject a updateQcMask mutation prop into a wrapped component', () => {
    expectThatCompositionInjectsAProp(
      IanMutations.UpdateQcMaskMutation.withUpdateQcMaskMutation,
      'updateQcMasks'
    );
  });

  it('makes a request to the server when the qcMask mutation is called', () => {
    expectThatMutationHookMakesAxiosCall(
      IanMutations.UpdateQcMaskMutation.useQcMaskMutation,
      mutationArgs
    );
  });
});
