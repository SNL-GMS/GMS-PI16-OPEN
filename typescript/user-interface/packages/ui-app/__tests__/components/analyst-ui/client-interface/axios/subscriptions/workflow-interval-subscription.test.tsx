import { CommonTypes, WorkflowTypes } from '@gms/common-model';
import { InteractiveAnalysisStageInterval } from '@gms/common-model/lib/workflow/types';
import { AxiosRequestConfig } from 'axios';

import { getWorkflowIntervalQueryConfig } from '../../../../../../src/ts/components/analyst-ui/client-interface/axios/queries/workflow-interval-query';
import {
  cacheInitializedCallBack,
  subscribeWorkflowInterval
} from '../../../../../../src/ts/components/analyst-ui/client-interface/axios/subscriptions/workflow-interval-subscription';
import * as Subscriptions from '../../../../../../src/ts/components/client-interface';
import { deserializeTypeTransformer } from '../../../../../../src/ts/components/client-interface/axios/axios-transformers';
import { queryCache } from '../../../../../../src/ts/components/client-interface/axios/queries/query-util';

function getStageInterval(): WorkflowTypes.InteractiveAnalysisStageInterval {
  return JSON.parse(
    `{
    "stageMode": "INTERACTIVE",
    "activityIntervals": [
      {
        "name": "name",
        "processingStartTime": "2010-05-19T20:00:01.000Z",
        "processingEndTime": "2010-05-19T22:00:00.000Z",
        "status": "COMPLETE",
        "comment": "This is a comment",
        "modificationTime": "2010-05-19T20:00:01.000Z",
        "percentAvailable": 5,
        "stageName": "AL1",
        "activeAnalysts": ["Richard"]
      }
    ],
    "name": "name",
    "startTime": "2010-05-19T20:00:01.000Z",
    "endTime": "2010-05-19T22:00:00.000Z",
    "processingStartTime": "2010-05-19T20:00:01.000Z",
    "processingEndTime": "2010-05-19T22:00:00.000Z",
    "status": "COMPLETE",
    "comment": "This is a comment",
    "modificationTime": "2010-05-19T20:00:01.000Z",
    "percentAvailable": 5
  }`
  );
}

let queryCacheMock;
let subscriptionsMock;

function initializeMocks(
  subscriptionCallBackArg: WorkflowTypes.StageInterval[],
  getFn: (key: (string | AxiosRequestConfig)[]) => Map<string, WorkflowTypes.StageInterval[]>
): void {
  queryCacheMock = {
    getQueryData: jest.fn(getFn),
    setQueryData: jest.fn()
  };
  Object.assign(queryCache, queryCacheMock);

  subscriptionsMock = {
    Subscriptions: {
      UiSubscription: {
        getWsConnection: jest.fn(),
        establishWsConnection: jest.fn((): WebSocket => null),
        addSubscriber: jest.fn(
          (
            topic: string,
            subscriptionCallBack: (data: WorkflowTypes.StageInterval[]) => void
          ): string => {
            subscriptionCallBack(subscriptionCallBackArg);
            return null;
          }
        )
      }
    }
  };
  Object.assign(Subscriptions, subscriptionsMock);
}

describe('Workflow Interval Subscription', () => {
  const timeRange: CommonTypes.TimeRange = {
    startTimeSecs: 0,
    endTimeSecs: 100
  };

  const key = getWorkflowIntervalQueryConfig([], timeRange).queryKey;

  it('subscribeWorkflowInterval replaces populated query cache', () => {
    const initialInterval = deserializeTypeTransformer(getStageInterval());
    // Now make change to an updated interval
    const intervalToInsert: WorkflowTypes.InteractiveAnalysisStageInterval = deserializeTypeTransformer(
      getStageInterval()
    );
    intervalToInsert.activityIntervals[0].activeAnalysts.push('Raymond Luxury Yacht');

    const initialMap = new Map<string, WorkflowTypes.StageInterval[]>([
      [initialInterval.name, [initialInterval]]
    ]);
    initializeMocks([intervalToInsert], () => initialMap);

    const updatedMap = new Map<string, WorkflowTypes.StageInterval[]>([
      [intervalToInsert.name, [intervalToInsert]]
    ]);

    expect(key).toBeDefined();
    expect(subscribeWorkflowInterval(key)).toBeUndefined();

    expect(subscriptionsMock.Subscriptions.UiSubscription.addSubscriber).toBeCalled();
    expect(queryCacheMock.getQueryData).toBeCalledWith(key);
    expect(queryCacheMock.setQueryData).toBeCalledWith(key, updatedMap);
  });

  it('subscribeWorkflowInterval adds to populated query cache', () => {
    const initialInterval = deserializeTypeTransformer(getStageInterval());
    // Now make change to an updated interval
    const intervalToInsert: WorkflowTypes.InteractiveAnalysisStageInterval = deserializeTypeTransformer(
      getStageInterval()
    );
    intervalToInsert.activityIntervals[0].activeAnalysts.push('Throatwarbler Mangrove');
    intervalToInsert.startTime = 9999999;

    const initialMap = new Map<string, WorkflowTypes.StageInterval[]>([
      [initialInterval.name, [initialInterval]]
    ]);
    initializeMocks([intervalToInsert], () => initialMap);

    const updatedMap = new Map<string, WorkflowTypes.StageInterval[]>([
      [intervalToInsert.name, [initialInterval, intervalToInsert]]
    ]);

    expect(key).toBeDefined();
    expect(subscribeWorkflowInterval(key)).toBeUndefined();

    expect(subscriptionsMock.Subscriptions.UiSubscription.addSubscriber).toBeCalled();
    expect(queryCacheMock.getQueryData).toBeCalledWith(key);
    expect(queryCacheMock.setQueryData).toBeCalledWith(key, updatedMap);
  });

  it('subscribeWorkflowInterval receives interval for un-cached stage', () => {
    const initialInterval: WorkflowTypes.InteractiveAnalysisStageInterval = deserializeTypeTransformer(
      getStageInterval()
    );
    initialInterval.activityIntervals[0].activeAnalysts.push('Throatwarbler Mangrove');
    initialInterval.name = 'Different Stage';

    const map = new Map<string, WorkflowTypes.StageInterval[]>([
      [initialInterval.name, [initialInterval]]
    ]);
    initializeMocks([getStageInterval()], () => map);

    expect(key).toBeDefined();
    expect(subscribeWorkflowInterval(key)).toBeUndefined();

    expect(subscriptionsMock.Subscriptions.UiSubscription.addSubscriber).toBeCalled();
    expect(queryCacheMock.getQueryData).toBeCalledWith(key);
    expect(queryCacheMock.setQueryData).toBeCalled();
  });

  it('subscribeWorkflowInterval buffers intervals until cache is initialized', () => {
    const initialInterval: InteractiveAnalysisStageInterval = deserializeTypeTransformer(
      getStageInterval()
    );

    initializeMocks([initialInterval], null);

    expect(key).toBeDefined();
    expect(subscribeWorkflowInterval(key)).toBeUndefined();
    expect(subscriptionsMock.Subscriptions.UiSubscription.addSubscriber).toBeCalled();
    expect(queryCacheMock.getQueryData).toBeCalledWith(key);
    expect(queryCacheMock.setQueryData).not.toBeCalled();

    initializeMocks(
      [],
      () => new Map<string, WorkflowTypes.StageInterval[]>([[initialInterval.name, []]])
    );

    cacheInitializedCallBack();
    expect(queryCacheMock.getQueryData).toBeCalledWith(key);
    const expectedQueryData = new Map<string, WorkflowTypes.StageInterval[]>([
      [initialInterval.name, [initialInterval]]
    ]);

    expect(queryCacheMock.setQueryData).toBeCalledWith(key, expectedQueryData);
  });

  it('subscribeWorkflowInterval ignores insertion of intervals modified earlier than the cached interval', () => {
    const initialInterval = deserializeTypeTransformer(getStageInterval());
    // Now make change to an updated interval
    const intervalToIgnore: WorkflowTypes.InteractiveAnalysisStageInterval = deserializeTypeTransformer(
      getStageInterval()
    );
    intervalToIgnore.modificationTime -= 1;

    const initialMap = new Map<string, WorkflowTypes.StageInterval[]>([
      [initialInterval.name, [initialInterval]]
    ]);
    initializeMocks([intervalToIgnore], () => initialMap);

    expect(key).toBeDefined();
    expect(subscribeWorkflowInterval(key)).toBeUndefined();

    expect(subscriptionsMock.Subscriptions.UiSubscription.addSubscriber).toBeCalled();
    expect(queryCacheMock.getQueryData).toBeCalledWith(key);
    expect(queryCacheMock.setQueryData).toBeCalledWith(key, initialMap);
  });
});
