/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import { BarChart, ChartTypes } from '@gms/ui-core-components';
import * as React from 'react';

import { dataAcquisitionUserPreferences } from '~components/data-acquisition-ui/config';

/** The Bar/line chart panel props */
export interface BarChartWrapperProps {
  id: string;
  widthPx: number;
  heightPx: number;
  barChartProps?: ChartTypes.BarChartProps;
}

/**
 * Bar/line chart panel component - renders a bar chart and line chart
 */
export const BarChartWrapper: React.FunctionComponent<BarChartWrapperProps> = props => {
  // define the chart padding for the two charts
  const padding: ChartTypes.ChartPadding = { top: 16, right: 29, bottom: 120, left: 63 };

  const sharedProps = {
    classNames: 'table-display',
    padding,
    minHeightPx: dataAcquisitionUserPreferences.minChartHeightPx
  };

  return (
    <>
      <div className="legend-and-charts">
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <BarChart id={`bar-chart-${props.id}`} {...sharedProps} {...props?.barChartProps} />
      </div>
    </>
  );
};
