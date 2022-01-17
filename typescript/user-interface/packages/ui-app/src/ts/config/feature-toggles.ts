interface ToggleOptions {
  readonly [id: string]: boolean | ToggleOptions;
}

export interface FeatureToggles extends ToggleOptions {
  readonly WAVEFORMS: {
    readonly LOAD_COLLAPSED_CHANNELS: boolean;
  };
}

/**
 * A collection of feature toggles that can be enabled/disabled to turn a feature on or off.
 */
export const FEATURE_TOGGLES: FeatureToggles = {
  WAVEFORMS: {
    /**
     * When true, will preload all collapsed child channelSegments in the waveform display.
     */
    LOAD_COLLAPSED_CHANNELS: false
  }
} as const;
