import { ProcessingChannel } from '../station/processing-station/types';

/**
 * Converts Processing Channels into OSD compatible Channels
 *
 * @param channels Gateway compatible Processing Channel
 * @returns OSD compatible channel list
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertOSDProcessingChannel(channels: ProcessingChannel[]): any[] {
  const osdChannels = [];
  channels.forEach(channel => {
    const newChannel = {
      ...channel
    };
    osdChannels.push(newChannel);
  });
  return osdChannels;
}
