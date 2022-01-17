import { IconName, Intent } from '@blueprintjs/core';
import { WeavessTypes } from '@gms/weavess-core';
import * as React from 'react';

export interface MeasureWindowSelectionListenerProps {
  displayTimeRange: WeavessTypes.TimeRange;
  hotKeys: WeavessTypes.HotKeysConfiguration;
  isMeasureWindowEnabled(): boolean;
  children(measureWindowParams: {
    contentRenderer: JSX.Element;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  }): JSX.Element | null;
  toast(
    message: string,
    intent?: Intent | undefined,
    icon?: IconName | undefined,
    timeout?: number | undefined
  ): void;
  updateMeasureWindowPanel(
    timeRange: WeavessTypes.TimeRange,
    removeMeasureWindowSelection: () => void
  ): void;
  computeTimeSecsFromMouseXPixels(mouseXPx: number): number;
}
