import { WorkflowTypes } from '@gms/common-model';
import { TimeRange } from '@gms/common-model/lib/common/types';
import { StationGroup } from '@gms/common-model/lib/workflow/types';
import * as Redux from 'redux';
import createMockStore, { MockStore, MockStoreCreator } from 'redux-mock-store';
import thunk from 'redux-thunk';

import { Actions } from '../../../../src/ts/state/analyst-workspace/workflow/actions';
import { ActionTypes } from '../../../../src/ts/state/analyst-workspace/workflow/types';
import { initialAppState } from '../../../../src/ts/state/initial-state';
import { AppState } from '../../../../src/ts/state/types';

const middlewares = [thunk];
const mockStoreCreator: MockStoreCreator<AppState, Redux.AnyAction> = createMockStore(middlewares);
let store: MockStore<AppState, Redux.AnyAction>;

describe('state workflow actions', () => {
  beforeEach(() => {
    store = mockStoreCreator(initialAppState);
  });
  it('should set the time range', () => {
    const timeRange: TimeRange = {
      startTimeSecs: 1,
      endTimeSecs: 2
    };
    const expectedAction: Redux.AnyAction = {
      type: ActionTypes.SET_TIME_RANGE,
      payload: timeRange
    };
    expect(Actions.setTimeRange(timeRange)).toEqual(expectedAction);

    store.dispatch(Actions.setTimeRange(timeRange));
    const actions = store.getActions();
    expect(actions).toEqual([expectedAction]);
  });

  it('should set the station group', () => {
    const stationGroup: StationGroup = {
      effectiveAt: 1,
      name: 'name',
      description: 'description'
    };
    const expectedAction: Redux.AnyAction = {
      type: ActionTypes.SET_STATION_GROUP,
      payload: stationGroup
    };
    expect(Actions.setStationGroup(stationGroup)).toEqual(expectedAction);

    store.dispatch(Actions.setStationGroup(stationGroup));
    const actions = store.getActions();
    expect(actions).toEqual([expectedAction]);
  });

  it('should set the openIntervalName', () => {
    const openIntervalName = '1';
    const expectedAction: Redux.AnyAction = {
      type: ActionTypes.SET_OPEN_INTERVAL_NAME,
      payload: openIntervalName
    };
    expect(Actions.setOpenIntervalName(openIntervalName)).toEqual(expectedAction);

    store.dispatch(Actions.setOpenIntervalName(openIntervalName));
    const actions = store.getActions();
    expect(actions).toEqual([expectedAction]);
  });

  it('should set the openActivityNames', () => {
    const openActivityNames = ['1'];
    const expectedAction: Redux.AnyAction = {
      type: ActionTypes.SET_OPEN_ACTIVITY_NAMES,
      payload: openActivityNames
    };
    expect(Actions.setOpenActivityNames(openActivityNames)).toEqual(expectedAction);

    store.dispatch(Actions.setOpenActivityNames(openActivityNames));
    const actions = store.getActions();
    expect(actions).toEqual([expectedAction]);
  });

  it('should set the analysis modes', () => {
    const mode = WorkflowTypes.AnalysisMode.EVENT_REVIEW;
    const expectedAction: Redux.AnyAction = {
      type: ActionTypes.SET_ANALYSIS_MODE,
      payload: mode
    };
    expect(Actions.setAnalysisMode(mode)).toEqual(expectedAction);

    store.dispatch(Actions.setAnalysisMode(mode));
    const actions = store.getActions();
    expect(actions).toEqual([expectedAction]);
  });
});
