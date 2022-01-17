import { CommonTypes } from '@gms/common-model';
import * as React from 'react';

import { AlignmentMenu } from '../../../../../src/ts/components/analyst-ui/common/dialogs';
import { AlignWaveformsOn } from '../../../../../src/ts/components/analyst-ui/components/waveform';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');
// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const wrapper = Enzyme.mount(
  <AlignmentMenu
    alignedOn={AlignWaveformsOn.PREDICTED_PHASE}
    phaseAlignedOn={CommonTypes.PhaseType.LR}
    sdPhases={[CommonTypes.PhaseType.LR, CommonTypes.PhaseType.Lg]}
    prioritySdPhases={[CommonTypes.PhaseType.P]}
    onSubmit={() => {
      jest.fn();
    }}
  />
);

it('Alignment Menu Renders', () => {
  expect(wrapper.render()).toMatchSnapshot();
});

it('Alignment Menu un-mounts', () => {
  expect(wrapper).toMatchSnapshot();
});
