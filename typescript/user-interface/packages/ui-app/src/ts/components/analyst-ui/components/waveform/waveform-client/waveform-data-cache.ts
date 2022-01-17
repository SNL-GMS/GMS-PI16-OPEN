import { WeavessTypes } from '@gms/weavess-core';
import clone from 'lodash/clone';

/**
 * Provides an in-memory cache for waveform data used in rendering the waveform display
 */
export class WaveformDataCache {
  private readonly cache: Map<
    string,
    {
      channelSegmentMap: Map<string, WeavessTypes.ChannelSegment>;
      queryTimeRange: WeavessTypes.TimeRange;
    }
  > = new Map<
    string,
    {
      channelSegmentMap: Map<string, WeavessTypes.ChannelSegment>;
      queryTimeRange: WeavessTypes.TimeRange;
    }
  >();

  /**
   * Look in the cache to see if already have waveform data for the time range requested.
   * If there is a missing portion of the time range to the left or right of the existing data, then
   * return that time range. Note that this does not scan for holes, only for missing data before
   * and after the cached data.
   * If the whole time range is already cached return undefined.
   *
   * @param channelId
   * @param startTimeSecs
   * @param endTimeSecs
   *
   * @returns the missing time range
   */
  public readonly getMissingWaveformTimeRange = (
    channelId: string,
    startTimeSecs: number,
    endTimeSecs: number
  ): WeavessTypes.TimeRange => {
    // Get the cache entry
    const cachedEntry = this.cache.get(channelId);

    // If the channel has no entry return the entire time range
    if (!cachedEntry || !cachedEntry.queryTimeRange) {
      return {
        startTimeSecs,
        endTimeSecs
      };
    }

    // If the cache contains the waveform then nothing is missing
    if (
      cachedEntry.queryTimeRange.startTimeSecs <= startTimeSecs &&
      cachedEntry.queryTimeRange.endTimeSecs >= endTimeSecs
    ) {
      return undefined;
    }

    // Gotten this far figure out what the missing time range is
    const missingTimeRange: WeavessTypes.TimeRange = {
      startTimeSecs,
      endTimeSecs
    };

    // If we are asking for a larger range than the cached data, just return the full range.
    if (
      cachedEntry.queryTimeRange.startTimeSecs > missingTimeRange.startTimeSecs &&
      cachedEntry.queryTimeRange.endTimeSecs < missingTimeRange.endTimeSecs
    ) {
      return missingTimeRange;
    }

    // Going to assume the range is contiguous. Looking to see if the hole is on the left side
    if (cachedEntry.queryTimeRange.startTimeSecs > missingTimeRange.startTimeSecs) {
      missingTimeRange.endTimeSecs = cachedEntry.queryTimeRange.startTimeSecs;
    }

    // Going to assume the range is contiguous. Looking to see if the hole is on the right side
    if (cachedEntry.queryTimeRange.endTimeSecs < missingTimeRange.endTimeSecs) {
      missingTimeRange.startTimeSecs = cachedEntry.queryTimeRange.endTimeSecs;
    }
    return missingTimeRange;
  };

  /**
   * Retrieve the cache entry associated with the provided channel ID/filter ID.
   * This method returns undefined if no cache entry exists for the provided
   * channel ID/filter ID.
   *
   * @param channelId The channel ID associated with the cache entry to retrieve
   * @param filterId The filter ID associated with the cache entry to retrieve
   *
   * @returns a list of either channel segments or filtered channel segments
   */
  public readonly getWaveformEntry = (
    channelId: string,
    filterId: string
  ): WeavessTypes.ChannelSegment => {
    if (this.cache.has(channelId) && this.cache.get(channelId).channelSegmentMap.has(filterId)) {
      return this.cache.get(channelId).channelSegmentMap.get(filterId);
    }
    return undefined;
  };

  /**
   * Retrieves the cache entries associated with the provided channel ID.
   * This method returns undefined if no cache entries exists for the provided
   * channel ID.
   *
   * @param channelId The channel ID associated with the cache entry to retrieve
   *
   * @returns a map of channelIds to a list of channel segments or filtered channel segments
   */
  public getWaveformEntriesForChannelId(
    channelId: string
  ): Map<string, WeavessTypes.ChannelSegment> {
    return this.cache.has(channelId)
      ? this.cache.get(channelId).channelSegmentMap
      : new Map<string, WeavessTypes.ChannelSegment>();
  }

  /**
   * Clears all entries from the cache.
   */
  public clearAllWaveformEntries = (): void => {
    this.cache.clear();
  };

  /**
   * Updates the cache from the provided list of ChannelSegments, adding
   * new cache entries for channel IDs not already in the cache, and
   * merging in timeseries data into existing cache entries where they exist.
   * If the overwrite parameter is set to true, this method will replace
   * existing cache entries associated with the channel IDs, rather than merging
   * in the new timeseries data.
   *
   * @param channelSegments The list of ChannelSegments from which to update
   * the cache
   */
  public readonly updateFromChannelSegments = (
    channelSegments: WeavessTypes.ChannelSegment[],
    queryTimeRange: WeavessTypes.TimeRange
  ): void => {
    if (channelSegments) {
      channelSegments.forEach(channelSegment => {
        this.updateChannelSegment(
          channelSegment.channelName,
          channelSegment.wfFilterId,
          channelSegment,
          queryTimeRange
        );
      });
    }
  };

  /**
   * Updates the cache from the provided channel segment, adding
   * new cache entries for channel ID/filter ID not already in the cache, and
   * merging in timeseries data into existing cache entries where they exist.
   * If the overwrite parameter is set to true, this method will replace
   * existing cache entries associated with the channel ID/filter ID,
   * rather than merging in the new timeseries data.
   *
   * @param channelId The channel ID used as the channel key for the entry in the cache
   * @param filterId The filter ID used as the filter key for the entry in the cache
   *
   */
  public readonly updateChannelSegment = (
    channelId: string,
    filterId: string,
    channelSegment: WeavessTypes.ChannelSegment,
    queryTimeRange: WeavessTypes.TimeRange
  ): void => {
    if (!channelId || !filterId) {
      return;
    }
    this.set(channelId, channelSegment, filterId, queryTimeRange);
  };

  /**
   * Insert the provided entry in the cache replacing the existing entry
   * if one exists. Returns undefined if the entry is not inserted; otherwise
   * returns the entry inserted.
   *
   * @param channelId The channel ID used as the channel key for the entry in the cache
   * @param filterId The filter ID used as the filter key for the entry in the cache
   * @param value The entry to insert into the cache associated to the provided
   * channel ID/filter ID
   *
   * @returns either a channelSegment or a filteredChannelSegment
   */
  private readonly set = (
    channelId: string,
    value: WeavessTypes.ChannelSegment,
    filterId: string,
    queryTimeRange: WeavessTypes.TimeRange
  ): WeavessTypes.ChannelSegment => {
    if (channelId) {
      if (!this.cache.has(channelId)) {
        this.cache.set(channelId, {
          channelSegmentMap: new Map(),
          queryTimeRange: {
            startTimeSecs: queryTimeRange.startTimeSecs,
            endTimeSecs: queryTimeRange.endTimeSecs
          }
        });
      }

      // Get the cache entry and update the query times
      const channelEntry = this.cache.get(channelId);
      if (channelEntry.queryTimeRange.startTimeSecs > queryTimeRange.startTimeSecs) {
        channelEntry.queryTimeRange = {
          startTimeSecs: queryTimeRange.startTimeSecs,
          endTimeSecs: channelEntry.queryTimeRange.endTimeSecs
        };
      }

      if (channelEntry.queryTimeRange.endTimeSecs < queryTimeRange.endTimeSecs) {
        channelEntry.queryTimeRange = {
          startTimeSecs: channelEntry.queryTimeRange.startTimeSecs,
          endTimeSecs: queryTimeRange.endTimeSecs
        };
      }

      // Update the data segment for the filter
      if (filterId) {
        // If already has a channel segment merge the channel segment else new one so add

        const existingData = channelEntry.channelSegmentMap.get(filterId);
        if (existingData) {
          // append the data segment waveform data
          // clone it so that the data is referentially different
          const updatedData = clone(existingData);
          updatedData.dataSegments = existingData.dataSegments.concat(value.dataSegments);
          channelEntry.channelSegmentMap.set(filterId, updatedData);
        } else {
          this.cache.get(channelId).channelSegmentMap.set(filterId, value);
        }
        return value;
      }
    }
    return undefined;
  };
}
