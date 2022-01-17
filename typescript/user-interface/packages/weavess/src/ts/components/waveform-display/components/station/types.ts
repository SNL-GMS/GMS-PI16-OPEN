import { IconName, Intent } from '@blueprintjs/core';
import { WeavessTypes } from '@gms/weavess-core';

import { PositionConverters } from '../../../../util/types';

export interface CommonStationProps {
  /** A set of converter functions that convert between screen units and time units */
  converters: PositionConverters;

  /** Issues a re-render to re-paint the canvas */
  renderWaveforms(): void;

  /**
   * get the currently displayed viewTimeInterval
   * (the startTime and endTime of the currently displayed view of the waveforms)
   */
  getCurrentViewRangeInSeconds(): WeavessTypes.TimeRange;

  /**
   * Mouse move event
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param xPct percentage location x of mouse as a number
   * @param timeSecs the time in seconds
   */
  onMouseMove(e: React.MouseEvent<HTMLDivElement>, xPct: number, timeSecs: number): void;

  /**
   * Mouse down event
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param xPct percentage location x of mouse as a number
   * @param channelId channel Id as a string
   * @param timeSecs epoch seconds of mouse down
   * @param isDefaultChannel boolean
   */
  onMouseDown(
    e: React.MouseEvent<HTMLDivElement>,
    xPct: number,
    channelId: string,
    timeSecs: number,
    isDefaultChannel: boolean
  ): void;

  /**
   * Mouse up event
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param xPct percentage location x of mouse as a number
   * @param channelId channelId channel Id as a string
   * @param timeSecs timeSecs epoch seconds of mouse down
   * @param isDefaultChannel boolean
   */
  onMouseUp(
    e: React.MouseEvent<HTMLDivElement>,
    xPct: number,
    channelId: string,
    timeSecs: number,
    isDefaultChannel: boolean
  ): void;

  /* Is this part of the Measure Window */
  isMeasureWindow: boolean;

  /**
   * (optional) context menu creation
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param channelId channelId channel Id as a string
   * @param sdId station id as a string
   */
  onContextMenu?(e: React.MouseEvent<HTMLDivElement>, channelId: string, sdId?: string): void;

  /**
   * (optional) Updates the measure window
   *
   * @param stationId station id as a string
   * @param channel channel config as a Channel
   * @param startTimeSecs epoch start time secs
   * @param endTimeSecs epoch end time secs
   * @param isDefaultChannel boolean
   * @param removeSelection removed measure window selection div
   */
  updateMeasureWindow?(
    stationId: string,
    channel: WeavessTypes.Channel,
    startTimeSecs: number,
    endTimeSecs: number,
    isDefaultChannel: boolean,
    removeSelection: () => void
  ): void;

  /**
   * Used to look up the position buffer data (a Float32Array formatted like so: x y x y x y ...).
   * Takes the position buffer's id.
   */
  getPositionBuffer?(id: string, startTime: number, endTime: number): Promise<Float32Array>;

  /**
   * Used to look up the Channel Segment Boundaries for a given channel segment by name
   */
  getBoundaries?(
    channelName: string,
    channelSegment?: WeavessTypes.ChannelSegment,
    timeRange?: WeavessTypes.TimeRange
  ): Promise<WeavessTypes.ChannelSegmentBoundaries>;
}

export interface StationProps extends CommonStationProps {
  /** Configuration for weavess */
  initialConfiguration: WeavessTypes.Configuration;

  /** Station configuration (holds the data) */
  station: WeavessTypes.Station;

  /** Epoch Seconds start */
  displayStartTimeSecs: number;

  /** Epoch Seconds end */
  displayEndTimeSecs: number;

  /** true if waveforms should be rendered; false otherwise */
  shouldRenderWaveforms: boolean;

  /** true if spectrograms should be rendered; false otherwise */
  shouldRenderSpectrograms: boolean;

  /** Web workers */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workerRpcs: any[];

  /** The selections */
  selections: WeavessTypes.Selections;

  /** (optional) callbacks for events EX on station click */
  events?: WeavessTypes.StationEvents;

  /** Defines a custom component for displaying a custom label */
  customLabel?: React.FunctionComponent<WeavessTypes.LabelProps>;

  /** the min boundary (x value) in gl units */
  glMin: number;

  /** the max boundary (x value) in gl units */
  glMax: number;

  // callbacks
  /** Ref to the html canvas element */
  canvasRef(): HTMLCanvasElement | null;

  /** Gets the bounding rectangle for the canvas */
  getCanvasBoundingRect(): DOMRect;

  /**
   * @returns current view range as [0,1]
   */
  getViewRange(): [number, number];

  /**
   * Call back for toast, which is the notification pop up
   *
   * @param message message to be displayed as a string
   * @param intent (optional) NONE, PRIMARY, WARNING, DANGER ex NONE = "none"
   * @param icon (optional) the way it looks
   * @param timeout (optional) time before message disappears
   */
  toast(message: string, intent?: Intent, icon?: IconName, timeout?: number): void;

  /**
   * function to update the visibility of the channels for this station.
   *
   * @param stationId the id of the station to update
   */
  updateVisibleChannelForStation(stationId: string, isVisible: boolean): void;
}

export interface StationState {
  /** Toggles non default channels */
  expanded: boolean;

  /** Toggles red M on station when masks are in view */
  showMaskIndicator: boolean | false;
}
