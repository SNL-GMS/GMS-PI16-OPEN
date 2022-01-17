import React from 'react';

import {
  SohContext,
  SohContextData
} from '../../../../src/ts/components/data-acquisition-ui/shared/soh-context';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('Soh context', () => {
  const sohChartContext: SohContextData = {
    glContainer: {} as any,
    quietChannelMonitorStatuses: jest.fn()
  };
  const DumbComp: React.FunctionComponent = () => <div />;
  const sohChartContextMount = Enzyme.shallow(
    <SohContext.Provider value={sohChartContext}>
      <DumbComp />
    </SohContext.Provider>
  );
  it('should be defined', () => {
    expect(SohContext).toBeDefined();
  });
  it('should match snapshot', () => {
    expect(sohChartContextMount).toMatchSnapshot();
  });
});
