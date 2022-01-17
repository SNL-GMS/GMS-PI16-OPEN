import { WorkflowTypes } from '@gms/common-model';
import { isAutomaticProcessingStage, isStageInterval } from '@gms/common-model/lib/workflow/types';
import { humanReadable, secondsToString } from '@gms/common-util';
import { LabelValue, TooltipWrapper } from '@gms/ui-core-components';
import React from 'react';

import { useWorkflowQuery } from '~analyst-ui/client-interface/axios/queries/workflow-query';

import { WorkflowContext } from './workflow-context';
import { isStageIntervalPercentBar } from './workflow-util';

export interface TooltipPanelProps {
  status: string;
  activeAnalysts: string;
  lastModified: string;
  isStale: boolean;
}

export interface TooltipProps {
  interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval;
  activeAnalysts?: string[]; // Roll up of active analysts to show on cell
}

/**
 * Gets the status of the provided interval
 *
 * @param interval the interval
 * @param workflow the workflow data
 * @returns a string representation of the status
 */
export const getStatus = (
  interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval,
  workflow: WorkflowTypes.Workflow
): string => {
  if (!interval) {
    return undefined;
  }

  let status = `${humanReadable(interval.status)}`;

  if (workflow) {
    if (interval.status === WorkflowTypes.IntervalStatus.IN_PROGRESS) {
      if (isStageInterval(interval)) {
        if (isStageIntervalPercentBar(interval)) {
          const stage = workflow.stages.find(s => s.name === interval.name);
          if (isAutomaticProcessingStage(stage)) {
            // ! handle multiple sequences
            // TODO handle which step by using lastExecutedStep
            if (stage?.sequences?.length > 0) {
              status = `${status} (${
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                stage.sequences[0].steps[Math.ceil(interval.percentAvailable / 10)]?.name
              })`;
            }
          }
        }
      }
    }
  }
  return status;
};

/**
 * Gets the active analysts of the provided interval
 *
 * @param interval the interval
 * @returns a string representation of the active analysts
 */
export const getActiveAnalysts = (
  interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
): string => {
  if (!interval) {
    return undefined;
  }

  let activeAnalysts: string;
  if (WorkflowTypes.isActivityInterval(interval)) {
    activeAnalysts =
      interval.activeAnalysts && interval.activeAnalysts.length > 0
        ? interval.activeAnalysts.join(', ')
        : undefined;
  }
  return activeAnalysts;
};

export const TooltipPanel: React.FunctionComponent<TooltipPanelProps> = (
  props: TooltipPanelProps
) => {
  const { status, activeAnalysts, lastModified, isStale } = props;
  return (
    <div className="workflow-tooltip">
      {isStale ? (
        <LabelValue
          label="Stale"
          value="Interval is stale"
          tooltip="Status"
          containerClass="workflow-tooltip-container"
        />
      ) : undefined}
      {status ? (
        <LabelValue
          label="Status"
          value={`${status} ${isStale ? '(Stale)' : ''}`}
          tooltip="Status"
          containerClass="workflow-tooltip-container"
        />
      ) : undefined}
      {activeAnalysts ? (
        <LabelValue
          label="Active Analysts"
          value={activeAnalysts}
          tooltip="Active Analysts"
          containerClass="workflow-tooltip-container"
        />
      ) : undefined}
      {lastModified ? (
        <LabelValue
          label="Last Modified"
          value={lastModified}
          tooltip="Last Modified"
          containerClass="workflow-tooltip-container"
        />
      ) : undefined}
    </div>
  );
};

export const Tooltip: React.FunctionComponent<TooltipProps> = (
  props: React.PropsWithChildren<TooltipProps>
) => {
  const { children, interval, activeAnalysts } = props;

  const workflow = useWorkflowQuery();
  const context = React.useContext(WorkflowContext);

  if (!interval) {
    return <>{children}</>;
  }
  const status: string = getStatus(interval, workflow.data);
  // Active analysts can be a roll up of all analysts when it's a stage, when it's a rollup
  // it's passed in, if not, goes through and finds active analysts for that activity
  const activeAnalyst: string = activeAnalysts
    ? activeAnalysts.join(', ')
    : getActiveAnalysts(interval);
  const lastModified: string = secondsToString(interval.modificationTime);
  const { staleStartTime } = context;
  const isStale = staleStartTime > interval.startTime;
  return (
    <TooltipWrapper
      content={
        <TooltipPanel
          status={status}
          activeAnalysts={activeAnalyst}
          lastModified={lastModified}
          isStale={isStale}
        />
      }
    >
      {children ?? <></>}
    </TooltipWrapper>
  );
};
