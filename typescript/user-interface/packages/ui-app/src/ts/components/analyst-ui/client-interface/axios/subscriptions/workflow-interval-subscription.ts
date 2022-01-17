import { WorkflowTypes } from '@gms/common-model';
import Immutable from 'immutable';
import isEqual from 'lodash/isEqual';
import { QueryKey } from 'react-query';

import { queryCache, Subscriptions } from '~components/client-interface';

let key: QueryKey;
let subscriptionId: string;

let stageIntervalBuffer: WorkflowTypes.StageInterval[] = [];

const updateQueryCache = (): void => {
  // Get the cached Map of Stage Intervals
  let cacheResultMap: Immutable.Map<
    string,
    WorkflowTypes.StageInterval[]
  > = queryCache.getQueryData(key);

  if (cacheResultMap) {
    stageIntervalBuffer.forEach(stageInterval => {
      // If no map or map entry not found
      if (!cacheResultMap.has(stageInterval.name)) {
        // eslint-disable-next-line no-console
        console.log(`Query cache does not have stage ${stageInterval.name}`);
        return;
      }

      // Get the Stage Interval list for the relevant Stage
      const cacheStageIntervals: WorkflowTypes.StageInterval[] = cacheResultMap.get(
        stageInterval.name
      );

      // Update the Stage Interval list with the updated/new Stage Interval
      let foundInCache = false;
      const newData: WorkflowTypes.StageInterval[] =
        cacheStageIntervals.map(si => {
          // if the name, stageMode, startTime and endTime match,
          // and modification time is after the cached entry, it is an update
          if (
            isEqual(si.name, stageInterval.name) &&
            si.stageMode === stageInterval.stageMode &&
            si.startTime === stageInterval.startTime &&
            si.endTime === stageInterval.endTime
          ) {
            foundInCache = true;
            if (si.modificationTime <= stageInterval.modificationTime) {
              return stageInterval;
            }
            return si;
          }
          return si;
        }) ?? [];

      // If data was not an update then add as a new entry
      if (!foundInCache) {
        newData.push(stageInterval);
      }

      // Put the updated list back in the Map
      cacheResultMap = cacheResultMap.set(stageInterval.name, newData);
    });

    // Set the map back in the queryCache
    queryCache.setQueryData(key, cacheResultMap);

    stageIntervalBuffer = [];
  }
};

// Callback from the subscription list of StageInterval
const subscriptionCallback: (
  stageIntervals: WorkflowTypes.StageInterval[]
) => void = stageIntervals => {
  // If data is not defined
  if (!stageIntervals || stageIntervals.length === 0) {
    return;
  }

  stageIntervalBuffer = stageIntervalBuffer.concat(stageIntervals);
  updateQueryCache();
};

/**
 * Callback to be leveraged when the query cache associated with interval subscriptions has been initialized
 */
export const cacheInitializedCallBack: () => void = () => {
  if (stageIntervalBuffer.length > 0) {
    updateQueryCache();
  }
};

/**
 * Removes the subscription for workflow intervals from the parent UI subscription
 */
export const unsubscribeWorkflowInterval = (): void => {
  Subscriptions.UiSubscription.removeSubscriber(subscriptionId, 'intervals');
};

/**
 * Starts a Workflow Interval Subscript that will update the QueryCache with new StageIntervals
 */
export const subscribeWorkflowInterval = (queryKey: QueryKey): void => {
  key = queryKey;
  try {
    if (!Subscriptions.UiSubscription.getWsConnection()) {
      Subscriptions.UiSubscription.establishWsConnection();
    }
    if (!subscriptionId) {
      subscriptionId = Subscriptions.UiSubscription.addSubscriber(
        'intervals',
        subscriptionCallback
      );
    }
  } catch (e) {
    unsubscribeWorkflowInterval();
    throw new Error(e);
  }
};
