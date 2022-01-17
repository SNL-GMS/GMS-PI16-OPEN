/* eslint-disable jest/expect-expect */
import {
  useProcessingAnalystConfigurationQuery,
  withProcessingAnalystConfigurationQuery
} from '../../../../../src/ts/components/client-interface/axios/queries/processing-analyst-configuration-query';
import {
  expectQueryHookToMakeAxiosRequest,
  expectThatCompositionInjectsAProp
} from '../../../../utils/query-mutation-test-utils';

describe('Processing Analyst Configuration Query', () => {
  it('provides a hook for accessing the processing configuration', () => {
    expect(useProcessingAnalystConfigurationQuery).toBeDefined();
  });

  it('hook queries for processing configuration', async () => {
    await expectQueryHookToMakeAxiosRequest(useProcessingAnalystConfigurationQuery);
  });

  it('can inject a prop called processingAnalystConfigurationQuery', () => {
    expectThatCompositionInjectsAProp(
      withProcessingAnalystConfigurationQuery,
      'processingAnalystConfigurationQuery'
    );
  });
});
