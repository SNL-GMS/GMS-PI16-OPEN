/* eslint-disable react/destructuring-assignment */
import { WeavessConstants, WeavessTypes } from '@gms/weavess-core';
import isEqual from 'lodash/isEqual';
import memoizeOne from 'memoize-one';
import React from 'react';

import {
  createMoveableMarkers,
  createSelectionWindowMarkers,
  createVerticalMarkers
} from '../../../../../markers';
import { PredictedPhases, SignalDetections, TheoreticalPhases } from './components';
import { ContentRendererProps, ContentRendererState } from './types';

/**
 * Content renderer component responsible for rendering the main content of a channel.
 */
export class ContentRenderer extends React.PureComponent<
  ContentRendererProps,
  ContentRendererState
> {
  /** Default channel props, if not provided */
  // eslint-disable-next-line react/static-property-placement
  public static readonly defaultProps: WeavessTypes.ChannelDefaultConfiguration = {
    displayType: [WeavessTypes.DisplayType.LINE],
    pointSize: 2,
    color: '#4580E6'
  };

  /** Ref to the element where this channel will be rendered */
  public containerRef: HTMLElement | null;

  /** Ref to the element where this description label will be rendered */
  public descriptionLabelRef: HTMLElement | null;

  /** Ref to drag indicator element */
  private dragIndicatorRef: HTMLDivElement | null;

  /**
   * A memoized function for creating the vertical markers.
   * The memoization function caches the results using
   * the most recent argument and returns the results.
   *
   * @param startTimeSecs the start time in seconds for the data
   * @param endTimeSecs the end time in seconds for the data
   * @param verticalMarkers the vertical markers
   *
   * @returns an array JSX elements
   */
  private readonly memoizedCreateVerticalMarkers: (
    startTimeSecs: number,
    endTimeSecs: number,
    verticalMarkers: WeavessTypes.Marker[] | undefined
  ) => JSX.Element[] = memoizeOne(
    createVerticalMarkers,
    /* tell memoize to use a deep comparison for complex objects */
    isEqual
  );

  /**
   * A memoized function for creating the moveable markers.
   * The memoization function caches the results using
   * the most recent argument and returns the results.
   *
   * @param startTimeSecs the start time in seconds for the data
   * @param endTimeSecs the end time in seconds for the data
   * @param moveableMarkers the moveable markers
   * @param viewTimeRange provides the view time range
   * @param containerClientWidth provides the container client width
   * @param viewportClientWidth provides the viewport client width
   * @param updateMarkers event to be invoked on update
   * @param labelWidthPx offset provided for calculating location
   *
   * @returns an array JSX elements
   */
  private readonly memoizedCreateMoveableMarkers: (
    startTimeSecs: number,
    endTimeSecs: number,
    moveableMarkers: WeavessTypes.Marker[] | undefined,
    viewTimeRange: () => WeavessTypes.TimeRange,
    containerClientWidth: () => number,
    viewportClientWidth: () => number,
    onUpdateMarker?: (marker: WeavessTypes.Marker) => void,
    labelWidthPx?: number
  ) => JSX.Element[] = memoizeOne(
    createMoveableMarkers,
    /* tell memoize to use a deep comparison for complex objects */
    isEqual
  );

  /**
   * A memoized function for creating the selection window markers.
   * The memoization function caches the results using
   * the most recent argument and returns the results.
   *
   * @param startTimeSecs the start time in seconds for the data
   * @param endTimeSecs the end time in seconds for the data
   * @param selectionWindows the selection windows
   * @param viewTimeRange provides the view time range
   * @param canvasRef provides the canvas reference
   * @param containerClientWidth provides the container client width
   * @param viewportClientWidth provides the viewport client width
   * @param computeTimeSecsForMouseXPosition computes the time in seconds for the mouse x position.
   * @param onMouseMove event to be invoked on mouse move
   * @param onMouseDown event to be invoked on mouse move
   * @param onMouseUp event to be invoked on mouse move
   * @param onMoveSelectionWindow event handler for invoked while the selection is moving
   * @param onUpdateSelectionWindow event handler for updating selections value
   * @param onClickSelectionWindow event handler for click events within a selection
   * @param labelWidthPx offset provided for calculating location
   *
   * @returns an array JSX elements
   */
  private readonly memoizedCreateSelectionWindowMarkers: (
    startTimeSecs: number,
    endTimeSecs: number,
    selectionWindows: WeavessTypes.SelectionWindow[] | undefined,
    viewTimeRange: () => WeavessTypes.TimeRange,
    canvasRef: () => HTMLCanvasElement | null,
    containerClientWidth: () => number,
    viewportClientWidth: () => number,
    computeTimeSecsForMouseXPosition: (mouseXPosition: number) => number,
    onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void,
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void,
    onMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void,
    onMoveSelectionWindow?: (selection: WeavessTypes.SelectionWindow) => void,
    onUpdateSelectionWindow?: (selection: WeavessTypes.SelectionWindow) => void,
    onClickSelectionWindow?: (selection: WeavessTypes.SelectionWindow, timeSecs: number) => void,
    labelWidthPx?: number
  ) => JSX.Element[] = memoizeOne(
    createSelectionWindowMarkers,
    /* tell memoize to use a deep comparison for complex objects */
    isEqual
  );

  /**
   * Constructor
   *
   * @param props props as ContentRendererProps
   */
  public constructor(props: ContentRendererProps) {
    super(props);
    this.state = {};
  }

  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    const isSelected =
      this.props.selections.channels &&
      this.props.selections.channels.indexOf(this.props.channelId) > -1;
    const labelWidthPx =
      this.props.initialConfiguration?.labelWidthPx ?? WeavessConstants.DEFAULT_LABEL_WIDTH_PIXELS;

    return (
      // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div
        className="contentrenderer"
        style={{
          backgroundColor: isSelected ? 'rgba(150,150,150,0.2)' : 'initial'
        }}
        ref={ref => {
          if (ref) {
            this.containerRef = ref;
          }
        }}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onKeyDown={this.props.onKeyDown}
        onContextMenu={this.props.onContextMenu}
        onMouseMove={this.props.onMouseMove}
        onMouseDown={this.props.onMouseDown}
        onMouseUp={this.props.onMouseUp}
      >
        {this.props.children}
        <div
          className="contentrenderer-content contentrenderer-content--sticky"
          style={{
            width: this.props.canvasRef()?.clientWidth ?? `calc(100vw - ${labelWidthPx})`
          }}
        >
          {this.props.description ? (
            <div
              ref={ref => {
                this.descriptionLabelRef = ref;
              }}
              className="contentrenderer-content-description-label"
              data-cy="filtered-channel-label"
              data-cy-color={this.props.descriptionLabelColor}
              style={{
                color: this.props.descriptionLabelColor
              }}
            >
              <span className="contentrenderer-content__description">{this.props.description}</span>
            </div>
          ) : undefined}
        </div>
        <div
          className="contentrenderer-content"
          style={{
            left: labelWidthPx,
            width: `calc(100% - ${labelWidthPx})`
          }}
        >
          <div
            ref={ref => {
              this.dragIndicatorRef = ref;
            }}
            className="contentrenderer-content-drag-indicator"
          />
          {...this.props.contentRenderers}
          <div className="contentrenderer-content-markers">{this.createAllMarkers(this.props)}</div>
          <SignalDetections
            stationId={this.props.stationId}
            channelId={this.props.channelId}
            signalDetections={this.props.signalDetections}
            isDefaultChannel={this.props.isDefaultChannel}
            displayStartTimeSecs={this.props.displayStartTimeSecs}
            displayEndTimeSecs={this.props.displayEndTimeSecs}
            selectedSignalDetections={this.props.selections.signalDetections}
            events={this.props.events}
            toast={this.props.toast}
            getTimeSecsForClientX={this.getTimeSecsForClientX}
            toggleDragIndicator={this.toggleDragIndicator}
            positionDragIndicator={this.positionDragIndicator}
            disableModification={this.props.disableSignalDetectionModification}
          />
          <PredictedPhases
            stationId={this.props.stationId}
            channelId={this.props.channelId}
            predictedPhases={this.props.predictedPhases}
            isDefaultChannel={this.props.isDefaultChannel}
            displayStartTimeSecs={this.props.displayStartTimeSecs}
            displayEndTimeSecs={this.props.displayEndTimeSecs}
            selectedPredictedPhases={this.props.selections.predictedPhases}
            events={this.props.events}
            toast={this.props.toast}
            getTimeSecsForClientX={this.getTimeSecsForClientX}
            toggleDragIndicator={this.toggleDragIndicator}
            positionDragIndicator={this.positionDragIndicator}
            disableModification={this.props.disablePredictedPhaseModification}
          />
          <TheoreticalPhases
            stationId={this.props.stationId}
            theoreticalPhaseWindows={this.props.theoreticalPhaseWindows}
            isDefaultChannel={this.props.isDefaultChannel}
            displayStartTimeSecs={this.props.displayStartTimeSecs}
            displayEndTimeSecs={this.props.displayEndTimeSecs}
            events={this.props.events}
            toast={this.props.toast}
            getTimeSecsForClientX={this.getTimeSecsForClientX}
            toggleDragIndicator={this.toggleDragIndicator}
            positionDragIndicator={this.positionDragIndicator}
          />
        </div>
      </div>
    );
  }

  /**
   * Creates all of the markers.
   *
   * @param props the content renderer props
   *
   * @returns an array JSX elements
   */
  private readonly createAllMarkers = (props: ContentRendererProps): JSX.Element[] => [
    ...this.memoizedCreateVerticalMarkers(
      props.displayStartTimeSecs,
      props.displayEndTimeSecs,
      props.markers ? props.markers.verticalMarkers : undefined
    ),
    ...this.memoizedCreateMoveableMarkers(
      props.displayStartTimeSecs,
      props.displayEndTimeSecs,
      props.markers ? props.markers.moveableMarkers : undefined,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      props.getCurrentViewRangeInSeconds,
      () => (this.containerRef ? this.containerRef.clientWidth : 0),
      () => (this.containerRef ? this.containerRef.clientWidth : 0),
      props.events
        ? (marker: WeavessTypes.Marker) => {
            if (props.events && props.events.onUpdateMarker) {
              props.events.onUpdateMarker(props.channelId, marker);
            }
          }
        : undefined,
      0
    ),
    ...this.memoizedCreateSelectionWindowMarkers(
      props.displayStartTimeSecs,
      props.displayEndTimeSecs,
      props.markers ? props.markers.selectionWindows : undefined,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      props.getCurrentViewRangeInSeconds,
      () => props.canvasRef(),
      () => (this.containerRef ? this.containerRef.clientWidth : 0),
      () => (this.containerRef ? this.containerRef.clientWidth : 0),
      // eslint-disable-next-line @typescript-eslint/unbound-method
      props.converters.computeTimeSecsForMouseXFractionalPosition,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      props.onMouseMove,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      props.onMouseDown,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      props.onMouseUp,
      props.events
        ? (selection: WeavessTypes.SelectionWindow) => {
            if (props.events && props.events.onMoveSelectionWindow) {
              props.events.onMoveSelectionWindow(props.channelId, selection);
            }
          }
        : undefined,
      props.events
        ? (selection: WeavessTypes.SelectionWindow) => {
            if (props.events && props.events.onUpdateSelectionWindow) {
              props.events.onUpdateSelectionWindow(props.channelId, selection);
            }
          }
        : undefined,
      props.events
        ? (selection: WeavessTypes.SelectionWindow, timeSecs: number) => {
            if (props.events && props.events.onClickSelectionWindow) {
              props.events.onClickSelectionWindow(props.channelId, selection, timeSecs);
            }
          }
        : undefined,
      0
    )
  ];

  /**
   * Returns the time in seconds for the given clientX.
   *
   * @param clientX The clientX
   *
   * @returns The time in seconds; undefined if clientX is
   * out of the channel's bounds on screen.
   */
  private readonly getTimeSecsForClientX = (clientX: number): number | undefined => {
    const canvasRef = this.props.canvasRef();

    if (!this.containerRef || !canvasRef) return;

    const offset = canvasRef.getBoundingClientRect();
    // eslint-disable-next-line consistent-return
    if (clientX < offset.left && clientX > offset.right) return undefined;

    // position in [0,1] in the current channel bounds.
    const position = (clientX - offset.left) / offset.width;
    // eslint-disable-next-line consistent-return
    return this.props.converters.computeTimeSecsForMouseXFractionalPosition(position);
  };

  /**
   * Toggle display of the drag indicator for this channel
   *
   * @param show True to show drag indicator
   * @param color The color of the drag indicator
   */
  private readonly toggleDragIndicator = (show: boolean, color: string): void => {
    if (!this.dragIndicatorRef) return;

    this.dragIndicatorRef.style.borderColor = color;
    this.dragIndicatorRef.style.display = show ? 'initial' : 'none';
  };

  /**
   * Set the position for the drag indicator
   *
   * @param clientX The clientX
   */
  private readonly positionDragIndicator = (clientX: number): void => {
    if (!this.containerRef || !this.dragIndicatorRef) return;

    const fracToPct = 100;
    const boundingRect = this.containerRef.getBoundingClientRect();
    // position in [0,1] in the current channel bounds.
    const position = (clientX - boundingRect.left) / boundingRect.width;
    this.dragIndicatorRef.style.left = `${position * fracToPct}%`;
  };
}
