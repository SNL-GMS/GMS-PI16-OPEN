/* eslint-disable @typescript-eslint/no-use-before-define */
/**
 * Renders events onto the map
 */

import { CommonTypes, EventTypes } from '@gms/common-model';
import {
  DATE_TIME_FORMAT_WITH_SECOND_PRECISION,
  secondsToString,
  TIME_FORMAT_WITH_SECOND_PRECISION
} from '@gms/common-util';
import differenceBy from 'lodash/differenceBy';
import intersectionBy from 'lodash/intersectionBy';

import { userPreferences } from '~analyst-ui/config';
import { gmsColors, semanticColors } from '~scss-config/color-preferences';

import { MapProps } from '../types';

// eslint-disable-next-line import/no-dynamic-require, import/no-extraneous-dependencies, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const eventPng = require(`../img/${userPreferences.map.icons.event}`);
const imageScale = userPreferences.map.icons.eventScale;

declare let Cesium;

/** How much to scale the display of events by */
const { scaleFactor } = userPreferences.map.icons;
/** How far away the camera should be to render the label */
const { displayDistance } = userPreferences.map.icons;
/** Label's offset from the event */
const { pixelOffset } = userPreferences.map.icons;

/**
 * Draws events on map
 *
 * @param dataSource Data to add drawn events to
 * @param currentProps Previous props for the map
 * @param nextProps Incoming props for the map
 */
export function draw(dataSource: any, currentProps: MapProps, nextProps: MapProps): void {
  const nextEvents: EventTypes.Event[] =
    nextProps.eventsInTimeRangeQuery && nextProps.eventsInTimeRangeQuery.eventsInTimeRange
      ? nextProps.eventsInTimeRangeQuery.eventsInTimeRange
      : [];
  const currentEvents =
    currentProps.eventsInTimeRangeQuery && currentProps.eventsInTimeRangeQuery.eventsInTimeRange
      ? currentProps.eventsInTimeRangeQuery.eventsInTimeRange
      : [];
  const { currentTimeInterval } = nextProps;
  const nextOpenEventId = nextProps.openEventId;
  const { selectedEventIds } = nextProps;
  const prevSelectedEventIds = currentProps.selectedEventIds;

  const newEvents = differenceBy<EventTypes.Event, EventTypes.Event>(
    nextEvents,
    currentEvents,
    'id'
  );
  addEvents(dataSource, newEvents, currentTimeInterval, nextOpenEventId, selectedEventIds);

  const modifiedEvents = intersectionBy<EventTypes.Event, EventTypes.Event>(
    nextEvents,
    currentEvents,
    'id'
  );
  updateEvents(dataSource, modifiedEvents, currentTimeInterval, nextOpenEventId, selectedEventIds);

  const selectedEvents = intersectionBy<EventTypes.Event, EventTypes.Event>(
    nextEvents,
    currentEvents,
    'id'
  ).filter(
    selectionEvent =>
      selectedEventIds.find(eid => eid === selectionEvent.id) ||
      prevSelectedEventIds.find(eid => eid === selectionEvent.id)
  );
  updateEvents(dataSource, selectedEvents, currentTimeInterval, nextOpenEventId, selectedEventIds);

  const removedEvents = differenceBy<EventTypes.Event, EventTypes.Event>(
    currentEvents,
    nextEvents,
    'id'
  );
  removeEvents(dataSource, removedEvents);
}

/**
 * Highlight Open Event when event is opened on the map or list
 *
 * @param dataSource event datasource
 * @param currentTimeInterval current time interval opened by the analyst
 * @param currentOpenEvent open event that has been open
 * @param nextOpenEvent event being opened
 * @param selectedEventIds other selected event ids
 */
export function highlightOpenEvent(
  dataSource: any,
  currentTimeInterval: CommonTypes.TimeRange,
  currentOpenEvent: EventTypes.Event,
  nextOpenEvent: EventTypes.Event,
  selectedEventIds: string[]
): void {
  // attempt to re-color the currently selected event entity to its default state.
  if (currentOpenEvent) {
    const currentEventEntity = dataSource.entities.getById(currentOpenEvent.id);
    // If a next open event exists pass in the ID of that event,
    // in the case of selecting 'mark complete' on the current
    // open event nextopenevent is null/undefined.
    if (nextOpenEvent) {
      currentEventEntity.billboard.color = computeColorForEvent(
        currentOpenEvent,
        currentTimeInterval,
        nextOpenEvent.id,
        selectedEventIds
      );
    } else {
      currentEventEntity.billboard.color = computeColorForEvent(
        currentOpenEvent,
        currentTimeInterval,
        undefined,
        selectedEventIds
      );
    }
  }
  if (nextOpenEvent) {
    const nextEventEntity = dataSource.entities.getById(nextOpenEvent.id);
    nextEventEntity.billboard.color = computeColorForEvent(
      nextOpenEvent,
      currentTimeInterval,
      nextOpenEvent.id,
      selectedEventIds
    );
  }
}

/**
 * create new map entities for a list of events
 *
 * @param dataSource - source of event data
 * @param events - list of map events
 * @param currentTimeInterval - currently open time interval
 * @param nextOpenEventId - incoming open event id
 * @param selectedEventIds - list of selected event ids
 */
function addEvents(
  dataSource: any,
  events: EventTypes.Event[],
  currentTimeInterval: CommonTypes.TimeRange,
  nextOpenEventId: string,
  selectedEventIds: string[]
): void {
  // Walk thru the event list and add each event entity to the dataSource
  events.forEach(event => {
    dataSource.entities.add(
      createEventEntity(event, currentTimeInterval, nextOpenEventId, selectedEventIds)
    );
  });
}

/**
 * Update the map entities for a list of events
 *
 * @param dataSource - source of event data
 * @param events - list of map events
 * @param currentTimeInterval - currently open TimeInterval
 * @param nextOpenEventId - incoming id of open event
 * @param selectedEventIds - list of selected event ids
 */
function updateEvents(
  dataSource: any,
  events: EventTypes.Event[],
  currentTimeInterval: CommonTypes.TimeRange,
  nextOpenEventId: string,
  selectedEventIds: string[]
): void {
  events.forEach(event => {
    const eventEntity = dataSource.entities.getById(event.id);
    // Update location and description values if this is the selected event
    if (event.id === nextOpenEventId) {
      // Create a replacement event entity in case the event location has changed
      const newEventEntity = createEventEntity(
        event,
        currentTimeInterval,
        nextOpenEventId,
        selectedEventIds
      );
      eventEntity.position = newEventEntity.position;
      eventEntity.description = newEventEntity.description;
      eventEntity.label = newEventEntity.label;
    } else {
      // Not the selected event so update association colores
      const isSelected = selectedEventIds.find(eid => eid === event.id);
      eventEntity.billboard.color = computeColorForEvent(
        event,
        currentTimeInterval,
        nextOpenEventId,
        selectedEventIds
      );
      eventEntity.billboard.scale = isSelected ? imageScale * scaleFactor : imageScale;
    }
  });
}

/**
 * Creates the Event entity for the map. Used by addEvent and updateEvent if event is currentOpenEvet
 *
 * @param the reference event
 * @param currentTimeInterval selected
 * @param openEventId current open event id
 * @param selectedEventIds event list
 * @returns Event Entity (map entity entry) for rendering event on map
 */
function createEventEntity(
  event: EventTypes.Event,
  currentTimeInterval: CommonTypes.TimeRange,
  openEventId: string,
  selectedEventIds: string[]
): any {
  const { eventHypothesis } = event.currentEventHypothesis;
  const eventLon =
    eventHypothesis.preferredLocationSolution.locationSolution.location.longitudeDegrees;
  const eventLat =
    eventHypothesis.preferredLocationSolution.locationSolution.location.latitudeDegrees;
  const eventElev = eventHypothesis.preferredLocationSolution.locationSolution.location.depthKm;

  const eventTime = eventHypothesis.preferredLocationSolution.locationSolution.location.time;
  const eventTimeFormatted = secondsToString(eventTime, TIME_FORMAT_WITH_SECOND_PRECISION);
  const eventDateTimeFormatted = secondsToString(eventTime, DATE_TIME_FORMAT_WITH_SECOND_PRECISION);

  const eventDescription = `<ul>
      <li>ID: ${event.id}</li>
      <li>Time: ${eventDateTimeFormatted}</li>
      <li>Latitude: ${eventLat.toFixed(3)}</li>
      <li>Lognitude: ${eventLon.toFixed(3)}</li>
      <li>Elevation: ${eventElev.toFixed(3)}</li></ul>`;
  return {
    name: `Event: ${event.id}`,
    position: Cesium.Cartesian3.fromDegrees(eventLon, eventLat),
    id: event.id,
    billboard: {
      image: eventPng,
      color: computeColorForEvent(event, currentTimeInterval, openEventId, selectedEventIds),
      scale: imageScale
    },
    label: {
      text: eventTimeFormatted,
      font: '12px sans-serif',
      outlineColor: Cesium.Color.BLACK,
      pixelOffset: new Cesium.Cartesian2(0, pixelOffset),
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, displayDistance)
    },
    description: eventDescription,
    entityType: 'event'
  };
}

/**
 * Remove events from datasource
 *
 * @param dataSource event datasource
 * @param eventHypotheses events to be removed
 */
function removeEvents(dataSource: any, events: EventTypes.Event[]): void {
  events.forEach(event => {
    dataSource.entities.removeById(event.id);
  });
}

/**
 * Compute the proper png to use for an event star
 *
 * @param event event to draw
 * @param currentTimeInterval currently open time interval
 * @param openEventId string event id
 * @param selectedEventIds  list of selected events
 */
function computeColorForEvent(
  event: EventTypes.Event,
  currentTimeInterval: CommonTypes.TimeRange,
  openEventId: string,
  selectedEventIds: string[]
) {
  const eventTime =
    event.currentEventHypothesis.eventHypothesis.preferredLocationSolution.locationSolution.location
      .time;
  const isInTimeRange =
    eventTime > currentTimeInterval.startTimeSecs && eventTime < currentTimeInterval.endTimeSecs;

  // eslint-disable-next-line no-nested-ternary
  return isInTimeRange
    ? // eslint-disable-next-line no-nested-ternary
      event.status === 'Complete'
      ? Cesium.Color.fromCssColorString(semanticColors.analystComplete)
      : // eslint-disable-next-line no-nested-ternary
      event.id === openEventId
      ? Cesium.Color.fromCssColorString(semanticColors.analystOpenEvent)
      : selectedEventIds.find(eid => eid === event.id)
      ? Cesium.Color.fromCssColorString(semanticColors.analystOpenEvent)
      : Cesium.Color.fromCssColorString(semanticColors.analystToWork)
    : Cesium.Color.fromCssColorString(gmsColors.gmsProminent);
}
