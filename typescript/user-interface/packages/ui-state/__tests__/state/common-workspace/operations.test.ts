import { Displays, StationTypes } from '@gms/common-model';
import * as Immutable from 'immutable';
import * as Redux from 'redux';
import createMockStore, { MockStore, MockStoreCreator } from 'redux-mock-store';
import thunk from 'redux-thunk';

import { Operations } from '../../../src/ts/state/common-workspace/operations';
import * as Types from '../../../src/ts/state/common-workspace/types';
import { initialAppState } from '../../../src/ts/state/initial-state';
import { AppState } from '../../../src/ts/state/types';

const middlewares = [thunk];
const mockStoreCreator: MockStoreCreator<AppState, Redux.AnyAction> = createMockStore(middlewares);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let store: MockStore<AppState, any>;

describe('state common-workspace operations', () => {
  describe('operations', () => {
    beforeEach(() => {
      store = mockStoreCreator(initialAppState);
    });
    describe('setGlDisplayState', () => {
      it('should set the display layout to "open" for a display', () => {
        store.dispatch(
          Operations.setGlDisplayState(
            Displays.CommonDisplays.SYSTEM_MESSAGES,
            Types.GLDisplayState.OPEN
          )
        );
        const actions = store.getActions();
        expect(
          actions
            .find(action => action.type === Types.ActionTypes.SET_GL_LAYOUT_STATE)
            .payload.get(Displays.CommonDisplays.SYSTEM_MESSAGES)
        ).toEqual(Types.GLDisplayState.OPEN);
      });
      it('should reset the station visibility when the waveform display is closed', () => {
        let visibilityMap = Immutable.Map<string, Types.StationVisibilityObject>();
        visibilityMap = visibilityMap.set('testStation', {
          station: {
            allRawChannels: [],
            channelGroups: undefined,
            description: 'testStation',
            effectiveAt: 0,
            effectiveUntil: 1000,
            location: undefined,
            name: 'testStation',
            relativePositionsByChannel: undefined,
            type: StationTypes.StationType.SEISMIC_ARRAY
          },
          visibility: true
        });
        store = mockStoreCreator({
          ...initialAppState,
          commonWorkspaceState: {
            ...initialAppState.commonWorkspaceState,
            stationsVisibility: visibilityMap
          }
        });
        store.dispatch(
          Operations.setGlDisplayState(Displays.IanDisplays.WAVEFORM, Types.GLDisplayState.CLOSED)
        );
        const actions = store.getActions();
        expect(
          actions.filter(action => action.type === Types.ActionTypes.SET_STATIONS_VISIBILITY)
        ).toHaveLength(1);
        expect(
          actions
            .find(action => action.type === Types.ActionTypes.SET_STATIONS_VISIBILITY)
            .payload.get('testStation').visibility
        ).toBe(false);
      });
      it('throws when given an invalid display name', () => {
        expect(() =>
          store.dispatch(Operations.setGlDisplayState('GARBAGE', Types.GLDisplayState.CLOSED))
        ).toThrowErrorMatchingSnapshot();
      });
    });
  });
});
