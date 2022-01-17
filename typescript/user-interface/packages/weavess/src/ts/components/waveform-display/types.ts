import { IconName, Intent, Position } from '@blueprintjs/core';
import { WeavessTypes } from '@gms/weavess-core';

/** Brush Type */
export enum BrushType {
  /** zoom brush type */
  Zoom = 'Zoom',

  /** create mask brush type */
  CreateMask = 'CreateMask'
}

/**
 * Waveform DisplayProps
 */
export interface WaveformDisplayProps {
  /** waveform display configuration */
  initialConfiguration?: Partial<WeavessTypes.Configuration>;

  /** flex or not? */
  flex?: boolean;

  /** start time in seconds */
  startTimeSecs: number;

  /** end time in seconds */
  endTimeSecs: number;

  /** stations */
  stations: WeavessTypes.Station[];

  /** events */
  events: WeavessTypes.Events;

  /**
   * The range of the current interval.
   * Will default to use startTimeSec and endTimeSec if not provided
   */
  currentInterval?: WeavessTypes.TimeRange;

  /** selections */
  selections?: WeavessTypes.Selections;

  /** the initial zoom window */
  initialZoomWindow?: WeavessTypes.TimeRange;

  /** default zoom window */
  defaultZoomWindow?: WeavessTypes.TimeRange;

  /** markers */
  markers?: WeavessTypes.Markers;

  /** Defines a custom component for displaying a custom label */
  customLabel?: React.FunctionComponent<WeavessTypes.LabelProps>;

  /** display the measure window */
  showMeasureWindow?: boolean;

  /** specifies the measure window selection */
  measureWindowSelection?: WeavessTypes.MeasureWindowSelection;

  /** Defines a custom component for displaying a custom label on the measure window */
  customMeasureWindowLabel?: React.FunctionComponent<WeavessTypes.LabelProps>;

  /** event handler for clearing selected channels */
  clearSelectedChannels?(): void;

  /**
   * Event handler for selecting a channel
   *
   * @param channelId a Channel Id as a string
   */
  selectChannel?(channelId: string): void;

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
    channelSegment: WeavessTypes.ChannelSegment,
    timeRange?: WeavessTypes.TimeRange,
    isMeasureWindow?: boolean
  ): Promise<WeavessTypes.ChannelSegmentBoundaries>;
}

export interface WaveformDisplayState {
  /** Configuration for waveform display */
  initialConfiguration: WeavessTypes.Configuration;

  /** display the measure window */
  showMeasureWindow?: boolean;

  /** Determines if the measure window is displayed */
  isMeasureWindowVisible: boolean;

  /** Height of the measure window in pixels */
  measureWindowHeightPx: number;

  /** Selection info needed to render a measure window */
  measureWindowSelection: WeavessTypes.MeasureWindowSelection | undefined;

  /**
   * the previous measure window selection passed in from props
   * (used to ensure the measure window is only updated when expected)
   */
  prevMeasureWindowSelectionFromProps: WeavessTypes.MeasureWindowSelection | undefined;

  /** true if waveforms should be rendered; false otherwise */
  shouldRenderWaveforms: boolean;

  /** true if spectrograms should be rendered; false otherwise */
  shouldRenderSpectrograms: boolean;
}

export interface WaveformPanelProps {
  /** the display mode */
  // mode: WeavessTypes.Mode;

  /** Configuration for Waveform Panel */
  initialConfiguration: WeavessTypes.Configuration;

  /** true if waveforms should be rendered; false otherwise */
  shouldRenderWaveforms: boolean;

  /** true if spectrograms should be rendered; false otherwise */
  shouldRenderSpectrograms: boolean;

  /** Epoch seconds start */
  startTimeSecs: number;

  /** Epoch Seconds end */
  endTimeSecs: number;

  /** Array of Stations */
  stations: WeavessTypes.Station[];

  /** Call back events */
  events: WeavessTypes.Events;

  /* Is this part of the Measure Window */
  isMeasureWindow: boolean;

  /** Selections */
  selections?: WeavessTypes.Selections;

  /** the initial zoom window */
  initialZoomWindow?: WeavessTypes.TimeRange;

  /** Determines where zoom out defaults too */
  defaultZoomWindow?: WeavessTypes.TimeRange;

  /** (Optional) Markers for Waveform Panel */
  markers?: WeavessTypes.Markers;

  /** Sets as a flex display if active */
  flex?: boolean;

  /**
   * Indicates whether the display is being resized because
   * the measure window is being resized
   */
  isResizing?: boolean;

  customLabel?: React.FunctionComponent<WeavessTypes.LabelProps>;

  /**
   * Call back for toast, which is the notification pop up
   *
   * @param message message to be displayed as a string
   * @param intent (optional) NONE, PRIMARY, WARNING, DANGER ex NONE = "none"
   * @param icon (optional) the way it looks
   * @param timeout (optional) time before message disappears
   */
  toast(message: string, intent?: Intent, icon?: IconName, timeout?: number): void;

  /** Unselects channels */
  clearSelectedChannels?(): void;

  /** Selects channel
   *
   * @param channelId Channel Id as a string
   */
  selectChannel?(channelId: string): void;

  /**
   * Call back that updates the measure window
   *
   * @param stationId Station Id as a string
   * @param channel channel config as a Channel
   * @param startTimeSecs epoch seconds start
   * @param endTimeSecs epoch seconds end
   * @param isDefaultChannel boolean
   * @param removeSelection call back to remove selection
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
   *
   * @param id the id of a DataSegment for which to get the formatted position buffer data
   */
  getPositionBuffer?(id: string, startTime: number, endTime: number): Promise<Float32Array>;

  /**
   * Used to look up the Channel Segment Boundaries for a given channel segment by name
   */
  getBoundaries?(
    channelName: string,
    channelSegment: WeavessTypes.ChannelSegment,
    timeRange?: WeavessTypes.TimeRange,
    isMeasureWindow?: boolean | undefined
  ): Promise<WeavessTypes.ChannelSegmentBoundaries>;

  /**
   * Converts a time into GL Units (the units used in the WebGL clip space)
   *
   * @param timeSec the time you wish to convert
   */
  convertTimeToGL(timeSec: number): number;

  /**
   * Used to reset all waveform channel's amplitude scaling including the Measure Window
   */
  resetAmplitudes(): void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WaveformPanelState {
  /** The position of the time popover */
  timePopoverPosition: Position;

  /** flag for toggling whether or not the popover is open or closed for the time info label */
  timePopoverIsOpen: boolean;

  /**
   * A tuple with each element in [0,1] of form [start, end]. This will change as the user interacts.
   * 0 = this.props.startTimeSecs, initially
   * 1 = this.props.endTimeSecs, initially
   */
  viewRange: [number, number];
}
