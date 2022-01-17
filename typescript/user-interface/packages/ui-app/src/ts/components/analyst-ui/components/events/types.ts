import { GQLTypes } from '@gms/common-graphql';
import { CommonTypes, EventTypes, WorkflowTypes } from '@gms/common-model';
import GoldenLayout from '@gms/golden-layout';
import { ChildProps, MutationFunction } from 'react-apollo';

/**
 * Types of events which can be show
 */
export enum EventFilters {
  EDGE = 'Edge',
  COMPLETED = 'Completed'
}

/**
 * Table row object for events
 */
export interface EventsRow {
  id: string;
  eventHypId: string;
  isOpen: boolean;
  stageId: string;
  lat: number;
  lon: number;
  depth: number;
  time: number;
  activeAnalysts: string[];
  numDetections: number;
  status: string;
  edgeEvent: boolean;
  signalDetectionConflicts: SignalDetectionConflict[];
}

export interface SignalDetectionConflict {
  stationName: string;
  id: string;
  arrivalTime: number;
  phase: CommonTypes.PhaseType;
}
/**
 * Event list local state
 */
export interface EventsState {
  currentTimeInterval: CommonTypes.TimeRange;
  suppressScrollOnNewData: boolean;
  showEventOfType: Map<EventFilters, boolean>;
}

/**
 * Mutations used in the event list
 */
export interface EventsMutations {
  updateEvents: MutationFunction;
  saveEvent: MutationFunction;
  saveAllModifiedEvents: MutationFunction;
}

/**
 * Props mapped in from Redux state
 */
export interface EventsReduxProps {
  // Passed in from golden-layout
  glContainer?: GoldenLayout.Container;
  currentTimeInterval: CommonTypes.TimeRange;
  analysisMode: WorkflowTypes.AnalysisMode;
  openEventId: string;
  selectedEventIds: string[];

  // callbacks
  setOpenEventId(
    event: EventTypes.Event | undefined,
    latestLocationSolutionSet: EventTypes.LocationSolutionSet | undefined,
    preferredLocationSolutionId: string | undefined
  ): void;
  setSelectedEventIds(ids: string[]): void;
}

/**
 * Consolidated props type for event list
 */
export type EventsProps = EventsReduxProps &
  ChildProps<EventsMutations> &
  GQLTypes.EventsInTimeRangeQueryProps &
  GQLTypes.DefaultStationsQueryProps &
  GQLTypes.SignalDetectionsByStationQueryProps &
  GQLTypes.WorkspaceStateProps;
