import { Menu, MenuItem } from '@blueprintjs/core';
import React from 'react';

import { HideStationContextMenuProps } from '~common-ui/components/context-menus/types';

/**
 * Context menu intended to be used with the waveform display to show/hide stations
 *
 * @param props
 * @constructor
 */
export const HideStationContextMenu: React.FunctionComponent<HideStationContextMenuProps> = (
  props: HideStationContextMenuProps
) => {
  const { stationName, hideStationCallback, showHideText } = props;
  return (
    <Menu>
      <MenuItem
        className="context-menu-item-hide-station"
        onClick={hideStationCallback}
        text={showHideText ?? `Hide ${stationName}`}
      />
    </Menu>
  );
};
