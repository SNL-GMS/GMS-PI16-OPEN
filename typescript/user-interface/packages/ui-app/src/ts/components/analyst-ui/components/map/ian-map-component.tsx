import { AppState } from '@gms/ui-state';
import React from 'react';
import { useSelector } from 'react-redux';

import { IANMapComponentProps } from '~analyst-ui/components/map/types';
import { BaseDisplay } from '~common-ui/components/base-display';
import { Queries } from '~components/client-interface';

import { IANMapPanel } from './ian-map-panel';

const effectiveTimeUnixEpochSecs = Date.now() / 1000;
/**
 * IAN Map component. Renders a Cesium map and queries for Station Groups
 */
export const IANMapComponent: React.FunctionComponent<IANMapComponentProps> = (
  props: IANMapComponentProps
) => {
  const { glContainer } = props;

  const currentInterval = useSelector(
    (state: AppState) => state.analystWorkspaceState?.workflowState?.timeRange
  );
  const effectiveTime = currentInterval?.startTimeSecs || effectiveTimeUnixEpochSecs;
  // TODO: update with redux stationsVisibility
  const { data } = Queries.StationQueryUtil.useAllStationsQuery(effectiveTime);
  return (
    <BaseDisplay glContainer={glContainer} className="ian-map-gl-container">
      <IANMapPanel stationsResult={data} />
    </BaseDisplay>
  );
};

export const IANMap = React.memo(IANMapComponent);
