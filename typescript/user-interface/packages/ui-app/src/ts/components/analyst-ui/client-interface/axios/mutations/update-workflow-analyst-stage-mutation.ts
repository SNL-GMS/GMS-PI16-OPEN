import { MutateFunction, useMutation } from 'react-query';

import { defaultConfig } from '~config/endpoint-configuration';

import { callMutation } from '../../../../client-interface/index';
import { UpdateInteractiveAnalysisStageIntervalStatusRequest } from '../types';

export const updateInteractiveAnalysisStageIntervalStatus = async (
  mutationArgs: UpdateInteractiveAnalysisStageIntervalStatusRequest
): Promise<void> => {
  await callMutation(
    defaultConfig.workflowConfiguration.services.updateInteractiveAnalysisStageIntervalStatus
      .requestConfig,
    mutationArgs
  );
};

/**
 * The configuration used to set up stage mutation.
 */
export const interactiveStageStatusMutationConfig = {
  onSuccess: (): void =>
    // eslint-disable-next-line no-console
    console.log(
      `Successfully updated interval activity status ${interactiveStageStatusMutationConfig}`
    )
};

/**
 * This is the easiest way to get the stageIntervalStatusMutation
 *
 * @returns the mutate function that updates an stage interval status
 */
export const useStageIntervalStatusMutation = (): MutateFunction<
  void,
  unknown,
  UpdateInteractiveAnalysisStageIntervalStatusRequest,
  unknown
> => {
  const [mutate] = useMutation(
    updateInteractiveAnalysisStageIntervalStatus,
    interactiveStageStatusMutationConfig
  );
  return mutate;
};
