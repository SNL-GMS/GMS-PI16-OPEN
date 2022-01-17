import { WaveformQueries } from '@gms/common-graphql';
import { WaveformTypes } from '@gms/common-model';
import { Client } from '@gms/ui-apollo';
import { ApolloQueryResult } from 'apollo-client';

export const getFilteredWaveformSegmentsByChannels = async ({
  variables,
  client
}: {
  variables: WaveformTypes.GetFilteredWaveformSegmentQueryArgs;
  client: Client;
}): Promise<
  ApolloQueryResult<{
    getFilteredWaveformSegmentsByChannels?: WaveformTypes.FilteredChannelSegment[];
  }>
> =>
  client.query<{ getFilteredWaveformSegmentsByChannels?: WaveformTypes.FilteredChannelSegment[] }>({
    variables: {
      ...variables
    },
    query: WaveformQueries.getFilteredWaveformSegmentsByChannelsQuery
  });
