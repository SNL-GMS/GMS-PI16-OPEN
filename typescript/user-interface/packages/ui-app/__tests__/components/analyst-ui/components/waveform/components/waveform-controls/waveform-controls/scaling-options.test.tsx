/* eslint-disable @typescript-eslint/no-empty-function */
import Enzyme from 'enzyme';
import * as React from 'react';

import {
  AmplitudeScalingOptions,
  useScalingOptions
} from '../../../../../../../../src/ts/components/analyst-ui/components/waveform/components/waveform-controls/scaling-options';
import { waitForComponentToPaint } from '../../../../../../../utils/general-utils';

jest.mock(
  '~components/client-interface/axios/queries/processing-analyst-configuration-query',
  () => ({
    useProcessingAnalystConfigurationQuery: jest.fn(() => ({
      data: { fixedAmplitudeScaleValues: [1, 2] }
    }))
  })
);

describe('Scaling Options Toolbar Item', () => {
  it('should exist', () => {
    expect(useScalingOptions).toBeDefined();
  });
  it('should return a ToolbarItem element that matches a snapshot', async () => {
    const ScalingOptionWrapper: React.FC = () => {
      const scalingOptionToolbarItem = useScalingOptions(
        0,
        AmplitudeScalingOptions.AUTO,
        1,
        () => {},
        () => {}
      );
      return scalingOptionToolbarItem.toolbarItem.element;
    };
    const wrapper = Enzyme.mount(<ScalingOptionWrapper />);
    await waitForComponentToPaint(wrapper);
    expect(wrapper).toMatchSnapshot();
  });
});
