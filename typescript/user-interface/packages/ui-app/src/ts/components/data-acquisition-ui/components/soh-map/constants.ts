import * as Cesium from 'cesium';

import { dataAcquisitionUserPreferences } from '~components/data-acquisition-ui/config';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const font = require('~css/gms-fonts.scss');

export const colorDictionary = {
  GOOD: Cesium.Color.fromCssColorString(dataAcquisitionUserPreferences.colors.ok),
  MARGINAL: Cesium.Color.fromCssColorString(dataAcquisitionUserPreferences.colors.warning),
  BAD: Cesium.Color.fromCssColorString(dataAcquisitionUserPreferences.colors.strongWarning),
  NONE: Cesium.Color.fromCssColorString(dataAcquisitionUserPreferences.colors.none)
};

export const fontStyle = `14px ${font.gmsSans}`;
export const monoFontStyle = `14px ${font.gmsMono}`;

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, import/no-unresolved, global-require
export const stationTriangleWhite = require('./img/station-triangle-white.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, import/no-unresolved, global-require
export const stationTriangleOrange = require('./img/station-triangle-orange.png');

export const imageScale = 0.12;
const imageScaleMultiplier = 1.6;
export const imageScaleSelected = imageScale * imageScaleMultiplier;
const yCartesian = 10;
export const unselectedPixelOffset = new Cesium.Cartesian2(0, yCartesian);
export const selectedPixelOffset = new Cesium.Cartesian2(0, yCartesian + 2);
