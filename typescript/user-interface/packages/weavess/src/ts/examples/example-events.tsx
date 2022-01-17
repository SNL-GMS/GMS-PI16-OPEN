/* eslint-disable @typescript-eslint/no-magic-numbers */
import { WeavessConstants, WeavessTypes, WeavessUtil } from '@gms/weavess-core';
import React from 'react';

import { Weavess } from '../weavess';
import { WeavessGenericContainerWrapper } from './container-wrapper';

export class EventsExample extends React.Component<unknown, unknown> {
  public weavess: Weavess;

  public render(): JSX.Element {
    const waveforms: WeavessTypes.Station[] = [];

    const startTimeSecs =
      new Date('2016-01-01T00:00:00Z').valueOf() / WeavessConstants.MILLISECONDS_IN_SECOND;
    const endTimeSecs = startTimeSecs + 1800; // + 30 minutes

    for (let i = 0; i < 25; i += 1) {
      const waveform = WeavessUtil.createDummyWaveform(
        'ExampleChannel',
        startTimeSecs,
        endTimeSecs,
        20,
        WeavessUtil.getSecureRandomNumber() * 2,
        WeavessUtil.getSecureRandomNumber() * 0.25
      );
      waveform.id = `Channel${i}`;
      waveform.name = `Channel ${i}`;
      waveforms.push(waveform);
    }

    return (
      <WeavessGenericContainerWrapper>
        <Weavess
          ref={ref => {
            if (ref) {
              this.weavess = ref;
            }
          }}
          stations={waveforms}
          startTimeSecs={startTimeSecs}
          endTimeSecs={endTimeSecs}
          currentInterval={{ startTimeSecs, endTimeSecs }}
          events={{
            stationEvents: {
              defaultChannelEvents: {
                labelEvents: {},
                events: {
                  onSignalDetectionClick: () => {
                    // eslint-disable-next-line no-console
                    console.log('signal detection deleted!');
                  },
                  onSignalDetectionDragEnd: () => {
                    // eslint-disable-next-line no-console
                    console.log('signal detection modified!');
                  }
                }
              },
              nonDefaultChannelEvents: {
                labelEvents: {},
                events: {}
              }
            }
          }}
          flex={false}
        />
      </WeavessGenericContainerWrapper>
    );
  }
  // eslint-disable-next-line max-lines
}
