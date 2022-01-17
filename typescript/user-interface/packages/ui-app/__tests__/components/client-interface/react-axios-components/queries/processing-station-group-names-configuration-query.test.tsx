/* eslint-disable jest/expect-expect */
import {
  useProcessingStationGroupNamesConfigurationQuery,
  withProcessingStationGroupNamesConfigurationQuery
} from '../../../../../src/ts/components/client-interface/axios/queries/processing-station-group-names-configuration-query';
import {
  expectQueryHookToMakeAxiosRequest,
  expectThatCompositionInjectsAProp
} from '../../../../utils/query-mutation-test-utils';

describe('Processing Station Group Names Configuration Query', () => {
  it('provides a hook for accessing the processing configuration', () => {
    expect(useProcessingStationGroupNamesConfigurationQuery).toBeDefined();
  });

  it('hook queries for processing station group names configuration', async () => {
    await expectQueryHookToMakeAxiosRequest(useProcessingStationGroupNamesConfigurationQuery);
  });

  it('can inject a prop called processingStationGroupNamesConfigurationQuery', () => {
    expectThatCompositionInjectsAProp(
      withProcessingStationGroupNamesConfigurationQuery,
      'processingStationGroupNamesConfigurationQuery'
    );
  });
});
