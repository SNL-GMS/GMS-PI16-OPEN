import { SohTypes } from '@gms/common-model';
import { ChartTypes } from '@gms/ui-core-components';
import { DistinctColorPalette, hslToHex } from '@gms/ui-util';

import { dataAcquisitionUIConfig } from '~components/data-acquisition-ui/config';
import { BarLineChartData } from '~components/data-acquisition-ui/shared/chart/types';

const THOUSAND = 1000;

/** Returns based on the type provided */
export const getName = (type: SohTypes.SohMonitorType): string => {
  const lowercase: string = type.valueOf().toLowerCase();
  return lowercase.charAt(0).toUpperCase() + lowercase.slice(1);
};

/** Returns the label based on the type provided */
export const getLabel = (type: SohTypes.SohMonitorType): string => `${getName(type)} data`;

/** Returns the data type of the data based on the type provided */
export const getDataType = (type: SohTypes.SohMonitorType): string =>
  // !update this function when adding in new types
  type === SohTypes.SohMonitorType.MISSING ? '%' : 's';

/** A helper function for formatting chart tic labels; formats numbers to represent thousandths */
export const chartTickFormatForThousands = (value: number): string | number =>
  value >= THOUSAND ? `${value / THOUSAND}k` : value;

/** Returns the bar chart Y axis label based on the type provided */
export const barChartYAxisLabel = (type: SohTypes.SohMonitorType): string =>
  `Average ${getName(type)} (${getDataType(type)})`;

/** Returns the bar chart X axis label */
export const barChartXAxisLabel = (): string => 'Channel Name';

/** The bar chart Y axis tic formatter */
export const barChartYAxisTicFormat = chartTickFormatForThousands;

/** The bar chart X axis formatter */
export const barChartXAxisTicFormat = (stationName: string) => (name: string): string =>
  name && name.replace ? name.replace(`${stationName}.`, '') : name;

/** Returns the line chart Y axis label based on the type provided */
export const lineChartYAxisLabel = (type: SohTypes.SohMonitorType): string =>
  `${getName(type)} (${getDataType(type)})`;

/** Returns the line chart X axis label */
export const lineChartXAxisLabel = (): string => 'Time';

export const getChartHeight = (targetHeightPx: number): number =>
  Math.max(targetHeightPx, dataAcquisitionUIConfig.dataAcquisitionUserPreferences.minChartHeightPx);

/**
 * Returns the chart data needed to populate the bar and line charts for
 * the historical data.
 *
 * @param props historical trend history display props
 * @param context the historical soh query data
 */
export const getChartData = (
  monitorType: SohTypes.SohMonitorType,
  station: SohTypes.UiStationSoh,
  uiHistoricalSoh: SohTypes.UiHistoricalSohAsTypedArray,
  colorPalette: DistinctColorPalette
): BarLineChartData => {
  const monitorValues = uiHistoricalSoh?.monitorValues;

  const lineDefs: ChartTypes.WeavessLineDefinition[] = [];
  const barDefs: ChartTypes.BarDefinition[] = [];

  let categories: { x: string[]; y: string[] } = { x: [], y: [] };

  // Iterate through each channel monitor type building the line definition
  // and bar definition and add them to their respective arrays
  if (monitorValues) {
    categories = {
      x: monitorValues.map(mV => mV.channelName),
      y: []
    };
    // Iterate through each channel monitor type building the
    // bar definition and add them to the arrays
    monitorValues.forEach(mV => {
      // Add the line definition for this channel
      lineDefs.push({
        id: mV.channelName,
        color: hslToHex(colorPalette.getColor(mV.channelName)),
        values: mV.values,
        average: mV.average
      });
      // Add the bar definition for this channel
      barDefs.push({
        id: mV.channelName,
        color: colorPalette.getColorString(mV.channelName),

        value: {
          x: categories.x.find(name => name === mV.channelName),
          y: mV.average
        }
      });
    });
  }

  // Valid the bar definitions
  barDefs.forEach(
    (barDef, index) =>
      barDef.id !== categories.x[index] &&
      // eslint-disable-next-line no-console
      console.error('channel names of historical data may not match actual values')
  );

  const statuses = station?.channelSohs?.map(c =>
    c.allSohMonitorValueAndStatuses.find(v => v.monitorType === monitorType)
  );

  const thresholdsMarginal = statuses?.filter(s => s !== undefined).map(s => s.thresholdMarginal);
  const thresholdsBad = statuses?.filter(s => s !== undefined).map(s => s.thresholdBad);
  return {
    categories,
    lineDefs,
    barDefs,
    thresholdsMarginal,
    thresholdsBad,
    minAndMax: uiHistoricalSoh?.minAndMax
  };
};
