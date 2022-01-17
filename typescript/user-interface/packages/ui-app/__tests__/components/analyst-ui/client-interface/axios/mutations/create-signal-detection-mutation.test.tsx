/* eslint-disable jest/expect-expect */
import { SignalDetectionTypes } from '@gms/common-model';
import { Units } from '@gms/common-model/lib/common/types';
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

describe('Signal Detection mutation', () => {
  it('signalDetectionMutationConfig is defined', () => {
    expect(IanMutations.CreateSignalDetectionMutation.signalDetectionMutationConfig).toBeDefined();
  });

  const mutationArgs: SignalDetectionTypes.CreateDetectionMutationArgs = {
    input: {
      stationId: 'AAK',
      phase: 'P',
      signalDetectionTiming: {
        arrivalTime: 0,
        timeUncertaintySec: 0,
        amplitudeMeasurement: {
          startTime: 0,
          period: 0,
          amplitude: {
            value: 0,
            standardDeviation: 0,
            units: Units.DEGREES
          }
        }
      },
      eventId: '1'
    }
  };

  it('signalDetectionMutationConfig on success invalidates the signal detection query to force a re-fetch', async () => {
    QueryUtils.queryCache.invalidateQueries = jest.fn();

    const prevNumCalls = (QueryUtils.queryCache.invalidateQueries as jest.Mock).mock.calls.length;
    await IanMutations.CreateSignalDetectionMutation.signalDetectionMutationConfig.onSuccess();
    const { calls } = (QueryUtils.queryCache.invalidateQueries as jest.Mock).mock;
    // check for the second argument of the call, to make sure it was called with the newly provided data.
    expect(calls).toHaveLength(prevNumCalls + 1);
  });

  it('updateSignalDetection makes a call to the server with the expected data', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, jest/valid-expect-in-promise, jest/valid-expect
    expect(IanMutations.CreateSignalDetectionMutation.createSignalDetectionMutation(mutationArgs))
      .resolves.toBe(success)
      // eslint-disable-next-line no-console
      .catch(e => console.error(e));
  });

  it('creates a wrapped component that matches a snapshot', () => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const TestComponent: React.FC<{}> = () => <div>test</div>;
    const wrapperFn = IanMutations.CreateSignalDetectionMutation.withCreateSignalDetectionMutation();
    const WrappedComponent = wrapperFn(TestComponent);
    const wrapper = Enzyme.mount(<WrappedComponent />);
    expect(wrapper).toMatchSnapshot();
  });

  it('can inject a updateSignalDetection mutation prop into a wrapped component', () => {
    expectThatCompositionInjectsAProp(
      IanMutations.CreateSignalDetectionMutation.withCreateSignalDetectionMutation,
      'createSignalDetection'
    );
  });

  it('makes a request to the server when the signal detection mutation is called', () => {
    expectThatMutationHookMakesAxiosCall(
      IanMutations.CreateSignalDetectionMutation.useSignalDetectionMutation,
      mutationArgs
    );
  });
});
