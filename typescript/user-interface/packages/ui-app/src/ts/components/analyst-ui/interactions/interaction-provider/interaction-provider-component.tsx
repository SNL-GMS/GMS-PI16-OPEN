/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import { EventTypes } from '@gms/common-model';
import { UILogger } from '@gms/ui-apollo';
import React from 'react';

import { InteractionContext, InteractionProviderProps } from './types';

/**
 * Provides one implementation of graphQL and redux capabilities and provides them to child components via a context
 */
export const InteractionProvider: React.FunctionComponent<InteractionProviderProps> = props => {
  /**
   * Save current open event.
   */
  const saveCurrentlyOpenEvent = () => {
    if (
      props.openEventId === undefined ||
      props.openEventId === null ||
      props.openEventId === '' ||
      !props.saveEvent
    ) {
      return;
    }
    const variables: EventTypes.SaveEventMutationArgs = {
      eventId: props.openEventId
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    props
      .saveEvent({
        variables
      })
      .catch(e => UILogger.Instance().error(`Failed to save current open event: ${e.message}`));
  };

  /**
   * Save all events.
   */
  const saveAllEvents = () => {
    if (props.saveAllModifiedEvents) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      props
        .saveAllModifiedEvents({ variables: {} })
        .catch(e => UILogger.Instance().error(`Failed to save all events: ${e.message}`));
    }
  };
  const isIntervalOpened =
    props.currentTimeInterval !== undefined && props.currentTimeInterval !== null;
  const undo = () => {
    if (isIntervalOpened && props.undoHistory) {
      props.incrementHistoryActionInProgress();
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      props
        .undoHistory({ variables: { numberOfItems: 1 } })
        .then(() => {
          props.decrementHistoryActionInProgress();
        })
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .catch(() => {});
    }
  };

  /**
   * Redo a history change.
   *
   * @param count the number of changes to redo
   */
  const redo = () => {
    if (isIntervalOpened && props.redoHistory) {
      props.incrementHistoryActionInProgress();
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      props
        .redoHistory({ variables: { numberOfItems: 1 } })
        .then(() => {
          props.decrementHistoryActionInProgress();
        })
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .catch(() => {});
    }
  };

  const toggleCommandPaletteVisibility = () => {
    props.setCommandPaletteVisibility(!props.commandPaletteIsVisible);
  };

  return (
    <>
      <InteractionContext.Provider
        value={{
          isListenerAttached: false,
          saveCurrentlyOpenEvent,
          saveAllEvents,
          toggleCommandPaletteVisibility,
          undo,
          redo
        }}
      >
        {props.children}
      </InteractionContext.Provider>
    </>
  );
};
