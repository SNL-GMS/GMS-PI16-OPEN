/* eslint-disable react/destructuring-assignment */
import { SohTypes } from '@gms/common-model';
import { UILogger } from '@gms/ui-apollo';
import * as React from 'react';

import { BaseDisplay } from '~components/common-ui/components/base-display';
import { dataAcquisitionUIConfig } from '~components/data-acquisition-ui/config';

import { SohBarChartPanel } from './soh-bar-chart-panel';
import { SohBarChartProps, SohBarChartState } from './types';

const MIN_CHART_HEIGHT_PX = dataAcquisitionUIConfig.dataAcquisitionUserPreferences.minChartHeightPx;

export class SohBarChart extends React.Component<SohBarChartProps, SohBarChartState> {
  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Renders the component.
   */
  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    return (
      <BaseDisplay
        glContainer={this.props.glContainer}
        className={`${this.props.type.toLocaleLowerCase()}-display top-level-container scroll-box scroll-box--y`}
      >
        <SohBarChartPanel
          minHeightPx={MIN_CHART_HEIGHT_PX}
          type={this.props.type}
          station={this.getStation()}
          sohStatus={this.props.sohStatus}
          quietChannelMonitorStatuses={this.quietChannelMonitorStatuses}
          sohConfiguration={this.props.sohConfigurationQuery?.data}
          valueType={this.props.valueType}
        />
      </BaseDisplay>
    );
  }
  // ***************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /** Returns the selected station */
  private readonly getStation = (): SohTypes.UiStationSoh =>
    this.props.sohStatus.stationAndStationGroupSoh.stationSoh.find(
      s => s.stationName === this.props.selectedStationIds[0]
    );

  /**
   * Quiets a channel monitor status
   *
   * @param stationName name of the station
   * @param channelPairs channel monitor pairs to quiet
   * @param quietDurationMs duration to be quiet
   * @param comment (optional) the comment for the quiet action
   */
  private readonly quietChannelMonitorStatuses = (
    stationName: string,
    channelPairs: SohTypes.ChannelMonitorPair[],
    quietDurationMs: number,
    comment?: string
  ): void => {
    const input: SohTypes.ChannelMonitorInput = {
      channelMonitorPairs: channelPairs,
      stationName,
      quietDurationMs,
      comment
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.props
      .quietChannelMonitorStatuses({
        variables: {
          channelMonitorsToQuiet: input
        }
      })
      .catch(err => {
        UILogger.Instance().error(err);
      });
  };
}
