import { StationTypes } from '@gms/common-model';
import { AppState, CommonWorkspaceOperations, CommonWorkspaceTypes } from '@gms/ui-state';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Queries } from '~components/client-interface';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ReduxStationsVisibilityInitializerProps {}
// fallback if we dont have the currentInterval?.startTimeSecs
const effectiveTimeUnixEpochSecs = Date.now() / 1000;
/**
 * take the results of the useAllStationsQuery and checks if the stationsVisibility redux state is empty.
 * if the stationsVisibility state is empty then it build the stationsVisibility state with the fetch result
 */
export const ReduxStationsVisibilityInitializer: React.FunctionComponent<ReduxStationsVisibilityInitializerProps> = () => {
  let stationsVisibility = useSelector(
    (state: AppState) => state.commonWorkspaceState?.stationsVisibility
  );
  const currentInterval = useSelector(
    (state: AppState) => state.analystWorkspaceState?.workflowState?.timeRange
  );
  const effectiveTime = currentInterval?.startTimeSecs || effectiveTimeUnixEpochSecs;
  const { data } = Queries.StationQueryUtil.useAllStationsQuery(effectiveTime);
  const dispatch = useDispatch();
  if (stationsVisibility.isEmpty() && data) {
    data.forEach((station: StationTypes.Station) => {
      const newStationVisibilityObject: CommonWorkspaceTypes.StationVisibilityObject = {
        visibility: false,
        station
      };
      stationsVisibility = stationsVisibility.set(station.name, newStationVisibilityObject);
    });
    dispatch(CommonWorkspaceOperations.setStationsVisibility(stationsVisibility));
  }
  return null;
};
