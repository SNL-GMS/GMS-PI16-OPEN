/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import { ContextMenu, Menu, MenuItem } from '@blueprintjs/core';
import uniq from 'lodash/uniq';
import React from 'react';

import { AcknowledgeForm } from '../acknowledge/acknowledge-form';

/**
 * Station SOH context menu props
 */
export interface StationSohContextMenuProps {
  stationNames: string[];
  acknowledgeCallback(stationNames: string[], comment?: string);
}

/**
 * Station SOH context item menu props
 */
export interface StationSohContextMenuItemProps extends StationSohContextMenuProps {
  disabled: boolean;
}

/**
 * Creates menu item text for station acknowledgement
 */
export const getStationAcknowledgementMenuText = (
  stationNames: string[],
  withComment = false
): string => {
  const text =
    stationNames.length > 1 ? `Acknowledge ${stationNames.length} stations` : 'Acknowledge station';
  return withComment ? `${text} with comment...` : text;
};

/**
 * Creates menu item for acknowledging stations without a comment
 */
const AcknowledgeMenuItem: React.FunctionComponent<StationSohContextMenuItemProps> = props => {
  const stationList = uniq(props.stationNames);
  return React.createElement(MenuItem, {
    disabled: props.disabled,
    'data-cy': 'acknowledge-without-comment',
    onClick: () => {
      props.acknowledgeCallback(stationList);
    },
    text: getStationAcknowledgementMenuText(stationList),
    className: 'acknowledge-soh-status'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const acknowledgeOnClick = (e: React.MouseEvent, props: StationSohContextMenuItemProps) => {
  const stationList = uniq(props.stationNames);
  const clientOffset = 25;
  e.preventDefault();
  ContextMenu.hide();
  ContextMenu.show(
    React.createElement(AcknowledgeForm, {
      stationNames: stationList,
      acknowledgeStationsByName: (stationNames: string[], comment?: string) => {
        props.acknowledgeCallback(stationNames, comment);
        ContextMenu.hide();
      },
      onClose: ContextMenu.hide
    }),
    { left: e.clientX - clientOffset, top: e.clientY - clientOffset },
    undefined,
    true
  );
};

/**
 * Creates menu item for acknowledging stations with a comment
 */
const AcknowledgeWithCommentMenuItem: React.FunctionComponent<StationSohContextMenuItemProps> = props => {
  const stationList = uniq(props.stationNames);
  return React.createElement(MenuItem, {
    disabled: props.disabled,
    'data-cy': 'acknowledge-with-comment',
    onClick: e => acknowledgeOnClick(e, props),
    text: getStationAcknowledgementMenuText(stationList, true),
    className: 'acknowledge-soh-status'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
};

/**
 * Context menu for acknowledging station SOH
 */
export const StationSohContextMenu: React.FunctionComponent<StationSohContextMenuProps> = props =>
  React.createElement(
    Menu,
    {}, // empty props
    React.createElement(AcknowledgeMenuItem, {
      ...props,
      disabled: false
    }),
    React.createElement(AcknowledgeWithCommentMenuItem, {
      ...props,
      disabled: false
    })
  );

/**
 * Context menu for acknowledging station SOH
 */
export const DisabledStationSohContextMenu: React.FunctionComponent<StationSohContextMenuProps> = props =>
  React.createElement(
    Menu,
    {}, // empty props
    React.createElement(AcknowledgeMenuItem, {
      ...props,
      disabled: true
    }),
    React.createElement(AcknowledgeWithCommentMenuItem, {
      ...props,
      disabled: true
    })
  );
