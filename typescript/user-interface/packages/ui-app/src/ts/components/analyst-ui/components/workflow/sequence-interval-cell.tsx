import { ContextMenu } from '@blueprintjs/core';
import { WorkflowTypes } from '@gms/common-model';
import { PercentBar } from '@gms/ui-core-components';
import { AppState } from '@gms/ui-state';
import classNames from 'classnames';
import React from 'react';
import { Provider, useSelector, useStore } from 'react-redux';

import { preventDefaultEvent } from './activity-interval-cell';
import { IntervalContextMenu } from './context-menus';
import { SequenceIntervalCellProps } from './types';
import { WorkflowContext } from './workflow-context';
import { determineCellSize, isStageIntervalPercentBar } from './workflow-util';

/**
 * A sequence interval cell used to render the smaller blocks
 */
export const SequenceIntervalCell: React.FunctionComponent<SequenceIntervalCellProps> = React.memo(
  (props: SequenceIntervalCellProps) => {
    const { stageInterval } = props;
    const workflowState = useSelector(
      (state: AppState) => state.analystWorkspaceState.workflowState
    );
    const context = React.useContext(WorkflowContext);
    const isSelected =
      workflowState.openIntervalName === stageInterval.name &&
      workflowState.timeRange?.startTimeSecs === stageInterval.startTime;
    const isStale = context.staleStartTime > stageInterval.startTime;
    const cellClass = classNames({
      'interval-cell': true,
      'interval-cell--selected': isSelected,
      'interval-cell--not-complete':
        stageInterval.status === WorkflowTypes.IntervalStatus.NOT_COMPLETE,
      'interval-cell--in-progress':
        stageInterval.status === WorkflowTypes.IntervalStatus.IN_PROGRESS,
      'interval-cell--not-started':
        stageInterval.status === WorkflowTypes.IntervalStatus.NOT_STARTED,
      'interval-cell--complete': stageInterval.status === WorkflowTypes.IntervalStatus.COMPLETE,
      'interval-cell--skipped': stageInterval.status === WorkflowTypes.IntervalStatus.SKIPPED,
      'interval-cell--failed': stageInterval.status === WorkflowTypes.IntervalStatus.FAILED,
      'interval-cell--stale': isStale
    });
    const store = useStore();
    return !isStageIntervalPercentBar(stageInterval) ? (
      <div
        key={stageInterval.startTime}
        className={cellClass}
        onContextMenu={
          // We only want automatic stage intervals to show a context menu, other wise a right click should be a noop
          stageInterval.stageMode === WorkflowTypes.StageMode.INTERACTIVE && !isStale
            ? e => {
                e.preventDefault();
                ContextMenu.show(
                  <Provider store={store}>
                    <IntervalContextMenu
                      interval={stageInterval}
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
        style={{
          gridColumn: `span ${determineCellSize(stageInterval.startTime, stageInterval.endTime)}`
        }}
      />
    ) : (
      <div
        className={cellClass}
        style={{
          gridColumn: `span ${determineCellSize(stageInterval.startTime, stageInterval.endTime)}`
        }}
        onContextMenu={preventDefaultEvent}
      >
        <PercentBar percentage={stageInterval.percentAvailable} />
      </div>
    );
  }
);
