/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
import { WaveformTypes } from '@gms/common-model';
import { readJsonData } from '@gms/common-util';
import { AnalystWorkspaceTypes } from '@gms/ui-state';
import * as Immutable from 'immutable';
import * as path from 'path';

import { WaveformClient } from '../../../../../src/ts/components/analyst-ui/components/waveform/waveform-client';
import {
  createWeavessStations,
  CreateWeavessStationsParameters
} from '../../../../../src/ts/components/analyst-ui/components/waveform/weavess-stations-util';
import { eventData } from '../../../../__data__/event-data';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

describe('Weavess Station Creation unit tests', () => {
  it('When switching to measurement mode, should show only waveforms/channels with associated SD', () => {
    const basePath = path.resolve(__dirname, './__data__');
    const currentOpenEvent = eventData[0]; // readJsonData(path.resolve(basePath, 'currentOpenEvent.json'))[0];
    const defaultStations = readJsonData(path.resolve(basePath, 'defaultStations.json'));
    const defaultWaveformFilters = readJsonData(
      path.resolve(basePath, 'defaultWaveformFilters.json')
    );
    const eventsInTimeRange = [eventData];
    const featurePredictions = readJsonData(path.resolve(basePath, 'featurePredictions.json'))[0];
    const maskDisplayFilters = readJsonData(path.resolve(basePath, 'maskDisplayFilters.json'))[0];
    const measurementMode: AnalystWorkspaceTypes.MeasurementMode = {
      mode: AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT,
      entries: Immutable.Map<string, boolean>()
    };
    const defaultMode: AnalystWorkspaceTypes.MeasurementMode = {
      mode: AnalystWorkspaceTypes.WaveformDisplayMode.DEFAULT,
      entries: Immutable.Map()
    };
    const qcMasksByChannelId = readJsonData(path.resolve(basePath, 'qcMasksByChannelId.json'));
    const signalDetectionsByStation = readJsonData(
      path.resolve(basePath, 'signalDetectionsByStation.json')
    );
    const setWaveformClientLoadingState = (
      waveformClientState: AnalystWorkspaceTypes.WaveformClientState
    ) => {
      // Should get numerous callbacks based on loading indicator updating
      expect(waveformClientState).toBeDefined();
    };
    const waveformClient = new WaveformClient(setWaveformClientLoadingState);
    const channelFilters = Immutable.Map<string, WaveformTypes.WaveformFilter>();
    const waveformUtilParams: CreateWeavessStationsParameters = {
      channelFilters,
      channelHeight: 24.8,
      currentOpenEvent,
      defaultStations,
      defaultWaveformFilters,
      endTimeSecs: 1274400000,
      eventsInTimeRange,
      featurePredictions,
      maskDisplayFilters,
      measurementMode: defaultMode,
      offsets: [],
      qcMasksByChannelName: qcMasksByChannelId,
      showPredictedPhases: false,
      signalDetectionsByStation,
      startTimeSecs: 1274392801,
      distances: [],
      waveformClient
    };

    let result = createWeavessStations(waveformUtilParams);
    result.forEach(station => {
      delete station.defaultChannel.waveform.channelSegments;
      station.nonDefaultChannels.forEach(channel => delete channel.waveform.channelSegments);
    });

    expect(result).toMatchSnapshot();

    waveformUtilParams.measurementMode = measurementMode;

    result = createWeavessStations(waveformUtilParams);
    result.forEach(station => {
      delete station.defaultChannel.waveform.channelSegments;
      station.nonDefaultChannels.forEach(channel => delete channel.waveform.channelSegments);
    });
    expect(result).toMatchSnapshot();
  });
});
