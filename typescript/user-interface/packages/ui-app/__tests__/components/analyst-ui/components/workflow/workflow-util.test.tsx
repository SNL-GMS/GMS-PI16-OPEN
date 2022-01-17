/* eslint-disable @typescript-eslint/no-magic-numbers */
import { WorkflowTypes } from '@gms/common-model';
import { createStore } from '@gms/ui-state';
import { WorkflowState } from '@gms/ui-state/lib/state/analyst-workspace/workflow/types';
import Immutable from 'immutable';

import {
  determineCellSize,
  getTimeRangeForIntervals,
  isStageIntervalPercentBar,
  setIntervalStatus,
  useCloseInterval,
  useSetOpenInterval
} from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-util';
import { renderReduxHook } from '../../../../utils/render-hook-util';
import * as WorkflowDataTypes from './workflow-data-types';

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

const fiveMinutesInSeconds = 300;
const oneHourInSeconds = 3600;
const twoHoursInSeconds = 7200;

const dispatch = jest.fn();
const store = createStore();

describe('Workflow Util', () => {
  const workflowState: WorkflowState = {
    analysisMode: undefined,
    openActivityNames: ['1'],
    openIntervalName: 'test',
    stationGroup: undefined,
    timeRange: { startTimeSecs: 1, endTimeSecs: 2 }
  };
  it('determineCellSize is exported', () => {
    expect(determineCellSize).toBeDefined();
  });

  it('determineCellSize chooses the right class', () => {
    const endTime = Date.now();

    const fiveMinuteStartTime = endTime - fiveMinutesInSeconds;
    const fiveClass = determineCellSize(fiveMinuteStartTime, endTime);
    expect(fiveClass).toBe(1);

    const twoHourStartTime = endTime - twoHoursInSeconds;
    const twoHourClass = determineCellSize(twoHourStartTime, endTime);
    expect(twoHourClass).toBe(24);

    const oneHourStartTime = endTime - oneHourInSeconds;
    const oneHourClass = determineCellSize(oneHourStartTime, endTime);
    expect(oneHourClass).toBe(12);
  });

  it('can determine cell percent bar', () => {
    const interactiveStageInterval = isStageIntervalPercentBar(
      WorkflowDataTypes.interactiveAnalysisStageInterval
    );
    expect(interactiveStageInterval).toBeFalsy();

    const automaticStageInterval = isStageIntervalPercentBar(
      WorkflowDataTypes.automaticProcessingStageInterval
    );
    expect(automaticStageInterval).toBeTruthy();
  });

  it('handles setIntervalStatus with activity', async () => {
    const activityMutation = jest.fn();
    const analystStageMutation = jest.fn();
    const results = setIntervalStatus(
      dispatch,
      WorkflowDataTypes.workflow,
      'Joe Blow',
      WorkflowTypes.IntervalStatus.IN_PROGRESS,
      workflowState,
      activityMutation,
      analystStageMutation
    );
    expect(results).toBeDefined();
    expect(results).toMatchSnapshot();
    await results(WorkflowDataTypes.activityInterval);
    expect(activityMutation).toHaveBeenCalled();
    expect(analystStageMutation).toHaveBeenCalledTimes(1);
  });

  it('handles setIntervalStatus with stage', async () => {
    const activityMutation = jest.fn();
    const analystStageMutation = jest.fn();
    const results = setIntervalStatus(
      dispatch,
      WorkflowDataTypes.workflow,
      'Joe Blow',
      WorkflowTypes.IntervalStatus.NOT_COMPLETE,
      workflowState,
      activityMutation,
      analystStageMutation
    );
    expect(results).toBeDefined();
    expect(results).toMatchSnapshot();
    await results(WorkflowDataTypes.interactiveAnalysisStageInterval);
    expect(analystStageMutation).toHaveBeenCalled();
    expect(activityMutation).toHaveBeenCalledTimes(0);
  });

  it('handles useSetOpenInterval Hook', () => {
    const openInterval = renderReduxHook(store, () => useSetOpenInterval());
    expect(openInterval).toMatchSnapshot();
  });

  it('handles useCloseInterval Hook', () => {
    const closeInterval = renderReduxHook(store, () => useCloseInterval());
    expect(closeInterval).toMatchSnapshot();
  });

  it('handles getTimeRangeForIntervals', () => {
    let stageIntervalMap = Immutable.Map<string, WorkflowTypes.StageInterval[]>();

    let timeRange = getTimeRangeForIntervals(stageIntervalMap);

    expect(timeRange).toBeUndefined();

    stageIntervalMap = stageIntervalMap.set(WorkflowDataTypes.interactiveStage.name, [
      WorkflowDataTypes.interactiveAnalysisStageInterval
    ]);

    timeRange = getTimeRangeForIntervals(stageIntervalMap);

    expect(timeRange.startTimeSecs).toEqual(
      WorkflowDataTypes.interactiveAnalysisStageInterval.startTime
    );
    expect(timeRange.endTimeSecs).toEqual(
      WorkflowDataTypes.interactiveAnalysisStageInterval.endTime
    );
  });
});
