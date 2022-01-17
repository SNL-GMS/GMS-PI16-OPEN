import React from 'react';

import { StageExpansionButton } from './stage-expansion-button';
import { WorkflowRowProps } from './types';
import { WorkflowRowLabel } from './workflow-row-label';
import { WorkflowTableStage } from './workflow-table-stage';

/**
 * A row wrapper which uses a list of stage intervals
 */
export const WorkflowRow: React.FunctionComponent<WorkflowRowProps> = (props: WorkflowRowProps) => {
  const { stageIntervals, subRowNames } = props;

  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const toggle = React.useCallback(() => setIsExpanded(!isExpanded), [isExpanded]);

  if (!stageIntervals) return <div />;

  return (
    <div className="stage-row">
      <StageExpansionButton
        isExpanded={isExpanded}
        disabled={stageIntervals?.length === 0}
        stageName={stageIntervals[0]?.name}
        toggle={toggle}
      />
      {stageIntervals.map(interval => {
        return (
          <WorkflowTableStage
            key={`${interval.startTime.toString()} ${interval.name}`}
            stage={interval}
            subRowNames={subRowNames}
            isExpanded={isExpanded}
          />
        );
      })}
      <WorkflowRowLabel label={stageIntervals[0]?.name} isActivityRow={false} />
    </div>
  );
};
