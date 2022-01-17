/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import { SohTypes } from '@gms/common-model';
import { setDecimalPrecisionAsNumber, ValueType } from '@gms/common-util';
import { nonIdealStateWithNoSpinner } from '@gms/ui-core-components';
import { DistinctColorPalette } from '@gms/ui-util';
import Immutable from 'immutable';
import * as React from 'react';

import {
  barChartXAxisLabel,
  barChartXAxisTicFormat,
  barChartYAxisLabel,
  barChartYAxisTicFormat,
  getChartData,
  lineChartXAxisLabel,
  lineChartYAxisLabel
} from '~components/data-acquisition-ui/components/historical-trends/utils';
import {
  MAX_BAR_CHART_WIDTH,
  MIN_BAR_CHART_WIDTH,
  TOOLBAR_HEIGHT_PX
} from '~components/data-acquisition-ui/shared/chart/constants';
import { gmsColors } from '~scss-config/color-preferences';

import { BarAndLineChart } from '../../shared/chart/bar-and-line-chart';
import { BarLineChartData } from '../../shared/chart/types';

/**
 * Dimensions, station data, and props specific
 * to the charts.
 */
export interface BarLineChartPanelProps {
  legendTitle: string;
  startTimeMs: number;
  endTimeMs: number;
  heightPx: number;
  widthPx: number;
  entryVisibilityMap: Immutable.Map<string, boolean>;
  colorPalette: DistinctColorPalette;
  monitorType: SohTypes.SohMonitorType;
  station: SohTypes.UiStationSoh;
  valueType: ValueType;
  uiHistoricalSoh: SohTypes.UiHistoricalSohAsTypedArray;
}

/**
 * Manages the bar line chart data. Updates it only if the time range has changed.
 *
 * @param monitorType soh monitor type
 * @param station the station for which to build the chart data
 * @param colorPalette the color palette to choose from
 * @returns the BarLineChartData for the given station, monitor type and time range.
 */
export const useBarLineChartData = (
  monitorType: SohTypes.SohMonitorType,
  station: SohTypes.UiStationSoh,
  uiHistoricalSoh: SohTypes.UiHistoricalSohAsTypedArray,
  colorPalette: DistinctColorPalette
): BarLineChartData => {
  const [chartData, setChartData] = React.useState<BarLineChartData>(undefined);

  // Check if data has changed
  React.useEffect(() => {
    // prepare and get the chart data from the historical data
    setChartData(getChartData(monitorType, station, uiHistoricalSoh, colorPalette));
    // !FIX ESLINT Validate and check REACT HOOK dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiHistoricalSoh, station.channelSohs]);

  return chartData;
};

/**
 * Bar/line chart panel component -
 * vertically stacked bar and line charts, with appropriate padding.
 * Provides the charts with a color palette based on the channel name
 */
export const BarLineChartPanel: React.FunctionComponent<BarLineChartPanelProps> = props => {
  // calculate the height of each chart
  const heightPx = props.heightPx / 2 - TOOLBAR_HEIGHT_PX;

  const chartData = useBarLineChartData(
    props.monitorType,
    props.station,
    props.uiHistoricalSoh,
    props.colorPalette
  );

  // There is a condition where the chart can be undefined the first render after the query
  // returns. If this is the case return immediately with an empty non-ideal state.
  // This occurs for a fraction of a second.
  if (!chartData) {
    return nonIdealStateWithNoSpinner();
  }

  if (chartData.barDefs.length === 0) {
    return nonIdealStateWithNoSpinner('No data to display', 'Data is filtered out');
  }
  return (
    <BarAndLineChart
      id={props.station.stationName}
      widthPx={props.widthPx}
      heightPx={props.heightPx * 2 - TOOLBAR_HEIGHT_PX}
      barChart={{
        widthPx: props.widthPx,
        heightPx,
        maxBarWidth: MAX_BAR_CHART_WIDTH,
        minBarWidth: MIN_BAR_CHART_WIDTH,
        scrollBrushColor: gmsColors.gmsMain,
        categories: chartData ? chartData.categories : { x: [], y: [] },
        barDefs: chartData.barDefs,
        yAxisLabel: barChartYAxisLabel(props.monitorType),
        xAxisLabel: barChartXAxisLabel(),
        xTickTooltips: chartData.barDefs?.map(bar => `${setDecimalPrecisionAsNumber(bar.value.y)}`),
        yTickFormat: barChartYAxisTicFormat,
        xTickFormat: barChartXAxisTicFormat(props.station.stationName),
        thresholdsMarginal: chartData ? chartData.thresholdsMarginal : [],
        thresholdsBad: chartData ? chartData.thresholdsBad : []
      }}
      lineChart={{
        widthPx: props.widthPx,
        heightPx,
        startTimeMs: props.startTimeMs,
        endTimeMs: props.endTimeMs,
        yAxisLabel: lineChartYAxisLabel(props.monitorType),
        xAxisLabel: lineChartXAxisLabel(),
        lineDefs: chartData?.lineDefs,
        minAndMax: chartData?.minAndMax
      }}
    />
  );
};
