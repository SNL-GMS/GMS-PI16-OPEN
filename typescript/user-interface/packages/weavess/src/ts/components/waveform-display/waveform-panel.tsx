/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/destructuring-assignment */
import 'moment-precise-range-plugin';

import { Popover, Position } from '@blueprintjs/core';
import { WeavessConstants, WeavessMessages, WeavessTypes, WeavessUtil } from '@gms/weavess-core';
import * as d3 from 'd3';
import elementResizeEvent from 'element-resize-event';
import Immutable from 'immutable';
import defer from 'lodash/defer';
import delay from 'lodash/delay';
import flatMap from 'lodash/flatMap';
import isEqual from 'lodash/isEqual';
import range from 'lodash/range';
import memoizeOne from 'memoize-one';
import moment from 'moment';
import React from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import * as THREE from 'three';
import { RpcProvider } from 'worker-rpc';

import {
  computeTimeSecsForMouseXPositionFraction,
  convertPixelOffsetToFractionalPosition,
  convertPixelOffsetToTime
} from '../../util/position-util';
import { Station, TimeAxis } from './components';
import { TimeRange } from './components/axes/time-range';
import {
  createMoveableMarkers,
  createSelectionWindowMarkers,
  createVerticalMarkers
} from './components/markers';
import { Channel } from './components/station/components';
import { SingleDoubleClickEvent } from './events/single-double-click-event';
import { BrushType, WaveformPanelProps, WaveformPanelState } from './types';

declare let require;
const WeavessWorker = require('worker-loader?inline&fallback=false!../../workers'); // eslint-disable-line

// create web workers responsible for creating line geometries
const defaultNumWorkers = 4;
const workerRpcs = range(window.navigator.hardwareConcurrency || defaultNumWorkers).map(() => {
  const worker = new WeavessWorker();
  const workerRpc = new RpcProvider((message, transfer) => worker.postMessage(message, transfer));
  worker.onmessage = e => workerRpc.dispatch(e.data);
  return workerRpc;
});

/** Padding to move the time popover to the left as it gets closer to the edge of the container */
const POPOVER_POSITION_PADDING = 75;
/** Minimum location used to switch where the popover direction is, e.x TOP_RIGHT */
const MINIMUM_THRESHOLD = 80;
/**
 * Waveform Panel component. Contains a TimeAxis and Stations
 */
export class WaveformPanel extends React.PureComponent<WaveformPanelProps, WaveformPanelState> {
  /** Refs to each station component */
  public readonly stationComponentRefs: Map<string, Station> | null;

  /** Ref to the root element of weavess */
  private weavessRootRef: HTMLDivElement | null;

  /** Ref to the viewport where waveforms are rendered */
  private waveformsViewportRef: HTMLDivElement | null;

  /** Ref to the container where waveforms are held, directly within the viewport */
  private waveformsContainerRef: HTMLDivElement | null;

  /** Ref to the translucent selection brush-effect region, which is updated manually for performance reasons */
  private selectionAreaRef: HTMLDivElement | null;

  /** Ref to the TimeAxis component, which is updated manually for performance reasons */
  private timeAxisRef: TimeAxis | null;

  /** Ref to the vertical crosshair indicator element */
  private crosshairRef: HTMLDivElement | null;

  /** Ref to the primary canvas element where the waveforms are drawn */
  private canvasRef: HTMLCanvasElement | null;

  /** THREE.js WebGLRenderer used to draw waveforms */
  private renderer: THREE.WebGLRenderer;

  /** A list of active web workers */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly workerRpcs: any[];

  /** If the brush has just started to be used */
  private startOfBrush = true;

  /** Flag to indicate whether or not the mouse button is pressed down */
  private isMouseDown: { clientX: number; clientY: number } | undefined = undefined;

  /** The start of the brush effect in [0,1] where 0 = this.viewRange.left and 1 = this.viewRange.right */
  private selectionStart: number | undefined;

  /** The type of brush used on the channel */
  private brushType: BrushType | undefined = undefined;

  /** The type of brush used on the channel */
  private needToDeselect = false;

  /** Reference to the popover component for displaying the current time */
  private timePopoverRef: Popover | null;

  /** Reference to the popover content for displaying the current time */
  private timePopoverContentRef: HTMLDivElement | null;

  /** The left position in pixels for the time popover */
  private timePopoverLeftPosition = 0;

  /** The unique id for delaying the time popover to be displayed  */
  private timePopoverId: number | undefined = undefined;

  /** An id of the previous requestAnimationFrame call, which allows
   * one to cancel it, so we can avoid enqueueing multiple animation frames */
  private prevRAF: number;

  /** Keep track of what was previously in view so we can treat the viewRange
   * as a referentially-stable object if it has not changed.
   */
  private prevViewRange: WeavessTypes.TimeRange;

  /**
   * A collection of the physical dimensions in the DOM. These are calculated in a batch
   * in order to reduce calculation time during critical points in time, such as
   * requestAnimationFrame calls.
   */
  private readonly dimensions: {
    viewport: {
      clientHeight: number;
      clientWidth: number;
      scrollWidth: number;
      scrollLeft: number;
      scrollTop: number;
    };
    viewportContentContainer: {
      clientWidth: number;
    };
    /** The canvas bounding rectangle, for reuse */
    canvas: {
      rect: DOMRect;
      offsetWidth: number;
      offsetHeight: number;
      clientWidth: number;
    };
  };

  /**
   * A list of channels that we will attempt to render on the canvas.
   */
  private visibleChannels: Immutable.List<Channel>;

  /**
   * A resize observer for the canvas element
   */
  private readonly canvasResizeObserver: ResizeObserver;

  /** The empty set of what is selected */
  private readonly emptySelection = {
    channels: undefined,
    signalDetections: undefined,
    predictedPhases: undefined
  };

  /** the left boundary of the scroll position */
  private prevScrollLeftPx = 0;

  /** true if the control key is pressed; false otherwise */
  private ctrlKey = false;

  /** handler for handling single and double click events */
  private readonly handleSingleDoubleClick: SingleDoubleClickEvent = new SingleDoubleClickEvent();

  /**
   * A memoized function for creating all stations
   * The memoization function caches the results using
   * the most recent argument and returns the results.
   *
   * @param props the waveform panel props
   *
   * @returns an array JSX elements
   */
  private readonly memoizedCreateStationsJsx: (props: WaveformPanelProps) => JSX.Element[];

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
   * Constructor.
   *
   * @param props Waveform Panel props as WaveformPanelProps
   */
  public constructor(props: WaveformPanelProps) {
    super(props);
    this.state = {
      timePopoverPosition: Position.TOP,
      timePopoverIsOpen: false,
      viewRange: [0, 1]
    };
    this.canvasResizeObserver = new ResizeObserver(() => this.updateSize());
    this.workerRpcs = workerRpcs;
    this.stationComponentRefs = new Map();
    this.memoizedCreateStationsJsx = memoizeOne(this.createStationsJsx);
    this.visibleChannels = Immutable.List<Channel>();
    this.dimensions = {
      viewport: {
        clientHeight: 0,
        clientWidth: 0,
        scrollLeft: 0,
        scrollWidth: 0,
        scrollTop: 0
      },
      viewportContentContainer: {
        clientWidth: 0
      },
      canvas: {
        rect: new DOMRect(),
        offsetHeight: 0,
        offsetWidth: 0,
        clientWidth: 0
      }
    };
  }

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Called immediately after a component is mounted.
   * Setting state here will trigger re-rendering.
   */
  public componentDidMount(): void {
    // prevent firefox ctrl + wheel zoom, which fights with weavess
    document.addEventListener('wheel', this.documentPreventCtrlMouseWheel, { passive: false });

    if (!this.canvasRef) {
      console.error('Weavess error - canvas not present at mount time'); // eslint-disable-line
      return;
    }

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: this.canvasRef
    });

    this.canvasResizeObserver.observe(this.canvasRef);

    elementResizeEvent(this.waveformsViewportRef, () => {
      this.renderWaveforms();
      if (this.timeAxisRef) this.timeAxisRef.update();
    });

    if (this.props.initialZoomWindow) {
      this.zoomToTimeWindow(
        this.props.initialZoomWindow.startTimeSecs,
        this.props.initialZoomWindow.endTimeSecs
      );
    } else {
      this.renderWaveforms();
    }
  }

  /**
   * Called immediately after updating occurs. Not called for the initial render.
   *
   * @param prevProps the previous props
   * @param prevState the previous state
   */
  public componentDidUpdate(prevProps: WaveformPanelProps): void {
    if (
      this.props.initialZoomWindow &&
      !isEqual(this.props.initialZoomWindow, prevProps.initialZoomWindow)
    ) {
      this.zoomToTimeWindow(
        this.props.initialZoomWindow.startTimeSecs,
        this.props.initialZoomWindow.endTimeSecs
      );
    } else {
      this.renderWaveforms();
    }
  }

  /**
   * Catches exceptions generated in descendant components.
   * Unhandled exceptions will cause the entire component tree to unmount.
   *
   * @param error the error that was caught
   * @param info the information about the error
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public componentDidCatch(error, info): void {
    // eslint-disable-next-line no-console
    console.error(`Waveform Panel Error: ${error} : ${info}`);
  }

  /**
   * clean up when the component is unmounted
   */
  public componentWillUnmount(): void {
    document.removeEventListener('wheel', this.documentPreventCtrlMouseWheel);
    if (this.canvasRef) this.canvasResizeObserver.unobserve(this.canvasRef);
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * React component lifecycle
   */
  public render(): JSX.Element {
    const waveformComponents = this.memoizedCreateStationsJsx(this.props);
    const markers = this.createAllMarkers(this.props);
    const weavessRootStyle = this.createRootStyle();

    return (
      <div
        className="weavess-wp"
        ref={ref => {
          this.weavessRootRef = ref;
        }}
        style={weavessRootStyle}
        onMouseLeave={e => {
          // hide the time popover on mouse leave
          this.showHideTimePopover(e, undefined);
        }}
        onDoubleClick={this.onDoubleClick}
      >
        <canvas
          className="weavess-wp-canvas"
          ref={canvas => {
            if (canvas) {
              this.canvasRef = canvas;
              this.dimensions.canvas.rect = canvas?.getBoundingClientRect();
            }
          }}
          style={{
            width: `calc(100% - (${this.props.initialConfiguration.labelWidthPx}px + ${WeavessConstants.SCROLLBAR_WIDTH_PIXELS}px))`,
            height: `calc(100% - (${WeavessConstants.DEFAULT_XAXIS_HEIGHT_PIXELS}px))`,
            left: `${this.props.initialConfiguration.labelWidthPx}px`
          }}
        />
        <div className="weavess-wp-container">
          <div className="weavess-wp-container-1">
            <div className="weavess-wp-container-2">
              <div className="weavess-wp-container-3">
                <div
                  className="weavess-wp-container-viewport"
                  ref={ref => {
                    this.waveformsViewportRef = ref;
                  }}
                  onWheel={this.onMouseWheel}
                  onScroll={this.onScroll}
                  onKeyDown={this.onKeyDown}
                  onKeyUp={this.onKeyUp}
                >
                  <div
                    className="weavess-wp-container-viewport-content"
                    ref={waveformsContainer => {
                      this.waveformsContainerRef = waveformsContainer;
                    }}
                  >
                    {waveformComponents}
                    <div
                      className="weavess-wp-container-viewport-content-markers"
                      style={{
                        width: `calc(100% - ${this.props.initialConfiguration.labelWidthPx}px)`,
                        left: `${this.props.initialConfiguration.labelWidthPx}px`
                      }}
                    >
                      {markers}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="weavess-wp-container-overlay"
              style={{
                width: `calc(100% - (${this.props.initialConfiguration.labelWidthPx}px + ${WeavessConstants.SCROLLBAR_WIDTH_PIXELS}px))`
              }}
            >
              <Popover
                ref={ref => {
                  this.timePopoverRef = ref;
                }}
                content={
                  <div
                    className="weavess-wp-time-popover-content"
                    ref={ref => {
                      this.timePopoverContentRef = ref;
                    }}
                  />
                }
                isOpen={this.state.timePopoverIsOpen}
                usePortal
                minimal={false}
                position={this.state.timePopoverPosition}
              >
                <div />
              </Popover>
              <div
                className="weavess-wp-container-overlay-cross-hair"
                ref={ref => {
                  this.crosshairRef = ref;
                }}
              />
              <div
                className="weavess-wp-container-overlay-selection-area"
                ref={ref => {
                  this.selectionAreaRef = ref;
                }}
              />
            </div>
          </div>
          {this.props.stations.length > 0 ? (
            <TimeAxis
              ref={ref => {
                this.timeAxisRef = ref;
              }}
              startTimeSecs={this.props.startTimeSecs}
              endTimeSecs={this.props.endTimeSecs}
              borderTop
              labelWidthPx={
                this.props.initialConfiguration.labelWidthPx ||
                WeavessConstants.DEFAULT_LABEL_WIDTH_PIXELS
              }
              scrollbarWidthPx={WeavessConstants.SCROLLBAR_WIDTH_PIXELS}
              getViewRange={this.getViewRange}
              label={this.props.initialConfiguration.xAxisLabel}
            />
          ) : (
            []
          )}
        </div>
        <TimeRange labelWidthPx={this.props.initialConfiguration.labelWidthPx}>
          {this.displayCurrentTimeRange(
            this.props.startTimeSecs,
            this.props.endTimeSecs,
            this.state.viewRange
          )}
        </TimeRange>
      </div>
    );
  }

  /**
   * Exposed primarily for non-react users.
   * Force a refresh and redraw of the waveforms.
   */
  // eslint-disable-next-line react/sort-comp
  public refresh = (): void => {
    // fresh the zoom state, to ensure proper zoom if window has resized
    this.zoom(this.state.viewRange[0], this.state.viewRange[1]);
    if (this.timeAxisRef) this.timeAxisRef.update();
    this.renderWaveforms();
  };

  /**
   * Reset amplitudes of all waveforms in this panel.
   */
  public resetAmplitudes = (): void => {
    // Reset manual scale if this is the measure window
    if (this.stationComponentRefs)
      this.stationComponentRefs.forEach(station => station.resetAmplitude());
  };

  /**
   * get the currently displayed viewTimeInterval
   * (the startTime and endTime of the currently displayed view of the waveforms).
   *
   * @returns a time range that is referentially stable if unchanged
   */
  public getCurrentViewRangeInSeconds = (): WeavessTypes.TimeRange => {
    const waveformDataRange = this.props.endTimeSecs - this.props.startTimeSecs;
    const calculatedStartTime =
      waveformDataRange * this.state.viewRange[0] + this.props.startTimeSecs;
    const calculatedEndTime =
      waveformDataRange * this.state.viewRange[1] + this.props.startTimeSecs;
    if (
      !this.prevViewRange ||
      this.prevViewRange.startTimeSecs !== calculatedStartTime ||
      this.prevViewRange.endTimeSecs !== calculatedEndTime
    ) {
      this.prevViewRange = {
        startTimeSecs: calculatedStartTime,
        endTimeSecs: calculatedEndTime
      };
    }
    return this.prevViewRange;
  };

  /**
   * Updates the position and size dimensions of elements that the waveform display cares about. This
   * prevents one from having to ask the browser to calculate layout and styles during critical points
   * in the execution of the code.
   */
  private readonly updateTrackedDimensions = () => {
    if (this.waveformsViewportRef) {
      this.dimensions.viewport.clientHeight = this.waveformsViewportRef.clientHeight;
      this.dimensions.viewport.clientWidth = this.waveformsViewportRef.clientWidth;
      this.dimensions.viewport.scrollWidth = this.waveformsViewportRef.scrollWidth;
      this.dimensions.viewport.scrollLeft = this.waveformsViewportRef.scrollLeft;
      this.dimensions.viewport.scrollTop = this.waveformsViewportRef.scrollTop;
    }
    if (this.waveformsContainerRef) {
      this.dimensions.viewportContentContainer.clientWidth = this.waveformsContainerRef.clientWidth;
    }
    if (this.canvasRef) {
      this.dimensions.canvas.rect = this.canvasRef.getBoundingClientRect();
      this.dimensions.canvas.clientWidth = this.canvasRef.clientWidth;
    }
  };

  /**
   * Computes the time in seconds for the mouse x position, represented as a fraction of the canvas.
   *
   * @param mouseXPositionFraction the mouse x position from 0 to 1, where 0 is the far left and 1 is the far right of the canvas
   * @returns The computed time in seconds
   */
  public readonly computeTimeSecsForMouseXFractionalPosition = (
    mouseXPositionFraction: number
  ): number => {
    return computeTimeSecsForMouseXPositionFraction(
      mouseXPositionFraction,
      { startTimeSecs: this.props.startTimeSecs, endTimeSecs: this.props.endTimeSecs },
      this.state.viewRange
    );
  };

  /**
   * Computes the time in epoch seconds when given an x pixel position on the screen.
   *
   * @param mouseXPx the x position in pixels in question
   * @returns the time represented by that location
   */
  public readonly computeTimeSecsFromMouseXPixels = (mouseXPx: number): number => {
    return convertPixelOffsetToTime(
      mouseXPx,
      this.getCanvasRect(),
      { startTimeSecs: this.props.startTimeSecs, endTimeSecs: this.props.endTimeSecs },
      this.state.viewRange
    );
  };

  /**
   * Computes a fraction representing where on the canvas an x pixel value is found.
   * 0 means the left side of the canvas, 1 means the right. Value can be out of these bounds.
   *
   * @param xPositionPx the input
   * @returns the fractional x position on the canvas
   */
  public readonly computeFractionOfCanvasFromXPositionPx = (xPositionPx: number): number => {
    return convertPixelOffsetToFractionalPosition(this.getCanvasRect(), xPositionPx);
  };

  /**
   * Gets the bounding client rectangle of the waveform panel's canvas element in the DOM.
   *
   * @returns the canvas' bounding rectangle, or undefined if no canvas is found.
   */
  public readonly getCanvasBoundingClientRect = (): DOMRect | undefined =>
    this.canvasRef?.getBoundingClientRect();

  /**
   * Gets the bounding client rectangle of the waveform panel's canvas element in the DOM.
   *
   * @returns the canvas' bounding rectangle, or undefined if no canvas is found.
   */
  public readonly getWaveformPanelBoundingClientRect = (): DOMRect | undefined =>
    this.weavessRootRef?.getBoundingClientRect();

  /**
   * Removes the brush div, is public so it be hit with weavess reference
   */
  public clearBrushStroke = (): void => {
    if (!this.selectionAreaRef) {
      return;
    }
    this.selectionAreaRef.style.display = 'none';
    this.selectionStart = undefined;
    this.brushType = undefined;
    this.startOfBrush = true;
  };

  /**
   * Zooms to the provided time range [startTimeSecs, endTimeSecs].
   *
   * @param startTimeSecs the start time in seconds
   * @param endTimeSecs the end time in seconds
   */
  public readonly zoomToTimeWindow = (startTimeSecs: number, endTimeSecs: number): void => {
    const scale = d3
      .scaleLinear()
      .domain([this.props.startTimeSecs, this.props.endTimeSecs])
      .range([0, 1])
      .clamp(true);
    defer(() => this.zoom(scale(startTimeSecs), scale(endTimeSecs)));
  };

  private readonly documentPreventCtrlMouseWheel = e => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  };

  /**
   * return the current view range in [0,1]
   * where 0 = this.props.startTimeSecs
   * and 1 = this.props.endTimeSecs
   */
  private readonly getViewRange = () => this.state.viewRange;

  /**
   * onScroll handler for viewport scroll events.
   * Throttled ever 16ms to avoid thrashing.
   */
  private readonly onScroll = () => {
    if (!this.waveformsViewportRef || !this.stationComponentRefs || !this.timeAxisRef) {
      return;
    }

    // check if zooming; if so enure the vertical scrollbar does not scroll
    if (this.ctrlKey) {
      this.waveformsViewportRef.scroll({ top: this.dimensions.viewport.scrollTop });
    } else {
      this.updateTrackedDimensions();
      this.updateScrollPosition();
    }

    const labelWidthPx =
      this.props.initialConfiguration.labelWidthPx || WeavessConstants.DEFAULT_LABEL_WIDTH_PIXELS;

    const timeRangeLeft =
      this.dimensions.viewport.scrollLeft /
      (this.dimensions.viewportContentContainer.clientWidth - labelWidthPx);

    const timeRangeRight =
      (this.dimensions.viewport.scrollLeft + this.dimensions.canvas.clientWidth) /
      (this.dimensions.viewportContentContainer.clientWidth - labelWidthPx);

    // Only call setState if the time range has actually changed.
    if (this.state.viewRange[0] !== timeRangeLeft || this.state.viewRange[1] !== timeRangeRight) {
      this.setState({ viewRange: [timeRangeLeft, timeRangeRight] });
    }

    this.timeAxisRef.update();

    // don't update tracked dimensions again.
    this.renderWaveforms(false);
  };

  /**
   * Zoom in on mouse wheel
   *
   * @param e
   */
  private readonly onMouseWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!this.canvasRef) return;

    const modPercent = 0.4;

    if (e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      // compute current x position in [0,1] and zoom to that point
      const xFrac =
        (e.clientX - this.canvasRef.getBoundingClientRect().left) /
        this.canvasRef.getBoundingClientRect().width;

      // zoom out
      if (e.deltaY > 0) {
        this.zoomByPercentageToPoint(modPercent, xFrac);
      } else {
        // zoom in
        // eslint-disable-next-line no-lonely-if
        if (!this.hasReachedMaxZoomLevel()) {
          this.zoomByPercentageToPoint(-modPercent, xFrac);
        } else {
          this.props.toast(WeavessMessages.maxZoom);
        }
      }
      this.renderWaveforms();
    } else if (e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      if (e.deltaY > 0) {
        // pan left
        this.panByPercentage(-modPercent);
      } else {
        // pan right
        this.panByPercentage(modPercent);
      }
      this.renderWaveforms();
    }
  };

  /**
   * onKeyDown event handler
   *
   * @param e
   */
  private readonly onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    this.ctrlKey = e.ctrlKey;

    // Hot key definitions
    const amplitudeScaleResetHotKey = this.props.initialConfiguration.hotKeys.amplitudeScaleReset;
    const maskCreateHotKey = this.props.initialConfiguration.hotKeys.maskCreate;
    // check for amplitude reset for all channels
    if (
      amplitudeScaleResetHotKey &&
      WeavessUtil.isHotKeyCommandSatisfied(e.nativeEvent, amplitudeScaleResetHotKey)
    ) {
      this.props.resetAmplitudes();
    }
    // check for mask create hot key
    else if (
      maskCreateHotKey &&
      WeavessUtil.isHotKeyCommandSatisfied(e.nativeEvent, maskCreateHotKey)
    ) {
      this.brushType = BrushType.CreateMask;
    }
  };

  /**
   * onKeyUp event handler
   *
   * @param e
   */
  private readonly onKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    this.ctrlKey = e.ctrlKey;

    const maskCreateHotKey = this.props.initialConfiguration.hotKeys.maskCreate;
    if (
      maskCreateHotKey &&
      maskCreateHotKey.indexOf(e.nativeEvent.code) > -1 &&
      !this.selectionStart
    ) {
      this.brushType = undefined;
    }
  };

  /**
   * Creates all of the markers.
   *
   * @param props the waveform panel props
   *
   * @returns an array JSX elements
   */
  private readonly createAllMarkers = (props: WaveformPanelProps): JSX.Element[] => [
    ...this.memoizedCreateVerticalMarkers(
      props.startTimeSecs,
      props.endTimeSecs,
      props.markers ? props.markers.verticalMarkers : undefined
    ),
    ...this.memoizedCreateMoveableMarkers(
      props.startTimeSecs,
      props.endTimeSecs,
      props.markers ? props.markers.moveableMarkers : undefined,
      this.getCurrentViewRangeInSeconds,
      () => (this.waveformsContainerRef ? this.waveformsContainerRef.clientWidth : 0),
      () => (this.waveformsViewportRef ? this.waveformsViewportRef.clientWidth : 0),
      props.events
        ? (marker: WeavessTypes.Marker) => {
            if (props.events.onUpdateMarker) {
              props.events.onUpdateMarker(marker);
            }
          }
        : undefined,
      props.initialConfiguration.labelWidthPx || WeavessConstants.DEFAULT_LABEL_WIDTH_PIXELS
    ),
    ...this.memoizedCreateSelectionWindowMarkers(
      props.startTimeSecs,
      props.endTimeSecs,
      props.markers ? props.markers.selectionWindows : undefined,
      this.getCurrentViewRangeInSeconds,
      () => this.canvasRef,
      () => (this.waveformsContainerRef ? this.waveformsContainerRef.clientWidth : 0),
      // TODO verify that this is correct for the panel level selection windows: this.waveformsViewportRef
      () => (this.waveformsContainerRef ? this.waveformsContainerRef.clientWidth : 0),
      this.computeTimeSecsForMouseXFractionalPosition,
      this.onMouseMove,
      this.onMouseDown,
      this.onMouseUp,
      props.events
        ? (selection: WeavessTypes.SelectionWindow) => {
            if (props.events.onMoveSelectionWindow) {
              props.events.onMoveSelectionWindow(selection);
            }
          }
        : undefined,
      props.events
        ? (selection: WeavessTypes.SelectionWindow) => {
            if (props.events.onUpdateSelectionWindow) {
              props.events.onUpdateSelectionWindow(selection);
            }
          }
        : undefined,
      props.events
        ? (selection: WeavessTypes.SelectionWindow, timeSecs: number) => {
            if (props.events.onClickSelectionWindow) {
              props.events.onClickSelectionWindow(selection, timeSecs);
            }
          }
        : undefined,
      props.initialConfiguration.labelWidthPx || WeavessConstants.DEFAULT_LABEL_WIDTH_PIXELS
    )
  ];

  /**
   * Sets the prevScrollLeftPx to infinity to guarantee that labels will be repositioned.
   */
  private readonly invalidateScrollLeftPos = () => {
    this.prevScrollLeftPx = Infinity;
  };

  /**
   * Adds a channel to the list of visible channels, and invalidates the scroll left position
   * to ensure that the label will be properly positioned for the new channel.
   *
   * @param channel the channel to add to the internal visibleChannels list
   */
  private readonly addVisibleChannel = (channel: Channel) => {
    this.invalidateScrollLeftPos();
    this.visibleChannels = this.visibleChannels.push(channel);
  };

  /**
   * Removes the channel from the list of visible channels.
   */
  private readonly removeVisibleChannel = (channel: Channel) => {
    this.visibleChannels = this.visibleChannels.remove(
      this.visibleChannels.findIndex(c => c === channel)
    );
  };

  /**
   * Identifies whether the channel is visible or not.
   */
  private readonly isChannelVisible = (channel: Channel): boolean =>
    !!channel && !!this.visibleChannels.includes(channel);

  /**
   * Adds or removes a channel from the list of visible channels.
   *
   * @param station: the station to which the channel belongs.
   * @param channelId: The ID of the channel within that station.
   * @param isVisible Channel is added if true, removed if false.
   */
  private readonly updateChannelVisibility = (
    station: Station,
    channelId: string,
    isVisible: boolean
  ) => {
    const channel = station.nonDefaultChannelRefs[channelId];
    if (channel) {
      if (!this.visibleChannels.includes(channel) && isVisible) {
        this.addVisibleChannel(channel);
      } else if (this.visibleChannels.includes(channel) && !isVisible) {
        this.removeVisibleChannel(channel);
      }
    }
  };

  /**
   * Updates the channel visibility list for all channels within the station.
   *
   * @param stationId the ID of the station we want to update.
   * @param isVisible whether to add or remove child (non default) channels from the station. Parent channels,
   * (default channels) will never be removed from visibility, since they cannot be collapsed.
   */
  private readonly updateVisibleChannelsForStation = (stationId: string, isVisible = true) => {
    const station: Station | undefined = this.stationComponentRefs?.get(stationId);
    if (!station) {
      return;
    }
    const defaultChan = station.defaultChannelRef;
    if (defaultChan && !this.isChannelVisible(defaultChan)) {
      this.visibleChannels = this.visibleChannels.push(defaultChan);
    }
    if (station.state.expanded) {
      // eslint-disable-next-line no-restricted-syntax
      for (const channelId in station.nonDefaultChannelRefs) {
        if (Object.prototype.hasOwnProperty.call(station.nonDefaultChannelRefs, channelId)) {
          this.updateChannelVisibility(station, channelId, isVisible);
        }
      }
    }
  };

  /**
   * handler for the ref callback for stations. As a side effect, adds the station's
   * default channel to the visible list of channels.
   *
   * @param stationRef: the ref to the station provided by the React ref callback.
   * If null, will be a no-op.
   */
  private readonly setStationComponentRef = (stationRef: Station | null) => {
    if (this.stationComponentRefs && stationRef) {
      // id should be set when station is created.
      this.stationComponentRefs.set(stationRef.props.station.id, stationRef);
      this.updateVisibleChannelsForStation(stationRef.props.station.id);
    }
  };

  /**
   * @returns a ref to the canvas element on which all waveforms are drawn.
   */
  private readonly getCanvasRef = () => this.canvasRef;

  /**
   * @returns the bounding client rectangle for the canvas.
   */
  private readonly getCanvasRect = () => this.dimensions.canvas.rect;

  /**
   * A set of converter functions that are passed to stations for converting position to
   * and from screen and time units.
   * */
  // eslint-disable-next-line react/sort-comp
  private readonly converters = {
    computeTimeSecsForMouseXFractionalPosition: this.computeTimeSecsForMouseXFractionalPosition,
    computeTimeSecsFromMouseXPixels: this.computeTimeSecsFromMouseXPixels,
    computeFractionOfCanvasFromMouseXPx: this.computeFractionOfCanvasFromXPositionPx
  };

  /**
   * Creates all of the stations. Parameters should be referentially stable for
   * optimal rendering.
   *
   * @param props the waveform panel props
   *
   * @returns an array JSX elements
   */
  private readonly createStationsJsx = ({
    stations,
    initialConfiguration,
    events,
    startTimeSecs,
    endTimeSecs,
    shouldRenderWaveforms,
    shouldRenderSpectrograms,
    selections,
    toast,
    updateMeasureWindow,
    getPositionBuffer,
    getBoundaries
  }: WaveformPanelProps): JSX.Element[] => {
    const stationElements: JSX.Element[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const station of stations) {
      stationElements.push(
        <Station
          // data props
          key={station.id}
          ref={this.setStationComponentRef}
          initialConfiguration={initialConfiguration}
          displayStartTimeSecs={startTimeSecs}
          displayEndTimeSecs={endTimeSecs}
          shouldRenderWaveforms={shouldRenderWaveforms}
          shouldRenderSpectrograms={shouldRenderSpectrograms}
          workerRpcs={this.workerRpcs}
          selections={selections ?? this.emptySelection}
          station={station}
          customLabel={this.props.customLabel}
          glMin={this.props.convertTimeToGL(startTimeSecs)}
          glMax={this.props.convertTimeToGL(endTimeSecs)}
          toast={toast}
          isMeasureWindow={this.props.isMeasureWindow}
          getViewRange={this.getViewRange}
          canvasRef={this.getCanvasRef}
          getCanvasBoundingRect={this.getCanvasRect}
          getPositionBuffer={getPositionBuffer}
          getBoundaries={getBoundaries}
          renderWaveforms={this.renderWaveforms}
          getCurrentViewRangeInSeconds={this.getCurrentViewRangeInSeconds}
          converters={this.converters}
          events={events?.stationEvents}
          onMouseMove={this.onMouseMove}
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          updateMeasureWindow={updateMeasureWindow || undefined}
          updateVisibleChannelForStation={this.updateVisibleChannelsForStation}
        />
      );
    }
    return stationElements;
  };

  /**
   * draw time range of current view as human-readable string
   */
  private readonly displayCurrentTimeRange = (
    startTimeSecs: number,
    endTimeSecs: number,
    viewRange: [number, number]
  ) => {
    const scale = d3.scaleLinear().domain([0, 1]).range([startTimeSecs, endTimeSecs]);
    const left = scale(viewRange[0]);
    const right = scale(viewRange[1]);
    return `${moment
      .unix(left)
      .utc()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .format('YYYY-MM-DD HH:mm:ss.SSS')} + ${(moment as any).preciseDiff(
      moment.unix(right),
      moment.unix(left)
    )}`;
  };

  /**
   * If WEAVESS is contained inside of a div with flex layout, sizing it with height=100% doesn't work.
   */
  private createRootStyle(): React.CSSProperties & { '--weavess-scrollbar-track-margin': string } {
    if (this.props.flex) {
      return {
        flex: '1 1 0',
        position: 'relative',
        // this custom property is used in the css to set the webkit scrollbar margin (position the left side of the scrollbar).
        '--weavess-scrollbar-track-margin': `${this.props.initialConfiguration.labelWidthPx}px`
      };
    }

    return {
      height: '100%',
      position: 'relative',
      width: '100%',
      boxSizing: 'content-box',
      // this custom property is used in the css to set the webkit scrollbar margin (position the left side of the scrollbar).
      '--weavess-scrollbar-track-margin': `${this.props.initialConfiguration.labelWidthPx}px`
    };
  }

  /**
   * Render currently visible waveforms to the canvas.
   */
  // eslint-disable-next-line react/sort-comp
  private readonly renderWaveforms = (shouldUpdateDimensions = true): void => {
    // don't render yet if we are resizing
    if (this.props.isResizing !== undefined && this.props.isResizing) {
      defer(this.renderWaveforms, WeavessConstants.ONE_FRAME_MS);
      return;
    }
    if (shouldUpdateDimensions) {
      this.updateTrackedDimensions();
    }
    window.cancelAnimationFrame(this.prevRAF);
    this.prevRAF = window.requestAnimationFrame(() => {
      // if we don't have a set size to display, abort
      if (
        !this.weavessRootRef ||
        !this.stationComponentRefs ||
        !this.waveformsViewportRef ||
        !this.canvasRef ||
        this.dimensions.viewport.clientHeight === 0 ||
        this.dimensions.viewport.clientWidth === 0
      ) {
        return;
      }

      this.updateScrollPosition();

      this.renderer.setScissorTest(true);

      this.visibleChannels.forEach(channel => {
        if (channel) {
          channel.renderScene(this.renderer, this.dimensions.canvas.rect);
        }
      });

      this.renderer.setScissorTest(false);
    });
  };

  /**
   * resize the renderer to fit the new canvas size
   */
  private updateSize() {
    if (!this.canvasRef) return;
    if (this.props.isResizing) {
      // clear the display while we are resizing so we don't draw distorted images
      this.renderer.clear(true, true, true);
      defer(() => this.updateSize(), WeavessConstants.ONE_FRAME_MS);
      return;
    }

    const width = this.canvasRef.offsetWidth;
    const height = this.canvasRef.offsetHeight;
    if (
      this.dimensions.canvas.offsetWidth !== width ||
      this.dimensions.canvas.offsetHeight !== height
    ) {
      this.dimensions.canvas.offsetWidth = width;
      this.dimensions.canvas.offsetHeight = height;
      this.renderer.setSize(width, height, false);
    }
  }

  /**
   * This is used to keep the label aligned to the left when the user is
   * scrolling to the left and right (for example, after zooming in).
   */
  private updateScrollPosition() {
    if (
      this.waveformsViewportRef &&
      this.stationComponentRefs &&
      this.prevScrollLeftPx !== this.dimensions.viewport.scrollLeft
    ) {
      this.prevScrollLeftPx = this.dimensions.viewport.scrollLeft;
      this.stationComponentRefs.forEach(station => {
        if (this.waveformsViewportRef) {
          station.updateMaskLabels();
        }
      });
      this.visibleChannels.forEach(async chan => {
        await chan.updateAmplitude(this.getCurrentViewRangeInSeconds());
      });
    }
  }

  /**
   * Handles a double click event.
   *
   * @param event
   */
  private readonly onDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    this.handleSingleDoubleClick.onDoubleClick(event, () => {
      const defaultZoomWindow = this.props.defaultZoomWindow
        ? this.props.defaultZoomWindow
        : {
            startTimeSecs: this.props.startTimeSecs,
            endTimeSecs: this.props.endTimeSecs
          };

      // double click registered, clear mouse down state
      this.isMouseDown = undefined;
      if (this.timePopoverId) {
        clearTimeout(this.timePopoverId);
        this.timePopoverId = undefined;
      }

      if (this.waveformsViewportRef) {
        // reset the scroll bar to the start to prevent rendering issues
        this.waveformsViewportRef.scrollLeft = 0;
      }
      this.zoomToTimeWindow(defaultZoomWindow.startTimeSecs, defaultZoomWindow.endTimeSecs);
    });
  };

  /**
   * mouse down event handler
   *
   * @param e
   * @param xPct
   * @param channelId
   * @param timeSecs
   * @param isDefaultChannel
   */
  // eslint-disable-next-line complexity
  private readonly onMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    xPct: number | undefined = undefined,
    channelId: string | undefined = undefined,
    timeSecs: number | undefined = undefined,
    isDefaultChannel: boolean | undefined = undefined
  ) => {
    // keep track of the mouse down state
    if (timeSecs) {
      // markers do not have time seconds, only track when on the waveform
      this.isMouseDown = { clientX: e.clientX, clientY: e.clientY };
    }
    // if the amplitude scaling hotkey is in use - do not brush
    // show or hide the time popover
    this.showHideTimePopover(e, timeSecs);

    // check if any keys are pressed on mouse down
    // zoom mode
    if (e.ctrlKey || e.metaKey) {
      this.brushType = BrushType.Zoom;
    }

    // set the zoom start point if a brush is being used
    if (this.brushType === BrushType.Zoom) {
      this.selectionStart = xPct;
    } else if (this.brushType === BrushType.CreateMask) {
      const disableMaskModification = isDefaultChannel
        ? this.props.initialConfiguration.defaultChannel.disableMaskModification
        : this.props.initialConfiguration.nonDefaultChannel.disableMaskModification;
      if (!disableMaskModification) {
        this.selectionStart = xPct;
      } else {
        this.selectionStart = undefined;
        this.brushType = undefined;
        this.props.toast(WeavessMessages.maskModificationDisabled);
      }
    }

    // Select channel if no channels selected and using CreateMask brush
    if (this.brushType === BrushType.CreateMask) {
      if (
        !this.props.selections ||
        !this.props.selections.channels ||
        this.props.selections.channels.length < 1
      ) {
        if (this.props.selectChannel && channelId) {
          this.props.selectChannel(channelId);
          this.needToDeselect = true;
        }
      }
    }
  };

  /**
   * mouse move event handler
   *
   * @param e
   * @param xPct
   * @param timeSecs
   */
  private readonly onMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    xPct: number | undefined = undefined,
    timeSecs: number | undefined = undefined
  ) => {
    if (!this.selectionAreaRef) return;

    const width = this.dimensions.canvas.rect.width ?? 0;
    if (!xPct) {
      const leftOffset = this.dimensions.canvas.rect.left ?? 0;
      // eslint-disable-next-line no-param-reassign
      xPct = (e.clientX - leftOffset) / width;
    }

    // show or hide the time popover
    // TODO: time seconds is not available on mouse move over selection windows
    this.showHideTimePopover(e, timeSecs);

    // move the crosshair to the current pointer location
    if (this.crosshairRef) {
      this.crosshairRef.style.transform = `translateX(${xPct * width}px)`;
    }

    // if the user has moved more than 1% of the viewport, consider it an operation
    // Paint !
    if (this.selectionStart) {
      const fracToPct = 100;
      // minimum amount the mouse must move until it begins a brush effect
      // 0.01 = 1% of the current view range
      const minMovementDeltaFrac = 0.01;
      if (
        Math.abs(this.selectionStart - xPct) > minMovementDeltaFrac ||
        Math.abs(xPct - this.selectionStart) > minMovementDeltaFrac
      ) {
        if (this.startOfBrush) {
          this.selectionAreaRef.style.display = 'initial';
          this.startOfBrush = false;
        }
        const start = Math.min(this.selectionStart, xPct);
        const end = Math.max(this.selectionStart, xPct);
        const left = `${start * fracToPct}%`;
        const right = `${(1 - end) * fracToPct}%`;
        this.selectionAreaRef.style.left = left;
        this.selectionAreaRef.style.right = right;
        // eslint-disable-next-line
        if (this.brushType === BrushType.CreateMask) {
          // eslint-disable-next-line max-len
          this.selectionAreaRef.style.backgroundColor = 'rgba(145, 228, 151, .3)'; // ! should be set from user preferences
        } else {
          this.selectionAreaRef.style.backgroundColor = 'rgba(150,150,150,0.3)';
        }
      }
    }
  };

  /**
   * mouse up event handler
   *
   * @param event
   * @param xPct
   * @param channelId
   * @param timeSecs
   * @param isDefaultChannel
   */
  // eslint-disable-next-line complexity
  private readonly onMouseUp = (
    event: React.MouseEvent<HTMLDivElement>,
    xPct: number | undefined = undefined,
    channelId: string | undefined = undefined,
    timeSecs: number | undefined = undefined,
    isDefaultChannel: boolean | undefined = undefined
  ) => {
    // ignore any mouse up events if the mouse down flag is not set
    if (!this.isMouseDown) {
      return;
    }

    const mouseDown = this.isMouseDown;

    // track the mouse down state
    this.isMouseDown = undefined;
    if (this.timePopoverId) {
      clearTimeout(this.timePopoverId);
      this.timePopoverId = undefined;
    }

    // show or hide the time popover
    this.showHideTimePopover(event, timeSecs);

    // If the mouse is released *before* a brush stroke has been made
    // Cancel the stroke so as to not interfere with other mouse events
    if (this.startOfBrush) {
      if (this.selectionAreaRef) {
        this.selectionAreaRef.style.display = 'none';
      }
      this.selectionStart = undefined;
      this.brushType = undefined;
      this.startOfBrush = true;
    }
    if (!this.selectionAreaRef) return;

    if (!xPct) {
      const leftOffset = this.canvasRef ? this.canvasRef.getBoundingClientRect().left : 0;
      const width = this.canvasRef ? this.canvasRef.getBoundingClientRect().width : 0;
      // eslint-disable-next-line no-param-reassign
      xPct = (event.clientX - leftOffset) / width;
    }

    // eslint-disable-next-line no-nested-ternary
    const events = isDefaultChannel
      ? this.props.events?.stationEvents?.defaultChannelEvents?.events
        ? this.props.events?.stationEvents.defaultChannelEvents.events
        : undefined
      : this.props.events?.stationEvents?.nonDefaultChannelEvents?.events
      ? this.props.events?.stationEvents.nonDefaultChannelEvents.events
      : undefined;

    // if the user is zooming, perform the zoom
    if (this.brushType && !this.startOfBrush && this.selectionStart) {
      const scale = d3.scaleLinear().domain([0, 1]).range(this.state.viewRange);
      const start = Math.min(this.selectionStart, xPct);
      const end = Math.max(this.selectionStart, xPct);
      if (this.brushType === BrushType.Zoom) {
        if (!this.hasReachedMaxZoomLevel()) {
          this.zoom(scale(start), scale(end));
        } else {
          this.props.toast(WeavessMessages.maxZoom);
        }
      } else if (this.brushType === BrushType.CreateMask) {
        const scaleTime = d3
          .scaleLinear()
          .domain([0, 1])
          .range([this.props.startTimeSecs, this.props.endTimeSecs]);

        if (events) {
          if (events.onMaskCreateDragEnd) {
            const channels = flatMap(
              this.props.stations.map<WeavessTypes.Channel[]>((s: WeavessTypes.Station) =>
                s.nonDefaultChannels
                  ? [s.defaultChannel, ...s.nonDefaultChannels]
                  : [s.defaultChannel]
              )
            );
            const channel = channels.find(c => c.id === channelId);
            if (channel) {
              // determine if there is an offset applied to the channel data
              const timeOffsetSeconds = channel.timeOffsetSeconds ? channel.timeOffsetSeconds : 0;
              events.onMaskCreateDragEnd(
                event,
                scaleTime(scale(start)) - timeOffsetSeconds,
                scaleTime(scale(end)) - timeOffsetSeconds,
                this.needToDeselect
              );
            }
          }
        }
        this.needToDeselect = false;
      }
    } else {
      // handle a single click event, only if the user has not moved the mouse
      // eslint-disable-next-line no-lonely-if
      if (event.clientX === mouseDown.clientX && event.clientY === mouseDown.clientY) {
        this.handleSingleDoubleClick.onSingleClickEvent(
          event,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (e: React.MouseEvent<HTMLDivElement> | any) => {
            // handle onChannelClick event if not zooming or modifying a mask
            if (events) {
              if (events.onChannelClick && channelId && timeSecs) {
                events.onChannelClick(e, channelId, timeSecs);
              }
            }
          }
        );
      }
    }

    if (this.brushType !== BrushType.CreateMask) {
      this.selectionAreaRef.style.display = 'none';
      this.selectionStart = undefined;
      this.brushType = undefined;
      this.startOfBrush = true;
    }
  };

  /**
   * Shows or hides the time popover.
   *
   * @param e the mouse event
   * @param timeSecs the current time in seconds
   *
   */
  // eslint-disable-next-line complexity
  private readonly showHideTimePopover = (
    e: React.MouseEvent<HTMLDivElement>,
    timeSecs: number | undefined
  ) => {
    if (this.timePopoverRef) {
      if (this.isMouseDown && timeSecs) {
        if (this.canvasRef) {
          const canvasBoundingClientRect = this.canvasRef.getBoundingClientRect();
          // calculate the popover position based on the current mouse event
          this.timePopoverLeftPosition = e.clientX - canvasBoundingClientRect.left;
          // function used to update the current state of the time popover
          const updatePopover = () => {
            if (
              this.timePopoverRef &&
              this.timePopoverRef.popoverElement &&
              this.timePopoverContentRef &&
              this.timePopoverRef.popoverElement.parentElement
            ) {
              defer(() => {
                if (
                  this.timePopoverRef &&
                  this.timePopoverRef.popoverElement &&
                  this.timePopoverContentRef &&
                  this.timePopoverRef.popoverElement.parentElement
                ) {
                  this.timePopoverRef.popoverElement.style.left = `${
                    this.state.timePopoverPosition === Position.TOP_RIGHT
                      ? this.timePopoverLeftPosition - POPOVER_POSITION_PADDING
                      : this.timePopoverLeftPosition
                  }px`;
                  this.timePopoverContentRef.innerHTML = moment
                    .unix(timeSecs)
                    .utc()
                    .format('YYYY-MM-DD HH:mm:ss.SSS');
                }
              });
            }
          };

          if (this.canvasRef.width - this.timePopoverLeftPosition < MINIMUM_THRESHOLD) {
            if (this.state.timePopoverPosition !== Position.TOP_RIGHT) {
              this.setState({ timePopoverPosition: Position.TOP_RIGHT });
            }
          } else if (this.timePopoverLeftPosition < MINIMUM_THRESHOLD) {
            if (this.state.timePopoverPosition !== Position.TOP_LEFT) {
              this.setState({ timePopoverPosition: Position.TOP_LEFT });
            }
          } else if (this.state.timePopoverPosition !== Position.TOP) {
            this.setState({ timePopoverPosition: Position.TOP });
          }

          if (this.timePopoverRef.state.isOpen) {
            this.timePopoverRef.setState({ isOpen: true }, updatePopover);
            this.setState({ timePopoverIsOpen: true });
          } else {
            // popover is currently not open, delay opening slightly to
            // avoid conflict with a double click event
            // eslint-disable-next-line no-lonely-if
            if (!this.timePopoverId) {
              this.timePopoverId = delay(
                () => {
                  if (this.timePopoverRef && this.isMouseDown) {
                    this.timePopoverRef.setState({ isOpen: true }, updatePopover);
                    this.setState({ timePopoverIsOpen: true });
                  }
                  this.timePopoverId = undefined;
                },
                // typical default timing is 500 ms (half a second)
                // between clicks for a double click to register
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                500
              );
            }
          }
        }
      } else {
        if (this.timePopoverContentRef) {
          this.timePopoverContentRef.innerHTML = '';
        }
        this.timePopoverRef.setState({ isOpen: false });
        this.setState({ timePopoverIsOpen: false });
      }
    }
  };

  /**
   * Returns true if the max zoom level has been reached. False otherwise.
   */
  private readonly hasReachedMaxZoomLevel = (): boolean => {
    const maxZoomDiff = 0.001;
    return (
      parseFloat(this.state.viewRange[1].toFixed(4)) -
        parseFloat(this.state.viewRange[0].toFixed(4)) <=
      maxZoomDiff
    );
  };

  /**
   * zoomPct in [0,1], x in [0,1]
   *
   * @param zoomPct
   * @param x
   */
  private readonly zoomByPercentageToPoint = (zoomPct: number, x: number) => {
    const theRange = this.state.viewRange[1] - this.state.viewRange[0];
    const zoom = (theRange * zoomPct) / 2.0; // eslint-disable-line
    const left = this.state.viewRange[0] - zoom * x;
    const right = this.state.viewRange[1] + zoom * (1 - x);
    this.zoom(left, right);
  };

  /**
   * pct in [0,1]
   *
   * @param pct
   */
  private readonly panByPercentage = (pct: number) => {
    const theRange = this.state.viewRange[1] - this.state.viewRange[0];
    const delta = theRange * pct;
    const left = this.state.viewRange[0] + delta;
    const right = this.state.viewRange[1] + delta;
    this.zoom(left, right);
  };

  /**
   * left/right are numbers between [0,1] denoting the left/right percentages of [start,end]
   *
   * @param start
   * @param end
   */
  // eslint-disable-next-line complexity
  private readonly zoom = (start: number, end: number) => {
    if (
      !this.waveformsContainerRef ||
      !this.canvasRef ||
      !this.waveformsViewportRef ||
      !this.timeAxisRef
    ) {
      return;
    }
    if (start < 0) {
      // eslint-disable-next-line no-param-reassign
      start = 0;
    }
    if (end > 1) {
      // eslint-disable-next-line no-param-reassign
      end = 1;
    }
    if (end < start) {
      const minDelta = 0.001;
      // eslint-disable-next-line no-param-reassign
      end = start + minDelta;
    }

    if (this.state.viewRange[0] !== start || this.state.viewRange[1] !== end) {
      if (start === 0 && end === 1) {
        this.waveformsContainerRef.style.width = 'initial';
      } else {
        const theRange = end - start;
        const labelWidthPx: number =
          this.props.initialConfiguration.labelWidthPx ||
          WeavessConstants.DEFAULT_LABEL_WIDTH_PIXELS;
        const pixels = this.canvasRef.clientWidth / theRange + labelWidthPx;
        this.waveformsContainerRef.style.width = `${pixels}px`;
        this.waveformsViewportRef.scrollLeft = start * (pixels - labelWidthPx);
      }

      this.setState({ viewRange: [start, end] });
      this.timeAxisRef.update();

      // Any zoom needs to reset manual scaling
      this.resetAmplitudes();

      this.visibleChannels.forEach(async chan => {
        await chan.updateAmplitude(this.getCurrentViewRangeInSeconds());
      });
      this.renderWaveforms();

      if (this.props.events.onZoomChange) {
        this.props.events.onZoomChange(this.getCurrentViewRangeInSeconds());
      }
    }
  };
}
// eslint-disable-next-line max-lines
