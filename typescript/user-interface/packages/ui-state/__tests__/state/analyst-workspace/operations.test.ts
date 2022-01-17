import * as Immutable from 'immutable';
import * as Redux from 'redux';
import createMockStore, { MockStore, MockStoreCreator } from 'redux-mock-store';
import thunk from 'redux-thunk';

import { Operations } from '../../../src/ts/state/analyst-workspace/operations';
import * as Types from '../../../src/ts/state/analyst-workspace/types';
import { initialAppState } from '../../../src/ts/state/initial-state';
import { AppState } from '../../../src/ts/state/types';

const middlewares = [thunk];
const mockStoreCreator: MockStoreCreator<AppState, Redux.AnyAction> = createMockStore(middlewares);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let store: MockStore<AppState, any>;

describe('state analyst-workspace operations', () => {
  describe('operations', () => {
    beforeEach(() => {
      store = mockStoreCreator(initialAppState);
    });

    describe('open event', () => {
      it('should set the open event (undefined) starting with initial state', () => {
        const expectedActions = [
          {
            type: Types.ActionTypes.SET_SELECTED_LOCATION_SOLUTION_SET_ID,
            payload: undefined
          },
          {
            type: Types.ActionTypes.SET_SELECTED_LOCATION_SOLUTION_ID,
            payload: undefined
          },
          {
            type: Types.ActionTypes.SET_SELECTED_PREFERRED_LOCATION_SOLUTION_SET_ID,
            payload: undefined
          },
          {
            type: Types.ActionTypes.SET_SELECTED_PREFERRED_LOCATION_SOLUTION_ID,
            payload: undefined
          }
        ];
        store.dispatch(Operations.setOpenEventId(undefined, undefined, undefined));
        const actions = store.getActions();
        expect(actions).toEqual(expectedActions);
      });

      it('should set the open event (undefined)', () => {
        store = mockStoreCreator({
          ...initialAppState,
          analystWorkspaceState: {
            ...initialAppState.analystWorkspaceState,
            selectedSdIds: ['selected-signal-detection-id'],
            openEventId: 'event',
            selectedEventIds: ['selected-event-id'],
            sdIdsToShowFk: ['signal-detection-id'],
            measurementMode: {
              mode: Types.WaveformDisplayMode.MEASUREMENT,
              entries: Immutable.Map<string, boolean>().set('a', true)
            },
            selectedSortType: Types.WaveformSortType.distance
          }
        });
        const expectedActions = [
          { type: Types.ActionTypes.SET_OPEN_EVENT_ID, payload: undefined },
          { type: Types.ActionTypes.SET_SELECTED_EVENT_IDS, payload: [] },
          {
            type: Types.ActionTypes.SET_SELECTED_SORT_TYPE,
            payload: Types.WaveformSortType.stationName
          },
          {
            type: Types.ActionTypes.SET_MEASUREMENT_MODE_ENTRIES,
            payload: Immutable.Map<string, boolean>()
          },
          {
            type: Types.ActionTypes.SET_SELECTED_LOCATION_SOLUTION_SET_ID,
            payload: undefined
          },
          {
            type: Types.ActionTypes.SET_SELECTED_LOCATION_SOLUTION_ID,
            payload: undefined
          },
          {
            type: Types.ActionTypes.SET_SELECTED_PREFERRED_LOCATION_SOLUTION_SET_ID,
            payload: undefined
          },
          {
            type: Types.ActionTypes.SET_SELECTED_PREFERRED_LOCATION_SOLUTION_ID,
            payload: undefined
          },
          { type: Types.ActionTypes.SET_SELECTED_SD_IDS, payload: [] },
          { type: Types.ActionTypes.SET_SD_IDS_TO_SHOW_FK, payload: [] },
          {
            type: Types.ActionTypes.SET_MODE,
            payload: Types.WaveformDisplayMode.DEFAULT
          }
        ];
        store.dispatch(Operations.setOpenEventId(undefined, undefined, undefined));
        const actions = store.getActions();
        expect(actions).toEqual(expectedActions);
      });

      // TODO add test that passes in an valid event object
    });

    describe('measurement mode', () => {
      it('should set the mode to default', () => {
        const mode = Types.WaveformDisplayMode.DEFAULT;
        const expectedActions = [{ type: Types.ActionTypes.SET_MODE, payload: mode }];

        store.dispatch(Operations.setMode(mode));
        const actions = store.getActions();
        expect(actions).toEqual(expectedActions);
      });

      it('should set the mode to measurement', () => {
        const mode = Types.WaveformDisplayMode.MEASUREMENT;
        const expectedActions = [{ type: Types.ActionTypes.SET_MODE, payload: mode }];

        store.dispatch(Operations.setMode(mode));
        const actions = store.getActions();
        expect(actions).toEqual(expectedActions);
      });

      it('should set the measurements entries', () => {
        const entries = Immutable.Map<string, boolean>().set('a', true);
        const expectedActions = [
          {
            type: Types.ActionTypes.SET_MEASUREMENT_MODE_ENTRIES,
            payload: entries
          }
        ];

        store.dispatch(Operations.setMeasurementModeEntries(entries));
        const actions = store.getActions();
        expect(actions).toEqual(expectedActions);
      });
    });

    describe('location', () => {
      it('should set the location solution', () => {
        const locationSolutionSetId = 'location-solution-set-id';
        const locationSolutionId = 'location-solution-id';
        const expectedActions = [
          {
            type: Types.ActionTypes.SET_SELECTED_LOCATION_SOLUTION_SET_ID,
            payload: locationSolutionSetId
          },
          {
            type: Types.ActionTypes.SET_SELECTED_LOCATION_SOLUTION_ID,
            payload: locationSolutionId
          }
        ];
        store.dispatch(
          Operations.setSelectedLocationSolution(locationSolutionSetId, locationSolutionId)
        );
        const actions = store.getActions();
        expect(actions).toEqual(expectedActions);
      });

      it('should set the preferred location solution', () => {
        const preferredLocationSolutionSetId = 'preferred-location-solution-set-id';
        const preferredLocationSolutionId = 'preferred-location-solution-id';
        const expectedActions = [
          {
            type: Types.ActionTypes.SET_SELECTED_PREFERRED_LOCATION_SOLUTION_SET_ID,
            payload: preferredLocationSolutionSetId
          },
          {
            type: Types.ActionTypes.SET_SELECTED_PREFERRED_LOCATION_SOLUTION_ID,
            payload: preferredLocationSolutionId
          }
        ];
        store.dispatch(
          Operations.setSelectedPreferredLocationSolution(
            preferredLocationSolutionSetId,
            preferredLocationSolutionId
          )
        );
        const actions = store.getActions();
        expect(actions).toEqual(expectedActions);
      });
    });
  });
});
