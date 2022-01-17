/* eslint-disable jest/expect-expect */
import { NonIdealStateDefinition, WithNonIdealStates } from '@gms/ui-core-components';
import * as Enzyme from 'enzyme';
import * as React from 'react';

import { AnalystNonIdealStates } from '../../../../../src/ts/components/analyst-ui/common/non-ideal-states';

const testForLoadingAndError = (defs: NonIdealStateDefinition<unknown>[], key: string) => {
  const TestComponent: React.FC = () => <div>Test</div>;
  const WrappedComponent = WithNonIdealStates<any>(defs, TestComponent);
  const props = {};

  props[key] = { isLoading: true, isError: false };
  // eslint-disable-next-line react/jsx-props-no-spreading
  const loadingWrapper = Enzyme.mount(<WrappedComponent {...props} />);
  expect(loadingWrapper.containsMatchingElement(<TestComponent />)).toEqual(false);
  // index 1 is the error case
  expect(loadingWrapper.containsMatchingElement(defs[1].element)).toEqual(false);
  // index 0 is the loading case
  expect(loadingWrapper.containsMatchingElement(defs[0].element)).toEqual(true);

  props[key] = { isLoading: false, isError: true };
  // eslint-disable-next-line react/jsx-props-no-spreading
  const errorWrapper = Enzyme.mount(<WrappedComponent {...props} />);
  expect(errorWrapper.containsMatchingElement(<TestComponent />)).toEqual(false);
  // index 0 is the loading case
  expect(errorWrapper.containsMatchingElement(defs[0].element)).toEqual(false);
  // index 1 is the error case
  expect(errorWrapper.containsMatchingElement(defs[1].element)).toEqual(true);
};

describe('Non ideal state definitions', () => {
  it('renders non ideal states for loading and error processing analyst configuration', () => {
    testForLoadingAndError(
      AnalystNonIdealStates.processingAnalystConfigNonIdealStateDefinitions,
      'processingAnalystConfigurationQuery'
    );
  });

  it('renders non ideal states for loading and error events', () => {
    testForLoadingAndError(AnalystNonIdealStates.eventNonIdealStateDefinitions, 'eventQuery');
  });

  it('renders non ideal states for loading and error signal detections', () => {
    testForLoadingAndError(
      AnalystNonIdealStates.signalDetectionsNonIdealStateDefinitions,
      'signalDetectionQuery'
    );
  });
  it('renders non ideal states for loading and error qc masks', () => {
    testForLoadingAndError(AnalystNonIdealStates.qcMaskNonIdealStateDefinitions, 'qcMaskQuery');
  });

  it('renders non ideal states for loading and error station definitions', () => {
    testForLoadingAndError(
      AnalystNonIdealStates.stationDefinitionNonIdealStateDefinitions,
      'stationDefinitionsQuery'
    );
  });
});
