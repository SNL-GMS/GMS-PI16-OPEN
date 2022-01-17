/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import { AnalystWorkspaceTypes, CommonWorkspaceTypes, getKeyPressAction } from '@gms/ui-state';
import throttle from 'lodash/throttle';
import React from 'react';

import { InteractionContext } from '../interaction-provider/types';
import { InteractionConsumerProps } from './types';

const THROTTLE_HOTKEY_REPEAT_MS = 500;

const isHotkeyListenerAttached = () => {
  if (document.getElementById('app')) {
    return document.getElementById('app').dataset.hotkeyListenerAttached === 'true';
  }
  return false;
};

const setHotkeyListenerAttached = () => {
  if (document.getElementById('app')) {
    document.getElementById('app').dataset.hotkeyListenerAttached = 'true';
  }
};

/**
 * Consumes keypress from the redux store and calls the Interaction Provider context to perform the appropriate action
 */
export const InteractionConsumer: React.FunctionComponent<InteractionConsumerProps> = props => {
  const callbacks = React.useContext(InteractionContext);

  /**
   * Checks to see if an action should be performed, and if so consumes the keypress and performs it
   *
   * @param keyAction the key action
   * @param callback the callback
   * @param shouldConsumeAllKeypress true if should consume all key presses
   */
  const maybeConsumeKeypress = (
    keyAction: AnalystWorkspaceTypes.KeyAction | CommonWorkspaceTypes.KeyAction,
    callback: () => void,
    shouldConsumeAllKeypress = false
  ) => {
    if (props.keyPressActionQueue && props.keyPressActionQueue.get) {
      const maybeKeyCount = props.keyPressActionQueue.get(keyAction);
      // eslint-disable-next-line no-restricted-globals
      if (!isNaN(maybeKeyCount) && maybeKeyCount > 0) {
        const newKeyPressActionQueue = props.keyPressActionQueue.set(
          keyAction,
          shouldConsumeAllKeypress ? 0 : maybeKeyCount - 1
        );
        props.setKeyPressActionQueue(newKeyPressActionQueue);
        callback();
      }
    }
  };

  React.useEffect(() => {
    maybeConsumeKeypress(
      AnalystWorkspaceTypes.KeyAction.SAVE_OPEN_EVENT,
      () => {
        if (callbacks.saveCurrentlyOpenEvent) {
          callbacks.saveCurrentlyOpenEvent();
        }
      },
      true
    );

    maybeConsumeKeypress(
      AnalystWorkspaceTypes.KeyAction.SAVE_ALL_EVENTS,
      () => {
        if (callbacks.saveAllEvents) {
          callbacks.saveAllEvents();
        }
      },
      true
    );

    maybeConsumeKeypress(
      AnalystWorkspaceTypes.KeyAction.UNDO_GLOBAL,
      () => {
        if (callbacks.undo) {
          callbacks.undo(1);
        }
      },
      true
    );

    maybeConsumeKeypress(
      AnalystWorkspaceTypes.KeyAction.REDO_GLOBAL,
      () => {
        if (callbacks.redo) {
          callbacks.redo(1);
        }
      },
      true
    );

    maybeConsumeKeypress(
      CommonWorkspaceTypes.KeyAction.OPEN_COMMAND_PALETTE,
      () => {
        if (callbacks.toggleCommandPaletteVisibility) {
          callbacks.toggleCommandPaletteVisibility();
        }
      },
      true
    );
    // !FIX ESLINT Validate and check REACT HOOK dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.keyPressActionQueue]); // use effect if queue has changed

  /**
   * checks to see if the keypress matches a configured hotkey, and if so,
   * adds it to the keypress action queue
   */
  const handleHotkey = (keyEvent: KeyboardEvent): void => {
    if (props.keyPressActionQueue && !keyEvent.repeat) {
      if (props.keyPressActionQueue) {
        const keyPressAction = getKeyPressAction(keyEvent);
        if (
          keyPressAction &&
          (CommonWorkspaceTypes.isCommonKeyAction(keyPressAction) ||
            AnalystWorkspaceTypes.isAnalystKeyAction(keyPressAction))
        ) {
          keyEvent.stopPropagation();
          keyEvent.preventDefault();
          const entryForKeyMap = props.keyPressActionQueue.get(keyPressAction)
            ? props.keyPressActionQueue.get(keyPressAction)
            : 0;
          const updatedMap = props.keyPressActionQueue.set(
            keyPressAction.toString(),
            Number(entryForKeyMap) + 1
          );
          props.setKeyPressActionQueue(updatedMap);
        }
      }
    }
  };

  /**
   * Adds a keydown listener to the document, so we will catch anything that bubbles up to the top.
   */
  React.useEffect(() => {
    if (!isHotkeyListenerAttached()) {
      document.addEventListener('keydown', throttle(handleHotkey, THROTTLE_HOTKEY_REPEAT_MS));
      setHotkeyListenerAttached();
    }

    // Clean up the event listener on unmount
    return () => document.removeEventListener('keydown', handleHotkey);
    // !FIX ESLINT Validate and check REACT HOOK dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{props.children}</>;
};
