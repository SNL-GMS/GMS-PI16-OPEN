import React from 'react';

import { SignalDetectionDetails } from '../../../../../src/ts/components/analyst-ui/common/dialogs';
import { signalDetectionsData } from '../../../../__data__/signal-detections-data';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');
// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

it('SignalDetectionDetails renders & matches snapshot', () => {
  const wrapper = Enzyme.shallow(
    <SignalDetectionDetails detection={signalDetectionsData[0]} color="red" />
  );
  expect(wrapper).toMatchSnapshot();
});
