import { Intent, Spinner } from '@blueprintjs/core';
import { AppState } from '@gms/ui-state';
import * as React from 'react';
import { useSelector } from 'react-redux';

// Listens to Waveform Client waveform loading state in redux
export const WaveformLoadingIndicator: React.FC = () => {
  const waveformClientState = useSelector(
    (state: AppState) => state.analystWorkspaceState?.waveformClientLoadingState
  );
  return (
    <div className="loading-indicator__container">
      {waveformClientState.isLoading && (
        <Spinner
          intent={Intent.PRIMARY}
          size={Spinner.SIZE_SMALL}
          value={waveformClientState.percent}
        />
      )}
      {waveformClientState.isLoading && (
        <span className="loading-indicator__description"> {waveformClientState.description}</span>
      )}
    </div>
  );
};
