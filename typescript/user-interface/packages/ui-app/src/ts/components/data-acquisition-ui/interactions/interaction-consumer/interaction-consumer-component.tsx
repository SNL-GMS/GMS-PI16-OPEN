/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import {
  CommonWorkspaceTypes,
  DataAcquisitionWorkspaceTypes,
  getKeyPressAction
} from '@gms/ui-state';
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
 * checks to see if the keypress matches a configured hotkey, and if so,
 * adds it to the keypress action queue
 */
export const handleHotkey = (props: InteractionConsumerProps) => (
  keyEvent: KeyboardEvent
): void => {
  if (props.keyPressActionQueue && !keyEvent.repeat) {
    const keyPressAction = getKeyPressAction(keyEvent);
    if (
      keyPressAction &&
      (CommonWorkspaceTypes.isCommonKeyAction(keyPressAction) ||
        DataAcquisitionWorkspaceTypes.isDataAcquisitionKeyAction(keyPressAction))
    ) {
      keyEvent.stopPropagation();
      keyEvent.preventDefault();
      const entryForKeyMap = props.keyPressActionQueue.get<number>(keyPressAction.toString(), 0);
      const updatedMap = props.keyPressActionQueue.set(
        keyPressAction.toString(),
        Number(entryForKeyMap) + 1
      );
      props.setKeyPressActionQueue(updatedMap);
    }
  }
};

/**
 * Consumes keypress from the redux store and calls the Interaction Provider context to perform the appropriate action
 */
export const InteractionConsumer: React.FunctionComponent<InteractionConsumerProps> = props => {
  const callbacks = React.useContext(InteractionContext);
  const throttleFunction = React.useCallback(() => {
    return throttle(handleHotkey(props), THROTTLE_HOTKEY_REPEAT_MS);
  }, [props]);
  /**
   * Checks to see if an action should be performed, and if so consumes the keypress and performs it
   *
   * @param keyAction the key action
   * @param callback the callback
   * @param shouldConsumeAllKeypress true if should consume all key presses
   */
  const maybeConsumeKeypress = (
    keyAction: CommonWorkspaceTypes.KeyAction,
    callback: () => void,
    shouldConsumeAllKeypress = false
  ) => {
    if (props.keyPressActionQueue && props.keyPressActionQueue.get) {
      const maybeKeyCount = props.keyPressActionQueue.get(keyAction);
      // eslint-disable-next-line no-restricted-globals
      if (!isNaN(maybeKeyCount) && Number(maybeKeyCount) > 0) {
        const newKeyPressActionQueue = props.keyPressActionQueue.set(
          keyAction,
          shouldConsumeAllKeypress ? 0 : maybeKeyCount - 1
        );
        props.setKeyPressActionQueue(newKeyPressActionQueue);
        callback();
      }
    }
  };

  /**
   * Adds a hotkey that toggles command palette visibility.
   */
  React.useEffect(() => {
    maybeConsumeKeypress(
      CommonWorkspaceTypes.KeyAction.OPEN_COMMAND_PALETTE,
      () => {
        callbacks.toggleCommandPaletteVisibility();
      },
      true
    );
    // !FIX ESLINT Validate and check REACT HOOK dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.keyPressActionQueue]);
  /**
   * Adds a keydown listener to the document, so we will catch anything that bubbles up to the top.
   */
  React.useEffect(() => {
    if (!isHotkeyListenerAttached()) {
      document.addEventListener('keydown', throttleFunction);
      setHotkeyListenerAttached();
    }
    // Clean up the event listener on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => document.removeEventListener('keydown', throttleFunction);
    // !FIX ESLINT Validate and check REACT HOOK dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{props.children}</>;
};
