/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChannelSegmentTypes,
  EventTypes,
  QcMaskTypes,
  SignalDetectionTypes,
  WaveformTypes,
  WorkflowTypes
} from '@gms/common-model';
import { AxiosRequestConfig } from 'axios';
import { QueryResult } from 'react-query';

export interface EventMutationArgs {
  variables: {
    events: EventTypes.Event[];
  };
}

export interface QcMaskMutationArgs {
  variables: {
    qcMasks: QcMaskTypes.QcMask[];
  };
}

export interface SignalDetectionMutationArgs {
  variables: {
    signalDetections: SignalDetectionTypes.SignalDetection[];
  };
}

// ***************************************
// Workflow Interval Query and Mutation interfaces
// ***************************************
export interface StageIntervalsByStageIdAndTimeRequest {
  startTime: number;
  endTime: number;
  stageIds: WorkflowTypes.WorkflowDefinitionId[];
}
export interface UserRequest {
  userName: string;
  time: number;
}

export interface UpdateActivityIntervalStatusRequest extends UserRequest {
  activityIntervalId: WorkflowTypes.IntervalId;
  stageIntervalId: WorkflowTypes.IntervalId;
  status: WorkflowTypes.IntervalStatus;
}

export interface UpdateInteractiveAnalysisStageIntervalStatusRequest extends UserRequest {
  stageIntervalId: WorkflowTypes.IntervalId;
  status: WorkflowTypes.IntervalStatus;
}

export interface SplitActivityIntervalRequest {
  intervalId: WorkflowTypes.IntervalId;
  duration: number;
}
export interface EventQueryProps {
  eventQuery: QueryResult<EventTypes.Event[], any>;
}

export interface QcMaskQueryProps {
  qcMaskQuery: QueryResult<QcMaskTypes.QcMask[], any>;
}

export interface SignalDetectionQueryProps {
  signalDetectionQuery: QueryResult<SignalDetectionTypes.SignalDetection[], any>;
}

export interface WaveformQueryProps {
  waveformQuery: QueryResult<ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[], any>;
}

/**
 * An axios request known to have a waveform query request in its data.
 */
export type WaveformAxiosRequestConfig = AxiosRequestConfig & {
  data: WaveformTypes.WaveformQueryArgs;
};
