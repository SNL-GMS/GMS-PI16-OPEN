import { ToolbarTypes } from '@gms/ui-core-components';
import * as React from 'react';

const buildNumVisibleWaveforms = (
  analystNumberOfWaveforms: number,
  setAnalystNumberOfWaveforms: (value: number, valueAsString?: string) => void,
  rank: number
) => ({
  tooltip: 'Sets the number of visible channels per screen',
  type: ToolbarTypes.ToolbarItemType.NumericInput,
  rank,
  onChange: value => setAnalystNumberOfWaveforms(value),
  value: analystNumberOfWaveforms,
  minMax: {
    min: 1,
    max: 100
  },
  menuLabel: 'Number of Channels'
});

/**
 * Creates a toolbar control that lets the user choose the number of waveforms, or returns the previously created
 * toolbar if none of the parameters have changed. Requires referentially stable functions.
 *
 * @param analystNumberOfWaveforms the number of waveforms the analyst has chosen to display
 * @param setAnalystNumberOfWaveforms a setter function for setting the number of waveforms. Must be referentially stable.
 * @param rank the position of this control in the toolbar.
 * @returns the toolbar item
 */
export const useNumWaveformControl = (
  analystNumberOfWaveforms: number,
  setAnalystNumberOfWaveforms: (value: number, valueAsString?: string) => void,
  rank: number
): ToolbarTypes.ToolbarItem =>
  React.useMemo<ToolbarTypes.ToolbarItem>(
    () => buildNumVisibleWaveforms(analystNumberOfWaveforms, setAnalystNumberOfWaveforms, rank),
    [analystNumberOfWaveforms, setAnalystNumberOfWaveforms, rank]
  );
