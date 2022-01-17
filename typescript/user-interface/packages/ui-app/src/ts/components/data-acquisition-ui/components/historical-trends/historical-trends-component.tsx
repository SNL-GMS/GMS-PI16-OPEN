/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import { SohTypes } from '@gms/common-model';
import { ValueType } from '@gms/common-util';
import React from 'react';

import { BaseDisplay } from '~components/common-ui/components/base-display';

import { HistoricalTrendsHistoryPanel } from './historical-trends-panel';
import { HistoricalTrendsHistoryComponentProps } from './types';
/**
 * State of health historical trends component display.
 * Composes together the various charts into the a display.
 */
export const buildHistoricalTrendsHistoryComponent = (
  type: SohTypes.SohMonitorType,
  valueType: ValueType,
  displaySubtitle: string
  // eslint-disable-next-line react/display-name
): React.FunctionComponent<HistoricalTrendsHistoryComponentProps> => props => {
  /**
   * Returns the selected station
   */
  const getStation = (): SohTypes.UiStationSoh =>
    props.sohStatus?.stationAndStationGroupSoh?.stationSoh?.find(
      s => s.stationName === props.selectedStationIds[0]
    );

  return (
    <BaseDisplay
      glContainer={props.glContainer}
      className="history-display top-level-container scroll-box scroll-box--y"
    >
      <HistoricalTrendsHistoryPanel
        monitorType={SohTypes.SohMonitorType[type]}
        station={getStation()}
        sohStatus={props.sohStatus}
        sohHistoricalDurations={props.sohConfigurationQuery.data.sohHistoricalTimesMs}
        valueType={valueType}
        displaySubtitle={displaySubtitle}
      />
    </BaseDisplay>
  );
};
