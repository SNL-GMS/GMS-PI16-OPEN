/* eslint-disable react/destructuring-assignment */
import { SignalDetectionTypes } from '@gms/common-model';
import {
  dateToString,
  MILLISECONDS_IN_SECOND,
  TIME_FORMAT_WITH_SECOND_PRECISION
} from '@gms/common-util';
import sortBy from 'lodash/sortBy';
import React from 'react';

export interface SDConflictPopupProps {
  sdConflicts: SignalDetectionTypes.ConflictingSdHypData[];
}
/**
 * Displays signal detection information in tabular form
 */
export class SDConflictPopup extends React.PureComponent<SDConflictPopupProps> {
  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Renders the component.
   */
  public render(): JSX.Element {
    const orderedConflicts = sortBy(this.props.sdConflicts, e => e.eventTime);
    return (
      <div>
        <div>Conflicts exist (event time, sd station , sd phase, sd time):</div>
        <ul>
          {orderedConflicts.map(conflict => {
            const eventTime = conflict.eventTime
              ? dateToString(
                  new Date(conflict.eventTime * MILLISECONDS_IN_SECOND),
                  TIME_FORMAT_WITH_SECOND_PRECISION
                )
              : '';
            const sdTime = dateToString(
              new Date(conflict.arrivalTime * MILLISECONDS_IN_SECOND),
              TIME_FORMAT_WITH_SECOND_PRECISION
            );
            return (
              <li key={conflict.eventId}>
                {`${eventTime}, ${conflict.stationName}, ${conflict.phase}, ${sdTime}`}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
