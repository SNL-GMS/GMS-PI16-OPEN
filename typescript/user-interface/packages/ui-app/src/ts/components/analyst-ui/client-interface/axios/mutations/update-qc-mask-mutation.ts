/* eslint-disable @typescript-eslint/no-explicit-any */
import { QcMaskTypes } from '@gms/common-model';
import { MutateFunction, useMutation } from 'react-query';

import { buildMutationInjector, queryCache } from '~components/client-interface';

import { qcMaskQueryConfig } from '../queries/qc-mask-query';

/**
 * Call mutation using ReactQuery with mutation args
 *
 * @param mutationArgs
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const updateQcMasks = async (
  mutationArgs: QcMaskTypes.UpdateQcMaskMutationArgs
): Promise<QcMaskTypes.QcMask[]> => {
  // TODO: uncomment when mutation is implemented
  // const result = await callMutation(
  //   defaultConfig.QcMask.services.setQcMask.requestConfig,
  //   mutationArgs.
  // );
  // eslint-disable-next-line no-console
  console.log(`updateQcMasks with ${JSON.stringify(mutationArgs)}`);
  return new Promise<[]>(resolve => resolve([]));
};

/**
 * The configuration used to set up the QcMaskMutation.
 * Stores the results in the QcMaskQuery on success, causing subscribed components to update.
 */
export const qcMaskMutationConfig = {
  // eslint-disable-next-line @typescript-eslint/require-await
  onSuccess: async (): Promise<unknown> => queryCache.invalidateQueries(qcMaskQueryConfig.queryKey)
};

/**
 * This is the easiest way to get the mutation
 *
 * @returns the mutate function that sets the results
 * on the server.
 */
export const useQcMaskMutation = (): MutateFunction<
  QcMaskTypes.QcMask[],
  unknown,
  QcMaskTypes.UpdateQcMaskMutationArgs,
  unknown
> => {
  const [mutate] = useMutation(updateQcMasks, qcMaskMutationConfig);
  return mutate;
};

/**
 * Used with compose to inject the mutation function into the wrapped
 * component. Note that this needs to be called (don't forget the '()'). This is to maintain
 * consistency with the way graphql mutations are bound.
 * ie: compose(...otherStuff, withUpdateQcMaskMutation())(ExampleComponent);
 * ExampleComponent now contains a prop called 'updateQcMasks' that calls the mutation.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const withUpdateQcMaskMutation = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildMutationInjector<QcMaskTypes.QcMask[], any, QcMaskTypes.UpdateQcMaskMutationArgs, any>(
    'updateQcMasks',
    updateQcMasks,
    qcMaskMutationConfig
  );
