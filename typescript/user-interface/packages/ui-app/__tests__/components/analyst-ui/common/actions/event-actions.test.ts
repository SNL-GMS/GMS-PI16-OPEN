import { CommonTypes, WorkflowTypes } from '@gms/common-model';

import {
  autoOpenEvent,
  openEvent
} from '../../../../../src/ts/components/analyst-ui/common/actions/event-actions';

/* eslint-disable no-console */
window.alert = jest.fn();
window.open = jest.fn();

describe('event actions', () => {
  test('should exist', () => {
    expect(openEvent).toBeDefined();
    expect(autoOpenEvent).toBeDefined();
  });

  test('should set the open event', () => {
    const events: any[] = [
      {
        id: 'id',
        currentEventHypothesis: {
          eventHypothesis: {}
        }
      }
    ];
    const openEventId = 'id';
    const analysisMode = undefined;
    const setOpenEventId = jest.fn(() => true);

    expect(openEvent(events, openEventId, analysisMode, undefined, setOpenEventId)).toEqual(
      undefined
    );
    expect(setOpenEventId).toHaveBeenCalledTimes(1);
    expect(setOpenEventId).toHaveBeenCalledWith(events[0], undefined, undefined);

    //  test it with a processing stage id
    events[0].currentEventHypothesis.processingStage = { id: 'id' };
    expect(
      // eslint-disable-next-line no-void
      openEvent(events, openEventId, analysisMode, undefined, setOpenEventId)
    ).toEqual(undefined);
    expect(setOpenEventId).toHaveBeenCalledTimes(2);
    expect(setOpenEventId).toHaveBeenCalledWith(events[0], undefined, undefined);
  });

  test('should set the open event with auto open event given the correct time range', () => {
    const events: any[] = [
      {
        id: 'id',
        currentEventHypothesis: {
          eventHypothesis: {}
        }
      }
    ];
    const currentTimeInterval: CommonTypes.TimeRange = {
      startTimeSecs: 1,
      endTimeSecs: 2
    };
    const openEventId = null;
    const analysisMode = WorkflowTypes.AnalysisMode.EVENT_REVIEW;
    const setOpenEventId = jest.fn(() => true);
    events[0].currentEventHypothesis.eventHypothesis = {
      preferredLocationSolution: {
        locationSolution: {
          location: {
            time: 1.5
          }
        }
      }
    };
    expect(
      // eslint-disable-next-line no-void
      autoOpenEvent(
        events,
        currentTimeInterval,
        openEventId,
        analysisMode,
        setOpenEventId,
        undefined
      )
    ).toEqual(undefined);
    expect(setOpenEventId).toHaveBeenCalledTimes(1);
    expect(setOpenEventId).toHaveBeenCalledWith(events[0], undefined, undefined);
  });
});
