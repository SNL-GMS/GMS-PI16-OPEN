/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChannelTypes, WaveformTypes } from '@gms/common-model';
import { AnalystWorkspaceTypes } from '@gms/ui-state';
import { WeavessTypes } from '@gms/weavess-core';
import Axios, { CancelTokenSource } from 'axios';
import clone from 'lodash/clone';
import sortBy from 'lodash/sortBy';
import PQueue from 'p-queue';

import { IanQueries } from '~analyst-ui/client-interface';

import { WaveformDataCache } from './waveform-data-cache';

export class WaveformClient implements AnalystWorkspaceTypes.WaveformClient {
  /**
   * A cache storing which channels we've already loaded data for.
   */
  private readonly waveformDataCache: WaveformDataCache = new WaveformDataCache();

  private cancelTokenSource: CancelTokenSource | undefined;

  /**
   * Maximum number of outstanding requests at any given time
   */
  private readonly simultaneousRequests = 2;

  /**
   * Promise pool used to throttle connections to waveform service
   */
  private readonly promiseQueue = new PQueue({ concurrency: this.simultaneousRequests });

  /**
   * Set current waveform loading state in redux. Plumbed through the Waveform Panel
   */
  private readonly setWaveformClientLoadingState: (
    waveformClientState: AnalystWorkspaceTypes.WaveformClientState
  ) => void;

  /**
   * Set the initial loading state used in Redux
   */
  private waveformLoadingState: AnalystWorkspaceTypes.WaveformClientState = clone(
    AnalystWorkspaceTypes.DEFAULT_INITIAL_WAVEFORM_CLIENT_STATE
  );

  /**
   * Waveform Client constructor
   *
   * @param setWaveformClientLoadingState setter to set waveformClientState in redux
   */
  public constructor(
    setWaveformClientLoadingState: (
      waveformClientState: AnalystWorkspaceTypes.WaveformClientState
    ) => void
  ) {
    this.setWaveformClientLoadingState = setWaveformClientLoadingState;
    this.setWaveformClientLoadingState(this.waveformLoadingState);
  }

  /**
   * Retrieves the cache entries associated with the provided channel ID.
   * This method returns undefined if no cache entries exists for the provided
   * channel ID.
   *
   * @param channelId The channel ID associated with the cache entry to retrieve
   *
   * @returns Map of id's (strings) to a list of either ChannelSegments or FilteredChannelSegments
   */
  public readonly getWaveformEntriesForChannelId = (
    channelId: string
  ): Map<string, WeavessTypes.ChannelSegment> =>
    this.waveformDataCache.getWaveformEntriesForChannelId(channelId);

  /**
   * Cancels the current fetch and clears the WF cache and the loading state
   */
  public readonly stopAndClear = (): void => {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Operation canceled by the user');
      this.cancelTokenSource = undefined;
    }

    // Reset the loading state
    this.waveformLoadingState = clone(AnalystWorkspaceTypes.DEFAULT_INITIAL_WAVEFORM_CLIENT_STATE);
    this.setWaveformClientLoadingState(this.waveformLoadingState);

    // Clear waveform caches; this ensures waveforms render if display is closed & re-opened
    this.waveformDataCache.clearAllWaveformEntries();
    IanQueries.WaveformQuery.clearWaveformCaches();
  };

  /**
   * Retrieves ChannelSegments from the OSD backend for the provided time range and channel IDs, and
   * updates the waveform data cache based on the results. If the overwrite parameter is provided and
   * set to true, cache entries will be overwritten with the retrieved ChannelSegments; otherwise
   * timeseries data from the retrieved ChannelSegments will be added to the existing cache entries
   * where they exist.
   *
   * @param channelIds list of channel ids to fetch for
   * @param filterIds list of filter ids to load data for
   * @param startTimeSecs start of interval to load waveforms for
   * @param endTimeSecs end of interval to load waveforms
   * @param notifyStateUpdated callback function that updates loading spinners/state about status of fetch
   * @param action callback to be executed after fetch
   * @param queuePriority precedence of these requests. Set a higher number to pre-empt existing queued requests
   */
  public readonly fetchAndCacheWaveforms = async (
    channelIds: string[],
    filters: WaveformTypes.WaveformFilter[],
    startTimeSecs: number,
    endTimeSecs: number,
    currentInterval: WeavessTypes.TimeRange,
    action: (channelNames: string[]) => unknown,
    queuePriority = 0
  ): Promise<void> => {
    if (channelIds && channelIds.length > 0) {
      if (!this.cancelTokenSource) {
        this.cancelTokenSource = Axios.CancelToken.source();
      }

      // Update the loading state to started if not in progress
      if (!this.waveformLoadingState.isLoading) {
        this.waveformLoadingState.completed = 0;
        this.waveformLoadingState.total = channelIds.length;
        this.waveformLoadingState.percent = 0;
        this.waveformLoadingState.isLoading = true;
      } else {
        this.waveformLoadingState.total += channelIds.length;
        this.waveformLoadingState.percent =
          this.waveformLoadingState.completed / this.waveformLoadingState.total;
      }
      this.setWaveformClientLoadingState(this.waveformLoadingState);

      // Sort channel names so they populate on the display in alphabetical order
      channelIds = sortBy(channelIds);

      // Add request batches to the promise queue
      const fetchFunctions = [];
      channelIds.forEach(channelId => {
        fetchFunctions.push(
          this.promiseQueue.add(
            async () =>
              this.internalFetchAndCacheRawWaveforms(
                channelId,
                startTimeSecs,
                endTimeSecs,
                currentInterval,
                action
              ),
            { priority: queuePriority }
          )
        );
      });
      await Promise.all(fetchFunctions);
    }
  };

  /**
   * Updates the fetch result state (completed and percent)
   *
   * @param completed the number of just completed fetches
   * @param notifyStateUpdated callback function that updates loading spinners/state about status of fetch
   */
  private readonly updateFetchResult = (completed: number) => {
    this.waveformLoadingState.completed += completed;
    this.waveformLoadingState.percent =
      this.waveformLoadingState.completed / this.waveformLoadingState.total;
    // Update the loading state to done
    if (this.waveformLoadingState.completed === this.waveformLoadingState.total) {
      // Update state of isLoading based on if the total number of channels have completed
      this.waveformLoadingState.isLoading = false;
    }
    // Update state in redux so the loading indicator updates
    this.setWaveformClientLoadingState(this.waveformLoadingState);
  };

  /**
   * Performs the react query calls to retrieve raw waveform data
   *
   * @param channelIds a list of channelIds to fetch
   * @param startTimeSecs start of the interval to fetch wf data
   * @param endTimeSecs start of the interval to fetch wf data
   * @param filterIds list of filter ids to load data for
   * @param action callback to be executed after fetch
   *
   * @returns a list of fetched channel ids'
   */
  private readonly internalFetchAndCacheRawWaveforms = async (
    channelId: string,
    startTimeSecs: number,
    endTimeSecs: number,
    currentInterval: WeavessTypes.TimeRange,
    action: (channelNames: string[]) => unknown
  ): Promise<void> => {
    // Request raw waveforms via react query
    if (this.cancelTokenSource?.token) {
      // Ask the data cache for time range of missing waveform
      const missingTimeRange: WeavessTypes.TimeRange = this.waveformDataCache.getMissingWaveformTimeRange(
        channelId,
        startTimeSecs,
        endTimeSecs
      );

      // If all the waveform data is already cached then return
      if (!missingTimeRange) {
        this.updateFetchResult(1);
        action([channelId]);
        return new Promise<void>(resolve => resolve());
      }

      // Fetch and Cache Waveforms
      const channelRequest: ChannelTypes.ChannelRequest = {
        name: channelId,
        effectiveAt: startTimeSecs
      };
      const waveformQueryInput: WaveformTypes.WaveformQueryArgs = {
        channels: [channelRequest],
        startTime: missingTimeRange.startTimeSecs,
        endTime: missingTimeRange.endTimeSecs
      };
      await IanQueries.WaveformQuery.fetchWaveforms(waveformQueryInput, currentInterval)
        .then(queryChannelSegments => {
          // If the waveform requests have been cancelled (loading will be set to false)
          // then skip adding to the cache and update the waveform state
          if (!this.waveformLoadingState.isLoading) {
            return [];
          }
          // Update the cache with results and query
          this.waveformDataCache.updateFromChannelSegments(queryChannelSegments, {
            startTimeSecs: waveformQueryInput.startTime,
            endTimeSecs: waveformQueryInput.endTime
          });

          // Update the state for the number of channels returned
          this.updateFetchResult(waveformQueryInput.channels.length);

          // If there was waveform data returned
          // Call the provided action callback
          // after filtered waveforms have been added to data cache
          const channelSegmentNames: string[] = queryChannelSegments
            .filter(cs => cs.dataSegments.length > 0)
            .map(cs => cs.channelName);

          if (channelSegmentNames.length > 0) {
            action(channelSegmentNames);
          }
          return queryChannelSegments;
        })
        .catch(e =>
          // Decrement remaining query count by the failed query caught
          // The error is logged in the Query Util
          this.updateFetchResult(waveformQueryInput.channels.length)
        );
    }
    return new Promise<void>(resolve => resolve());
  };
}
