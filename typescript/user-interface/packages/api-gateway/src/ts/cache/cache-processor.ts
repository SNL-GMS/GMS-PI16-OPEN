import { CommonTypes } from '@gms/common-model';
import Immutable from 'immutable';
import cloneDeep from 'lodash/cloneDeep';

import { ProcessingStationData } from '../station/processing-station/types';
import { GlobalCache } from './global-cache';

/**
 * API gateway Cache Processor for a single global data cache that represents the
 * OSD state for all users.
 */
export class CacheProcessor {
  /** The singleton instance */
  private static instance: CacheProcessor;

  /**
   * Shared workspace state
   */
  private workspaceState: CommonTypes.WorkspaceState;

  /** The singleton instance of Global Cache */
  private globalCache: GlobalCache;

  /**
   * Constructor
   */
  // eslint-disable-next-line no-useless-constructor
  private constructor() {
    /* no-op */
  }

  /**
   * Returns the singleton instance of the cache processor.
   *
   * @returns the instance of the cache processor
   */
  public static Instance(): CacheProcessor {
    if (CacheProcessor.instance === undefined) {
      CacheProcessor.instance = new CacheProcessor();
      CacheProcessor.instance.initialize();
    }
    return CacheProcessor.instance;
  }

  /**
   * Returns the workspace state
   *
   * @returns the workspace state
   */
  public getWorkspaceState(): CommonTypes.WorkspaceState {
    return cloneDeep(this.workspaceState);
  }

  /**
   * Adds or updates event to user map in workspace state
   *
   * @param eventId event id to remove user from
   * @param userName the username to remove
   */
  public addOrUpdateEventToUser(eventId: string, userName: string): void {
    const eventToUsers = this.workspaceState.eventToUsers.find(
      evToUsers => evToUsers.eventId === eventId
    );
    if (eventToUsers) {
      // Event is already in the map so if the username is not in the list push it
      if (eventToUsers.userNames.indexOf(userName) < 0) {
        eventToUsers.userNames.push(userName);
      }
    } else {
      // Event is not in map, create new username array
      this.workspaceState.eventToUsers.push({ eventId, userNames: [userName] });
    }
  }

  /**
   * Removes a user from the event in the workspace state
   *
   * @param eventId event id to remove user from
   * @param userName the username to remove
   */
  public removeUserFromEvent(eventId: string, userName: string): void {
    const eventToUsers = this.workspaceState.eventToUsers.find(
      evToUsers => evToUsers.eventId === eventId
    );
    const index = eventToUsers ? eventToUsers.userNames.indexOf(userName) : undefined;
    if (index >= 0) {
      eventToUsers.userNames.splice(index, 1);
    }
  }

  // ----- Configuration Functions ------

  /**
   * Gets the configuration from the global cache
   *
   * @returns the configuration from the global cache
   */
  public getConfiguration(): Immutable.Map<string, string> {
    return this.globalCache.getConfiguration();
  }

  /**
   * Set the configuration in the global cache
   *
   * @param configuration the configuration
   */
  public setConfiguration(configuration: Immutable.Map<string, string>): void {
    this.globalCache.setConfiguration(configuration);
  }

  // ----- Processing Station Data Functions ------

  /**
   * Gets the station data from the global cache for the given id
   *
   * @param name the unique id (network name)
   * @returns the station data
   */
  public getProcessingStationData(): ProcessingStationData {
    return this.globalCache.getProcessingStationData();
  }

  /**
   * Initialize the Cache Processor (global cache and user caches)
   */
  private initialize(): void {
    this.globalCache = new GlobalCache();

    this.workspaceState = {
      eventToUsers: []
    };
  }
}
