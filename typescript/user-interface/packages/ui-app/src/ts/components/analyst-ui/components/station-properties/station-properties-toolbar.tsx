import React from 'react';

import { useBaseDisplaySize } from '~common-ui/components/base-display/base-display-hooks';
import { BaseToolbar } from '~data-acquisition-ui/shared/toolbars/base-toolbar';

import { getToolbarItemDefs } from './toolbar-item-defs';
import { PropertiesToolbarItemDefs, StationPropertiesToolbarProps } from './types';

/**
 * toolbar used in the station properties display
 */
export const StationPropertiesToolbar: React.FunctionComponent<StationPropertiesToolbarProps> = (
  props: StationPropertiesToolbarProps
) => {
  const {
    selectedStation,
    stationName,
    widthPx,
    onEffectiveTimeChange,
    selectedEffectiveAt,
    effectiveAtTimes,
    setSelectedSiteColumnsToDisplay,
    setSelectedChannelColumnsToDisplay
  } = props;
  const [displayWidthPx] = useBaseDisplaySize();

  const toolbarItemDefs: PropertiesToolbarItemDefs = getToolbarItemDefs(
    effectiveAtTimes,
    selectedStation,
    stationName,
    selectedEffectiveAt,
    onEffectiveTimeChange,
    setSelectedSiteColumnsToDisplay,
    setSelectedChannelColumnsToDisplay
  );
  return (
    <BaseToolbar
      widthPx={displayWidthPx || widthPx}
      items={toolbarItemDefs.rightToolbarItemDefs}
      itemsLeft={toolbarItemDefs.leftToolbarItemDefs}
    />
  );
};
