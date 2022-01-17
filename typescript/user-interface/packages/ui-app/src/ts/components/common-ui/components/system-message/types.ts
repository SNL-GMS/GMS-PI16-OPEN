import { SystemMessageTypes } from '@gms/common-model';
import GoldenLayout from '@gms/golden-layout';
import { CellRendererParams } from '@gms/ui-core-components';
import { ColumnDefinition } from '@gms/ui-core-components/lib/components/table/types/column-definition';
import { SystemMessageState } from '@gms/ui-state/lib/state/system-message/types';
import Immutable from 'immutable';
import * as React from 'react';
import { MutationFunction } from 'react-apollo';

import { QueryAndMutationTypes } from '~components/client-interface';

export type SystemMessageColumnDefinition = ColumnDefinition<
  { id: string; severity: string },
  any,
  any,
  any,
  any
>;

export interface SystemMessageInfiniteTableDataType {
  id: string;
  severity: string;
}

/**
 * The system message component redux props
 */
export interface SystemMessageReduxProps {
  systemMessagesState: SystemMessageState;

  /**
   *  Adds system messages to the redux store
   *
   * @param messages the system messages to add
   * @param limit (optional) limit the number of messages in the redux state
   * when adding new messages; if set when adding new messages the message list
   * result will not be larger than the size of the `limit` specified.
   * @param pageSizeBuffer (optional) the size of the page buffer; if specified and the
   * limit is reached then messages will be removed at increments of the page buffer size
   */
  addSystemMessages(
    messages: SystemMessageTypes.SystemMessage[],
    limit?: number,
    pageSizeBuffer?: number
  ): void;

  /**
   * Clears (removes) the number of specified system messages starting at `index` from the redux store.
   *
   * @param index the index; starting position to start
   * @param deleteCount the number or messages to remove from the index
   */
  clearSystemMessages(index: number, deleteCount: number): void;

  /**
   * Clears (removes) all system messages from the redux store that have expired.
   *
   * @param expiredLimitMs the expired time limit to check; any messages that have a time
   * older than the expired time limit will be removed.
   */
  clearExpiredSystemMessages(expiredLimitMs: number): void;

  /** Clears (removes) all system messages from the redux store */
  clearAllSystemMessages(): void;
}

interface SystemMessageBaseProps extends SystemMessageReduxProps {
  glContainer?: GoldenLayout.Container;
}

export interface SystemMessageMutations {
  setAudibleNotifications: MutationFunction;
}

/**
 *  The system message component props
 */
export type SystemMessageProps = SystemMessageBaseProps &
  QueryAndMutationTypes.SystemMessageDefinitionsQueryProps &
  QueryAndMutationTypes.UserProfileQueryProps &
  SystemMessageMutations;

/**
 * The system message toolbar component props
 */
export interface SystemMessageToolbarProps extends SystemMessageReduxProps {
  /** true if auto scrolling is enabled for the system message table; false otherwise */
  isAutoScrollingEnabled: boolean;
  /** enables or disables auto scrolling for the system message table */
  setIsAutoScrollingEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  /** true if sound is enabled for system messages; false otherwise */
  isSoundEnabled: boolean;
  /** enables or disables sounds for system messages */
  setIsSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;

  systemMessageDefinitions: SystemMessageTypes.SystemMessageDefinition[];

  severityFilterMap: Immutable.Map<SystemMessageTypes.SystemMessageSeverity, boolean>;
  setSeverityFilterMap(m: Immutable.Map<SystemMessageTypes.SystemMessageSeverity, boolean>): void;
}

/**
 * The system message table props
 */
export interface SystemMessageTableProps {
  systemMessages: SystemMessageTypes.SystemMessage[];

  /** true if auto scrolling is enabled for the system message table; false otherwise */
  isAutoScrollingEnabled: boolean;

  severityFilterMap: Immutable.Map<SystemMessageTypes.SystemMessageSeverity, boolean>;

  /** enables or disables auto scrolling for the system message table */
  setIsAutoScrollingEnabled: React.Dispatch<React.SetStateAction<boolean>>;

  /**
   *  Adds system messages to the redux store
   *
   * @param messages the system messages to add
   * @param limit (optional) limit the number of messages in the redux state
   * when adding new messages; if set when adding new messages the message list
   * result will not be larger than the size of the `limit` specified.
   * @param pageSizeBuffer (optional) the size of the page buffer; if specified and the
   * limit is reached then messages will be removed at increments of the page buffer size
   */
  addSystemMessages(
    messages: SystemMessageTypes.SystemMessage[],
    limit?: number,
    pageSizeBuffer?: number
  ): void;

  /**
   * Clears (removes) the number of specified system messages starting at `index` from the redux store.
   *
   * @param index the index; starting position to start
   * @param deleteCount the number or messages to remove from the index
   */
  clearSystemMessages(index: number, deleteCount: number): void;

  /**
   * Clears (removes) all system messages from the redux store that have expired.
   *
   * @param expiredLimitMs the expired time limit to check; any messages that have a time
   * older than the expired time limit will be removed.
   */
  clearExpiredSystemMessages(expiredLimitMs: number): void;

  /** Clears (removes) all system messages from the redux store */
  clearAllSystemMessages(): void;
}

export interface SystemMessageTableState {
  /**
   * The system messages, derived from props
   */
  systemMessages: SystemMessageTypes.SystemMessage[];
  /**
   * Flag to indicate that we have unseen messages.
   */
  hasUnseenMessages: boolean;

  /**
   * In order to keep track of the direction in which we've scrolled, we keep
   * track of the last two scroll positions (px from top of scroll container).
   */
  prevScrollPositions: [number, number];

  /**
   * Whether we've scrolled to the latest row or not.
   */
  isScrolledToLatest: boolean;
}

export type BaseCellRendererParams = CellRendererParams<
  { id: string },
  unknown,
  number,
  unknown,
  {
    value: string | number;
    formattedValue: string;
  }
>;

export type SystemMessageCellRendererParams = CellRendererParams<
  { id: string; severity: string },
  unknown,
  number,
  unknown,
  {
    value: string | number;
    formattedValue: string;
  }
>;

export interface NewMessageIndicatorProps {
  isVisible: boolean;
  handleNewMessageIndicatorClick(e: MouseEvent): void;
}

export interface SystemMessageSummaryProps {
  systemMessages: SystemMessageTypes.SystemMessage[];
  severityFilterMap: Immutable.Map<SystemMessageTypes.SystemMessageSeverity, boolean>;
  setSeverityFilterMap(m: Immutable.Map<SystemMessageTypes.SystemMessageSeverity, boolean>): void;
}
