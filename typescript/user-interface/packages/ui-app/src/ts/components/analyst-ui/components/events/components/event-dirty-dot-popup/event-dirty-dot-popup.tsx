/* eslint-disable react/destructuring-assignment */
import { EventTypes } from '@gms/common-model';
import React from 'react';

export interface EventDirtyDotPopupProps {
  event: EventTypes.Event;
}
/**
 * Displays signal detection information in tabular form
 */
export class EventDirtyDotPopup extends React.PureComponent<EventDirtyDotPopupProps> {
  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Renders the component.
   */
  public render(): JSX.Element {
    return <div>{this.props.event.modified ? <div>Event has unsaved changes</div> : null}</div>;
  }
}
