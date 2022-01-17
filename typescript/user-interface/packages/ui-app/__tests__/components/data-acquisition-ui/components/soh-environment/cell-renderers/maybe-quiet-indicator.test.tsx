import { SohTypes } from '@gms/common-model';
import React from 'react';

import { MaybeQuietIndicator } from '../../../../../../src/ts/components/data-acquisition-ui/components/soh-environment/cell-renderers/maybe-quiet-indicator';
import { QuietIndicatorWrapperProps } from '../../../../../../src/ts/components/data-acquisition-ui/components/soh-environment/cell-renderers/types';
// eslint-disable-next-line max-len
import { EnvironmentalSoh } from '../../../../../../src/ts/components/data-acquisition-ui/components/soh-environment/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('quiet indicator wrapper', () => {
  const valueAndStatusByChannelNameVal: EnvironmentalSoh = {
    value: 10,
    status: SohTypes.SohStatusSummary.GOOD,
    monitorTypes: SohTypes.SohMonitorType.MISSING,
    channelName: 'channelName',
    hasUnacknowledgedChanges: true,
    quietTimingInfo: {
      quietDurationMs: 100,
      quietUntilMs: 100
    },
    isSelected: false,
    isContributing: true
  };
  // const valueAndStatusByChannelNameMap: Map<string, EnvironmentalSoh> = new Map();
  // valueAndStatusByChannelNameMap.set('channelName', valueAndStatusByChannelNameVal);
  const myProps: QuietIndicatorWrapperProps = {
    data: valueAndStatusByChannelNameVal,
    diameterPx: 34
  };
  // eslint-disable-next-line react/jsx-props-no-spreading
  const quietIndicatorWrapper = Enzyme.mount(<MaybeQuietIndicator {...myProps} />);
  it('should be defined', () => {
    expect(MaybeQuietIndicator).toBeDefined();
  });
  it('should match snapshot', () => {
    expect(quietIndicatorWrapper).toBeDefined();
  });
});
