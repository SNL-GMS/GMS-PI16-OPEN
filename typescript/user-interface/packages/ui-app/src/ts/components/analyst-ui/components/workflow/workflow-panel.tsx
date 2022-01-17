/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { WorkflowTypes } from '@gms/common-model';
import {
  isActivityInterval,
  isInteractiveAnalysisStage,
  StageInterval
} from '@gms/common-model/lib/workflow/types';
import {
  MILLISECONDS_IN_DAY,
  MILLISECONDS_IN_SECOND,
  MILLISECONDS_IN_WEEK
} from '@gms/common-util';
import { ModalPrompt } from '@gms/ui-core-components';
import { AppState, WorkflowOperations } from '@gms/ui-state';
import throttle from 'lodash/throttle';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IanMutations } from '~analyst-ui/client-interface';
import { cleanUpWorkflow } from '~analyst-ui/client-interface/axios/utils';
import { messageConfig } from '~analyst-ui/config/message-config';

import { PIXELS_PER_SECOND } from './constants';
import { OpenAnythingInterval, WorkflowPanelProps } from './types';
import { WorkflowContext } from './workflow-context';
import { WorkflowTable } from './workflow-table';
import { WorkflowTimeAxis } from './workflow-time-axis';
import { WorkflowToolbar } from './workflow-toolbar';
import {
  closeStage,
  getTimeRangeForIntervals,
  useCloseInterval,
  useSetOpenInterval
} from './workflow-util';

/**
 * onKeyDown function to determine hot key input and pan position
 * TODO use https://blueprintjs.com/docs/#core/hooks/use-hotkeys when blueprint latest is updated
 *
 * @param event react mouse event
 * @param onPan pan function which will update scroll position
 */
export const panWithHotKey = (
  event: React.KeyboardEvent<HTMLDivElement>,
  onPan: (seconds: number) => void
): void => {
  const timeToPan = event.shiftKey
    ? MILLISECONDS_IN_WEEK / MILLISECONDS_IN_SECOND
    : MILLISECONDS_IN_DAY / MILLISECONDS_IN_SECOND;
  switch (event.key) {
    case 'ArrowRight':
      onPan(timeToPan);
      event.stopPropagation();
      break;
    case 'ArrowLeft':
      onPan(-timeToPan);
      event.stopPropagation();
      break;
    default:
  }
};

/**
 * Component to render the workflow toolbar and workflow table.
 * It uses a workflow query which returns workflow and stage intervals
 */
export const WorkflowPanel: React.FunctionComponent<WorkflowPanelProps> = (
  props: WorkflowPanelProps
) => {
  // Set up a confirmation popup that can be used by all ways to open an interval
  const [isConfirmationPromptVisible, setConfirmationPromptVisible] = useState(false);
  const [isOpenAnything, setIsOpenAnything] = useState(false);
  const [popupInterval, setPopupInterval] = useState(null);

  const workflowState = useSelector((state: AppState) => state.analystWorkspaceState.workflowState);
  const userName = useSelector(
    (state: AppState) => state.userSessionState.authorizationStatus.userName
  );
  const openInterval = useSetOpenInterval();
  const closeInterval = useCloseInterval();
  const stageMutation = IanMutations.UpdateWorkflowAnalystStageMutation.useStageIntervalStatusMutation();

  const {
    workflowQuery,
    workflowIntervalQuery,
    operationalTimePeriodConfigurationQuery,
    timeRange
  } = props;
  const dispatch = useDispatch();

  const workflow = workflowQuery.data;
  const stageIntervals = workflowIntervalQuery.data;

  const table = React.useRef<WorkflowTable>(undefined);
  const timeAxis = React.useRef<WorkflowTimeAxis>(undefined);

  const onPan = throttle((seconds: number): void => {
    const left = table.current.intervalTableWrapper.scrollLeft + seconds * PIXELS_PER_SECOND;
    // This doesn't play well with Enzyme tests to ensuring it is a function before calling it.
    if (typeof table.current.intervalTableWrapper.scroll === 'function') {
      table.current.intervalTableWrapper.scroll({ left });
    }
  });

  const onScroll = throttle((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft } = event.currentTarget;
    timeAxis.current.setScrollLeft(scrollLeft);
    table.current.dayBoundaryIndicator.scrollDayIndicator(scrollLeft);
  });

  const firstStageIntervalList: StageInterval[] = stageIntervals.first();

  const openAnything = (interval: OpenAnythingInterval): void => {
    dispatch(
      WorkflowOperations.setOpenInterval(
        interval.timeRange,
        interval.stationGroup,
        interval.openIntervalName,
        [],
        null
      )
    );
  };

  const onCancelPrompt = (): void => {
    setConfirmationPromptVisible(false);
  };

  const showConfirmationPrompt = async (
    interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
  ): Promise<void> => {
    let stageName = interval.name;
    if (isActivityInterval(interval)) {
      stageName = interval.stageName;
    }

    // If nothing is open, no need to prompt
    if (!workflowState.openIntervalName) {
      return openInterval(interval);
    }

    // If open but opening something in the same timerange and stage interval no need to prompt
    if (
      workflowState.openIntervalName === stageName &&
      workflowState.timeRange?.startTimeSecs === interval.startTime &&
      workflowState.timeRange?.endTimeSecs === interval.endTime
    ) {
      return openInterval(interval);
    }
    setPopupInterval(interval);
    setIsOpenAnything(false);
    setConfirmationPromptVisible(true);
    return null;
  };

  const showOpenAnythingConfirmationPrompt = (interval: OpenAnythingInterval): void => {
    if (workflowState.timeRange?.endTimeSecs || workflowState.timeRange?.startTimeSecs) {
      setPopupInterval(interval);
      setIsOpenAnything(true);
      setConfirmationPromptVisible(true);
      return null;
    }
    return openAnything(interval);
  };

  const onConfirmationPrompt = async (): Promise<void> => {
    if (isOpenAnything) {
      await closeStage(
        userName,
        workflowState.timeRange.startTimeSecs,
        workflowState.openIntervalName,
        stageMutation
      );
      openAnything(popupInterval);
    } else {
      await openInterval(popupInterval);
    }
    setConfirmationPromptVisible(false);
  };

  // Sets the scroll to the far right the first time rendered
  React.useEffect(() => {
    table.current.intervalTableWrapper.scrollLeft = table.current.intervalTableWrapper.scrollWidth;
  }, []);

  const timeRangeForIntervals = getTimeRangeForIntervals(stageIntervals);

  React.useEffect(() => {
    const autoScrollThreshold = 97;
    const removeStaleThreshold = 15;
    const scrollPercentage = Math.round(
      (100 * table.current.intervalTableWrapper.scrollLeft) /
        (table.current.intervalTableWrapper.scrollWidth -
          table.current.intervalTableWrapper.clientWidth)
    );

    // Checks if scrolled all the way to the right, if so pans all the way to the right automatically
    // Panning by 45 days since, that is the most the workflow will show, and most it could potentially receive at one time.
    if (scrollPercentage >= autoScrollThreshold) {
      onPan(
        operationalTimePeriodConfigurationQuery.data.operationalPeriodStartSecs -
          operationalTimePeriodConfigurationQuery.data.operationalPeriodEndSecs
      );
    }

    if (scrollPercentage > removeStaleThreshold) {
      cleanUpWorkflow(
        firstStageIntervalList[firstStageIntervalList.length - 1].startTime,
        operationalTimePeriodConfigurationQuery.data.operationalPeriodStartSecs,
        workflow.stages.map(stage => stage.name),
        timeRange
      );
    }
  }, [
    workflow.stages,
    stageIntervals,
    firstStageIntervalList,
    operationalTimePeriodConfigurationQuery.data.operationalPeriodStartSecs,
    operationalTimePeriodConfigurationQuery.data.operationalPeriodEndSecs,
    timeRange,
    onPan
  ]);
  const openStage = workflow.stages.find(stage => stage.name === workflowState.openIntervalName);
  let allActivitiesOpenForSelectedInterval = false;
  if (isInteractiveAnalysisStage(openStage)) {
    allActivitiesOpenForSelectedInterval =
      openStage.activities.length === workflowState.openActivityNames.length;
  }
  return (
    <WorkflowContext.Provider
      value={{
        staleStartTime:
          firstStageIntervalList[firstStageIntervalList.length - 1].startTime -
          operationalTimePeriodConfigurationQuery.data.operationalPeriodStartSecs,
        allActivitiesOpenForSelectedInterval,
        closeConfirmationPrompt: async (
          interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
        ) => closeInterval(interval),
        openConfirmationPrompt: async (
          interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
        ) => showConfirmationPrompt(interval),
        openAnythingConfirmationPrompt: (interval: OpenAnythingInterval) =>
          showOpenAnythingConfirmationPrompt(interval)
      }}
    >
      <div
        className="workflow-panel"
        onKeyDown={e => {
          panWithHotKey(e, onPan);
        }}
        onMouseEnter={e => {
          e.currentTarget.focus();
        }}
        onMouseLeave={e => {
          e.currentTarget.blur();
        }}
        tabIndex={0}
      >
        <WorkflowToolbar onPan={onPan} />
        <WorkflowTable
          ref={ref => {
            table.current = ref;
          }}
          timeRange={timeRangeForIntervals}
          workflow={workflow}
          stageIntervals={stageIntervals}
          onScroll={onScroll}
        />
        <WorkflowTimeAxis
          timeRange={timeRangeForIntervals}
          ref={ref => {
            timeAxis.current = ref;
          }}
        />
        <ModalPrompt
          actionText={messageConfig.tooltipMessages.workflowConfirmation.discardText}
          actionCallback={onConfirmationPrompt}
          optionalCallback={onCancelPrompt}
          cancelText={messageConfig.tooltipMessages.workflowConfirmation.cancelText}
          cancelButtonCallback={onCancelPrompt}
          onCloseCallback={onCancelPrompt}
          isOpen={isConfirmationPromptVisible}
          title={messageConfig.tooltipMessages.workflowConfirmation.title}
          actionTooltipText={messageConfig.tooltipMessages.workflowConfirmation.discardTooltip}
          cancelTooltipText={messageConfig.tooltipMessages.workflowConfirmation.cancelTooltip}
        >
          <div className="interval-confirmation-contents">
            <div className="interval-confirmation-text">
              <div className="interval-confirmation-header">
                {messageConfig.tooltipMessages.workflowConfirmation.header}
              </div>
              <div className="interval-confirmation-paragraph">
                {messageConfig.tooltipMessages.workflowConfirmation.text}
              </div>
            </div>
            <Icon icon={IconNames.ERROR} className="interval-confirmation-icon" iconSize={48} />
          </div>
        </ModalPrompt>
      </div>
    </WorkflowContext.Provider>
  );
};
