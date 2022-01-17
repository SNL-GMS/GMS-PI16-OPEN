/* eslint-disable jsx-a11y/no-static-element-interactions */
import * as React from 'react';

import { MeasureWindowSelectionAreaProps } from './types';

/**
 * Memoized component that draws a measure window selection area and positions it according to the props provided.
 * Draws two divs, one that is a container and the other that is the actual visible overlay. The container spans
 * the full width of its parent. This allows us to reposition it using transform: translateX, which is more performant
 * than using left or right positions. See https://stackoverflow.com/questions/7108941/css-transform-vs-position/53892597
 * Note that, for optimal performance, all props should be treated as immutable.
 */
export const MeasureWindowSelectionArea: React.FC<MeasureWindowSelectionAreaProps> = React.memo(
  ({ position: measureWindowSelectionArea, onClick }: MeasureWindowSelectionAreaProps) => {
    const { startPercent, endPercent } = measureWindowSelectionArea ?? {
      startPercent: 0,
      endPercent: 0
    };
    const overlayStyle = React.useMemo(
      () => ({
        display: measureWindowSelectionArea ? 'initial' : 'none',
        left: `50%`,
        width: `${endPercent - startPercent}%`
      }),
      [measureWindowSelectionArea, startPercent, endPercent]
    );
    const containerStyle = React.useMemo(
      () => ({
        display: measureWindowSelectionArea ? 'initial' : 'none',
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        transform: `translateX(${startPercent - 50}%)`
      }),
      [measureWindowSelectionArea, startPercent]
    );
    return (
      <div
        className="measure-window-selection measure-window-selection__container"
        style={containerStyle}
      >
        <div
          className="measure-window-selection__overlay"
          style={overlayStyle}
          onDragStart={e => {
            e.preventDefault();
            onClick(e);
          }}
          draggable
        />
      </div>
    );
  }
);
