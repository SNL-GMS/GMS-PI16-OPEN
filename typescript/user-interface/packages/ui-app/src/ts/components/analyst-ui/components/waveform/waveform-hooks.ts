import { StationTypes } from '@gms/common-model';
import { CheckboxSearchListTypes } from '@gms/ui-core-components';
import { AppState, CommonWorkspaceOperations, CommonWorkspaceTypes } from '@gms/ui-state';
import Immutable from 'immutable';
import clone from 'lodash/clone';
import * as React from 'react';
import { QueryResult } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import {
  useAllStationsQuery,
  useStationGroupStationQuery
} from '~components/client-interface/axios/queries/station-query-util';

/**
 * Helper function for create an Immutable.Map<string, CommonWorkspaceTypes.StationVisibilityObject> where
 * all the values have been set to visibility false
 *
 * @param StationsVisibilityMap map of station name to StationVisibilityObject
 * @returns an immutable stationVisibilityMap with all visibilities set to false.
 */
export const getStationsVisibilityMapWithFalseVisibility = (
  StationsVisibilityMap: Immutable.Map<string, CommonWorkspaceTypes.StationVisibilityObject>
): Immutable.Map<string, CommonWorkspaceTypes.StationVisibilityObject> => {
  let newMap = Immutable.Map<string, CommonWorkspaceTypes.StationVisibilityObject>();
  StationsVisibilityMap.forEach(
    (value: CommonWorkspaceTypes.StationVisibilityObject, key: string) => {
      const newValue = { ...value, visibility: false };
      newMap = newMap.set(key, newValue);
    }
  );
  return newMap;
};
/**
 * Takes startTimeSecs for useStationGroupStationQuery along with the redux station group and
 * get all the station definitions for the station group. Updates the stationsVisibility redux map
 * to set the station group stations to be visible and updates the redux state to reflect that
 *
 * @param startTimeSecs get station definitions that were effective at this time
 * @returns QueryResult with the requested station array
 */
export const useStationDefinitionResult = (
  startTimeSecs: number
): QueryResult<StationTypes.Station[], unknown> => {
  const stationGroup = useSelector(
    (state: AppState) => state.analystWorkspaceState?.workflowState?.stationGroup?.name
  );
  const stationsVisibility = useSelector(
    (state: AppState) => state.commonWorkspaceState?.stationsVisibility
  );
  const stationVisibilityRef = React.useRef(stationsVisibility);
  // Get current station group based on workflow interval selection to set which
  // stations are visible
  const stationGroupStations = useStationGroupStationQuery(stationGroup, startTimeSecs);
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (stationGroupStations?.data) {
      let stationsVisibilityMap = getStationsVisibilityMapWithFalseVisibility(
        stationVisibilityRef.current
      );
      stationGroupStations?.data.forEach((station: StationTypes.Station) => {
        if (stationsVisibilityMap.has(station.name)) {
          const stationVisibilityObject = {
            ...stationsVisibilityMap.get(station.name),
            visibility: true
          };
          stationsVisibilityMap = stationsVisibilityMap.set(station.name, stationVisibilityObject);
        }
      });
      dispatch(CommonWorkspaceOperations.setStationsVisibility(stationsVisibilityMap));
    }
  }, [dispatch, stationGroupStations?.data]);

  // Return all stations so we build all corresponding WeavessStation in the waveform panel
  return useAllStationsQuery(startTimeSecs);
};

/**
 * Takes checkbox items and a station visibility map and returns a function that can update redux when a checkbox is clicked
 *
 * @param checkboxItemsList list of check boxed items
 * @param stationsVisibility station visibility map from redux
 * @returns a function for changing stationsVisibility for on clicking a checkbox on station dropdown
 */
export const useStationsVisibilityFromCheckboxState = (
  checkboxItemsList: CheckboxSearchListTypes.CheckboxItem[],
  stationsVisibility: Immutable.Map<string, CommonWorkspaceTypes.StationVisibilityObject>
): ((
  getUpdatedCheckboxItemsList: (
    previousList: CheckboxSearchListTypes.CheckboxItem[]
  ) => CheckboxSearchListTypes.CheckboxItem[]
) => void) => {
  const dispatch = useDispatch();

  return React.useCallback(
    (
      getUpdatedCheckboxItemsList: (
        previousList: CheckboxSearchListTypes.CheckboxItem[]
      ) => CheckboxSearchListTypes.CheckboxItem[]
    ) => {
      const updatedCheckboxItemsList = getUpdatedCheckboxItemsList(checkboxItemsList);
      let newStationsVisibility = stationsVisibility;
      updatedCheckboxItemsList
        // filter to the checkbox items that we changed
        .filter(checkBoxItem => {
          const previousVersionCheckBoxItem = checkboxItemsList.find(
            item => item.name === checkBoxItem.name
          );
          if (previousVersionCheckBoxItem.checked !== checkBoxItem.checked) {
            return true;
          }
          return false;
        })
        .forEach(checkBoxItem => {
          const stationVisibilityObject: CommonWorkspaceTypes.StationVisibilityObject = clone(
            stationsVisibility.get(checkBoxItem.name)
          );
          stationVisibilityObject.visibility = checkBoxItem.checked;
          newStationsVisibility = newStationsVisibility.set(
            checkBoxItem.name,
            stationVisibilityObject
          );
        });
      dispatch(CommonWorkspaceOperations.setStationsVisibility(newStationsVisibility));
    },
    [checkboxItemsList, dispatch, stationsVisibility]
  );
};
