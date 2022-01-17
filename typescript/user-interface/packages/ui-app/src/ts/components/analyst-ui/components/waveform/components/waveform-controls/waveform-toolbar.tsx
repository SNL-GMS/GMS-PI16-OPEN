import { Toolbar, ToolbarTypes } from '@gms/ui-core-components';
import * as React from 'react';

const GL_CONTAINER_PADDING_PX = 16;

interface WaveformToolbarProps {
  leftToolbarLeftItems: ToolbarTypes.ToolbarItem[];
  rightToolbarItems: ToolbarTypes.ToolbarItem[];
  widthPx: number;
}

/**
 * A stateless waveform component for memoization.
 */
const InternalWaveformToolbar: React.FunctionComponent<WaveformToolbarProps> = ({
  leftToolbarLeftItems,
  rightToolbarItems,
  widthPx
}: WaveformToolbarProps) => (
  <div className="waveform-display-control-panel">
    <Toolbar
      itemsLeft={leftToolbarLeftItems}
      items={rightToolbarItems}
      toolbarWidthPx={widthPx - GL_CONTAINER_PADDING_PX}
    />
  </div>
);

/**
 * A memoized toolbar. Stateless.
 */
export const WaveformToolbar = React.memo(InternalWaveformToolbar);
