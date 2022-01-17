export interface XAxisProps {
  /** Epoch seconds end */
  endTimeSecs: number;

  /** Epoch seconds start */
  startTimeSecs: number;

  /** Add border to top */
  borderTop: boolean;

  /** Label width in px */
  labelWidthPx: number;

  /** Scrollbar width in px */
  scrollbarWidthPx: number;

  /** (optional) x-axis label  */
  label?: string;

  /** Call back to get the current view range */
  getViewRange(): [number, number];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface XAxisState {}
