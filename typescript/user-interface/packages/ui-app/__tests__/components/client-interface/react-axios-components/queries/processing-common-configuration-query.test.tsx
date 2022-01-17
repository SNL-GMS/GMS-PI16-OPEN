/* eslint-disable jest/expect-expect */
import {
  useProcessingCommonConfigurationQuery,
  withProcessingCommonConfigurationQuery
} from '../../../../../src/ts/components/client-interface/axios/queries/processing-common-configuration-query';
import {
  expectQueryHookToMakeAxiosRequest,
  expectThatCompositionInjectsAProp
} from '../../../../utils/query-mutation-test-utils';

describe('Processing Common Configuration Query', () => {
  it('provides a hook for accessing the processing configuration', () => {
    expect(useProcessingCommonConfigurationQuery).toBeDefined();
  });

  it('hook queries for processing configuration', async () => {
    await expectQueryHookToMakeAxiosRequest(useProcessingCommonConfigurationQuery);
  });

  it('can inject a prop called processingCommonConfigurationQuery', () => {
    expectThatCompositionInjectsAProp(
      withProcessingCommonConfigurationQuery,
      'processingCommonConfigurationQuery'
    );
  });
});
