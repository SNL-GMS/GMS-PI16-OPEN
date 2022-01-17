import { AppState } from '@gms/ui-state';
import { Viewer as CesiumViewer } from 'cesium';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { CesiumComponentRef } from 'resium';

/**
 * Calls requestRender on the scene within the map when the redux selectedStations change.
 *
 * @param viewerRef a ref to the viewer element
 */
export const useRenderMapOnSelection = (
  viewerRef: React.MutableRefObject<CesiumComponentRef<CesiumViewer>>
): void => {
  const selectedStations = useSelector(
    (state: AppState) => state.commonWorkspaceState?.selectedStationIds
  );
  const stationsVisibility = useSelector(
    (state: AppState) => state.commonWorkspaceState?.stationsVisibility
  );
  const selectedStationsDependencyArray = selectedStations.sort();
  // This useEffect hook is used to rerender the map when the dependencies have changed.
  React.useEffect(() => {
    if (
      viewerRef.current &&
      viewerRef.current.cesiumElement &&
      viewerRef.current.cesiumElement.scene
    ) {
      viewerRef.current.cesiumElement.scene.requestRender();
    }
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(selectedStationsDependencyArray),
    // stationsVisibility is immutable, so a shallow comparison is sufficient
    stationsVisibility,
    viewerRef,
    viewerRef.current?.cesiumElement,
    viewerRef.current?.cesiumElement?.scene
  ]);
};
