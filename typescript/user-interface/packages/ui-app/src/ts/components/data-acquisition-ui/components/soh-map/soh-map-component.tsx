/* eslint-disable react/destructuring-assignment */
import { nonIdealStateWithSpinner } from '@gms/ui-core-components';
import React from 'react';

import { SohMapPanel } from './soh-map-panel';
import { SohMapProps } from './types';

const MIN_CHART_HEIGHT_PX = 300;

/**
 * State of health map component.
 */
export class SohMapComponent extends React.Component<SohMapProps> {
  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Renders the component.
   */
  public render(): JSX.Element {
    if (this.props.defaultStationsQuery.loading) {
      return nonIdealStateWithSpinner('Loading', 'Stations');
    }

    return (
      <SohMapPanel
        minHeightPx={MIN_CHART_HEIGHT_PX}
        selectedStationIds={this.props.selectedStationIds ? this.props.selectedStationIds : []}
        sohStatus={this.props.sohStatus}
        stations={
          this.props.defaultStationsQuery
            ? this.props.defaultStationsQuery.defaultProcessingStations
            : []
        }
        setSelectedStationIds={this.props.setSelectedStationIds}
      />
    );
  }

  // ***************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ***************************************
}
