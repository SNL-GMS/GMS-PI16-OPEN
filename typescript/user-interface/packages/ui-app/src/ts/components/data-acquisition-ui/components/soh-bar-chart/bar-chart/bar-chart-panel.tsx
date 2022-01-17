/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import { setDecimalPrecisionAsNumber } from '@gms/common-util';
import { nonIdealStateWithNoSpinner } from '@gms/ui-core-components';
import { AppState } from '@gms/ui-state';
import * as React from 'react';
import { useSelector } from 'react-redux';

import { useBaseDisplaySize } from '~components/common-ui/components/base-display/base-display-hooks';
import {
  barChartXAxisLabel,
  barChartYAxisTicFormat
} from '~components/data-acquisition-ui/components/historical-trends/utils';
import { dataAcquisitionUserPreferences } from '~components/data-acquisition-ui/config';
import { gmsColors } from '~scss-config/color-preferences';
import { gmsLayout } from '~scss-config/layout-preferences';

import { MAX_BAR_CHART_WIDTH, MIN_BAR_CHART_WIDTH } from '../../../shared/chart/constants';
import {
  buildData,
  getOnContextMenus,
  toolbarBarChartXAxisTicFormat,
  toolbarBarChartYAxisLabel
} from './bar-chart-utils';
import { BarChartWrapper } from './bar-chart-wrapper';
import { QuietIndicatorWrapper } from './quiet-indicator-wrapper';
import { BarChartPanelProps } from './types';

const PADDING_PX = gmsLayout.displayPaddingPx * 2;
const nullValueToolTip = 'null';
const isXTickDisabled = (tick: { value: number; tooltip: string }): boolean =>
  tick.value === 0 && tick.tooltip === nullValueToolTip;

export const BarChartPanel: React.FunctionComponent<BarChartPanelProps> = props => {
  const [widthPx, heightPx] = useBaseDisplaySize();

  const isStale = useSelector(
    (state: AppState) => state.dataAcquisitionWorkspaceState?.data?.sohStatus?.isStale
  );

  // get our 2 context menus for the bar and the label
  const onContextMenus = getOnContextMenus(
    props.type,
    props.quietChannelMonitorStatuses,
    props.sohConfiguration.availableQuietTimesMs,
    props.station.stationName,
    isStale,
    props.channelSoh
  );
  const widthWithPaddingPx = widthPx - gmsLayout.displayPaddingPx * 2;
  const barChartHeight = heightPx - props.chartHeaderHeight - PADDING_PX;

  // format the data for passing to the bar chart props
  const chartData = buildData(props.channelSoh, onContextMenus, props.valueType);

  return chartData?.barData.length > 0 ? (
    <>
      <BarChartWrapper
        widthPx={widthWithPaddingPx || dataAcquisitionUserPreferences.minChartWidthPx}
        heightPx={barChartHeight || dataAcquisitionUserPreferences.minChartHeightPx}
        id={props.type}
        barChartProps={{
          // eslint-disable-next-line @typescript-eslint/unbound-method
          onContextMenuBar: onContextMenus.onContextMenuBar,
          // eslint-disable-next-line @typescript-eslint/unbound-method
          onContextMenuBarLabel: onContextMenus.onContextMenuBarLabel,
          // victory does not take a functional component so we have
          // to cast our quiet component to an any to suppress the linter
          // this can supposedly be fixed by updating to the latest types
          // in our package.json
          dataComponent: QuietIndicatorWrapper as any,
          maxBarWidth: MAX_BAR_CHART_WIDTH,
          minBarWidth: MIN_BAR_CHART_WIDTH,
          scrollBrushColor: gmsColors.gmsMain,
          categories: chartData?.barCategories ? chartData.barCategories : { x: [], y: [] },
          widthPx: widthWithPaddingPx || dataAcquisitionUserPreferences.minChartWidthPx,
          heightPx: barChartHeight || dataAcquisitionUserPreferences.minChartHeightPx,
          barDefs: chartData?.barData,
          disabled: {
            xTicks: {
              disabledColor: gmsColors.gmsChartTickLabelDisabled,
              disabledCondition: isXTickDisabled
            }
          },
          thresholdsBad: chartData?.thresholdsBad,
          thresholdsMarginal: chartData?.thresholdsMarginal,
          yTickFormat: barChartYAxisTicFormat,
          xTickFormat: toolbarBarChartXAxisTicFormat(props.station.stationName, props.channelSoh),
          // !update toolbarBarChartYAxisLabel when adding in new types
          yAxisLabel: toolbarBarChartYAxisLabel(props.type),
          xAxisLabel: barChartXAxisLabel(),
          xTickTooltips: chartData?.barData.map(bar =>
            bar.value.y ? `${setDecimalPrecisionAsNumber(bar.value.y)}` : nullValueToolTip
          )
        }}
      />
    </>
  ) : (
    nonIdealStateWithNoSpinner('No data to display', 'Data is filtered out')
  );
};
