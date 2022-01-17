/* eslint-disable no-underscore-dangle */
import { ContextMenu } from '@blueprintjs/core';
import { ChannelTypes, StationTypes } from '@gms/common-model';
import { GLDisplayState } from '@gms/ui-state/lib/state/common-workspace/types';
import * as Cesium from 'cesium';
import Immutable from 'immutable';
import React from 'react';
import { CesiumMovementEvent, Entity } from 'resium';

import { HideStationContextMenu } from '~common-ui/components/context-menus/hide-station-context-menu';
import { TOOLTIP_HEIGHT } from '~common-ui/components/map/constants';
import { monoFontStyle } from '~components/data-acquisition-ui/components/soh-map/constants';

export const IAN_MAP_TOOL_TIP_PADDING = 11;
/**
 * Given the position of the mouse on the cesium map,
 * it will attempt to return the entity the mouse is hovering over.
 * If there is no entity below the mouse, function returns undefined.
 *
 * @param viewer: the cesium map
 * @param endPosition: mouse position to be checked for an entity
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getObjectFromPoint = (viewer: Cesium.Viewer, endPosition: Cesium.Cartesian2) => {
  let pickedFeature;
  try {
    pickedFeature = viewer.scene.pick(endPosition);
  } catch (err) {
    console.dir(err);
    return undefined;
  }
  if (Cesium.defined(pickedFeature)) {
    // id is actually an object not a string
    return pickedFeature.id;
  }
  return undefined;
};

export const ianMapTooltipLabelOptions: Cesium.Entity.ConstructorOptions = {
  id: 'labelEntity',
  label: {
    show: false,
    text: 'loading',
    showBackground: true,
    font: monoFontStyle,
    horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
    verticalOrigin: Cesium.VerticalOrigin.TOP,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    pixelOffset: new Cesium.Cartesian2(15, 0),
    eyeOffset: new Cesium.Cartesian3(0.0, 0.0, TOOLTIP_HEIGHT)
  }
};

export const ianMapTooltipLabel = new Cesium.Entity(ianMapTooltipLabelOptions);

export const stationTypeToFriendlyNameMap: Map<StationTypes.StationType, string> = new Map([
  [StationTypes.StationType.SEISMIC_3_COMPONENT, 'Single Station'],
  [StationTypes.StationType.SEISMIC_1_COMPONENT, 'Single Station'],
  [StationTypes.StationType.SEISMIC_ARRAY, 'Array'],
  [StationTypes.StationType.HYDROACOUSTIC, 'Single Station'],
  [StationTypes.StationType.HYDROACOUSTIC_ARRAY, 'Array'],
  [StationTypes.StationType.INFRASOUND, 'Single Station'],
  [StationTypes.StationType.INFRASOUND_ARRAY, 'Array'],
  [StationTypes.StationType.WEATHER, 'Single Station'],
  [StationTypes.StationType.UNKNOWN, 'Unknown']
]);

/**
 * Converts a number to the nearest three decimal places for
 * display in the map tooltip
 *
 * @param num
 * @returns the number fixed to three decimal places
 */
export function formatNumberForTooltipDisplay(num: number): string {
  return num.toFixed(3);
}

/**
 * Given a Station or ChannelGroup Location, returns a Cesium Cartesian3 position
 *
 * @param location
 */
export function createCartesianFromLocation(location: ChannelTypes.Location): Cesium.Cartesian3 {
  return Cesium.Cartesian3.fromDegrees(
    location.longitudeDegrees,
    location.latitudeDegrees,
    location.elevationKm
  );
}

/**
 * Takes or creates the labelEntity and add information to it for display as a tooltip
 *
 * @param movement cesium movement
 * @param viewer The cesium map
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ianMapTooltipHandleMouseMove = (movement, viewer: Cesium.Viewer) => {
  const selectedEntity = getObjectFromPoint(viewer, movement.endPosition);
  let labelEntity = viewer.entities.getById('labelEntity');
  if (!labelEntity) {
    labelEntity = viewer.entities.add(ianMapTooltipLabel);
  }
  // if we are hovering over an entity
  if (selectedEntity?.properties) {
    const properties = selectedEntity.properties.getValue(Cesium.JulianDate.now());
    // and if this entity is a Channel Group or a Station
    if (properties.type === 'ChannelGroup' || properties.type === 'Station') {
      let position = null;
      try {
        position = viewer.scene.pickPosition(movement.endPosition);
      } catch (err) {
        console.dir(err);
      }
      if (position) {
        labelEntity.position = new Cesium.ConstantPositionProperty(position);

        let labelText = `${`Name:`.padEnd(IAN_MAP_TOOL_TIP_PADDING)}${
          selectedEntity.name
        }\n${`Lat:`.padEnd(IAN_MAP_TOOL_TIP_PADDING)}${
          properties.coordinates.latitude
        }°\n${`Lon:`.padEnd(IAN_MAP_TOOL_TIP_PADDING)}${
          properties.coordinates.longitude
        }°\n${`Elevation:`.padEnd(IAN_MAP_TOOL_TIP_PADDING)}${properties.coordinates.elevation} km`;
        if (properties.type === 'Station') {
          labelText += `\n${`Type:`.padEnd(IAN_MAP_TOOL_TIP_PADDING)}${properties.statype}`;
        }
        labelEntity.label.text = new Cesium.ConstantProperty(labelText);
        labelEntity.label.show = new Cesium.ConstantProperty(true);
        viewer.scene.requestRender();
      }
    }
  } else {
    // Do not show the tooltip if there is no entity under our mouse
    labelEntity.label.show = new Cesium.ConstantProperty(false);
    viewer.scene.requestRender();
  }
  return labelEntity;
};

/**
 * Takes Cesium entities and maps them to Resium component entities
 *
 * @param entities
 * @param onClickHandler
 * @param onRightClickHandler
 * @returns
 */
export const mapIanEntitiesToEntityComponent = (
  entities: Cesium.Entity[],
  onClickHandler: (targetEntity: Cesium.Entity) => () => void,
  onRightClickHandler: (movement: CesiumMovementEvent, target: Cesium.Entity) => void
): JSX.Element[] =>
  entities.map((ianEntity: Cesium.Entity) => {
    return (
      <Entity
        id={ianEntity.id}
        label={ianEntity.label}
        key={ianEntity.id}
        name={ianEntity.name}
        billboard={ianEntity.billboard}
        show={ianEntity.show}
        properties={ianEntity.properties}
        position={ianEntity.position.getValue(Cesium.JulianDate.now())}
        polyline={ianEntity.polyline}
        onClick={onClickHandler(ianEntity)}
        onRightClick={(movement, target) => onRightClickHandler(movement, target)}
      />
    );
  });

/**
 * Returns true if 'waveform-display' is included in the provided map
 *
 * @param openDisplays
 */
export function waveformDisplayIsOpen(
  openDisplays: Immutable.Map<string, GLDisplayState>
): boolean {
  if (!openDisplays) return false;
  return openDisplays.get('waveform-display') === GLDisplayState.OPEN;
}

/**
 *  Returns the bounding rectangle for the cesium map widget. This allows us to display html external to the map
 *  relative to the map position (such as map context menus) by giving us the map offset on the screen.
 */
export function getMapBoundingRectangle(): DOMRect {
  const canvas = document.getElementsByClassName('cesium-widget');
  return canvas[0]?.getBoundingClientRect() ?? undefined;
}

/**
 * returns the onRightClickHandler function used for bringing up a context menu on the map
 *
 * @param stationsVisibility
 * @param setChannelVisibility
 */
export const getOnRightClickHandler = (
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  stationsVisibility,
  setChannelVisibility: (channelName: string, visible: boolean) => void
) => {
  function onRightClickHandler(movement: CesiumMovementEvent, target: Cesium.Entity): void {
    if (target?.properties?.type?.getValue(Cesium.JulianDate.now()) === 'Station') {
      const channelName = target.id;
      // get bounding rectangle for the map so that tooltip position can be computed
      const mapPosition = getMapBoundingRectangle();
      const channelShouldBeVisible = !stationsVisibility.get(channelName).visibility;

      const menuString = channelShouldBeVisible
        ? `Show ${channelName} on Waveform Display`
        : `Hide ${channelName} on Waveform Display`;

      ContextMenu.show(
        <HideStationContextMenu
          stationName={channelName}
          hideStationCallback={() => {
            setChannelVisibility(channelName, channelShouldBeVisible);
          }}
          showHideText={menuString}
        />,
        {
          left: movement.position.x + mapPosition?.x,
          top: movement.position.y + mapPosition?.y
        },
        undefined,
        true
      );
    }
  }
  return onRightClickHandler;
};
