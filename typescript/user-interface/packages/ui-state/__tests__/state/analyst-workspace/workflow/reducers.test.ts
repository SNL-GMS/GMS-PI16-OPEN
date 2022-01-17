import { WorkflowTypes } from '@gms/common-model';
import { TimeRange } from '@gms/common-model/lib/common/types';
import { StationGroup } from '@gms/common-model/lib/workflow/types';
import * as Redux from 'redux';

import { Reducer } from '../../../../src/ts/state/analyst-workspace/workflow/reducers';
import {
  ActionTypes,
  WorkflowState
} from '../../../../src/ts/state/analyst-workspace/workflow/types';
import { initialWorkflowState } from '../../../../src/ts/state/initial-state';
import { actionCreator, actionCreatorVoid } from '../../../../src/ts/state/util/action-helper';

describe('state analyst-workspace reducers', () => {
  describe('reducer', () => {
    it('should return the initial state', () => {
      expect(Reducer(undefined, actionCreatorVoid(undefined))).toEqual(initialWorkflowState);
      expect(Reducer(undefined, actionCreator(undefined))).toEqual(initialWorkflowState);

      expect(Reducer(undefined, actionCreatorVoid(''))).toEqual(initialWorkflowState);
      expect(Reducer(undefined, actionCreator(''))).toEqual(initialWorkflowState);

      expect(Reducer(initialWorkflowState, actionCreatorVoid(undefined))).toEqual(
        initialWorkflowState
      );
      expect(Reducer(initialWorkflowState, actionCreator(undefined))).toEqual(initialWorkflowState);

      expect(Reducer(initialWorkflowState, actionCreatorVoid(''))).toEqual(initialWorkflowState);
      expect(Reducer(initialWorkflowState, actionCreator(''))).toEqual(initialWorkflowState);
    });

    it('should set the time range', () => {
      const timeRange: TimeRange = {
        startTimeSecs: 1,
        endTimeSecs: 2
      };
      const action: Redux.AnyAction = {
        type: ActionTypes.SET_TIME_RANGE,
        payload: timeRange
      };
      const expectedState: WorkflowState = {
        ...initialWorkflowState,
        timeRange
      };
      expect(Reducer(initialWorkflowState, action)).toEqual(expectedState);
    });

    it('should set the station group', () => {
      const stationGroup: StationGroup = {
        effectiveAt: 1,
        name: 'name',
        description: 'description'
      };
      const action: Redux.AnyAction = {
        type: ActionTypes.SET_STATION_GROUP,
        payload: stationGroup
      };
      const expectedState: WorkflowState = {
        ...initialWorkflowState,
        stationGroup
      };
      expect(Reducer(initialWorkflowState, action)).toEqual(expectedState);
    });

    it('should set the openIntervalName', () => {
      const openIntervalName = '1';
      const action: Redux.AnyAction = {
        type: ActionTypes.SET_OPEN_INTERVAL_NAME,
        payload: openIntervalName
      };
      const expectedState: WorkflowState = {
        ...initialWorkflowState,
        openIntervalName
      };
      expect(Reducer(initialWorkflowState, action)).toEqual(expectedState);
    });

    it('should set the openActivityNames', () => {
      const openActivityNames = ['1'];
      const action: Redux.AnyAction = {
        type: ActionTypes.SET_OPEN_ACTIVITY_NAMES,
        payload: openActivityNames
      };
      const expectedState: WorkflowState = {
        ...initialWorkflowState,
        openActivityNames
      };
      expect(Reducer(initialWorkflowState, action)).toEqual(expectedState);
    });

    it('should set the analysis mode', () => {
      const mode = WorkflowTypes.AnalysisMode.EVENT_REVIEW;
      const action: Redux.AnyAction = {
        type: ActionTypes.SET_ANALYSIS_MODE,
        payload: mode
      };
      const expectedState: WorkflowState = {
        ...initialWorkflowState,
        analysisMode: mode
      };
      expect(Reducer(initialWorkflowState, action)).toEqual(expectedState);
    });
  });
});
