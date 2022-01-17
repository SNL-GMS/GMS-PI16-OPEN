import { MutateFunction, useMutation } from 'react-query';

import { defaultConfig } from '~config/endpoint-configuration';

import { callMutation } from '../../../../client-interface/index';
import { UpdateActivityIntervalStatusRequest } from '../types';

export const updateActivityIntervalStatus = async (
  mutationArgs: UpdateActivityIntervalStatusRequest
): Promise<void> => {
  await callMutation(
    defaultConfig.workflowConfiguration.services.updateActivityIntervalStatus.requestConfig,
    mutationArgs
  );
};

/**
 * The configuration used to set up the activity interval mutation
 */
export const activityStatusMutationConfig = {
  onSuccess: (): void =>
    // eslint-disable-next-line no-console
    console.log(`Successfully updated interval activity status ${activityStatusMutationConfig}`)
};

/**
 * This is the easiest way to get the activityIntervalStatusMutation
 *
 * @returns the mutate function that sets the activity interval status
 * on the server.
 */
export const useActivityIntervalStatusMutation = (): MutateFunction<
  void,
  unknown,
  UpdateActivityIntervalStatusRequest,
  unknown
> => {
  const [mutate] = useMutation(updateActivityIntervalStatus, activityStatusMutationConfig);
  return mutate;
};
