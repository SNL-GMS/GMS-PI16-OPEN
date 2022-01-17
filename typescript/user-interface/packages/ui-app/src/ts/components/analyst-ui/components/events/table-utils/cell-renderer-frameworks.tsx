/* eslint-disable react/destructuring-assignment */
// eslint-disable-next-line max-classes-per-file
import { Button, Classes, Icon, Intent, Tooltip } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import classNames from 'classnames';
import React from 'react';

import { gmsColors, semanticColors } from '~scss-config/color-preferences';

import { EventConflictPopup } from '../components/event-conflict-popup';
import { EventDirtyDotPopup } from '../components/event-dirty-dot-popup';

/**
 * Renders the 'Mark Complete' button for the event list
 */
export class MarkCompleteCellRenderer extends React.PureComponent<any> {
  /**
   * React component lifecycle
   */
  public render(): JSX.Element {
    if (this.props.data.status === 'Complete') {
      return (
        <div
          style={{
            color: semanticColors.analystComplete
          }}
        >
          Complete
        </div>
      );
    }

    return (
      <Button
        className={classNames(Classes.SMALL, 'event-list__mark-complete-button')}
        text="Mark Complete"
        data-cy="event-mark-complete"
        intent={Intent.PRIMARY}
        disabled={this.props.data.signalDetectionConflicts.length > 0}
        onClick={() =>
          this.props.context.markEventComplete([this.props.data.id], this.props.data.stageId)
        }
      />
    );
  }
}

/**
 * Renders the modified color cell for the signal detection list
 */
export class EventConflictMarker extends React.PureComponent<any> {
  /**
   * react component lifecycle
   */
  public render(): JSX.Element {
    return this.props.data.signalDetectionConflicts &&
      this.props.data.signalDetectionConflicts.length > 0 ? (
      <Tooltip
        content={
          <EventConflictPopup signalDetectionConflicts={this.props.data.signalDetectionConflicts} />
        }
      >
        <Icon icon={IconNames.ISSUE} intent={Intent.DANGER} />
      </Tooltip>
    ) : null;
  }
}

/**
 * Renders the modified color cell for the signal detection list
 */
export class EventModifiedDot extends React.PureComponent<any> {
  /**
   * react component lifecycle
   */
  public render(): JSX.Element {
    return (
      <Tooltip
        content={<EventDirtyDotPopup event={this.props.data} />}
        className="dirty-dot-wrapper"
      >
        <div
          style={{
            backgroundColor: this.props.data.modified ? gmsColors.gmsMain : 'transparent'
          }}
          className="list-entry-dirty-dot"
        />
      </Tooltip>
    );
  }
}
