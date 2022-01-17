/* eslint-disable react/destructuring-assignment */
import {
  dateToString,
  getSecureRandomNumber,
  MILLISECONDS_IN_SECOND,
  TIME_FORMAT_WITH_SECOND_PRECISION
} from '@gms/common-util';
import React from 'react';

import { SignalDetectionConflict } from '../../types';

export interface EventConflictPopupProps {
  signalDetectionConflicts: SignalDetectionConflict[];
}
/**
 * Displays signal detection information in tabular form
 */
export class EventConflictPopup extends React.PureComponent<EventConflictPopupProps> {
  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Renders the component.
   */
  public render(): JSX.Element {
    return (
      <div>
        <div>Signal Detection(s) in conflict:</div>
        <ul>
          {this.props.signalDetectionConflicts.map(sdc => (
            <li
              // eslint-disable-next-line newline-per-chained-call
              key={sdc.id + String(getSecureRandomNumber())}
            >
              {sdc.phase} on&nbsp;
              {sdc.stationName}&nbsp; at{' '}
              {dateToString(
                new Date(sdc.arrivalTime * MILLISECONDS_IN_SECOND),
                TIME_FORMAT_WITH_SECOND_PRECISION
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
