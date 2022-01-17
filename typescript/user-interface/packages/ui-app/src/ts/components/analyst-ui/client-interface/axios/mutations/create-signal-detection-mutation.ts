/* eslint-disable @typescript-eslint/no-explicit-any */
import { SignalDetectionTypes } from '@gms/common-model';
import { MutateFunction, useMutation } from 'react-query';

import { buildMutationInjector, queryCache } from '~components/client-interface';

import { signalDetectionQueryConfig } from '../queries/signal-detection-query';

/**
 * Call mutation using ReactQuery with mutation args
 *
 * @param mutationArgs
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createSignalDetectionMutation = async (
  mutationArgs: SignalDetectionTypes.CreateDetectionMutationArgs
): Promise<SignalDetectionTypes.SignalDetection[]> => {
  // TODO: uncomment when mutation is implemented
  // const result = await callMutation(
  //   defaultConfig.SignalDetection.services.setSignalDetection.requestConfig,
  //   mutationArgs
  // );
  // eslint-disable-next-line no-console
  console.log(`createSignalDetectionMutation with ${JSON.stringify(mutationArgs)}`);
  return new Promise<[]>(resolve => resolve([]));
};

/**
 * The configuration used to set up the SignalDetectionMutation.
 * Stores the results in the SignalDetectionQuery on success, causing subscribed components to update.
 */
export const signalDetectionMutationConfig = {
  // eslint-disable-next-line @typescript-eslint/require-await
  onSuccess: async (): Promise<unknown> =>
    queryCache.invalidateQueries(signalDetectionQueryConfig.queryKey)
};

/**
 * This is the easiest way to get the mutation
 *
 * @returns the mutate function that sets the results
 * on the server.
 */
export const useSignalDetectionMutation = (): MutateFunction<
  SignalDetectionTypes.SignalDetection[],
  unknown,
  SignalDetectionTypes.CreateDetectionMutationArgs,
  unknown
> => {
  const [mutate] = useMutation(createSignalDetectionMutation, signalDetectionMutationConfig);
  return mutate;
};

/**
 * Used with compose to inject the mutation function into the wrapped
 * component. Note that this needs to be called (don't forget the '()'). This is to maintain
 * consistency with the way graphql mutations are bound.
 * ie: compose(...otherStuff, withCreateSignalDetectionMutation())(ExampleComponent);
 * ExampleComponent now contains a prop called 'createSignalDetectionMutation' that calls the mutation.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const withCreateSignalDetectionMutation = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildMutationInjector<
    SignalDetectionTypes.SignalDetection[],
    any,
    SignalDetectionTypes.CreateDetectionMutationArgs,
    any
  >('createSignalDetection', createSignalDetectionMutation, signalDetectionMutationConfig);
