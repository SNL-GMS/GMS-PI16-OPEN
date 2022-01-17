import { ToolbarTypes } from '@gms/ui-core-components';
import { AnalystWorkspaceTypes } from '@gms/ui-state';
import * as React from 'react';

import { AlignWaveformsOn } from '../../types';

const buildStationSort = (
  currentSortType: AnalystWorkspaceTypes.WaveformSortType,
  alignWaveformsOn: AlignWaveformsOn,
  currentOpenEventId: string,
  setSelectedSortType: (sortType: AnalystWorkspaceTypes.WaveformSortType) => void,
  rank: number
) => ({
  label: 'Station Sort',
  tooltip: 'Set the sort order of stations',
  type: ToolbarTypes.ToolbarItemType.Dropdown,
  value: currentSortType,
  disabled: alignWaveformsOn !== AlignWaveformsOn.TIME || !currentOpenEventId,
  rank,
  onChange: value => {
    setSelectedSortType(value);
  },
  dropdownOptions: AnalystWorkspaceTypes.WaveformSortType,
  widthPx: 130
});

/**
 * Creates a sort control for the toolbar, or returns the previously created control if none of the
 * parameters have changed.
 *
 * @param currentSortType on what should we sort
 * @param alignWaveformsOn on what are waveforms aligned
 * @param currentOpenEventId the id of the currently open event
 * @param setSelectedSortType a function to set hte state of the sort. Must be referentially stable
 * @param rank sets the position of this control within the toolbar.
 * @returns a sort control for the toolbar
 */
export const useStationSortControl = (
  currentSortType: AnalystWorkspaceTypes.WaveformSortType,
  alignWaveformsOn: AlignWaveformsOn,
  currentOpenEventId: string,
  setSelectedSortType: (sortType: AnalystWorkspaceTypes.WaveformSortType) => void,
  rank: number
): ToolbarTypes.ToolbarItem =>
  React.useMemo<ToolbarTypes.ToolbarItem>(
    () =>
      buildStationSort(
        currentSortType,
        alignWaveformsOn,
        currentOpenEventId,
        setSelectedSortType,
        rank
      ),
    [currentSortType, alignWaveformsOn, currentOpenEventId, rank, setSelectedSortType]
  );
