import { StationTypes } from '@gms/common-model';
import {
  AppState,
  CommonWorkspaceActions,
  CommonWorkspaceOperations,
  CommonWorkspaceTypes
} from '@gms/ui-state';
import Cesium, { JulianDate } from 'cesium';
import clone from 'lodash/clone';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Map } from '~components/common-ui/components/map';

import { createMapEntitiesFromStationArray } from './create-ian-entities';
import { IanMapTooltipHandler } from './ian-map-tooltip-handler';
import {
  getOnRightClickHandler,
  mapIanEntitiesToEntityComponent,
  waveformDisplayIsOpen
} from './ian-map-utils';

interface Props {
  stationsResult: StationTypes.Station[];
}

/**
 * IAN Map component. Renders a Cesium map and queries for Station Groups
 */
export const IANMapPanelComponent: React.FunctionComponent<Props> = (props: Props) => {
  const { stationsResult } = props;
  const selectedStations = useSelector(
    (state: AppState) => state.commonWorkspaceState?.selectedStationIds
  );
  const dispatch = useDispatch();
  const [canOpenContextMenu, setCanOpenContextMenu] = React.useState(false);
  /**
   * on left-click handler for Ian entities displayed on the map
   */
  const onClickHandler = React.useCallback(
    (targetEntity: Cesium.Entity) => () => {
      if (targetEntity?.properties?.type?.getValue(JulianDate.now()) === 'Station') {
        dispatch(CommonWorkspaceOperations.setSelectedStationIds([targetEntity.id]));
      }
    },
    [dispatch]
  );

  const stationsVisibility = useSelector(
    (state: AppState) => state.commonWorkspaceState?.stationsVisibility
  );

  // create entities from stations array
  const entities: Cesium.Entity[] = createMapEntitiesFromStationArray(
    stationsResult,
    selectedStations,
    stationsVisibility
  );

  /**
   * Sets the visibility for provided station or channel to the value of @param visible
   *
   * @param channelName
   * @param visible
   */
  const setChannelVisibility = (channelName: string, visible: boolean) => {
    const stationVisibilityObject: CommonWorkspaceTypes.StationVisibilityObject = clone(
      stationsVisibility.get(channelName)
    );

    stationVisibilityObject.visibility = visible;
    dispatch(
      CommonWorkspaceActions.setStationsVisibility(
        stationsVisibility.set(channelName, stationVisibilityObject)
      )
    );
  };

  /**
   * The hide/show station context menu should not be available (currently) unless the following is true:
   * 1: An interval is selected
   * 2: The waveform display is open (this condition may change later)
   *
   * if both of these conditions are true, then canOpenContext menu is set to true, and this function also returns that
   */
  const useContextMenuState = () => {
    const openDisplays = useSelector((state: AppState) => state.commonWorkspaceState.glLayoutState);
    const currentInterval = useSelector(
      (state: AppState) => state.analystWorkspaceState?.workflowState?.timeRange
    );
    React.useEffect(() => {
      if (waveformDisplayIsOpen(openDisplays) && !!currentInterval) {
        setCanOpenContextMenu(true);
      } else {
        setCanOpenContextMenu(false);
      }
    }, [currentInterval, openDisplays]);

    return canOpenContextMenu;
  };

  const rightClickHandler = getOnRightClickHandler(stationsVisibility, setChannelVisibility);

  const canShowContextMenu = useContextMenuState();
  // convert entities to resium components
  const entityComponents: JSX.Element[] = mapIanEntitiesToEntityComponent(
    entities,
    onClickHandler,
    canShowContextMenu ? rightClickHandler : () => null
  );

  return (
    <>
      <Map entities={entityComponents} minHeightPx={500} handlers={[IanMapTooltipHandler]} />
    </>
  );
};

export const IANMapPanel = React.memo(IANMapPanelComponent);
