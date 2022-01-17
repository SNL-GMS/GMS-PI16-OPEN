import { UserActionDescription } from '@gms/common-model/lib/cache/types';
import Immutable from 'immutable';

/**
 * Specifies the type (method) for committing to the Global Cache.
 */
export type CommitFunc<T> = (items: T[]) => void;

/**
 * User Cache Processor interface.
 * Defines all of the common method definitions required
 * for a user cache item.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IUserCacheItem<T> {
  has(id: string): boolean;
  get(id: string): T;
  getAll(): T[];
  set(item: T): void;
  setAll(items: T[]): void;
  remove(item: T): void;
  removeAll(item: T[]): void;
  commitAll(): void;
  commitWithIds(ids: string[]): void;
  updateFromGlobalCache(cachedEntries: T[], overwrite: boolean): void;
}

/**
 * User Cache interface.
 * Defines all of the common method definitions required for a user cache.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IUserCache {
  getRedoPriorityOrder(id: string): number | undefined;
  getHistory(): History[];
  clearHistory(): void;
}

/**
 * User context for apollo and user sessions
 */
export interface UserContext {
  readonly sessionId: string;
  readonly userName: string;
  readonly userRole: string;
}

/**
 * Defines the interface of User Action.
 */
export interface UserAction {
  /**
   * The user action description
   */
  readonly description: UserActionDescription;

  /**
   * Returns the toString value of a user action.
   *
   * @returns the string representation of the action
   */
  toString(): string;
}

/**
 * Defines the hypothesis type for a hypothesis change.
 */
export enum HypothesisType {
  EventHypothesis = 'EventHypothesis',
  SignalDetectionHypothesis = 'SignalDetectionHypothesis'
}

/**
 * Represents hypothesis information for a change.
 * Defines a mapping from a hypothesis id to the main
 * object id.
 */
export interface HypothesisChangeInformation {
  readonly id: string;
  readonly hypothesisId: string;
  readonly type: HypothesisType;
  readonly parentId: string;
  readonly userAction: UserAction;
}

/**
 * Represents a history change.
 */
export interface HistoryChange {
  readonly id: string;
  readonly active: boolean;
  readonly eventId: string;
  readonly conflictCreated: boolean;
  readonly hypothesisChangeInformation: HypothesisChangeInformation;
}

/**
 * Represents the history.
 */
export interface History {
  readonly id: string;
  readonly description: UserActionDescription;
  readonly changes: Immutable.List<HistoryChange>;
}

/**
 * Invalid data; typically data that has been deleted.
 */
export interface InvalidData {
  readonly eventIds: string[];
  readonly signalDetectionIds: string[];
}
