import { WaveformQueries } from '@gms/common-graphql';
import { ChannelSegmentTypes, WaveformTypes } from '@gms/common-model';
import { Client } from '@gms/ui-apollo';
import { ApolloQueryResult } from 'apollo-client';

export const getRawWaveformSegmentsByChannels = async ({
  variables,
  client
}: {
  variables: WaveformTypes.GetRawWaveformSegmentQueryArgs;
  client: Client;
}): Promise<
  ApolloQueryResult<{
    getRawWaveformSegmentsByChannels?: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[];
  }>
> =>
  client.query<{
    getRawWaveformSegmentsByChannels?: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[];
  }>({
    variables: {
      ...variables
    },
    query: WaveformQueries.getRawWaveformSegmentsByChannelsQuery
  });
