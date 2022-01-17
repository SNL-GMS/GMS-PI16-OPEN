import { WeavessConstants, WeavessTypes } from '@gms/weavess-core';
import defaultsDeep from 'lodash/defaultsDeep';
import memoizeOne from 'memoize-one';

/** Defines the default configuration for Weavess */
export const defaultConfiguration: WeavessTypes.Configuration = {
  defaultChannelHeightPx: WeavessConstants.DEFAULT_CHANNEL_HEIGHT_PIXELS,

  labelWidthPx: WeavessConstants.DEFAULT_LABEL_WIDTH_PIXELS,

  xAxisLabel: undefined,

  shouldRenderWaveforms: true,

  shouldRenderSpectrograms: true,

  hotKeys: {
    drawMeasureWindow: 'Alt',
    amplitudeScale: 'KeyS',
    amplitudeScaleSingleReset: 'Alt+KeyS',
    amplitudeScaleReset: 'Alt+Shift+KeyS',
    maskCreate: 'KeyM'
  },

  defaultChannel: {
    disableMeasureWindow: false,
    disableSignalDetectionModification: false,
    disablePreditedPhaseModification: false,
    disableMaskModification: false
  },

  nonDefaultChannel: {
    disableMeasureWindow: false,
    disableSignalDetectionModification: false,
    disablePreditedPhaseModification: false,
    disableMaskModification: false
  },

  colorScale: undefined
};

/**
 * Returns the Weavess configuration based on the configuration
 * passed in by the user and the default configuration
 *
 * @param config
 * @param defaultConfig
 */
// eslint-disable-next-line
const getConfiguration = (
  config: Partial<WeavessTypes.Configuration> | undefined,
  defaultConfig: WeavessTypes.Configuration = defaultConfiguration
): WeavessTypes.Configuration => defaultsDeep(config, defaultConfig);

export const memoizedGetConfiguration = memoizeOne(getConfiguration);
