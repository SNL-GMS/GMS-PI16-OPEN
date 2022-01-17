import * as React from 'react';

import * as AnalystWorkspaceTypes from './analyst-workspace/types';
import * as CommonWorkspaceTypes from './common-workspace/types';
import * as DataAcquisitionWorkspaceTypes from './data-acquisition-workspace/types';

export type GenericKeyAction =
  | AnalystWorkspaceTypes.KeyAction
  | CommonWorkspaceTypes.KeyAction
  | DataAcquisitionWorkspaceTypes.KeyAction;

const createKeyString = (e: React.KeyboardEvent | KeyboardEvent, keyCode: string) =>
  `${e.ctrlKey || e.metaKey ? 'Control+' : ''}${e.altKey ? 'Alt+' : ''}${
    e.shiftKey ? 'Shift+' : ''
  }${keyCode}`;

const getKeyAction = (
  e: React.KeyboardEvent | KeyboardEvent,
  keyCode: string
):
  | AnalystWorkspaceTypes.KeyAction
  | DataAcquisitionWorkspaceTypes.KeyAction
  | CommonWorkspaceTypes.KeyAction => {
  const keyStr = createKeyString(e, keyCode);
  const keyAction =
    CommonWorkspaceTypes.KeyActions.get(keyStr) ??
    AnalystWorkspaceTypes.KeyActions.get(keyStr) ??
    DataAcquisitionWorkspaceTypes.KeyActions.get(keyStr);
  return keyAction;
};

/**
 * Gets the keypress event, if any are defined, that matches the action provided.
 * Handles events on React wrapped HTML elements. For example,
 * this may be used to handle keypress events on elements created by JSX, like <div>
 *
 * @param e a React wrapped keypress event
 */
export function getReactKeyPressAction(
  e: React.KeyboardEvent<HTMLElement>
):
  | AnalystWorkspaceTypes.KeyAction
  | DataAcquisitionWorkspaceTypes.KeyAction
  | CommonWorkspaceTypes.KeyAction {
  return getKeyAction(e, e.nativeEvent.code);
}

/**
 * Gets the keypress event, if any are defined, that matches the action provided.
 * Handles events on native HTML elements. For example,
 * this may be used to handle keypress events on document or window.
 *
 * @param e a keyboard event
 */
export function getKeyPressAction(
  e: KeyboardEvent
):
  | AnalystWorkspaceTypes.KeyAction
  | DataAcquisitionWorkspaceTypes.KeyAction
  | CommonWorkspaceTypes.KeyAction {
  return getKeyAction(e, e.code);
}
