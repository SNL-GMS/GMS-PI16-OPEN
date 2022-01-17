/* eslint-disable react/jsx-props-no-spreading */
import { CommonTypes } from '@gms/common-model';
import { AnalystWorkspaceTypes, createStore } from '@gms/ui-state';
import Enzyme from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';

import { WaveformControls } from '../../../../../../../src/ts/components/analyst-ui/components/waveform/components/waveform-controls';
import { AmplitudeScalingOptions } from '../../../../../../../src/ts/components/analyst-ui/components/waveform/components/waveform-controls/scaling-options';
import { WaveformControlsProps } from '../../../../../../../src/ts/components/analyst-ui/components/waveform/components/waveform-controls/types';
import { WaveformLoadingIndicator } from '../../../../../../../src/ts/components/analyst-ui/components/waveform/components/waveform-loading-indicator';
import { AlignWaveformsOn } from '../../../../../../../src/ts/components/analyst-ui/components/waveform/types';
import { memoizedGetAlignablePhases } from '../../../../../../../src/ts/components/analyst-ui/components/waveform/weavess-stations-util';
import { BaseDisplayContext } from '../../../../../../../src/ts/components/common-ui/components/base-display';

const MOCK_TIME = 123456789;
const MOCK_TIME_STR = '2021-01-20 02:34:31';

const mockDate: any = new Date(MOCK_TIME);
mockDate.now = () => MOCK_TIME;
Date.constructor = jest.fn(() => new Date(MOCK_TIME));
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
Date.now = jest.fn(() => MOCK_TIME);
Date.UTC = jest.fn(() => MOCK_TIME);

jest.mock('moment-precise-range-plugin', () => {
  return {};
});

jest.mock('moment', () => {
  // mock chain builder pattern
  const mMoment = {
    utc: jest.fn(() => mMoment),
    format: jest.fn(() => MOCK_TIME_STR),
    preciseDiff: jest.fn(() => '')
  };

  // mock the constructor and to modify instance methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn: any = jest.fn(() => {
    mMoment.format = jest.fn(() => MOCK_TIME_STR);
    mMoment.preciseDiff = jest.fn(() => '');
    return mMoment;
  });

  // mock moment methods that depend on moment not on a moment instance
  fn.unix = () => ({ utc: () => mMoment });
  return fn;
});
describe('WaveformControls', () => {
  const currentOpenEventId = 'TEST_EVENT_ID';

  const props: WaveformControlsProps = {
    defaultSignalDetectionPhase: CommonTypes.PhaseType.P,
    currentSortType: AnalystWorkspaceTypes.WaveformSortType.stationName,
    currentOpenEventId,
    analystNumberOfWaveforms: 20,
    showPredictedPhases: false,
    maskDisplayFilters: {
      ANALYST_DEFINED: { color: 'tomato', visible: false, name: 'ANALYST_DEFINED' },
      CHANNEL_PROCESSING: { color: 'tomato', visible: false, name: 'CHANNEL_PROCESSING' },
      DATA_AUTHENTICATION: { color: 'tomato', visible: false, name: 'DATA_AUTHENTICATION' },
      REJECTED: { color: 'tomato', visible: false, name: 'REJECTED' },
      STATION_SOH: { color: 'tomato', visible: false, name: 'STATION_SOH' },
      WAVEFORM_QUALITY: { color: 'tomato', visible: false, name: 'WAVEFORM_QUALITY' }
    },
    alignWaveformsOn: AlignWaveformsOn.TIME,
    phaseToAlignOn: CommonTypes.PhaseType.P,
    alignablePhases: memoizedGetAlignablePhases(currentOpenEventId, undefined),
    measurementMode: {
      mode: AnalystWorkspaceTypes.WaveformDisplayMode.DEFAULT,
      entries: undefined
    },
    setDefaultSignalDetectionPhase: jest.fn(),
    setWaveformAlignment: jest.fn(),
    setSelectedSortType: jest.fn(),
    setAnalystNumberOfWaveforms: jest.fn(),
    setMaskDisplayFilters: jest.fn(),
    setShowPredictedPhases: jest.fn(),
    setMode: jest.fn(),
    toggleMeasureWindow: jest.fn(),
    pan: jest.fn(),
    onKeyPress: jest.fn(),
    isMeasureWindowVisible: false,
    amplitudeScaleOption: AmplitudeScalingOptions.AUTO,
    fixedScaleVal: 1,
    setAmplitudeScaleOption: jest.fn(),
    setFixedScaleVal: jest.fn()
  };
  const wrapper = Enzyme.mount(
    <Provider store={createStore()}>
      <BaseDisplayContext.Provider
        value={{
          glContainer: undefined,
          widthPx: 1920,
          heightPx: 1080
        }}
      >
        <WaveformControls {...props} />
        <WaveformLoadingIndicator />
      </BaseDisplayContext.Provider>
    </Provider>
  );
  it('matches a snapshot when given basic props', () => {
    expect(wrapper).toMatchSnapshot();
  });
});
