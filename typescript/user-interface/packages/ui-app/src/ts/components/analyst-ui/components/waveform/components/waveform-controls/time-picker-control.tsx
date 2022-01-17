import { CommonTypes, ConfigurationTypes } from '@gms/common-model';
import { ToolbarTypes } from '@gms/ui-core-components';
import { AppState, WorkflowActions } from '@gms/ui-state';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useTimePicker } from '~common-ui/common/time-picker-control';
import { Queries } from '~components/client-interface';

export const useWaveformTimePickerControl = (rank: number): ToolbarTypes.ToolbarItem => {
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

  const currentInterval = useSelector(
    (state: AppState) => state.analystWorkspaceState?.workflowState?.timeRange
  );
  const [selectedInterval, timePicker] = useTimePicker(
    currentInterval,
    'Current Interval',
    'Set start and end times',
    rank,
    undefined,
    operationalTimeRange
  );

  const dispatch = useDispatch();
  React.useEffect(() => {
    if (selectedInterval.startTimeSecs && selectedInterval.endTimeSecs) {
      dispatch(
        WorkflowActions.setTimeRange({
          startTimeSecs: selectedInterval.startTimeSecs,
          endTimeSecs: selectedInterval.endTimeSecs
        })
      );
    }
  }, [selectedInterval.startTimeSecs, selectedInterval.endTimeSecs, dispatch]);
  return timePicker;
};
