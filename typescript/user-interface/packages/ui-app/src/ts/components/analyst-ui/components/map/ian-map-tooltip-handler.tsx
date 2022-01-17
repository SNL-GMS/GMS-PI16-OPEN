import * as Cesium from 'cesium';
import * as React from 'react';
import { ScreenSpaceEvent, ScreenSpaceEventHandler } from 'resium';

import { MapHandlerProps } from '~common-ui/components/map/types';

import { ianMapTooltipHandleMouseMove, ianMapTooltipLabel } from './ian-map-utils';

/**
 * This component creates and ScreenSpaceEventHandler along with a ScreenSpaceEvent of type mousemove
 * so that when an entity on the map has been hovered over a tooltip will appear.
 *
 * @param props the props
 */
// TODO: update types when we upgrade cesium
export const IanMapTooltipHandler: React.FunctionComponent<MapHandlerProps> = ({
  viewer
}: MapHandlerProps) => {
  if (viewer) {
    // check to see if we have a tooltip entity to work with if not we add it
    if (!viewer.entities.getById('labelEntity')) {
      viewer.entities.add(ianMapTooltipLabel);
    }
    return (
      <ScreenSpaceEventHandler key={234}>
        <ScreenSpaceEvent
          action={position => ianMapTooltipHandleMouseMove(position, viewer)}
          type={Cesium.ScreenSpaceEventType.MOUSE_MOVE}
        />
      </ScreenSpaceEventHandler>
    );
  }
  return null;
};
