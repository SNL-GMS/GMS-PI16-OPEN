/* eslint-disable react/destructuring-assignment */
import { SignalDetectionTypes } from '@gms/common-model';
import React from 'react';

export interface SDDirtyDotPopupProps {
  signalDetection: SignalDetectionTypes.SignalDetection;
}
/**
 * Displays signal detection information in tabular form
 */
export class SDDirtyDotPopup extends React.PureComponent<SDDirtyDotPopupProps> {
  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Renders the component.
   */
  public render(): JSX.Element {
    return (
      <div>
        {this.props.signalDetection.modified ? (
          <div>Signal Detection has unsaved changes</div>
        ) : null}
      </div>
    );
  }
}
