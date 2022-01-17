import { AxiosRequestConfig } from 'axios';

import { WaveformAxiosRequestConfig } from '~analyst-ui/client-interface/axios/types';

/**
 * TypeGuard that checks an axios configuration's internal data to verify that it is a correctly
 * formatted request config for waveform data. Checks for
 *   startTime: string;
 *   endTime: string;
 *   channels: ChannelRequest[];
 *
 * @param requestConfig The Axios Request Configuration that should be checked to see if its
 * request data is of the type WaveformRequest
 */

export function isWaveformRequest(
  requestConfig: AxiosRequestConfig
): requestConfig is WaveformAxiosRequestConfig {
  return (
    requestConfig?.data &&
    typeof requestConfig.data?.startTime === 'string' &&
    typeof requestConfig.data?.endTime === 'string' &&
    Array.isArray(requestConfig.data?.channels) &&
    (requestConfig.data.channels.length === 0 ||
      (requestConfig.data.channels[0]?.name &&
        typeof requestConfig.data.channels[0].name === 'string'))
  );
}
