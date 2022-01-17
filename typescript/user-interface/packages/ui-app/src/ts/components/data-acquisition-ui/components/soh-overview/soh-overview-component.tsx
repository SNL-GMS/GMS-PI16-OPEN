/* eslint-disable react/destructuring-assignment */
import React from 'react';

import { BaseDisplay } from '~components/common-ui/components/base-display';

import { SohOverviewContext } from './soh-overview-context';
import { SohOverviewPanel } from './soh-overview-panel';
import { SohOverviewProps } from './types';

/**
 * Parent soh component using query to get soh status and pass down to Soh Overview
 */
export class SohOverviewComponent extends React.PureComponent<SohOverviewProps> {
  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Renders the component.
   */
  public render(): JSX.Element {
    return (
      <SohOverviewContext.Provider
        value={{
          sohStationStaleTimeMS: this.props.sohConfigurationQuery.data.sohStationStaleMs,
          acknowledgeSohStatus: this.props.acknowledgeStationsByName,
          glContainer: this.props.glContainer,
          selectedStationIds: this.props.selectedStationIds ? this.props.selectedStationIds : [],
          setSelectedStationIds: this.props.setSelectedStationIds,
          stationSoh: this.props.sohStatus.stationAndStationGroupSoh.stationSoh,
          stationGroupSoh: this.props.sohStatus.stationAndStationGroupSoh.stationGroups,
          quietTimerMs: this.props.sohConfigurationQuery.data.acknowledgementQuietMs,
          updateIntervalSecs: this.props.sohConfigurationQuery.data.reprocessingPeriodSecs
        }}
      >
        <BaseDisplay
          glContainer={this.props.glContainer}
          className="soh-overview soh-overview-display"
        >
          <SohOverviewPanel />
        </BaseDisplay>
      </SohOverviewContext.Provider>
    );
  }
}
