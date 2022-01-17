import { CommonTypes, EventTypes, WorkflowTypes } from '@gms/common-model';
import sortBy from 'lodash/sortBy';
import { MutationFunction } from 'react-apollo';

import {
  getLatestLocationSolutionSet,
  getOpenEvent,
  getPreferredLocationSolutionIdFromEventHypothesis
} from '../utils/event-util';

/**
 * Updates and marks and event as opened.
 *
 * @param events the available events
 * @param openEventId the event id to open
 * @param analysisMode the current analysis mode
 * @param setOpenEventId the function to set the open event id
 * @param updateEvents the function to update the event
 */
export const openEvent = (
  events: EventTypes.Event[],
  openEventId: string,
  analysisMode: WorkflowTypes.AnalysisMode,
  updateEvents: MutationFunction,
  setOpenEventId: (
    event: EventTypes.Event | undefined,
    latestLocationSolutionSet: EventTypes.LocationSolutionSet | undefined,
    preferredLocationSolutionId: string | undefined
  ) => void
): void => {
  const event: EventTypes.Event = getOpenEvent(openEventId, events);
  if (event !== undefined) {
    const processingStageId = event.currentEventHypothesis.processingStage
      ? event.currentEventHypothesis.processingStage.id
      : undefined;
    if (processingStageId) {
      const variables: EventTypes.UpdateEventsMutationArgs = {
        eventIds: [openEventId],
        input: {
          processingStageId,
          status: EventTypes.EventStatus.OpenForRefinement
        }
      };
      if (updateEvents !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        updateEvents({
          variables
          // eslint-disable-next-line no-console
        }).catch(console.warn);
      }
      if (setOpenEventId) {
        setOpenEventId(
          event,
          getLatestLocationSolutionSet(event),
          event.currentEventHypothesis && event.currentEventHypothesis.eventHypothesis
            ? getPreferredLocationSolutionIdFromEventHypothesis(
                event.currentEventHypothesis.eventHypothesis
              )
            : undefined
        );
      }
    } else if (setOpenEventId) {
      setOpenEventId(
        event,
        getLatestLocationSolutionSet(event),
        event.currentEventHypothesis && event.currentEventHypothesis.eventHypothesis
          ? getPreferredLocationSolutionIdFromEventHypothesis(
              event.currentEventHypothesis.eventHypothesis
            )
          : undefined
      );
    }
  }
};

/**
 * Action that auto opens the first non completed event within
 * the provided time interval.
 *
 * @param data the available events
 * @param currentTimeInterval the current time interval
 * @param openEventId the current open event id
 * @param analysisMode the current analysis mode
 * @param setOpenEventId the function to set the open event id
 * @param updateEvents the function to update the event
 */
export const autoOpenEvent = (
  events: EventTypes.Event[],
  currentTimeInterval: CommonTypes.TimeRange,
  openEventId: string,
  analysisMode: WorkflowTypes.AnalysisMode,
  setOpenEventId: (
    event: EventTypes.Event | undefined,
    latestLocationSolutionSet: EventTypes.LocationSolutionSet | undefined,
    preferredLocationSolutionId: string | undefined
  ) => void,
  updateEvents: MutationFunction
): void => {
  if (events && !openEventId && analysisMode === WorkflowTypes.AnalysisMode.EVENT_REVIEW) {
    const sortedEvents = sortBy(
      events,
      e =>
        e.currentEventHypothesis.eventHypothesis.preferredLocationSolution.locationSolution.location
          .time
    );
    const event = sortedEvents.find(e => {
      const {
        time
      } = e.currentEventHypothesis.eventHypothesis.preferredLocationSolution.locationSolution.location;
      return (
        time >= currentTimeInterval.startTimeSecs &&
        time <= currentTimeInterval.endTimeSecs &&
        e.status !== EventTypes.EventStatus.Complete
      );
    });
    if (event && event.id !== openEventId) {
      openEvent(events, event.id, analysisMode, updateEvents, setOpenEventId);
    }
  }
};
