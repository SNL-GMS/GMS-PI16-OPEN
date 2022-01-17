import { WeavessTypes } from '@gms/weavess-core';

export interface WaveformRendererProps {
  /** Epoch seconds start time */
  displayStartTimeSecs: number;

  /** Boolean is default channel */
  displayEndTimeSecs: number;

  /** Id of channel segment */
  channelSegmentId: string;

  /** Collection of channel segments */
  channelSegments: Map<string, WeavessTypes.ChannelSegment>;

  /** the min boundary (x value) in gl units */
  glMin: number;

  /** the max boundary (x value) in gl units */
  glMax: number;

  /** Collection of masks */
  masks?: WeavessTypes.Mask[];

  /** Web Workers */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workerRpcs: any[];

  /** default min/max range scale for the y-axis */
  defaultRange?: WeavessTypes.Range;

  /** helps identify the channel associated to this renderer */
  channelName: string;

  // Callbacks
  /**
   * Sets the Y axis bounds
   *
   * @param min minimum bound as a number
   * @param max Maximum bound as a number
   */
  setYAxisBounds(min: number, max: number);

  /** Issues a re render */
  renderWaveforms(): void;

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
    timeRange?: WeavessTypes.TimeRange
  ): Promise<WeavessTypes.ChannelSegmentBoundaries>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WaveformRendererState {}

export interface Float32ArrayData {
  /** Color */
  color?: string;

  /** Display type */
  displayType?: WeavessTypes.DisplayType[];

  /** Point size */
  pointSize?: number;

  /** Waveform data */
  float32Array: Float32Array;
}
