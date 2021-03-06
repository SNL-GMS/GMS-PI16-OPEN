/* eslint-disable react/destructuring-assignment */
import { Checkbox, Classes, ContextMenu } from '@blueprintjs/core';
import { EventTypes } from '@gms/common-model';
import {
  CESIUM_OFFLINE,
  dateToString,
  ISO_DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION
} from '@gms/common-util';
import { UILogger } from '@gms/ui-apollo';
import { addGlForceUpdateOnResize, addGlForceUpdateOnShow } from '@gms/ui-util';
import isEqual from 'lodash/isEqual';
import React from 'react';

import { SignalDetectionContextMenu } from '~analyst-ui/common/context-menus/signal-detection-context-menu';
import { SignalDetectionDetails } from '~analyst-ui/common/dialogs';
import {
  getLatestLocationSolutionSet,
  getPreferredLocationSolutionIdFromEventHypothesis
} from '~analyst-ui/common/utils/event-util';
import { determineDetectionColor } from '~analyst-ui/common/utils/signal-detection-util';
import { analystUiConfig, environmentConfig } from '~analyst-ui/config';

import { CesiumMap } from './components/cesium-map';
import { MapAPI } from './components/map-api';
import { LayerLabels, LayerTooltips, MapProps, MapState } from './types';

/**
 * Primary map display
 */
export class Map extends React.PureComponent<MapProps, MapState> {
  /**
   * handle to the dom element we want to render Map inside of.
   */
  private containerDomElement: HTMLDivElement;

  /**
   * Handlers to unsubscribe from apollo subscriptions
   */
  private readonly unsubscribeHandlers: { (): void }[] = [];

  /** The map */
  private readonly map: MapAPI;

  /** We want to force the rendering of stations after a mount */
  private firstUpdateAfterMount: boolean;
  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Constructor.
   *
   * @param props The initial props
   */
  public constructor(props: MapProps) {
    super(props);
    this.map = new CesiumMap({
      events: {
        onMapClick: this.onMapClick,
        onMapRightClick: this.onMapRightClick,
        onMapShiftClick: this.onMapShiftClick,
        onMapDoubleClick: this.onMapDoubleClick,
        onMapAltClick: this.onMapAltClick
      },
      analystUiConfig
    });
  }

  /**
   * Invoked when the component mounted.
   */
  public componentDidMount(): void {
    this.firstUpdateAfterMount = true;
    addGlForceUpdateOnShow(this.props.glContainer, this);
    addGlForceUpdateOnResize(this.props.glContainer, this);
    this.map.initialize(this.containerDomElement);

    UILogger.Instance().info(`Cesium configured with CESIUM_OFFLINE=(${CESIUM_OFFLINE})`);
  }

  /**
   * Invoked when the component mounted.
   *
   * @param prevProps The previous props
   * @param prevState The previous state
   */
  // eslint-disable-next-line complexity
  public componentDidUpdate(prevProps: MapProps): void {
    if (
      this.props.currentTimeInterval &&
      this.props.defaultStationsQuery.defaultProcessingStations &&
      !isEqual(this.props.currentTimeInterval, prevProps.currentTimeInterval)
    ) {
      this.setupSubscriptions(this.props);
    }

    if (
      this.firstUpdateAfterMount ||
      !isEqual(
        this.props.defaultStationsQuery.defaultProcessingStations,
        prevProps.defaultStationsQuery.defaultProcessingStations
      )
    ) {
      this.map.drawDefaultStations(
        prevProps.defaultStationsQuery.defaultProcessingStations,
        this.props.defaultStationsQuery.defaultProcessingStations
      );
    }

    // Get the current default stations needed for location of Signal Detections rendering
    const currentDefaultStations =
      this.props.defaultStationsQuery && this.props.defaultStationsQuery.defaultProcessingStations
        ? this.props.defaultStationsQuery.defaultProcessingStations
        : [];
    const prevEventsInTimeRange =
      prevProps.eventsInTimeRangeQuery && prevProps.eventsInTimeRangeQuery.eventsInTimeRange
        ? prevProps.eventsInTimeRangeQuery.eventsInTimeRange
        : [];

    const currentEventsInTimeRange =
      this.props.eventsInTimeRangeQuery && this.props.eventsInTimeRangeQuery.eventsInTimeRange
        ? this.props.eventsInTimeRangeQuery.eventsInTimeRange
        : [];

    const prevSignalDetectionsByStation =
      prevProps.signalDetectionsByStationQuery &&
      prevProps.signalDetectionsByStationQuery.signalDetectionsByStation
        ? prevProps.signalDetectionsByStationQuery.signalDetectionsByStation
        : [];

    const currentSignalDetectionsByStation =
      this.props.signalDetectionsByStationQuery &&
      this.props.signalDetectionsByStationQuery.signalDetectionsByStation
        ? this.props.signalDetectionsByStationQuery.signalDetectionsByStation
        : [];

    if (
      !isEqual(currentEventsInTimeRange, prevEventsInTimeRange) ||
      !isEqual(this.props.selectedEventIds, prevProps.selectedEventIds)
    ) {
      this.map.drawEvents(prevProps, this.props);
    }

    const previousOpenEvent = this.props.openEventId
      ? currentEventsInTimeRange.find(e => e.id === prevProps.openEventId)
      : undefined;

    const currentOpenEvent = this.props.openEventId
      ? currentEventsInTimeRange.find(e => e.id === this.props.openEventId)
      : undefined;

    // FIXME: Need to rework this if/else if (too redundant)
    if (!isEqual(currentOpenEvent, previousOpenEvent)) {
      if (this.props.openEventId !== prevProps.openEventId) {
        this.map.highlightOpenEvent(
          this.props.currentTimeInterval,
          previousOpenEvent,
          currentOpenEvent,
          this.props.selectedEventIds
        );
      }

      this.map.drawSignalDetections(
        currentSignalDetectionsByStation,
        currentEventsInTimeRange,
        currentOpenEvent,
        currentDefaultStations
      );
      this.map.drawUnAssociatedSignalDetections(
        currentSignalDetectionsByStation,
        currentEventsInTimeRange,
        currentOpenEvent,
        currentDefaultStations
      );
      this.map.drawOtherAssociatedSignalDetections(
        currentSignalDetectionsByStation,
        currentEventsInTimeRange,
        currentOpenEvent,
        currentDefaultStations
      );
    } else if (!isEqual(currentSignalDetectionsByStation, prevSignalDetectionsByStation)) {
      this.map.drawSignalDetections(
        currentSignalDetectionsByStation,
        currentEventsInTimeRange,
        currentOpenEvent,
        currentDefaultStations
      );
      this.map.drawUnAssociatedSignalDetections(
        currentSignalDetectionsByStation,
        currentEventsInTimeRange,
        currentOpenEvent,
        currentDefaultStations
      );
      this.map.drawOtherAssociatedSignalDetections(
        currentSignalDetectionsByStation,
        currentEventsInTimeRange,
        currentOpenEvent,
        currentDefaultStations
      );

      this.map.updateStations(
        prevSignalDetectionsByStation,
        previousOpenEvent,
        currentSignalDetectionsByStation,
        currentOpenEvent
      );
    }

    if (!isEqual(this.props.selectedSdIds, prevProps.selectedSdIds)) {
      this.map.highlightSelectedSignalDetections(this.props.selectedSdIds);
    }

    if (!isEqual(this.props.selectedSdIds, prevProps.selectedSdIds)) {
      this.selectSignalDetectionsFromProps(this.props);
    }

    // Explicitly render a new frame
    // eslint-disable-next-line newline-per-chained-call
    this.map.getViewer().scene.requestRender();
    this.firstUpdateAfterMount = false;
  }

  /**
   * Invoked when the component will unmount.
   */
  public componentWillUnmount(): void {
    // unsubscribe from all current subscriptions
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers.length = 0;
  }

  /**
   * Renders the component.
   */
  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    return (
      <div data-cy="map" className="map">
        <div className="map__column">
          {this.mapTopOptions()}
          <div className="map__row">
            <div className="map-layer-toggles">{this.generateLayerToggles()}</div>
            <div className="map__inner-column">
              <div className="map__rendering-wrapper-1">
                <div
                  className="map__rendering-wrapper-2 max"
                  ref={ref => {
                    if (ref) {
                      this.containerDomElement = ref;
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="map__status-online-indicator">
          {environmentConfig.map.online ? (
            <span className="map__status-online-indicator__online-mode">Online Mode</span>
          ) : (
            <span className="map__status-online-indicator__offline-mode">Offline Mode</span>
          )}
        </div>
      </div>
    );
  }

  // ***************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Initialize graphql subscriptions on the apollo client
   */
  private readonly setupSubscriptions = (props: MapProps): void => {
    if (!props.eventsInTimeRangeQuery && !props.signalDetectionsByStationQuery) {
      return;
    }

    // first, unsubscribe from all current subscriptions
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers.length = 0;
  };

  /**
   * Generate the sidebar with layer toggles
   */
  private readonly generateLayerToggles = (): JSX.Element[] =>
    Object.keys(this.map.getDataLayers()).map(id => (
      <Checkbox
        key={id}
        labelElement={<span title={LayerTooltips[id]}>{LayerLabels[id]}</span>}
        style={{
          margin: '0.5rem'
        }}
        title={id}
        checked={this.map.getDataLayers()[id].show}
        onChange={() => this.toggleDataLayerVisibility(id)}
      />
    ));

  private readonly mapTopOptions = (): JSX.Element => (
    <div className="map-controls">
      <Checkbox label="Sync with user actions" style={{ marginBottom: '0px' }} />
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label className={`${Classes.LABEL} ${Classes.INLINE} map-controls__label`}>
        Start time:{' '}
        <span className="map-time">
          {dateToString(new Date(), ISO_DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)}
        </span>
      </label>
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label className={`${Classes.LABEL} ${Classes.INLINE} map-controls__label`}>
        End time:{' '}
        <span className="map-time">
          {dateToString(new Date(), ISO_DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)}
        </span>
      </label>
    </div>
  );

  /**
   * Toggle the visibility of a data source
   */
  private readonly toggleDataLayerVisibility = (id: string, show?: boolean) => {
    const layer = this.map.getDataLayers()[id];
    if (layer) {
      if (show === undefined) {
        layer.show = !layer.show;
      } else {
        layer.show = show;
      }
      this.forceUpdate();
    }
  };

  private readonly onMapAltClick = (clickEvent: any, entity?: any) => {
    if (entity && entity.entityType === 'sd') {
      const detection = this.props.signalDetectionsByStationQuery.signalDetectionsByStation.filter(
        sd => sd.id === entity.id
      )[0];
      const color = determineDetectionColor(
        detection,
        this.props.eventsInTimeRangeQuery.eventsInTimeRange,
        this.props.openEventId
      );
      ContextMenu.show(
        <SignalDetectionDetails detection={detection} color={color} />,
        { left: clickEvent.position.x, top: clickEvent.position.y },
        undefined,
        true
      );
    }
  };

  /**
   * Handler for map click event
   */
  private readonly onMapClick = (clickEvent: any, entity?: any) => {
    if (entity && entity.entityType === 'event') {
      this.props.setSelectedEventIds([entity.id]);
    } else if (entity && entity.entityType === 'sd') {
      this.props.setSelectedSdIds([entity.id]);
    } else {
      this.props.setSelectedSdIds([]);
      this.props.setSelectedEventIds([]);
    }
  };

  /**
   * Handler for map right click event
   */
  private readonly onMapRightClick = (clickEvent: any, entity?: any) => {
    if (entity && entity.entityType === 'sd') {
      // const sdIds = this.props.selectedSdIds.indexOf(entity.id) >= 0 ?
      // [...this.props.selectedSdIds, entity.id] : [entity.id];
      const sdIds =
        // eslint-disable-next-line no-nested-ternary
        this.props.selectedSdIds.length > 0
          ? this.props.selectedSdIds.indexOf(entity.id) >= 0
            ? this.props.selectedSdIds
            : [...this.props.selectedSdIds, entity.id]
          : [entity.id];
      const sds = this.props.signalDetectionsByStationQuery.signalDetectionsByStation.filter(
        sd => sdIds.indexOf(sd.id) >= 0
      );
      const currentOpenEvent:
        | EventTypes.Event
        | undefined = this.props.eventsInTimeRangeQuery.eventsInTimeRange.find(
        ev => ev.id === this.props.openEventId
      );
      const sdMenu = (
        <SignalDetectionContextMenu
          signalDetections={this.props.signalDetectionsByStationQuery.signalDetectionsByStation}
          selectedSds={sds}
          currentOpenEvent={currentOpenEvent}
          changeAssociation={this.props.changeSignalDetectionAssociations}
          rejectDetections={this.props.rejectDetections}
          updateDetections={this.props.updateDetections}
          setSdIdsToShowFk={this.props.setSdIdsToShowFk}
          sdIdsToShowFk={this.props.sdIdsToShowFk}
          associateToNewEvent={this.props.createEvent}
          measurementMode={this.props.measurementMode}
          setSelectedSdIds={this.props.setSelectedSdIds}
          setMeasurementModeEntries={this.props.setMeasurementModeEntries}
        />
      );
      const y =
        (clickEvent.position.y as number) + this.containerDomElement.getBoundingClientRect().top;
      const x =
        (clickEvent.position.x as number) + this.containerDomElement.getBoundingClientRect().left;

      ContextMenu.show(sdMenu, { top: y, left: x }, undefined, true);
      this.props.setSelectedSdIds(sdIds);
    }
  };

  /**
   * Handler for map ctrl+click
   */
  private readonly onMapShiftClick = (clickEvent: any, entity?: any) => {
    if (entity && entity.entityType === 'sd') {
      this.props.setSelectedSdIds([...this.props.selectedSdIds, entity.id]);
    }
    if (entity && entity.entityType === 'event') {
      this.props.setSelectedEventIds([...this.props.selectedEventIds, entity.id]);
    }
  };

  /**
   * Handler for map double click
   */
  private readonly onMapDoubleClick = (clickEvent: any, entity?: any) => {
    if (entity && entity.entityType === 'event') {
      // TODO: fix this so completed events can't be opened again
      const filteredList =
        this.props.eventsInTimeRangeQuery && this.props.eventsInTimeRangeQuery.eventsInTimeRange
          ? this.props.eventsInTimeRangeQuery.eventsInTimeRange.filter(
              event => event.id === entity.id
            )
          : [];
      filteredList.forEach(event => {
        if (event.status !== 'Complete') {
          this.props.setOpenEventId(
            event,
            getLatestLocationSolutionSet(event),
            getPreferredLocationSolutionIdFromEventHypothesis(
              event.currentEventHypothesis.eventHypothesis
            )
          );
        }
      });
    }
  };

  /**
   * Selects clicked signal detections
   */
  private readonly selectSignalDetectionsFromProps = (props: MapProps) => {
    this.map.highlightSelectedSignalDetections(props.selectedSdIds);
  };
}
