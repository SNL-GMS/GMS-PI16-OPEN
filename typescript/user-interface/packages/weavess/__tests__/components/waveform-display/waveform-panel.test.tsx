/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { WeavessConstants, WeavessTypes } from '@gms/weavess-core';
import enzyme from 'enzyme';
import Immutable from 'immutable';
import * as React from 'react';

import { defaultConfiguration } from '../../../src/ts/components/waveform-display/configuration';
import { BrushType, WaveformPanelProps } from '../../../src/ts/components/waveform-display/types';
import { WaveformPanel } from '../../../src/ts/components/waveform-display/waveform-panel';

jest.mock('three', () => {
  const three = jest.requireActual('three');
  return {
    ...three,
    WebGLRenderer: jest.fn().mockReturnValue({
      setScissorTest: jest.fn(),
      render: jest.fn(),
      setSize: jest.fn(),
      setViewport: jest.fn()
    })
  };
});

jest.mock('worker-rpc', () => {
  const realWorkerRpc = jest.requireActual('worker-rpc');
  // We do this here to guarantee that it runs before the waveform panel generates its workers.
  // This works because jest.mock gets hoisted and run before even imports are figured out.
  Object.defineProperty(window.navigator, 'hardwareConcurrency', {
    writable: false,
    value: 4
  });

  // We don't actually need to mock anything in the worker-rpc module... just to hijack the
  // window before it runs.
  return {
    ...realWorkerRpc,
    RPCProvider: {
      constructor: () => ({
        _dispatch: jest.fn(),
        _nextTransactionId: 0,
        _pendingTransactions: {},
        _rpcHandlers: {},
        _rpcTimeout: 0,
        _signalHandlers: {},
        error: {
          _contexts: [],
          _handlers: [],
          dispatch: jest.fn(),
          hasHandlers: false
        }
      })
    }
  };
});
const mockResetAmplitudes = jest.fn();
const props: WaveformPanelProps = {
  endTimeSecs: 100,
  startTimeSecs: 0,
  events: WeavessConstants.DEFAULT_UNDEFINED_EVENTS,
  shouldRenderSpectrograms: false,
  shouldRenderWaveforms: true,
  toast: jest.fn(),
  isMeasureWindow: false,
  clearSelectedChannels: jest.fn(),
  stations: [
    {
      id: 'id',
      name: `name`,
      defaultChannel: {
        height: 40,
        id: 'id',
        name: 'default channel',
        waveform: {
          channelSegmentId: 'data',
          channelSegments: new Map<string, WeavessTypes.ChannelSegment>([
            [
              'data',
              {
                channelName: 'TestChannel',
                wfFilterId: WeavessTypes.UNFILTERED,
                dataSegments: [
                  {
                    color: 'tomato',
                    pointSize: 1,
                    data: {
                      startTimeSecs: 0,
                      endTimeSecs: 100,
                      sampleRate: 40,
                      values: Float32Array.from([0, 0, 1, 10, 2, 20, 3, 30])
                    }
                  }
                ]
              }
            ]
          ])
        }
      },
      nonDefaultChannels: []
    }
  ],
  initialConfiguration: {
    ...defaultConfiguration,
    shouldRenderSpectrograms: false,
    shouldRenderWaveforms: true,
    defaultChannel: {
      disableMeasureWindow: true
    },
    nonDefaultChannel: {},
    suppressLabelYAxis: false,
    labelWidthPx: 65,
    xAxisLabel: 'x axis'
  },
  convertTimeToGL: jest.fn(),
  resetAmplitudes: mockResetAmplitudes
};

const wrapper = enzyme.mount(<WaveformPanel {...props} />);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const instance: any = wrapper.instance();
describe('Weavess Waveform Panel', () => {
  it('matches a snapshot', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('updates its dimensions when renderWaveforms is called', () => {
    const testDimensions = {
      clientHeight: 100,
      clientWidth: 100,
      scrollWidth: 1000,
      scrollLeft: 1000
    };
    instance.waveformsViewportRef = {
      ...instance.waveformsViewportRef,
      clientHeight: 100,
      clientWidth: 100,
      scrollWidth: 1000,
      scrollLeft: 1000
    };
    const testRect = {
      width: 1000,
      left: 0
    };
    instance.canvasRef = {
      rect: testRect,
      getBoundingClientRect: jest.fn(() => testRect)
    };

    instance.renderWaveforms();
    expect(instance.dimensions.viewport.clientHeight).toBe(testDimensions.clientHeight);
    expect(instance.dimensions.viewport.clientWidth).toBe(testDimensions.clientWidth);
    expect(instance.dimensions.viewport.scrollWidth).toBe(testDimensions.scrollWidth);
    expect(instance.dimensions.viewport.scrollLeft).toBe(testDimensions.scrollLeft);
    expect(instance.dimensions.canvas.rect.width).toBe(testRect.width);
    expect(instance.dimensions.canvas.rect.left).toBe(testRect.left);
  });

  it('calls renderWaveforms on scroll', () => {
    const originalRenderWaveforms = instance.renderWaveforms;
    instance.renderWaveforms = jest.fn();
    instance.waveformsContainerRef = {
      clientWidth: 1000
    };
    instance.waveformsViewportRef = {
      scrollLeft: 0,
      scrollTop: 0,
      scroll: jest.fn()
    };
    instance.canvasRef = {
      clientWidth: 1000,
      getBoundingClientRect: jest.fn(() => ({
        width: 1000,
        left: 0
      }))
    };
    instance.stationComponentRefs = new Map();
    instance.timeAxisRef = {
      update: jest.fn()
    };

    instance.onScroll();
    expect(instance.renderWaveforms).toHaveBeenCalled();
    instance.renderWaveforms = originalRenderWaveforms;
  });

  it('calls renderWaveforms when you call refresh', () => {
    instance.waveformsContainerRef = {
      style: { width: 1000 }
    };
    instance.canvasRef = {
      clientWidth: 1000
    };
    instance.waveformsViewportRef = {
      scrollLeft: 0
    };
    instance.timeAxisRef = {
      update: jest.fn()
    };
    const originalRenderWaveforms = instance.renderWaveforms;
    instance.renderWaveforms = jest.fn();
    instance.refresh();
    expect(instance.renderWaveforms).toHaveBeenCalled();
    instance.renderWaveforms = originalRenderWaveforms;
  });

  it('can get the current view range in seconds', () => {
    const currentRange = instance.getCurrentViewRangeInSeconds();
    expect(currentRange.startTimeSecs).toBe(0);
    expect(currentRange.endTimeSecs).toBeGreaterThanOrEqual(100);
    expect(currentRange).toMatchSnapshot();
  });

  it('calls preventDefault if ctrl is held in documentPreventCtrlMouseWheel', () => {
    const mockEvent = {
      ctrlKey: false,
      preventDefault: jest.fn()
    };
    instance.documentPreventCtrlMouseWheel(mockEvent);
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    mockEvent.ctrlKey = true;
    instance.documentPreventCtrlMouseWheel(mockEvent);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('can invalidate scrollLeft position', () => {
    instance.prevScrollLeftPx = 100;
    instance.invalidateScrollLeftPos();
    expect(instance.prevScrollLeftPx).toBeGreaterThan(100);
  });

  const testChannel: any = {};
  it('can add a visibleChannel to the visibleChannelList', () => {
    instance.visibleChannels = Immutable.List();
    instance.addVisibleChannel(testChannel);
    expect(instance.visibleChannels.size).toBe(1);
  });

  it('can remove the visibleChannel from the visibleChannelList', () => {
    instance.visibleChannels = Immutable.List();
    instance.addVisibleChannel(testChannel);
    instance.removeVisibleChannel(testChannel);
    expect(instance.visibleChannels.size).toBe(0);
  });

  it('can update the channel visibility', () => {
    instance.visibleChannels = Immutable.List();
    const station = {
      nonDefaultChannelRefs: {
        testChannel: {}
      }
    };
    instance.updateChannelVisibility(station, 'testChannel', true);
    expect(instance.visibleChannels.size).toBe(1);
  });

  it('updates the visible child channels for a station when updateVisibleChannelsForStation is called', () => {
    instance.visibleChannels = Immutable.List();
    const defaultChannelRef = {};
    const testStation = {
      defaultChannelRef,
      state: {
        expanded: true
      },
      nonDefaultChannelRefs: {
        chanId: {}
      },
      resetAmplitude: mockResetAmplitudes
    };
    instance.stationComponentRefs.set('testStation', testStation);
    instance.updateVisibleChannelsForStation('testStation');
    expect(instance.visibleChannels.size).toBe(2);
  });

  it('gets code coverage for not calling reset amplitudes on stations if stationComponentRefs undefined', () => {
    // Reset call count to 0
    mockResetAmplitudes.mockClear();

    const backup = instance.stationComponentRefs;
    instance.stationComponentRefs = undefined;
    instance.resetAmplitudes();
    expect(mockResetAmplitudes).toBeCalledTimes(0);

    instance.stationComponentRefs = backup;
    instance.resetAmplitudes();
    expect(mockResetAmplitudes).toBeCalledTimes(1);
  });
});

describe('Keyboard events', () => {
  const buildKeyboardEvent = (
    code: string,
    altKey: boolean,
    shiftKey: boolean
  ): Partial<KeyboardEvent> => {
    const nativeKeyboardEvent: Partial<KeyboardEvent> = {
      code,
      altKey,
      shiftKey
    };
    return nativeKeyboardEvent;
  };

  const buildHTMLDivKeyboardEvent = (
    nativeKeyboardEvent: Partial<KeyboardEvent>,
    shiftKey: boolean
  ): Partial<React.KeyboardEvent<HTMLDivElement>> => {
    const keyboardEvent: Partial<React.KeyboardEvent<HTMLDivElement>> = {
      preventDefault: jest.fn(),
      shiftKey,
      repeat: false,
      nativeEvent: nativeKeyboardEvent as KeyboardEvent,
      stopPropagation: jest.fn(() => true)
    };
    return keyboardEvent;
  };

  it('exercise the reset amplitude scale on All channels', () => {
    const resetAllKey = buildHTMLDivKeyboardEvent(buildKeyboardEvent('KeyS', true, true), true);
    // Reset call count to 0
    mockResetAmplitudes.mockClear();
    expect(() => instance.onKeyDown(resetAllKey)).not.toThrow();
    expect(mockResetAmplitudes).toBeCalledTimes(1);
  });

  it('exercise the create mask keyboard event', () => {
    const maskKey = buildHTMLDivKeyboardEvent(buildKeyboardEvent('KeyM', false, false), false);
    // Key down
    expect(() => instance.onKeyDown(maskKey)).not.toThrow();
    expect(instance.brushType).toEqual(BrushType.CreateMask);

    // Key up
    expect(() => instance.onKeyUp(maskKey)).not.toThrow();
    expect(instance.brushType).toBeUndefined();
  });

  it('exercise the keyUp and keyDown for anyKey keyboard event', () => {
    const anyKey = buildHTMLDivKeyboardEvent(buildKeyboardEvent('anyKey', false, false), false);

    // Key down
    expect(() => instance.onKeyDown(anyKey)).not.toThrow();

    // Key up
    expect(() => instance.onKeyUp(anyKey)).not.toThrow();
  });
});
