/* eslint-disable react/destructuring-assignment */
import { WithNonIdealStates } from '@gms/ui-core-components';
import { AppState } from '@gms/ui-state';
import * as React from 'react';
import { useSelector } from 'react-redux';

import { useEventQuery } from '~analyst-ui/client-interface/axios/queries/event-query';
import { useQcMaskQuery } from '~analyst-ui/client-interface/axios/queries/qc-mask-query';
import { useSignalDetectionQuery } from '~analyst-ui/client-interface/axios/queries/signal-detection-query';
import { AnalystNonIdealStates } from '~analyst-ui/common/non-ideal-states';
import { BaseDisplay } from '~common-ui/components/base-display';
import { CommonNonIdealStateDefs } from '~common-ui/components/non-ideal-states';
import { Queries } from '~components/client-interface';

import { WaveformDisplayProps } from './types';
import { useStationDefinitionResult } from './waveform-hooks';
import { WaveformPanel } from './waveform-panel';
import { WeavessContext } from './weavess-context';

const WaveformOrNonIdealState = WithNonIdealStates<WaveformDisplayProps>(
  [
    ...CommonNonIdealStateDefs.baseNonIdealStateDefinitions,
    ...AnalystNonIdealStates.processingAnalystConfigNonIdealStateDefinitions,
    ...AnalystNonIdealStates.stationDefinitionNonIdealStateDefinitions,
    ...AnalystNonIdealStates.signalDetectionsNonIdealStateDefinitions,
    ...AnalystNonIdealStates.eventNonIdealStateDefinitions,
    ...AnalystNonIdealStates.qcMaskNonIdealStateDefinitions
  ],
  WaveformPanel
);

export const WaveformComponent: React.FunctionComponent<WaveformDisplayProps> = (
  props: WaveformDisplayProps
) => {
  const processingAnalystConfiguration = Queries.ProcessingAnalystConfigurationQuery.useProcessingAnalystConfigurationQuery();
  const stationDefResult = useStationDefinitionResult(props.currentTimeInterval.startTimeSecs);
  const signalDetectionResult = useSignalDetectionQuery({
    stationIds: stationDefResult.data?.map(station => station.name) ?? [],
    timeRange: props.currentTimeInterval
  });
  const eventResult = useEventQuery(props.currentTimeInterval);
  const qcMaskResult = useQcMaskQuery(props.currentTimeInterval);
  const waveformClient = useSelector(
    (state: AppState) => state.analystWorkspaceState?.waveformClient
  );

  const [weavessRef, setWeavessRef] = React.useState(null);

  return (
    <BaseDisplay glContainer={props.glContainer} className="waveform-display-window gms-body-text">
      <WeavessContext.Provider
        value={{
          weavessRef,
          setWeavessRef
        }}
      >
        <WaveformOrNonIdealState
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
          waveformClient={waveformClient}
          processingAnalystConfigurationQuery={processingAnalystConfiguration}
          eventQuery={eventResult}
          qcMaskQuery={qcMaskResult}
          signalDetectionQuery={signalDetectionResult}
          stationDefinitionsQuery={stationDefResult}
        />
      </WeavessContext.Provider>
    </BaseDisplay>
  );
};
