import { WithNonIdealStates } from '@gms/ui-core-components';
import * as React from 'react';

import { IanQueries } from '~analyst-ui/client-interface';
import { AnalystNonIdealStates } from '~analyst-ui/common/non-ideal-states';
import { BaseDisplay } from '~common-ui/components/base-display';
import { CommonNonIdealStateDefs } from '~common-ui/components/non-ideal-states';
import { Queries } from '~components/client-interface';

import {
  workflowIntervalQueryNonIdealStates,
  workflowQueryNonIdealStates
} from './non-ideal-states';
import { WorkflowComponentProps, WorkflowPanelProps } from './types';
import { WorkflowPanel } from './workflow-panel';

export const WorkflowPanelOrNonIdealState = WithNonIdealStates<WorkflowPanelProps>(
  [
    ...CommonNonIdealStateDefs.baseNonIdealStateDefinitions,
    ...AnalystNonIdealStates.processingAnalystConfigNonIdealStateDefinitions,
    ...AnalystNonIdealStates.operationalTimePeriodConfigNonIdealStateDefinitions,
    ...workflowQueryNonIdealStates,
    ...workflowIntervalQueryNonIdealStates
  ],
  WorkflowPanel
);

export const WorkflowComponent: React.FunctionComponent<WorkflowComponentProps> = (
  props: WorkflowComponentProps
) => {
  const { glContainer } = props;

  const processingAnalystConfiguration = Queries.ProcessingAnalystConfigurationQuery.useProcessingAnalystConfigurationQuery();
  const operationalTimeQuery = Queries.OperationalTimePeriodConfigurationQuery.useOperationalTimePeriodConfigurationQuery();

  // TODO analyst configuration needs to be updated to reflect a proper TimeRange; i.e. 45 days
  const timeRange = {
    startTimeSecs:
      processingAnalystConfiguration.data?.currentIntervalEndTime -
      processingAnalystConfiguration.data?.currentIntervalDuration,
    endTimeSecs: processingAnalystConfiguration.data?.currentIntervalEndTime
  };

  const workflowQueries = IanQueries.WorkflowQueryUtil.useWorkflowData(timeRange);
  return (
    <BaseDisplay glContainer={glContainer} className="workflow-display-window gms-body-text">
      <WorkflowPanelOrNonIdealState
        workflowQuery={workflowQueries.workflowQuery}
        workflowIntervalQuery={workflowQueries.workflowIntervalQuery}
        operationalTimePeriodConfigurationQuery={operationalTimeQuery}
        timeRange={timeRange}
      />
    </BaseDisplay>
  );
};
