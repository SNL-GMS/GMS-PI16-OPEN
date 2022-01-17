import { Menu, MenuItem } from '@blueprintjs/core';
import { AppState } from '@gms/ui-state';
import React from 'react';
import { useSelector } from 'react-redux';

import { IntervalContextMenuProps } from './types';

/**
 * Row entry wrapper for ActivityInterval cells
 */
export const IntervalContextMenu: React.FunctionComponent<IntervalContextMenuProps> = (
  props: IntervalContextMenuProps
) => {
  const workflowState = useSelector((state: AppState) => state.analystWorkspaceState.workflowState);
  const {
    interval,
    isSelectedInterval,
    allActivitiesOpenForSelectedInterval,
    openCallback,
    closeCallback
  } = props;

  const isDisabled =
    (allActivitiesOpenForSelectedInterval &&
      isSelectedInterval &&
      workflowState.openIntervalName === interval.name) ||
    (isSelectedInterval && interval.name !== workflowState.openIntervalName);
  return (
    <Menu>
      <MenuItem
        className="menu-item-open-interval"
        text="Open Interval"
        disabled={isDisabled}
        onClick={() => openCallback(interval)}
      />
      <MenuItem
        className="menu-item-close-interval"
        text="Close Interval"
        disabled={!isSelectedInterval}
        onClick={() => closeCallback(interval)}
      />
    </Menu>
  );
};
