import { IconName, Intent } from '@blueprintjs/core';
import { WeavessTypes } from '@gms/weavess-core';

export interface TheoreticalPhasesProps {
  /** Station Id as string */
  stationId: string;

  /** The theoretical phase windows */
  theoreticalPhaseWindows: WeavessTypes.TheoreticalPhaseWindow[] | undefined;

  /** Boolean is default channel */
  isDefaultChannel: boolean;

  /** Epoch seconds start time */
  displayStartTimeSecs: number;

  /** Epoch seconds end time */
  displayEndTimeSecs: number;

  /** (optional) callback events Ex on waveform click */
  events?: WeavessTypes.ChannelContentEvents;

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
   * Returns the time in seconds for the given clientX.
   *
   * @param clientX The clientX
   *
   * @returns The time in seconds; undefined if clientX is
   * out of the channel's bounds on screen.
   */
  getTimeSecsForClientX(clientX: number): number | undefined;

  /**
   * Toggle display of the drag indicator for this channel
   *
   * @param show True to show drag indicator
   * @param color The color of the drag indicator
   */
  toggleDragIndicator(show: boolean, color: string): void;

  /**
   * Set the position for the drag indicator
   *
   * @param clientX The clientX
   */
  positionDragIndicator(clientX: number): void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TheoreticalPhasesState {}
