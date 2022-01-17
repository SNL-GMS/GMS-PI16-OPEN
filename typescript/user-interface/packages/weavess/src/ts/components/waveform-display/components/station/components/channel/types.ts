import { IconName, Intent } from '@blueprintjs/core';
import { WeavessTypes } from '@gms/weavess-core';

import { CommonStationProps } from '../../types';

export interface ChannelProps extends CommonStationProps {
  /** The index of the channel in relation to the station */
  index: number;

  /** Height of channel */
  height: number;

  /** true if waveforms should be rendered; false otherwise */
  shouldRenderWaveforms: boolean;

  /** true if spectrograms should be rendered; false otherwise */
  shouldRenderSpectrograms: boolean;

  /** default min max range scale */
  defaultRange?: WeavessTypes.Range;

  /** Web Workers */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workerRpcs: any[];

  /** Configuration for weavess */
  initialConfiguration: WeavessTypes.Configuration;

  /** Station Id as string */
  stationId: string;

  /** Channel configuration (Holds the Data) */
  channel: WeavessTypes.Channel;

  /** Epoch seconds start time */
  displayStartTimeSecs: number;

  /** Epoch seconds end time */
  displayEndTimeSecs: number;

  /** how much to offset the channel (used in mouse callbacks) */
  offsetSecs: number;

  /** Boolean is default channel */
  isDefaultChannel: boolean;

  /** Does have sub channels */
  isExpandable: boolean;

  /** Displaying sub channels */
  expanded: boolean;

  /** The selections */
  selections: WeavessTypes.Selections;

  /** Toggles red M when mask(s) is in view */
  showMaskIndicator: boolean;

  /** Distance */
  distance: number;

  /** Distance units */
  distanceUnits: WeavessTypes.DistanceUnits;

  /** Defines a custom component for displaying a custom label */
  customLabel?: React.FunctionComponent<WeavessTypes.LabelProps>;

  /** (optional) callback events Ex on label click */
  events?: WeavessTypes.ChannelEvents;

  /** the min boundary (x value) in gl units */
  glMin: number;

  /** the max boundary (x value) in gl units */
  glMax: number;

  // callbacks

  /** Ref to the html canvas element */
  canvasRef(): HTMLCanvasElement | null;

  /** gets the bounding rectangle for the canvas */
  getCanvasBoundingRect(): DOMRect;

  /**
   * Call back for toast, which is the notification pop up
   *
   * @param message message to be displayed as a string
   * @param intent (optional) NONE, PRIMARY, WARNING, DANGER ex NONE = "none"
   * @param icon (optional) the way it looks
   * @param timeout (optional) time before message disappears
   */
  toast(message: string, intent?: Intent, icon?: IconName, timeout?: number): void;

  /** Toggles display of sub channels */
  toggleExpansion?(): void;

  /**
   * @returns current view range as [0,1]
   */
  getViewRange(): [number, number];
}

export interface ChannelState {
  /** Waveform y-axis bounds */
  waveformYAxisBounds: WeavessTypes.YAxisBounds;

  /** Spectrogram y-axis bounds */
  spectrogramYAxisBounds: WeavessTypes.YAxisBounds;
}

export interface Handler<EventType> {
  test(event: EventType): boolean;
  action(event: EventType): boolean;
}
