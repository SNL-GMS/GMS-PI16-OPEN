import { WeavessConstants, WeavessTypes } from '@gms/weavess-core';
import enzyme from 'enzyme';
import * as React from 'react';

import {
  WaveformDisplayProps,
  WaveformDisplayState
} from '../../../lib/components/waveform-display/types';
import { WaveformDisplay } from '../../../src/ts/components/waveform-display/waveform-display';
import {
  actAndWaitForComponentToPaint,
  clickElement,
  documentMoveMouse,
  documentReleaseMouse
} from '../../test-util/test-util';

// Set reference after setState call since derivedProps might null it out
let measureWindowPanelRef;

const timeRange: WeavessTypes.TimeRange = {
  startTimeSecs: 0,
  endTimeSecs: 100
};

const station: WeavessTypes.Station = {
  id: 'ANMO',
  defaultChannel: {
    id: 'ANMO.ANMO.BHZ',
    name: 'ANMO.ANMO.BHZ'
  },
  name: 'ANMO',
  distance: 0,
  distanceUnits: WeavessTypes.DistanceUnits.km,
  nonDefaultChannels: [
    {
      id: 'ANMO.ANMO.BHZ',
      name: 'ANMO.ANMO.BHZ',
      waveform: {
        channelSegmentId: '1',
        channelSegments: new Map(),
        masks: [
          {
            id: 'mask',
            color: 'ff0000',
            startTimeSecs: 5,
            endTimeSecs: 10
          }
        ]
      }
    }
  ]
};

const channel: Partial<WeavessTypes.Channel> = {
  name: 'ANMO.ANMO.BHZ'
};

const msrWindowSelection: WeavessTypes.MeasureWindowSelection = {
  /** Station Id as a string */
  stationId: 'ANMO',
  channel: channel as WeavessTypes.Channel,
  startTimeSecs: timeRange.startTimeSecs,
  endTimeSecs: timeRange.endTimeSecs,
  isDefaultChannel: true,
  removeSelection: jest.fn()
};

const initialConfiguration: WeavessTypes.Configuration = {
  shouldRenderWaveforms: true,
  shouldRenderSpectrograms: false,
  hotKeys: {
    amplitudeScale: 'KeyS',
    amplitudeScaleSingleReset: 'Alt+KeyS',
    amplitudeScaleReset: 'Alt+Shift+KeyS',
    maskCreate: 'KeyM'
  },
  defaultChannel: {
    disableMeasureWindow: true,
    disableSignalDetectionModification: false,
    disableMaskModification: true
  },
  nonDefaultChannel: {
    disableMeasureWindow: true,
    disableSignalDetectionModification: true,
    disableMaskModification: false
  }
};

const weavessEvents: WeavessTypes.Events = {
  ...WeavessConstants.DEFAULT_UNDEFINED_EVENTS,
  stationEvents: {
    ...WeavessConstants.DEFAULT_UNDEFINED_EVENTS?.stationEvents,
    defaultChannelEvents: {
      ...WeavessConstants.DEFAULT_UNDEFINED_EVENTS?.stationEvents?.defaultChannelEvents,
      events: {
        ...WeavessConstants.DEFAULT_UNDEFINED_EVENTS?.stationEvents?.defaultChannelEvents?.events,
        onMeasureWindowUpdated: jest.fn()
      }
    },
    nonDefaultChannelEvents: {
      ...WeavessConstants.DEFAULT_UNDEFINED_EVENTS?.stationEvents?.nonDefaultChannelEvents,
      events: {
        ...WeavessConstants.DEFAULT_UNDEFINED_EVENTS?.stationEvents?.nonDefaultChannelEvents
          ?.events,
        onMeasureWindowUpdated: jest.fn()
      }
    }
  },
  onMeasureWindowResize: jest.fn()
};

const waveformDisplayProps: WaveformDisplayProps = {
  initialConfiguration,
  flex: false,
  startTimeSecs: timeRange.startTimeSecs,
  endTimeSecs: timeRange.endTimeSecs,
  stations: [station],
  events: weavessEvents,
  currentInterval: timeRange,
  selections: undefined,
  initialZoomWindow: timeRange,
  defaultZoomWindow: timeRange,
  markers: undefined,
  customLabel: undefined,
  showMeasureWindow: true,
  measureWindowSelection: msrWindowSelection,
  customMeasureWindowLabel: undefined,
  clearSelectedChannels: jest.fn(),
  selectChannel: jest.fn(),
  getPositionBuffer: jest.fn(),
  getBoundaries: jest.fn()
};

const waveformDisplayState: WaveformDisplayState = {
  initialConfiguration,
  showMeasureWindow: true,
  isMeasureWindowVisible: true,
  measureWindowHeightPx: 100,
  measureWindowSelection: msrWindowSelection,
  prevMeasureWindowSelectionFromProps: undefined,
  shouldRenderWaveforms: true,
  shouldRenderSpectrograms: false
};

const newWrapper = enzyme.mount(
  // eslint-disable-next-line react/jsx-props-no-spreading
  <WaveformDisplay {...waveformDisplayProps} />
);
const waveformDisplay: WaveformDisplay = newWrapper
  .find(WaveformDisplay)
  .instance() as WaveformDisplay;

describe('waveform display', () => {
  test('waveform display match snapshot', () => {
    expect(newWrapper).toMatchSnapshot();
  });

  test('update set state for measure window selection to be set', () => {
    expect(() => waveformDisplay.setState(waveformDisplayState)).not.toThrow();
    expect(waveformDisplay.measureWindowPanelRef).toBeDefined();
  });

  test('waveform display updateMeasureWindow', () => {
    expect(waveformDisplay?.waveformPanelRef?.props?.updateMeasureWindow).toBeDefined();
    if (waveformDisplay?.waveformPanelRef?.props?.updateMeasureWindow) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(
        waveformDisplay.waveformPanelRef.props.updateMeasureWindow(
          station.name,
          station.defaultChannel,
          timeRange.startTimeSecs,
          timeRange.endTimeSecs,
          true,
          jest.fn()
        )
      ).toBeUndefined();
    }
  });
  test('waveform display convertTimeToGL', () => {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expect(waveformDisplay.convertTimeToGL(10000)).toBe(10000);
  });

  test('waveform display refresh', () => {
    expect(waveformDisplay.refresh()).toBeUndefined();
  });

  test('waveform display getCurrentViewRangeInSeconds', () => {
    expect(waveformDisplay.getCurrentViewRangeInSeconds()).toMatchSnapshot();
  });

  test('waveform display isMeasureWindowVisible', () => {
    expect(waveformDisplay.isMeasureWindowVisible()).toMatchSnapshot();
  });

  test('waveform display toggleMeasureWindowVisibility', () => {
    expect(waveformDisplay.toggleMeasureWindowVisibility()).toBeUndefined();
  });

  test('waveform display clearBrushStroke', () => {
    waveformDisplay.measureWindowPanelRef = measureWindowPanelRef;
    expect(waveformDisplay.clearBrushStroke()).toBeUndefined();
  });

  test('waveform display toggleRenderingContent', () => {
    expect(waveformDisplay.toggleShouldRenderWaveforms()).toBeUndefined();
    expect(waveformDisplay.toggleShouldRenderSpectrograms()).toBeUndefined();
    expect(waveformDisplay.toggleRenderingContent()).toBeUndefined();
    expect(waveformDisplay.toggleRenderingContent()).toBeUndefined();
  });

  test('waveform display zoomToTimeWindow to first half of time range', () => {
    expect(
      waveformDisplay.zoomToTimeWindow(timeRange.startTimeSecs, timeRange.endTimeSecs / 2)
    ).toBeUndefined();
  });

  test('waveform display toast', () => {
    expect(waveformDisplay.toastInfo(`This is a toast info message`)).toBeUndefined();
    expect(waveformDisplay.toastWarn(`This is a toast warning message`)).toBeUndefined();
    expect(waveformDisplay.toastError(`This is a toast error message`)).toBeUndefined();
  });

  test('matches snapshot when measure window is open with default channel', async () => {
    await actAndWaitForComponentToPaint(newWrapper, () =>
      newWrapper.setState({
        measureWindowSelection: {
          stationId: station.id,
          channel: station.defaultChannel,
          isDefaultChannel: true,
          startTimeSecs: 100,
          endTimeSecs: 200,
          removeSelection: jest.fn()
        },
        isMeasureWindowVisible: true
      })
    );
    expect(newWrapper).toMatchSnapshot();
  });

  test('onMeasureWindowResizeUp calls measureWindowUpdate callback for default event on drag end', async () => {
    const resizeMeasureWindow = () => {
      clickElement(newWrapper, '.horizontal-divider__target');
      documentMoveMouse();
      documentReleaseMouse();
    };
    await actAndWaitForComponentToPaint(newWrapper, resizeMeasureWindow);
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      waveformDisplayProps?.events?.stationEvents?.defaultChannelEvents?.events
        ?.onMeasureWindowUpdated
    ).toHaveBeenCalled();
  });

  test('onMeasureWindowResizeUp calls resize event callback when resized', async () => {
    const resizeMeasureWindow = () => {
      clickElement(newWrapper, '.horizontal-divider__target');
      documentMoveMouse();
      documentReleaseMouse();
    };
    await actAndWaitForComponentToPaint(newWrapper, resizeMeasureWindow);
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      waveformDisplayProps?.events?.onMeasureWindowResize
    ).toHaveBeenCalled();
  });

  test('matches snapshot when measure window is open with nonDefault channel', async () => {
    await actAndWaitForComponentToPaint(newWrapper, () =>
      newWrapper.setState({
        measureWindowSelection: {
          stationId: station.id,
          channel: station?.nonDefaultChannels ? station?.nonDefaultChannels[0] : undefined,
          isDefaultChannel: false,
          startTimeSecs: 100,
          endTimeSecs: 200,
          removeSelection: jest.fn()
        },
        isMeasureWindowVisible: true
      })
    );
    expect(newWrapper).toMatchSnapshot();
  });

  test('onMeasureWindowResizeUp calls event callback for nonDefault event on drag end', async () => {
    const resizeMeasureWindow = () => {
      clickElement(newWrapper, '.horizontal-divider__target');
      documentMoveMouse();
      documentReleaseMouse();
    };
    await actAndWaitForComponentToPaint(newWrapper, resizeMeasureWindow);
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      waveformDisplayProps?.events?.stationEvents?.nonDefaultChannelEvents?.events
        ?.onMeasureWindowUpdated
    ).toHaveBeenCalled();
  });

  test('onMeasureWindowResizeUp does not throw when events are not defined', () => {
    const testDrag = async (w: any) => {
      const resizeMeasureWindow = async () => {
        await actAndWaitForComponentToPaint(w, () =>
          w.setState({
            measureWindowSelection: {
              stationId: station.id,
              channel: station?.nonDefaultChannels ? station?.nonDefaultChannels[0] : undefined,
              isDefaultChannel: false,
              startTimeSecs: 100,
              endTimeSecs: 200,
              removeSelection: jest.fn()
            },
            isMeasureWindowVisible: true
          })
        );
        clickElement(w, '.horizontal-divider__target');
        documentMoveMouse();
        documentReleaseMouse();
        expect(w).toMatchSnapshot();
        await actAndWaitForComponentToPaint(w, () => {
          w.instance().toggleMeasureWindowVisibility();
          expect(w).toMatchSnapshot();
        });
      };
      await actAndWaitForComponentToPaint(w, resizeMeasureWindow);
    };
    const testComponent = (
      Comp: React.ComponentClass | React.FC,
      props: any,
      testAction: (w: any) => void
    ) => {
      // eslint-disable-next-line react/jsx-props-no-spreading
      const w = enzyme.mount(<Comp {...props} />);
      expect(() => testAction(w)).not.toThrow();
    };
    testComponent(
      (WaveformDisplay as unknown) as React.ComponentClass,
      {
        ...waveformDisplayProps,
        events: {
          ...waveformDisplayProps.events,
          stationEvents: {
            ...waveformDisplayProps.events?.stationEvents,
            defaultChannelEvents: {
              ...waveformDisplayProps.events?.stationEvents?.defaultChannelEvents,
              onMeasureWindowUpdated: undefined
            }
          }
        }
      },
      testDrag
    );
    testComponent(
      (WaveformDisplay as unknown) as React.ComponentClass,
      {
        ...waveformDisplayProps,
        events: {
          ...waveformDisplayProps.events,
          stationEvents: {
            ...waveformDisplayProps.events.stationEvents,
            defaultChannelEvents: undefined
          }
        }
      },
      testDrag
    );
    testComponent(
      (WaveformDisplay as unknown) as React.ComponentClass,
      {
        ...waveformDisplayProps,
        events: {
          ...waveformDisplayProps.events,
          stationEvents: undefined
        }
      },
      testDrag
    );
    testComponent(
      (WaveformDisplay as unknown) as React.ComponentClass,
      {
        ...waveformDisplayProps,
        events: undefined
      },
      testDrag
    );
  });

  test('matches snapshot when measure window is open with no measure window selection', async () => {
    await actAndWaitForComponentToPaint(newWrapper, () =>
      newWrapper.setState({
        measureWindowSelection: undefined,
        isMeasureWindowVisible: true
      })
    );
    expect(newWrapper).toMatchSnapshot();
  });

  test('branches with waveformPanelRef not set', () => {
    const ref = waveformDisplay.waveformPanelRef;
    waveformDisplay.waveformPanelRef = null;
    expect(() => waveformDisplay.refresh()).not.toThrow();
    expect(waveformDisplay.getCurrentViewRangeInSeconds()).toMatchSnapshot();
    expect(() => waveformDisplay.clearBrushStroke()).not.toThrow();
    waveformDisplay.waveformPanelRef = ref;
  });

  it('reset manual amplitude scaling', () => {
    const mockResetAmplitudes = jest.fn();
    if (waveformDisplay.waveformPanelRef) {
      waveformDisplay.waveformPanelRef.resetAmplitudes = mockResetAmplitudes;
    }
    expect(() => waveformDisplay.resetAmplitudes()).not.toThrow();
    expect(mockResetAmplitudes).toBeCalledTimes(1);
  });
});
