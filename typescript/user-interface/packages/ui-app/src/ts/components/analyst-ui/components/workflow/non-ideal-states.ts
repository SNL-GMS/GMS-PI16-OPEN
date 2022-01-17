import {
  NonIdealStateDefinition,
  nonIdealStateWithNoSpinner,
  nonIdealStateWithSpinner
} from '@gms/ui-core-components';

import { WorkflowIntervalQueryProps } from '~analyst-ui/client-interface/axios/queries/workflow-interval-query';
import { WorkflowQueryProps } from '~analyst-ui/client-interface/axios/queries/workflow-query';

export const workflowQueryNonIdealStates: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: unknown & WorkflowQueryProps): boolean => {
      return props.workflowQuery?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'Workflow Data')
  },
  {
    condition: (props: unknown & WorkflowQueryProps): boolean => {
      return props.workflowQuery?.isError;
    },
    element: nonIdealStateWithSpinner('Error', 'Problem Loading Workflow Data')
  }
];

export const workflowIntervalQueryNonIdealStates: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: unknown & WorkflowIntervalQueryProps): boolean => {
      return props.workflowIntervalQuery?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'Workflow Interval Data')
  },
  {
    condition: (props: unknown & WorkflowIntervalQueryProps): boolean => {
      return (
        !props.workflowIntervalQuery?.isLoading &&
        !props.workflowIntervalQuery?.isError &&
        (!props.workflowIntervalQuery.data ||
          props.workflowIntervalQuery.data.filter(value => value.length > 0).isEmpty())
      );
    },
    element: nonIdealStateWithNoSpinner('No data', 'Stage intervals returned empty')
  },
  {
    condition: (props: unknown & WorkflowIntervalQueryProps): boolean => {
      return props.workflowIntervalQuery?.isError;
    },
    element: nonIdealStateWithNoSpinner('Error', 'Problem Loading Workflow Interval Data')
  }
];
