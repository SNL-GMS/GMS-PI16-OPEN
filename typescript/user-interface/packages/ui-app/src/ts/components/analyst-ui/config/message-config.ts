import { CacheTypes } from '@gms/common-model';

export interface MessageConfig {
  historyFilters: Map<string, boolean>;
  tooltipMessages: {
    history: {
      currentHistoryActionMessage: string;
      redoActionMessage: string;
      undoActionMessage: string;
      undoEventLevelActionMessage: string;
      redoEventLevelActionMessage: string;
      undoButtonAction: string;
      redoButtonAction: string;
    };
    location: {
      associatedOrCreatedMessage: string;
      locateCallInProgressMessage: string;
      rejectedOrUnassociatedMessage: string;
    };
    magnitude: {
      azimuthSourceToReceiverMessage: string;
      noStationsSetToDefiningMessage: string;
      setAllStationsNotDefiningMessage: string;
      setAllStationsDefiningMessage: string;
      sourceToReceiverAzimuthMessage: string;
      noAmplitudeMessage: string;
    };
    workflowConfirmation: {
      discardTooltip: string;
      cancelTooltip: string;
      header: string;
      text: string;
      title: string;
      cancelText: string;
      discardText: string;
    };
  };
}
export const messageConfig: MessageConfig = {
  // If true, filter out the keys from the history list
  historyFilters: new Map([
    [CacheTypes.UserActionDescription.UPDATE_EVENT_FROM_SIGNAL_DETECTION_CHANGE, true]
  ]),
  tooltipMessages: {
    history: {
      currentHistoryActionMessage: 'The current state displayed',
      redoActionMessage: 'Redo this action',
      undoActionMessage: 'Undo this action',
      undoEventLevelActionMessage: 'Revert event history',
      redoEventLevelActionMessage: 'Restore event history',
      undoButtonAction: 'Undo last action',
      redoButtonAction: 'Redo last undone action'
    },
    location: {
      associatedOrCreatedMessage: 'SD Associated or Created since last locate',
      locateCallInProgressMessage: 'Displays if a locate call is in progress',
      rejectedOrUnassociatedMessage: 'SD Rejected or Unassociated since last locate'
    },
    magnitude: {
      azimuthSourceToReceiverMessage: 'Source-to-Receiver Azimuth (\u00B0)',
      noStationsSetToDefiningMessage:
        'Select at least one defining station to calculate network magnitude',
      setAllStationsNotDefiningMessage: 'Set all stations as not defining',
      setAllStationsDefiningMessage: 'Set all stations as defining',
      sourceToReceiverAzimuthMessage: 'Source to Receiver Azimuth (\u00B0)',
      noAmplitudeMessage: 'Make amplitude measurement to set as defining'
    },
    workflowConfirmation: {
      discardTooltip: 'Discard your changes and open a new interval',
      cancelTooltip: 'Cancel and do not open a new interval',
      title: 'Warning',
      header: 'You have unsaved changes in your workspace.',
      text: ' Do you want to discard these changes and load data for a different time range?',
      cancelText: 'Cancel',
      discardText: 'Discard my changes'
    }
  }
};
