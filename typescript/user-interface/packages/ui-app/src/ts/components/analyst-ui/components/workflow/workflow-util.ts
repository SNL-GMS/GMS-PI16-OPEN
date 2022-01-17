import { CommonTypes, WorkflowTypes } from '@gms/common-model';
import { isInteractiveAnalysisStage } from '@gms/common-model/lib/workflow/types';
import { epochSecondsNow } from '@gms/common-util';
import { AppState, WorkflowOperations } from '@gms/ui-state';
import { WorkflowState } from '@gms/ui-state/lib/state/analyst-workspace/workflow/types';
import Immutable from 'immutable';
import { Dispatch } from 'react';
import { MutateFunction } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import { IanMutations, IanQueryAndMutationTypes } from '~analyst-ui/client-interface';
import { workflowQueryConfig } from '~analyst-ui/client-interface/axios/queries/workflow-query';
import { queryCache } from '~components/client-interface';

/**
 * Determines if a `stage interval` should be rendered as a percent bar.
 *
 * Auto Network is only automatic stage mode where the cells should not be percent bars
 * Auto Network time chunks are 5min so if stage mode is automatic and duration is more than
 * 5min it's not a Auto Network cell and should be shown as a percent bar
 *
 * @param interval stage interval
 * @returns boolean
 */
export const isStageIntervalPercentBar = (interval: WorkflowTypes.StageInterval): boolean => {
  const fiveMinInSeconds = 300;
  return (
    interval.endTime - interval.startTime > fiveMinInSeconds &&
    interval.stageMode === WorkflowTypes.StageMode.AUTOMATIC
  );
};

/**
 * Closes a stage
 *
 * @param userName current username
 * @param startTimeSecs open time range start time secs
 * @param openIntervalName open interval name
 * @param analystStageMutation mutation to close the stage
 */
export const closeStage = async (
  userName: string,
  startTimeSecs: number,
  openIntervalName: string,
  analystStageMutation: MutateFunction<
    void,
    unknown,
    IanQueryAndMutationTypes.UpdateInteractiveAnalysisStageIntervalStatusRequest,
    unknown
  >
): Promise<void> => {
  const args: IanQueryAndMutationTypes.UpdateInteractiveAnalysisStageIntervalStatusRequest = {
    stageIntervalId: {
      startTime: startTimeSecs,
      definitionId: {
        name: openIntervalName
      }
    },
    status: WorkflowTypes.IntervalStatus.NOT_COMPLETE,
    userName,
    time: epochSecondsNow()
  };
  await analystStageMutation(args);
};

/**
 * Determine css grid span amount by determining how scale the duration is based on
 * dividing by 5 since 5min is the smallest duration we can get
 *
 * @param startTime startTime in seconds
 * @param endTime endTime in seconds
 * @returns class name as a string to determine size
 */
export const determineCellSize = (startTime: number, endTime: number): number => {
  const sixty = 60;
  return Math.round((endTime - startTime) / sixty / 5);
};

export const setIntervalStatus = (
  dispatch: Dispatch<unknown>,
  workflow: WorkflowTypes.Workflow,
  userName: string,
  status: WorkflowTypes.IntervalStatus,
  workflowState: WorkflowState,
  activityMutation: MutateFunction<
    void,
    unknown,
    IanQueryAndMutationTypes.UpdateActivityIntervalStatusRequest,
    unknown
  >,
  analystStageMutation: MutateFunction<
    void,
    unknown,
    IanQueryAndMutationTypes.UpdateInteractiveAnalysisStageIntervalStatusRequest,
    unknown
  >
  // eslint-disable-next-line complexity
) => async (
  interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
): Promise<void> => {
  let interactiveAnalysisStage: WorkflowTypes.InteractiveAnalysisStage;
  let activities: WorkflowTypes.Activity[];
  let stageName = '';
  let isActivityInOpenStageInterval = true;

  if (WorkflowTypes.isActivityInterval(interval)) {
    stageName = interval.stageName;
  } else if (WorkflowTypes.isStageInterval(interval)) {
    stageName = interval.name;
  }

  // Close the open stage and/or activities since user is discarding changes and opening another interval
  if (
    status === WorkflowTypes.IntervalStatus.IN_PROGRESS &&
    workflowState.openIntervalName &&
    (workflowState.openIntervalName !== stageName ||
      interval.startTime !== workflowState.timeRange.startTimeSecs)
  ) {
    isActivityInOpenStageInterval = false;
    await closeStage(
      userName,
      workflowState.timeRange.startTimeSecs,
      workflowState.openIntervalName,
      analystStageMutation
    );
  }

  const foundStage: WorkflowTypes.Stage = workflow.stages.find(stage => stage.name === stageName);

  if (isInteractiveAnalysisStage(foundStage)) {
    interactiveAnalysisStage = foundStage;
  }

  if (WorkflowTypes.isStageInterval(interval)) {
    const args: IanQueryAndMutationTypes.UpdateInteractiveAnalysisStageIntervalStatusRequest = {
      stageIntervalId: {
        startTime: interval.startTime,
        definitionId: {
          name: interval.name
        }
      },
      status,
      userName,
      time: epochSecondsNow() // what should this time be?
    };
    await analystStageMutation(args);
    activities = interactiveAnalysisStage.activities;
  }

  if (WorkflowTypes.isActivityInterval(interval)) {
    const args: IanQueryAndMutationTypes.UpdateActivityIntervalStatusRequest = {
      activityIntervalId: {
        startTime: interval.startTime,
        definitionId: {
          name: interval.name
        }
      },
      stageIntervalId: {
        startTime: interval.startTime,
        definitionId: {
          name: interval.stageName
        }
      },
      status,
      userName,
      time: epochSecondsNow() // what should this time be?
    };
    await activityMutation(args);
    activities = [interactiveAnalysisStage.activities.find(act => act.name === interval.name)];
  }

  // Get the station group from the Workflow Stage
  // As guidance the first activity is the open that is supposed to be used
  const { stationGroup, analysisMode } = activities[0];
  // With a success mutation dispatch to Redux
  switch (status) {
    case WorkflowTypes.IntervalStatus.IN_PROGRESS:
      dispatch(
        WorkflowOperations.setOpenInterval(
          {
            startTimeSecs: interval.startTime,
            endTimeSecs: interval.endTime
          },
          stationGroup,
          interactiveAnalysisStage.name,
          isActivityInOpenStageInterval
            ? [...activities.map(activity => activity.name), ...workflowState.openActivityNames]
            : activities.map(activity => activity.name),
          analysisMode
        )
      );
      break;
    case WorkflowTypes.IntervalStatus.NOT_COMPLETE:
      dispatch(
        WorkflowOperations.setClosedInterval(
          activities[0].name,
          WorkflowTypes.isStageInterval(interval)
        )
      );
      break;
    // TODO add cases as they become available
    default:
  }
};

export const useSetOpenInterval = (): ((
  interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
) => Promise<void>) => {
  const dispatch = useDispatch();
  const workflow = queryCache.getQueryData<WorkflowTypes.Workflow>(workflowQueryConfig.queryKey);
  const userName = useSelector(
    (state: AppState) => state.userSessionState.authorizationStatus.userName
  );
  const workflowState = useSelector((state: AppState) => state.analystWorkspaceState.workflowState);
  const activityMutation = IanMutations.UpdateWorkflowActivityMutation.useActivityIntervalStatusMutation();
  const analystStageMutation = IanMutations.UpdateWorkflowAnalystStageMutation.useStageIntervalStatusMutation();
  return setIntervalStatus(
    dispatch,
    workflow,
    userName,
    WorkflowTypes.IntervalStatus.IN_PROGRESS,
    workflowState,
    activityMutation,
    analystStageMutation
  );
};

/**
 * Closes an interval and updates the redux state to reflect a state with no open interval
 */
export const useCloseInterval = (): ((
  interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval
) => Promise<void>) => {
  const dispatch = useDispatch();
  const workflow = queryCache.getQueryData<WorkflowTypes.Workflow>(workflowQueryConfig.queryKey);
  const userName = useSelector(
    (state: AppState) => state.userSessionState.authorizationStatus.userName
  );
  const workflowState = useSelector((state: AppState) => state.analystWorkspaceState.workflowState);
  const activityMutation = IanMutations.UpdateWorkflowActivityMutation.useActivityIntervalStatusMutation();
  const analystStageMutation = IanMutations.UpdateWorkflowAnalystStageMutation.useStageIntervalStatusMutation();
  return setIntervalStatus(
    dispatch,
    workflow,
    userName,
    WorkflowTypes.IntervalStatus.NOT_COMPLETE,
    workflowState,
    activityMutation,
    analystStageMutation
  );
};

/**
 * Retrieves the TimeRange for the provided intervals; i.e. the earliest start time and the latest end time.
 *
 * @param stageIntervals the stage intervals
 * @returns the time range for the intervals
 */
export const getTimeRangeForIntervals = (
  stageIntervals: Immutable.Map<string, WorkflowTypes.StageInterval[]>
): CommonTypes.TimeRange => {
  const timeRange: CommonTypes.TimeRange = {
    startTimeSecs: Infinity,
    endTimeSecs: -Infinity
  };

  stageIntervals.forEach(s =>
    s.forEach(interval => {
      timeRange.startTimeSecs =
        interval.startTime <= timeRange.startTimeSecs
          ? interval.startTime
          : timeRange.startTimeSecs;

      timeRange.endTimeSecs =
        interval.endTime >= timeRange.endTimeSecs ? interval.endTime : timeRange.endTimeSecs;
    })
  );
  if (timeRange.startTimeSecs === Infinity || timeRange.endTimeSecs === -Infinity) {
    return undefined;
  }
  return timeRange;
};
