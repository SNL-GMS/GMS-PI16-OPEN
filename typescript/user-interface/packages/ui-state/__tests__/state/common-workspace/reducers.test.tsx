import Immutable from 'immutable';
import * as Redux from 'redux';

import { Reducer } from '../../../lib/state/common-workspace/reducers';
import * as Types from '../../../src/ts/state/common-workspace/types';
import { initialCommonWorkspaceState } from '../../../src/ts/state/initial-state';
import { actionCreator, actionCreatorVoid } from '../../../src/ts/state/util/action-helper';

describe('common workspace reducer', () => {
  test('functions are defined', () => {
    expect(Reducer).toBeDefined();
  });
  it('should return the initial state', () => {
    expect(Reducer(undefined, actionCreatorVoid(undefined))).toEqual(initialCommonWorkspaceState);
    expect(Reducer(undefined, actionCreator(undefined))).toEqual(initialCommonWorkspaceState);

    expect(Reducer(undefined, actionCreatorVoid(''))).toEqual(initialCommonWorkspaceState);
    expect(Reducer(undefined, actionCreator(''))).toEqual(initialCommonWorkspaceState);

    expect(Reducer(initialCommonWorkspaceState, actionCreatorVoid(undefined))).toEqual(
      initialCommonWorkspaceState
    );
    expect(Reducer(initialCommonWorkspaceState, actionCreator(undefined))).toEqual(
      initialCommonWorkspaceState
    );

    expect(Reducer(initialCommonWorkspaceState, actionCreatorVoid(''))).toEqual(
      initialCommonWorkspaceState
    );
    expect(Reducer(initialCommonWorkspaceState, actionCreator(''))).toEqual(
      initialCommonWorkspaceState
    );
  });
  it('should set the default station visibility', () => {
    const stationsVisibility = Immutable.Map<string, Types.StationVisibilityObject>();
    const action: Redux.AnyAction = {
      type: Types.ActionTypes.SET_STATIONS_VISIBILITY,
      payload: stationsVisibility
    };
    const expectedState: Types.CommonWorkspaceState = {
      ...initialCommonWorkspaceState,
      stationsVisibility
    };
    expect(Reducer(initialCommonWorkspaceState, action)).toEqual(expectedState);
  });
  it('should set the change station visibility', () => {
    const myFakeStation = {
      station: { name: 'station name' } as any,
      visibility: true
    };
    let stationsVisibility = Immutable.Map<string, Types.StationVisibilityObject>();
    stationsVisibility = stationsVisibility.set('name', myFakeStation);
    const action: Redux.AnyAction = {
      type: Types.ActionTypes.SET_STATIONS_VISIBILITY,
      payload: stationsVisibility
    };
    expect(Reducer(initialCommonWorkspaceState, action).stationsVisibility.get('name')).toEqual(
      myFakeStation
    );
  });
});
