import { WorkflowTypes } from '@gms/common-model';
import { TimeRange } from '@gms/common-model/lib/common/types';
import { AnalysisMode, StationGroup } from '@gms/common-model/lib/workflow/types';
import Immutable from 'immutable';
import clone from 'lodash/clone';
import * as Redux from 'redux';
import createMockStore, { MockStore, MockStoreCreator } from 'redux-mock-store';
import thunk from 'redux-thunk';

import { ActionTypes as AnalystWorkspaceActionTypes } from '../../../../src/ts/state/analyst-workspace/types';
import { Operations } from '../../../../src/ts/state/analyst-workspace/workflow/operations';
import { ActionTypes } from '../../../../src/ts/state/analyst-workspace/workflow/types';
import { initialAppState } from '../../../../src/ts/state/initial-state';
import { AppState } from '../../../../src/ts/state/types';

const middlewares = [thunk];
const mockStoreCreator: MockStoreCreator<AppState, Redux.AnyAction> = createMockStore(middlewares);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let store: MockStore<AppState, any>;

describe('workflow operations', () => {
  it('should open an interval', () => {
    store = mockStoreCreator(initialAppState);

    const timeRange: TimeRange = {
      startTimeSecs: 1,
      endTimeSecs: 2
    };

    const stationGroup: StationGroup = {
      effectiveAt: 1,
      name: 'name',
      description: 'description'
    };

    const openIntervalName = '1';
    const openActivityNames = ['2'];
    const analysisMode = WorkflowTypes.AnalysisMode.SCAN;

    const expectedActions = [
      { type: ActionTypes.SET_TIME_RANGE, payload: timeRange },
      { type: ActionTypes.SET_STATION_GROUP, payload: stationGroup },
      { type: ActionTypes.SET_OPEN_INTERVAL_NAME, payload: openIntervalName },
      { type: ActionTypes.SET_OPEN_ACTIVITY_NAMES, payload: openActivityNames },
      { type: ActionTypes.SET_ANALYSIS_MODE, payload: WorkflowTypes.AnalysisMode.SCAN },
      { type: AnalystWorkspaceActionTypes.SET_SELECTED_SD_IDS, payload: [] },
      { type: AnalystWorkspaceActionTypes.SET_OPEN_EVENT_ID, payload: undefined },
      { type: AnalystWorkspaceActionTypes.SET_SELECTED_EVENT_IDS, payload: [] },
      { type: AnalystWorkspaceActionTypes.SET_SD_IDS_TO_SHOW_FK, payload: [] },
      { type: AnalystWorkspaceActionTypes.SET_MEASUREMENT_MODE_ENTRIES, payload: Immutable.Map() },
      { type: AnalystWorkspaceActionTypes.SET_SELECTED_SORT_TYPE, payload: 'Station Name' }
    ];

    store.dispatch(
      Operations.setOpenInterval(
        timeRange,
        stationGroup,
        openIntervalName,
        openActivityNames,
        analysisMode
      )
    );
    expect(store.getActions()).toEqual(expectedActions);
  });

  it('should open an interval with no change', () => {
    const updatedInitialState = clone(initialAppState);

    const timeRange: TimeRange = {
      startTimeSecs: 1,
      endTimeSecs: 2
    };

    const stationGroup: StationGroup = {
      effectiveAt: 1,
      name: 'name',
      description: 'description'
    };

    const openIntervalName = '1';
    const openActivityNames = ['2'];

    const analysisMode = WorkflowTypes.AnalysisMode.SCAN;

    updatedInitialState.analystWorkspaceState.workflowState = {
      timeRange,
      openIntervalName,
      openActivityNames,
      stationGroup,
      analysisMode: AnalysisMode.SCAN
    };
    store = mockStoreCreator(updatedInitialState);

    const expectedActions = [
      { type: ActionTypes.SET_TIME_RANGE, payload: timeRange },
      { type: ActionTypes.SET_STATION_GROUP, payload: stationGroup },
      { type: ActionTypes.SET_OPEN_INTERVAL_NAME, payload: openIntervalName },
      { type: ActionTypes.SET_OPEN_ACTIVITY_NAMES, payload: openActivityNames },
      { type: ActionTypes.SET_ANALYSIS_MODE, payload: WorkflowTypes.AnalysisMode.SCAN }
    ];

    store.dispatch(
      Operations.setOpenInterval(
        timeRange,
        stationGroup,
        openIntervalName,
        openActivityNames,
        analysisMode
      )
    );
    expect(store.getActions()).toEqual(expectedActions);
  });

  it('should close an interval activity', () => {
    const timeRange: TimeRange = {
      startTimeSecs: 1,
      endTimeSecs: 2
    };

    const stationGroup: StationGroup = {
      effectiveAt: 1,
      name: 'name',
      description: 'description'
    };
    const openIntervalName = '1';
    const openActivityNames = ['2'];

    const analysisMode = WorkflowTypes.AnalysisMode.SCAN;

    store = mockStoreCreator({
      ...initialAppState,
      analystWorkspaceState: {
        ...initialAppState.analystWorkspaceState,
        workflowState: {
          timeRange,
          stationGroup,
          openIntervalName,
          openActivityNames,
          analysisMode
        }
      }
    });

    const expectedActions = [
      { type: ActionTypes.SET_TIME_RANGE, payload: undefined },
      { type: ActionTypes.SET_STATION_GROUP, payload: undefined },
      { type: ActionTypes.SET_OPEN_INTERVAL_NAME, payload: undefined },
      { type: ActionTypes.SET_OPEN_ACTIVITY_NAMES, payload: [] },
      { type: ActionTypes.SET_ANALYSIS_MODE, payload: undefined },
      { type: AnalystWorkspaceActionTypes.SET_SELECTED_SD_IDS, payload: [] },
      { type: AnalystWorkspaceActionTypes.SET_OPEN_EVENT_ID, payload: undefined },
      { type: AnalystWorkspaceActionTypes.SET_SELECTED_EVENT_IDS, payload: [] },
      { type: AnalystWorkspaceActionTypes.SET_SD_IDS_TO_SHOW_FK, payload: [] },
      { type: AnalystWorkspaceActionTypes.SET_MEASUREMENT_MODE_ENTRIES, payload: Immutable.Map() },
      { type: AnalystWorkspaceActionTypes.SET_SELECTED_SORT_TYPE, payload: 'Station Name' }
    ];

    store.dispatch(Operations.setClosedInterval(openActivityNames[0], false));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('should close an stage interval', () => {
    const timeRange: TimeRange = {
      startTimeSecs: 1,
      endTimeSecs: 2
    };

    const stationGroup: StationGroup = {
      effectiveAt: 1,
      name: 'name',
      description: 'description'
    };
    const openIntervalName = '1';
    const openActivityNames = ['2', '3'];

    const analysisMode = WorkflowTypes.AnalysisMode.SCAN;

    store = mockStoreCreator({
      ...initialAppState,
      analystWorkspaceState: {
        ...initialAppState.analystWorkspaceState,
        workflowState: {
          timeRange,
          stationGroup,
          openIntervalName,
          openActivityNames,
          analysisMode
        }
      }
    });

    const expectedActions = [
      { type: ActionTypes.SET_TIME_RANGE, payload: undefined },
      { type: ActionTypes.SET_STATION_GROUP, payload: undefined },
      { type: ActionTypes.SET_OPEN_INTERVAL_NAME, payload: undefined },
      { type: ActionTypes.SET_OPEN_ACTIVITY_NAMES, payload: [] },
      { type: ActionTypes.SET_ANALYSIS_MODE, payload: undefined },
      { type: AnalystWorkspaceActionTypes.SET_SELECTED_SD_IDS, payload: [] },
      { type: AnalystWorkspaceActionTypes.SET_OPEN_EVENT_ID, payload: undefined },
      { type: AnalystWorkspaceActionTypes.SET_SELECTED_EVENT_IDS, payload: [] },
      { type: AnalystWorkspaceActionTypes.SET_SD_IDS_TO_SHOW_FK, payload: [] },
      { type: AnalystWorkspaceActionTypes.SET_MEASUREMENT_MODE_ENTRIES, payload: Immutable.Map() },
      { type: AnalystWorkspaceActionTypes.SET_SELECTED_SORT_TYPE, payload: 'Station Name' }
    ];

    store.dispatch(Operations.setClosedInterval(openActivityNames[0], true));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('should close an activity and remove selected', () => {
    const timeRange: TimeRange = {
      startTimeSecs: 1,
      endTimeSecs: 2
    };

    const stationGroup: StationGroup = {
      effectiveAt: 1,
      name: 'name',
      description: 'description'
    };
    const openIntervalName = '1';
    const openActivityNames = ['2', '3'];

    const analysisMode = WorkflowTypes.AnalysisMode.SCAN;

    store = mockStoreCreator({
      ...initialAppState,
      analystWorkspaceState: {
        ...initialAppState.analystWorkspaceState,
        workflowState: {
          timeRange,
          stationGroup,
          openIntervalName,
          openActivityNames,
          analysisMode
        }
      }
    });

    const expectedActions = [{ type: ActionTypes.SET_OPEN_ACTIVITY_NAMES, payload: ['3'] }];

    store.dispatch(Operations.setClosedInterval(openActivityNames[0], false));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });
});
