import { ContextMenu } from '@blueprintjs/core';
import { WorkflowTypes } from '@gms/common-model';
import { AppState } from '@gms/ui-state';
import classNames from 'classnames';
import includes from 'lodash/includes';
import React from 'react';
import { Provider, useSelector, useStore } from 'react-redux';

import { IntervalContextMenu } from './context-menus';
import { ActivityIntervalCellProps } from './types';
import { WorkflowContext } from './workflow-context';
import { determineCellSize } from './workflow-util';

/**
 * Determines the text for the cell based on status and activeAnalyst list
 * TODO for complete name needs to be analyst that marked complete
 *
 * @param status interval status
 * @param activeAnalysts list of activeAnalyst
 * @returns text for cell to display
 */
export const determineTextForCell = (
  status: WorkflowTypes.IntervalStatus,
  activeAnalysts: string[]
): string => {
  if (!activeAnalysts || activeAnalysts.length === 0) return '';

  switch (status) {
    case WorkflowTypes.IntervalStatus.NOT_STARTED:
    case WorkflowTypes.IntervalStatus.NOT_COMPLETE:
      return '';
    case WorkflowTypes.IntervalStatus.COMPLETE:
      return activeAnalysts[0];
    default:
      return `${activeAnalysts[0]}${
        activeAnalysts.length > 1 ? ` + ${activeAnalysts.length - 1}` : ''
      }`;
  }
};

export const preventDefaultEvent = (event: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
  event.preventDefault();
};

export const ActivityIntervalCell: React.FunctionComponent<ActivityIntervalCellProps> = React.memo(
  (props: ActivityIntervalCellProps) => {
    const { activityInterval } = props;
    const workflowState = useSelector(
      (state: AppState) => state.analystWorkspaceState.workflowState
    );
    const context = React.useContext(WorkflowContext);
    const isSelected =
      workflowState.openIntervalName === activityInterval.stageName &&
      includes(workflowState.openActivityNames, activityInterval.name) &&
      workflowState.timeRange?.startTimeSecs === activityInterval.startTime;
    const isStale = context.staleStartTime > activityInterval.startTime;
    const cellClass = classNames({
      'interval-cell': true,
      'interval-cell--selected': isSelected,
      'interval-cell--not-complete':
        activityInterval.status === WorkflowTypes.IntervalStatus.NOT_COMPLETE,
      'interval-cell--in-progress':
        activityInterval.status === WorkflowTypes.IntervalStatus.IN_PROGRESS,
      'interval-cell--not-started':
        activityInterval.status === WorkflowTypes.IntervalStatus.NOT_STARTED,
      'interval-cell--complete': activityInterval.status === WorkflowTypes.IntervalStatus.COMPLETE,
      'interval-cell--activity-cell': true,
      'interval-cell--stale': isStale
    });
    const store = useStore();
    return (
      <div
        key={activityInterval.startTime}
        data-cy={`${activityInterval.startTime}-${activityInterval.name}`}
        className={cellClass}
        style={{
          gridColumn: `span ${determineCellSize(
            activityInterval.startTime,
            activityInterval.endTime
          )}`
        }}
        onContextMenu={
          !isStale
            ? e => {
                e.preventDefault();
                ContextMenu.show(
                  <Provider store={store}>
                    <IntervalContextMenu
                      interval={activityInterval}
                      isSelectedInterval={isSelected}
                      allActivitiesOpenForSelectedInterval={
                        context.allActivitiesOpenForSelectedInterval
                      }
                      openCallback={context.openConfirmationPrompt}
                      closeCallback={context.closeConfirmationPrompt}
                    />
                  </Provider>,
                  {
                    left: e.clientX,
                    top: e.clientY
                  },
                  undefined,
                  true
                );
              }
            : preventDefaultEvent
        }
        title={determineTextForCell(activityInterval.status, activityInterval.activeAnalysts)}
      >
        <span className="workflow-ellipsis">
          {determineTextForCell(activityInterval.status, activityInterval.activeAnalysts)}
        </span>
      </div>
    );
  }
);
