import { IconName, Intent } from '@blueprintjs/core';
import { WeavessTypes } from '@gms/weavess-core';
import React from 'react';

import { PositionConverters } from '../../../../../../../../util/types';

export interface ContentRendererProps {
  /** Station Id as string */
  stationId: string;

  /** The description */
  description?: string;

  /** The description label color */
  descriptionLabelColor?: string;

  /** Channel Id as string */
  channelId: string;

  /** Boolean is default channel */
  isDefaultChannel: boolean;

  /** Epoch seconds start time */
  displayStartTimeSecs: number;

  /** Boolean is default channel */
  displayEndTimeSecs: number;

  /** Web Workers */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workerRpcs: any[];

  /** The signal detections */
  signalDetections: WeavessTypes.PickMarker[] | undefined;

  /** The predicted phases */
  predictedPhases: WeavessTypes.PickMarker[] | undefined;

  /** Should the user be able to modify the predicted phase */
  disablePredictedPhaseModification: boolean;

  /** Should the user be able to modify the predicted phase */
  disableSignalDetectionModification: boolean;

  /** The theoretical phase windows */
  theoreticalPhaseWindows: WeavessTypes.TheoreticalPhaseWindow[] | undefined;

  /** Collection of markers */
  markers?: WeavessTypes.Markers;

  /** The selections */
  selections: WeavessTypes.Selections;

  /** (optional) callback events */
  events?: WeavessTypes.ChannelContentEvents;

  /** Configuration for weavess */
  initialConfiguration: WeavessTypes.Configuration;

  /** React elements to render in the content-renderer-content area */
  contentRenderers: React.ReactElement[];

  // Functions

  converters: PositionConverters;

  /** Ref to the html canvas element */
  canvasRef(): HTMLCanvasElement | null;

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
   * Sets the Y axis bounds
   *
   * @param min minimum bound as a number
   * @param max Maximum bound as a number
   */
  setYAxisBounds(min: number, max: number);

  /**
   * @returns current view range as [0,1]
   */
  getViewRange(): [number, number];

  /** Issues a rerender of the graphics */
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
   */
  onMouseMove(e: React.MouseEvent<HTMLDivElement>): void;

  /**
   * Mouse down event
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  onMouseDown(e: React.MouseEvent<HTMLDivElement>): void;

  /**
   * onMouseUp event handler
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  onMouseUp(e: React.MouseEvent<HTMLDivElement>): void;

  /**
   * onContextMenu event handler
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  onContextMenu(e: React.MouseEvent<HTMLDivElement>): void;

  /**
   * onKeyDown event handler
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param timeForMouseXPosition the time for the current mouse position X
   */
  onKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void;

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
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ContentRendererState {}
