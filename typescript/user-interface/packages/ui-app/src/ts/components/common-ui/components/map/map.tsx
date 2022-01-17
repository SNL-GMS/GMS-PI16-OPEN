/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import {
  buildModuleUrl,
  Cartesian3,
  EllipsoidTerrainProvider,
  ProviderViewModel,
  TileMapServiceImageryProvider,
  Viewer as CesiumViewer
} from 'cesium';
import * as React from 'react';
import { Camera, CameraFlyTo, CesiumComponentRef, ImageryLayer, Viewer } from 'resium';

import { MIN_HEIGHT } from './constants';
import { baseViewerSettings } from './map-resources';
import { useRenderMapOnSelection } from './map-util';
import { MapProps } from './types';

const imageryProviderViewModels: ProviderViewModel[] = [];

const defaultStyle: React.CSSProperties = {
  position: 'absolute',
  top: 50,
  left: 0,
  right: 0,
  bottom: 0
};

imageryProviderViewModels.push(
  new ProviderViewModel({
    name: 'Natural Earth',
    tooltip: 'Natural Earth',
    iconUrl: buildModuleUrl('Widgets/Images/ImageryProviders/naturalEarthII.png'),
    creationFunction: (): TileMapServiceImageryProvider =>
      new TileMapServiceImageryProvider({
        url: buildModuleUrl('Assets/Textures/NaturalEarthII'),
        maximumLevel: 2
      })
  })
);

const naturalEarthImageryProvider = new TileMapServiceImageryProvider({
  url: buildModuleUrl('Assets/Textures/NaturalEarthII'),
  maximumLevel: 2
});

const terrainProviderViewModels = [];

const wgs84Terrain = new ProviderViewModel({
  name: 'WGS84 Ellipsoid',
  iconUrl: buildModuleUrl('Widgets/Images/TerrainProviders/Ellipsoid.png'),
  tooltip: 'WGS84 standard ellipsoid, also known as EPSG:4326',
  creationFunction: () => new EllipsoidTerrainProvider()
});

terrainProviderViewModels.push(wgs84Terrain);

/**
 * common base map component
 *
 * @param props the props
 */
export const MapComponent: React.FunctionComponent<MapProps> = props => {
  const ref = React.useRef<CesiumComponentRef<CesiumViewer>>(null);

  useRenderMapOnSelection(ref);

  const minHeight = MIN_HEIGHT;

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const destination: Cartesian3 = Cartesian3.fromDegrees(0, 0, 40000000);

  /**
   * This function passes all the ScreenSpaceEventHandlers
   * viewer context and then maps them into the viewer
   *
   * @returns jsx ScreenSpaceEventHandlers
   */
  const getViewerHandlers = () => {
    return (
      ref?.current?.cesiumElement &&
      props.handlers?.map(handler => handler({ viewer: ref?.current?.cesiumElement }))
    );
  };

  /**
   * expands the entity list
   *
   * @returns
   */
  const getEntityComponents = () => {
    return props.entities?.map(entity => entity);
  };
  return (
    <div className="soh-map-sub-wrapper" style={{ minHeight }}>
      <Viewer
        // "full" is set to false and and style is instead handled here
        style={defaultStyle}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...baseViewerSettings}
        ref={ref}
        full={false}
        infoBox={false}
        selectionIndicator={false}
        homeButton
        terrainProviderViewModels={terrainProviderViewModels}
        baseLayerPicker
        imageryProvider={false}
        imageryProviderViewModels={imageryProviderViewModels}
      >
        {/* uncomment the following to see map fps */}
        {/* <Scene debugShowFramesPerSecond /> */}
        <Camera defaultZoomAmount={0} />
        <CameraFlyTo duration={0} destination={destination} once />
        <ImageryLayer imageryProvider={naturalEarthImageryProvider} />
        {getEntityComponents()}
        {getViewerHandlers()}
      </Viewer>
    </div>
  );
};

export const Map = React.memo(MapComponent);
