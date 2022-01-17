import { WeavessTypes } from '@gms/weavess-core';
import * as d3 from 'd3';

import { WaveformStore } from '../worker-store/waveform-store';

let globalDomain: WeavessTypes.TimeRange;
export const setGlobalDomain = (timeRange: WeavessTypes.TimeRange): void => {
  globalDomain = timeRange;
};
export const getGlobalDomain = (): WeavessTypes.TimeRange => globalDomain;
export interface GetWaveformParams {
  id: string;
  startTime: number;
  endTime: number;
}

export const getWaveform = async ({
  id,
  startTime,
  endTime
}: GetWaveformParams): Promise<Float32Array> => {
  const wave = await WaveformStore.retrieve(id);
  const emptyFloat32Array: Float32Array = new Float32Array(0);
  const scale = d3
    .scaleLinear()
    .domain([globalDomain.startTimeSecs, globalDomain.endTimeSecs])
    .range([0, 100]);

  // Get gl based on start and end time
  const targetGlStart = scale(startTime);
  const targetGlEnd = scale(endTime);

  const lastIndex = wave.length;
  const scaleGlToIndices = d3
    .scaleLinear()
    .domain([wave[0], wave[wave.length - 2]])
    .range([0, lastIndex / 2]);

  let startIndex = Math.floor(scaleGlToIndices(targetGlStart)) * 2;
  const endIndex = Math.ceil(scaleGlToIndices(targetGlEnd)) * 2;

  // Slice doesn't handle negative numbers so get the first point at index 0
  if (startIndex < 0) {
    startIndex = 0;
  }
  // Return empty buffer if the start/end time are before or start/end time are after this
  // waveform or after this waveform
  if (endIndex < 0 || startIndex > wave.length) {
    return emptyFloat32Array;
  }
  // Nothing to slice return the whole waveform
  if (startIndex <= 0 && endIndex >= wave.length - 2) {
    return wave;
  }
  if (startIndex < endIndex) {
    return wave.slice(startIndex, endIndex);
  }
  throw new Error(
    'Start index should never be greater than end index. Something is wrong with the logic.'
  );
};
