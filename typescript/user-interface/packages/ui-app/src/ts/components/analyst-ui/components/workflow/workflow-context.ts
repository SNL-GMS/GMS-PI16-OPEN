import { WorkflowTypes } from '@gms/common-model';
import * as React from 'react';

import { OpenAnythingInterval } from './types';

export interface WorkflowContextData {
  staleStartTime: number;
  allActivitiesOpenForSelectedInterval: boolean;
  closeConfirmationPrompt: (
    interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
  ) => void;
  openConfirmationPrompt: (
    interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
  ) => void;
  openAnythingConfirmationPrompt: (interval: OpenAnythingInterval) => void;
}

/**
 * The audible notification context
 */
export const WorkflowContext: React.Context<WorkflowContextData> = React.createContext<
  WorkflowContextData
>(undefined);
