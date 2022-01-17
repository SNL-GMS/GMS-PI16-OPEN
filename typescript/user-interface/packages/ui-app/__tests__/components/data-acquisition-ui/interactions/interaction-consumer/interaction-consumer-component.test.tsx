import { SohTypes } from '@gms/common-model';
import Immutable from 'immutable';
import React from 'react';

import {
  handleHotkey,
  InteractionConsumer
} from '../../../../../src/ts/components/data-acquisition-ui/interactions/interaction-consumer/interaction-consumer-component';
import { InteractionConsumerProps } from '../../../../../src/ts/components/data-acquisition-ui/interactions/interaction-consumer/types';
import { InteractionProvider } from '../../../../../src/ts/components/data-acquisition-ui/interactions/interaction-provider/interaction-provider-component';
import { InteractionProviderProps } from '../../../../../src/ts/components/data-acquisition-ui/interactions/interaction-provider/types';
import { sohStatus } from '../../../../__data__/data-acquisition-ui/soh-status-data';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(document as any).getElementById = jest.fn(() => ({
  dataset: { hotkeyListenerAttached: true }
}));

describe('Interaction consumer component', () => {
  const interactionConsumerProps: InteractionConsumerProps = {
    keyPressActionQueue: Immutable.Map<string, number>(),
    setKeyPressActionQueue: jest.fn()
  };

  const interactionProviderProps: InteractionProviderProps = {
    selectedStationIds: ['test', 'test2'],
    sohStatus,
    selectedAceiType: SohTypes.AceiType.AMPLIFIER_SATURATION_DETECTED,
    setSelectedStationIds: jest.fn(),
    setSelectedAceiType: jest.fn(),
    commandPaletteIsVisible: true,
    setCommandPaletteVisibility: jest.fn()
  };

  interactionConsumerProps.keyPressActionQueue.get = jest.fn(() => 2);
  const wrapper = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <InteractionProvider {...interactionProviderProps}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <InteractionConsumer {...interactionConsumerProps} />{' '}
    </InteractionProvider>
  );
  it('is defined', () => {
    expect(wrapper).toBeDefined();
  });
  it('matches snapshot with hot key listener', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('matches snapshot with no hot key listener', () => {
    // set up window alert and open so we don't see errors
    (document as any).getElementById = jest.fn(() => ({
      dataset: { hotkeyListenerAttached: false }
    }));
    expect(wrapper).toMatchSnapshot();
  });

  it('handle hotkey', () => {
    const event: any = {
      repeat: false,
      ctrlKey: true,
      shiftKey: true,
      code: 'KeyP',
      stopPropagation: jest.fn(),
      preventDefault: jest.fn()
    };
    handleHotkey(interactionConsumerProps)(event);
    expect(wrapper).toBeDefined();
  });
});
