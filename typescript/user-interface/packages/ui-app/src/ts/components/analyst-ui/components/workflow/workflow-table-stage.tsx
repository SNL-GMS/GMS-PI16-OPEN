/* eslint-disable no-nested-ternary */
import { WorkflowTypes } from '@gms/common-model';
import { isInteractiveAnalysisStageInterval } from '@gms/common-model/lib/workflow/types';
import { flatten, uniqBy } from 'lodash';
import React from 'react';

import { ActivityColumnEntry } from './activity-column-entry';
import { StageColumnEntry } from './stage-column-entry';
import { WorkflowTableStageProps } from './types';
import { WorkflowRowLabel } from './workflow-row-label';
import { Tooltip } from './workflow-tooltip';

/**
 * A workflow stage entry which can render the sub rows for both activities or
 * sequence intervals
 */
export const WorkflowTableStage: React.FunctionComponent<WorkflowTableStageProps> = (
  props: WorkflowTableStageProps
) => {
  const { isExpanded, stage, subRowNames } = props;

  // Get the intervals (sequence or activity)
  let intervals: WorkflowTypes.Interval[] = [];
  if (WorkflowTypes.isInteractiveAnalysisStageInterval(stage)) {
    intervals = stage.activityIntervals;
  } else if (WorkflowTypes.isAutomaticProcessingStageInterval(stage)) {
    intervals = stage.sequenceIntervals;
  }

  const activeAnalystRollup = isInteractiveAnalysisStageInterval(stage)
    ? uniqBy(flatten(stage.activityIntervals.map(activity => activity.activeAnalysts)), name => {
        return name;
      })
    : undefined;

  return (
    <div className="stage-column">
      <Tooltip
        key={`${stage.startTime} ${stage.name}`}
        interval={stage}
        activeAnalysts={activeAnalystRollup}
      >
        <div className="internal-row">
          <StageColumnEntry stageInterval={stage} />
        </div>
      </Tooltip>
      {intervals.length > 0 &&
      subRowNames.length > 0 &&
      isExpanded &&
      stage.stageMode === WorkflowTypes.StageMode.INTERACTIVE
        ? subRowNames.map((name: string) => {
            const interval: WorkflowTypes.ActivityInterval = (intervals.find(
              activityInterval => activityInterval.name === name
            ) as unknown) as WorkflowTypes.ActivityInterval;
            return (
              <Tooltip key={`${interval.startTime} ${interval.name}`} interval={interval}>
                <div className="internal-row">
                  <ActivityColumnEntry activityInterval={interval} />
                  <WorkflowRowLabel label={interval.name} isActivityRow={isExpanded} />
                </div>
              </Tooltip>
            );
          })
        : isExpanded && stage.stageMode === WorkflowTypes.StageMode.AUTOMATIC
        ? subRowNames.map((name: string) => {
            const interval: WorkflowTypes.StageInterval = (intervals.find(
              activityInterval => activityInterval.name === name
            ) as unknown) as WorkflowTypes.StageInterval;
            const newInterval: WorkflowTypes.StageInterval = {
              ...interval,
              stageMode: stage.stageMode
            };
            return (
              <Tooltip key={`${interval.startTime} ${interval.name}`} interval={stage}>
                <div className="internal-row">
                  <StageColumnEntry stageInterval={newInterval} />
                  <WorkflowRowLabel label={newInterval.name} isActivityRow={isExpanded} />
                </div>
              </Tooltip>
            );
          })
        : undefined}
    </div>
  );
};
