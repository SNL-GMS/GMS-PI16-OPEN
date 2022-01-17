/* eslint-disable jest/expect-expect */
import {
  useSystemMessageDefinitionQuery,
  withSystemMessageDefinitions
} from '../../../../../src/ts/components/client-interface/axios/queries/system-message-definition-query';
import {
  expectQueryHookToMakeAxiosRequest,
  expectThatCompositionInjectsAProp
} from '../../../../utils/query-mutation-test-utils';

describe('System Message Definition Query', () => {
  it('provides a hook for accessing the system message definitions', () => {
    expect(useSystemMessageDefinitionQuery).toBeDefined();
  });

  it('hook queries for system message definitions', async () => {
    await expectQueryHookToMakeAxiosRequest(useSystemMessageDefinitionQuery);
  });

  it('can inject a prop called systemMessageDefinitionsQuery', () => {
    expectThatCompositionInjectsAProp(
      withSystemMessageDefinitions,
      'systemMessageDefinitionsQuery'
    );
  });
});
