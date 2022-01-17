import { ToolbarTypes } from '@gms/ui-core-components';
import * as React from 'react';

import { QcMaskFilter } from '~analyst-ui/common/dialogs';
import { QcMaskDisplayFilters } from '~analyst-ui/config';
import { MaskDisplayFilter } from '~analyst-ui/config/user-preferences';

const buildQcMaskPicker = (
  maskDisplayFilters: QcMaskDisplayFilters,
  setMaskDisplayFilters: (key: string, maskDisplayFilter: MaskDisplayFilter) => void,
  rank: number
): ToolbarTypes.PopoverItem => ({
  disabled: true, // TODO: remove when QC masks are implemented
  label: 'QC Masks',
  tooltip: 'Show/Hide categories of QC masks',
  rank,
  widthPx: 110,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPopoverDismissed: () => {},
  type: ToolbarTypes.ToolbarItemType.Popover,
  popoverContent: (
    <QcMaskFilter
      maskDisplayFilters={maskDisplayFilters}
      setMaskDisplayFilters={setMaskDisplayFilters}
    />
  )
});

/**
 * Creates a QC mask control for the toolbar, or returns the previously created control
 * if none of the parameters have changed.
 *
 * @param maskDisplayFilters The enum encompassing all mask display filters
 * @param setMaskDisplayFilters a function to modify the mask display filters
 * @param rank the position at which to place this control in the toolbar
 * @returns a toolbar item control for the QC masks
 */
export const useQcMaskControl = (
  maskDisplayFilters: QcMaskDisplayFilters,
  setMaskDisplayFilters: (key: string, maskDisplayFilter: MaskDisplayFilter) => void,
  rank: number
): ToolbarTypes.ToolbarItem =>
  React.useMemo<ToolbarTypes.ToolbarItem>(
    () => buildQcMaskPicker(maskDisplayFilters, setMaskDisplayFilters, rank),
    [maskDisplayFilters, setMaskDisplayFilters, rank]
  );
