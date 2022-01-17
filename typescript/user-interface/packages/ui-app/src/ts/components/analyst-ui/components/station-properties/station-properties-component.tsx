import { CommonTypes, ConfigurationTypes } from '@gms/common-model';
import { toOSDTime } from '@gms/common-util';
import { AppState } from '@gms/ui-state';
import React from 'react';
import { useSelector } from 'react-redux';

import { BaseDisplay } from '~common-ui/components/base-display';
import { Queries } from '~components/client-interface';

import {
  nonIdealStateEmptyEffectiveAtsQuery,
  nonIdealStateLoadingEffectiveAtsQuery,
  nonIdealStateNoOperationalTimePeriod,
  nonIdealStateSelectAStation,
  nonIdealStateTooManyStationsSelected
} from './station-properties-non-ideal-states';
import { StationPropertiesPanel } from './station-properties-panel';
import { StationPropertiesComponentProps } from './types';

export const StationPropertiesComponent: React.FunctionComponent<StationPropertiesComponentProps> = (
  props: StationPropertiesComponentProps
) => {
  const { glContainer } = props;

  const unfilteredSelectedStations = useSelector(
    (state: AppState) => state.commonWorkspaceState?.selectedStationIds
  );
  // Query the operational time period and adjust the time range
  const operationalTimeQuery = Queries.OperationalTimePeriodConfigurationQuery.useOperationalTimePeriodConfigurationQuery();
  const operationalTimePeriod: ConfigurationTypes.OperationalTimePeriodConfiguration =
    operationalTimeQuery?.data;
  const analystConfigurationQuery = Queries.ProcessingAnalystConfigurationQuery.useProcessingAnalystConfigurationQuery();
  const analystConfiguration: ConfigurationTypes.ProcessingAnalystConfiguration =
    analystConfigurationQuery?.data;

  const operationalTimeRange: CommonTypes.TimeRange = {
    startTimeSecs:
      analystConfiguration?.currentIntervalEndTime -
      operationalTimePeriod?.operationalPeriodStartSecs,
    endTimeSecs:
      analystConfiguration?.currentIntervalEndTime - operationalTimePeriod?.operationalPeriodEndSecs
  };

  // TODO Instead of filtering on a string we need to update the selected station IDs
  // TODO to be objects with a type field
  const selectedStations = unfilteredSelectedStations.filter((item: string) => !item.includes('.'));
  const effectiveAtTimes: string[] = Queries.StationsChangeTimesQuery.useStationsEffectiveAtTimesQuery(
    selectedStations[0],
    toOSDTime(operationalTimeRange.startTimeSecs),
    toOSDTime(operationalTimeRange.endTimeSecs)
  )?.data;
  if (selectedStations.length < 1) {
    return nonIdealStateSelectAStation;
  }
  if (selectedStations.length > 1) {
    return nonIdealStateTooManyStationsSelected;
  }
  if (!operationalTimeRange.startTimeSecs || !operationalTimeRange.endTimeSecs) {
    return nonIdealStateNoOperationalTimePeriod;
  }
  if (!effectiveAtTimes) {
    return nonIdealStateLoadingEffectiveAtsQuery;
  }
  if (effectiveAtTimes.length <= 0) {
    return nonIdealStateEmptyEffectiveAtsQuery;
  }
  return (
    <BaseDisplay glContainer={glContainer} className="station-properties-display-window">
      <StationPropertiesPanel
        selectedStation={selectedStations[0]}
        effectiveAtTimes={effectiveAtTimes}
      />
    </BaseDisplay>
  );
};
