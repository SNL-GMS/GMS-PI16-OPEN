import { AnalystWorkspaceActions, AnalystWorkspaceTypes } from '@gms/ui-state';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import { WaveformClient } from './waveform-client';

/**
 * This creates the WaveformClient and stores it in the ui global state store (redux).
 */
export const WaveformClientInitializer: React.FC<Record<string, never>> = () => {
  const dispatch = useDispatch();
  const setWaveformClientLoadingState = React.useCallback(
    (waveformClientState: AnalystWorkspaceTypes.WaveformClientState) => {
      dispatch(AnalystWorkspaceActions.setWaveformClientLoadingState(waveformClientState));
    },
    [dispatch]
  );
  React.useEffect(() => {
    const waveformClient = new WaveformClient(setWaveformClientLoadingState);
    dispatch(AnalystWorkspaceActions.setWaveformClient(waveformClient));
  }, [dispatch, setWaveformClientLoadingState]);
  return null;
};
