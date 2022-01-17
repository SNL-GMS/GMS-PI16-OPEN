/* eslint-disable jest/expect-expect */
import {
  useOperationalTimePeriodConfigurationQuery,
  withOperationalTimePeriodConfigurationQuery
} from '../../../../../src/ts/components/client-interface/axios/queries/processing-operational-time-period-configuration-query';
import {
  expectQueryHookToMakeAxiosRequest,
  expectThatCompositionInjectsAProp
} from '../../../../utils/query-mutation-test-utils';

describe('Processing Operational Time Period Configuration Query', () => {
  it('provides a hook for accessing the processing configuration', () => {
    expect(useOperationalTimePeriodConfigurationQuery).toBeDefined();
  });

  it('hook queries for processing configuration', async () => {
    await expectQueryHookToMakeAxiosRequest(useOperationalTimePeriodConfigurationQuery);
  });

  it('can inject a prop called OperationalTimePeriodConfigurationQuery', () => {
    expectThatCompositionInjectsAProp(
      withOperationalTimePeriodConfigurationQuery,
      'operationalTimePeriodConfigurationQuery'
    );
  });
});
