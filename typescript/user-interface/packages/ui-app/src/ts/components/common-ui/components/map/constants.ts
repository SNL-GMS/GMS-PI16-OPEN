import * as Cesium from 'cesium';

import { gmsColors } from '~scss-config/color-preferences';

// minimum height of viewer
export const MIN_HEIGHT = 300;

// distances between to show the label of the entity
export const NEAR = 0;
export const MEDIUM = 100000;
export const FAR = 5000000;
export const VERYFAR = 12000000;
// a cesium version of the gms blue selection color
export const SELECT_BLUE = Cesium.Color.fromCssColorString(gmsColors.gmsSelection);

// eyeoffset/zindex heights for entities on the map, lower values bring the item closer to the top
export const LABEL_HEIGHT_UNSELECTED = -3;
export const LABEL_HEIGHT_SELECTED = -10;
export const TOOLTIP_HEIGHT = -50;
export const BILLBOARD_HEIGHT_SELECTED = -10;
export const BILLBOARD_HEIGHT_UNSELECTED_STATION = -8;
export const BILLBOARD_HEIGHT_UNSELECTED_CHANNEL = -1;
