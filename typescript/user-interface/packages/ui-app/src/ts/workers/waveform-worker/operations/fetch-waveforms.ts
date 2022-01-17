import { ChannelSegmentTypes, WaveformTypes } from '@gms/common-model';
import { WeavessTypes } from '@gms/weavess-core';
import { AxiosRequestConfig } from 'axios';

import { defaultQuery } from '~components/client-interface';
import { GMSColors, SemanticColors } from '~scss-config/color-preferences';

import { convertChannelSegmentsToWeavessTypedArrays } from '../util/channel-segment-util';
import { setGlobalDomain } from './get-waveform';

export interface FetchWaveformParameters {
  queryKey: string;
  originalDomain: WeavessTypes.TimeRange;
  requestConfig: AxiosRequestConfig;
  gmsColors: GMSColors;
  semanticColors: SemanticColors;
}

/**
 * Sends a request to the server using the provided request configuration and query key.
 * Uses the defaultQuery function to perform the request.
 * Validates the returned data to ensure it is of the expected type: ChannelSegment<WaveformTypes.Waveform>[]
 * Converts the returned data to the TypedArray format Weavess requires.
 *
 * @param queryKey the request key string denoting the type of request
 * @param requestConfig the request configuration, which should have data of the WaveformRequestArgs type set
 * @throws Error when the request configuration does not contain the expected WaveformRequestArgs data
 * @throws Error when the request did not return the expected type: ChannelSegment<WaveformTypes.Waveform>[]
 */
export const requestAndConvertWaveforms = async (
  queryKey: string,
  requestConfig: AxiosRequestConfig,
  originalDomain: WeavessTypes.TimeRange,
  gmsColors: GMSColors,
  semanticColors: SemanticColors
): Promise<WeavessTypes.ChannelSegment[]> => {
  const queryFn = defaultQuery();
  let result: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[] = [];
  try {
    result = (await queryFn(queryKey, requestConfig)) as ChannelSegmentTypes.ChannelSegment<
      WaveformTypes.Waveform
    >[];
  } catch (err) {
    let reason: string;
    if (err.response) {
      reason = `[Waveform Worker] Error loading waveform ${err}`;
    } else if (err.request) {
      reason = `[Waveform Worker] Something went wrong fetching waveforms. Cannot make request: ${err.request}`;
    } else {
      reason = `[Waveform Worker] Something went wrong fetching waveforms: ${err}`;
    }
    // eslint-disable-next-line no-console
    console.error(reason);
    return new Promise((resolve, reject) => reject(reason));
  }
  return convertChannelSegmentsToWeavessTypedArrays(
    result,
    originalDomain,
    gmsColors,
    semanticColors
  );
};

export const fetchWaveforms = async (
  params: FetchWaveformParameters
): Promise<WeavessTypes.ChannelSegment[]> => {
  setGlobalDomain(params.originalDomain);
  return requestAndConvertWaveforms(
    params.queryKey,
    params.requestConfig,
    params.originalDomain,
    params.gmsColors,
    params.semanticColors
  );
};
