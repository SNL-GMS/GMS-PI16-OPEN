/* eslint-disable react/destructuring-assignment */
import { NonIdealState } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { SignalDetectionTypes } from '@gms/common-model';
import { addGlForceUpdateOnResize, addGlForceUpdateOnShow } from '@gms/ui-util';
import isEqual from 'lodash/isEqual';
import React from 'react';

import {
  getAssocSds,
  getDistanceToStationsForLocationSolutionId,
  getOpenEvent
} from '~analyst-ui/common/utils/event-util';
import {
  DataType,
  TableDataState,
  TableInvalidState
} from '~analyst-ui/common/utils/table-invalid-state';

import { LocationPanel } from './components/location-panel';
import { LocationProps } from './types';

export class Location extends React.PureComponent<LocationProps> {
  /** Handlers to unsubscribe from apollo subscriptions */
  private readonly unsubscribeHandlers: { (): void }[] = [];

  public componentDidMount(): void {
    addGlForceUpdateOnShow(this.props.glContainer, this);
    addGlForceUpdateOnResize(this.props.glContainer, this);
  }

  public componentDidUpdate(prevProps: LocationProps): void {
    if (
      this.props.currentTimeInterval &&
      !isEqual(this.props.currentTimeInterval, prevProps.currentTimeInterval)
    ) {
      this.setupSubscriptions(this.props);
    }
  }

  /**
   * Invoked when the component will unmount.
   */
  public componentWillUnmount(): void {
    // Unsubscribe from all current subscriptions
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers.length = 0;
  }

  /**
   * Renders the component.
   */
  // eslint-disable-next-line react/sort-comp, complexity
  public render(): JSX.Element {
    // no spinner if queries haven't been issued
    const dataState: TableDataState =
      // eslint-disable-next-line no-nested-ternary
      !this.props.eventsInTimeRangeQuery || !this.props.signalDetectionsByStationQuery
        ? TableDataState.NO_INTERVAL
        : // eslint-disable-next-line no-nested-ternary
        this.props.eventsInTimeRangeQuery && this.props.eventsInTimeRangeQuery.loading
        ? TableDataState.NO_EVENTS
        : // eslint-disable-next-line no-nested-ternary
        this.props.signalDetectionsByStationQuery.loading ||
          !this.props.signalDetectionsByStationQuery.signalDetectionsByStation
        ? TableDataState.NO_SDS
        : !this.props.openEventId
        ? TableDataState.NO_EVENT_OPEN
        : TableDataState.READY;
    if (dataState !== TableDataState.READY) {
      return (
        <TableInvalidState
          visual={IconNames.GEOSEARCH}
          message={dataState}
          dataType={dataState === TableDataState.NO_SDS ? DataType.SD : DataType.EVENT}
          noEventMessage="Select an event to refine location"
        />
      );
    }

    const openEvent = getOpenEvent(
      this.props.openEventId,
      this.props.eventsInTimeRangeQuery
        ? this.props.eventsInTimeRangeQuery.eventsInTimeRange
        : undefined
    );
    if (!openEvent) {
      return (
        <NonIdealState
          title="Selected Event Not Found"
          description="Refresh the Page and Cross Your Fingers"
        />
      );
    }
    const assocSDs: SignalDetectionTypes.SignalDetection[] = getAssocSds(
      openEvent,
      this.props.signalDetectionsByStationQuery.signalDetectionsByStation
    );
    const distances = getDistanceToStationsForLocationSolutionId(
      openEvent,
      this.props.location.selectedPreferredLocationSolutionId
    );
    // If the latest locationsolutionset is NOT selected, enabled historical mode
    // eslint-disable-next-line no-nested-ternary
    const signalDetectionsByStation = this.props.signalDetectionsByStationQuery
      ? this.props.signalDetectionsByStationQuery.signalDetectionsByStation
        ? this.props.signalDetectionsByStationQuery.signalDetectionsByStation
        : []
      : [];
    return (
      <LocationPanel
        associatedSignalDetections={assocSDs}
        changeSignalDetectionAssociations={this.props.changeSignalDetectionAssociations}
        createEvent={this.props.createEvent}
        distances={distances}
        locateEvent={this.props.locateEvent}
        measurementMode={this.props.measurementMode}
        openEvent={openEvent}
        rejectDetections={this.props.rejectDetections}
        sdIdsToShowFk={this.props.sdIdsToShowFk}
        selectedSdIds={this.props.selectedSdIds}
        setMeasurementModeEntries={this.props.setMeasurementModeEntries}
        setSdIdsToShowFk={this.props.setSdIdsToShowFk}
        setSelectedSdIds={this.props.setSelectedSdIds}
        signalDetectionsByStation={signalDetectionsByStation}
        updateDetections={this.props.updateDetections}
        // ! TODO DO NOT USE `this.props.glContainer.width` TO CALCULATING WIDTH - COMPONENT MAY NOT BE INSIDE GL
        widthOfDisplayPx={this.props.glContainer ? this.props.glContainer.width : 0}
        updateFeaturePredictions={this.props.updateFeaturePredictions}
        location={this.props.location}
        setSelectedLocationSolution={this.props.setSelectedLocationSolution}
        setSelectedPreferredLocationSolution={this.props.setSelectedPreferredLocationSolution}
      />
    );
  }

  // ***************************************
  // BEGIN GraphQL Wiring
  // ***************************************

  /**
   * Initialize graphql subscriptions on the apollo client
   *
   * @param LocationProps props of the event
   */
  private readonly setupSubscriptions = (props: LocationProps): void => {
    if (!props.eventsInTimeRangeQuery) return;

    // First, unsubscribe from all current subscriptions
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers.length = 0;
  };
}
