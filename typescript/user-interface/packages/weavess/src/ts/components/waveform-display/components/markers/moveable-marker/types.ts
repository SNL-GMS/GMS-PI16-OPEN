import { WeavessTypes } from '@gms/weavess-core';

export interface MoveableMarkerProps {
  /** The marker config */
  marker: WeavessTypes.Marker;

  /** The associated start marker (usually only for a selection window) */
  associatedStartMarker?: WeavessTypes.Marker;

  /** The associated end marker (usually only for a selection window) */
  associatedEndMarker?: WeavessTypes.Marker;

  /** Percentage Location 0-100 as number */
  percentageLocation: number;

  /** Label Width in px */
  labelWidthPx: number;

  /** react key but called name since key was causing fortify issues */
  name?: string;

  /** Start and end of the entire time range */
  timeRange(): WeavessTypes.TimeRange;

  /** current view port of the time range */
  viewTimeRange(): WeavessTypes.TimeRange;

  /** Returns container client width */
  containerClientWidth(): number;

  /** Returns the viewPort client width */
  viewportClientWidth(): number;

  /**
   * (optional) updates the location of the marker
   *
   * @param marker the marker
   */
  onUpdateMarker?(marker: WeavessTypes.Marker): void;

  /**  */
  updateTimeWindowSelection?(): void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MoveableMarkerState {}
