import { Classes, Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { WorkflowTypes } from '@gms/common-model';
import { SECONDS_IN_HOUR } from '@gms/common-util';
import { MILLISECONDS_IN_SECOND } from '@gms/common-util/src/ts/util/time-util';
import {
  DateRangePicker,
  DropDown,
  ModalPrompt,
  nonIdealStateWithSpinner
} from '@gms/ui-core-components';
import { useInterval } from '@gms/ui-util';
import React, { useEffect, useState } from 'react';

import { useWorkflowQuery } from '~analyst-ui/client-interface/axios/queries/workflow-query';
import { Queries } from '~components/client-interface';
import { useProcessingAnalystConfigurationQuery } from '~components/client-interface/axios/queries/processing-analyst-configuration-query';
import { useProcessingStationGroupNamesConfigurationQuery } from '~components/client-interface/axios/queries/processing-station-group-names-configuration-query';

import { WorkflowContext } from '../../workflow-context';
import { OpenAnythingDialogProps } from './types';

const OpenAnythingDialogComponent: React.FunctionComponent<OpenAnythingDialogProps> = (
  props: OpenAnythingDialogProps
) => {
  const operationalTimeQuery = Queries.OperationalTimePeriodConfigurationQuery.useOperationalTimePeriodConfigurationQuery();
  const configurationQuery = useProcessingAnalystConfigurationQuery();

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { isVisible, onOpen, onCancel } = props;

  // Round down to the last hour
  const roundedNow = new Date(Date.now());
  roundedNow.setHours(roundedNow.getHours(), 0, 0, 0);

  // Use the maximum Range if it exists
  let initialConfiguredStartTime =
    roundedNow.getTime() -
    operationalTimeQuery.data.operationalPeriodStartSecs * MILLISECONDS_IN_SECOND;

  if (configurationQuery.data.maximumOpenAnythingDuration) {
    initialConfiguredStartTime =
      roundedNow.getTime() -
      operationalTimeQuery.data.operationalPeriodEndSecs * MILLISECONDS_IN_SECOND -
      configurationQuery.data.maximumOpenAnythingDuration * MILLISECONDS_IN_SECOND;
  }

  const [initialIntervalStartTimeMs, initialIntervalEndTimeMs] = useInterval(
    initialConfiguredStartTime,
    roundedNow.getTime() -
      operationalTimeQuery.data.operationalPeriodEndSecs * MILLISECONDS_IN_SECOND
  );

  const [intervalStartTimeMs, intervalEndTimeMs, setInterval] = useInterval(
    initialIntervalStartTimeMs,
    initialIntervalEndTimeMs
  );

  const [errorMessage, setErrorMessage] = useState('');
  const [openDisabled, setOpenDisabled] = useState(true);

  useEffect(() => {
    if (
      intervalStartTimeMs +
        configurationQuery.data.maximumOpenAnythingDuration * MILLISECONDS_IN_SECOND <
      intervalEndTimeMs
    ) {
      const numHours = configurationQuery.data.maximumOpenAnythingDuration / SECONDS_IN_HOUR;
      setErrorMessage(`Time Range exceeds maximum range of ${numHours} hours`);
      setOpenDisabled(true);
    } else if (intervalStartTimeMs >= intervalEndTimeMs) {
      setErrorMessage('Start date overlaps end date');
      setOpenDisabled(true);
    } else if (
      intervalStartTimeMs <
      Date.now() - operationalTimeQuery.data.operationalPeriodStartSecs * MILLISECONDS_IN_SECOND
    ) {
      setErrorMessage('Start date is outside of operation time range');
      setOpenDisabled(true);
    } else if (
      intervalEndTimeMs >
      Date.now() - operationalTimeQuery.data.operationalPeriodEndSecs * MILLISECONDS_IN_SECOND
    ) {
      setErrorMessage('End date is outside of operation time range');
      setOpenDisabled(true);
    } else {
      setErrorMessage('');
      setOpenDisabled(false);
    }
  }, [
    intervalStartTimeMs,
    intervalEndTimeMs,
    operationalTimeQuery.data.operationalPeriodEndSecs,
    operationalTimeQuery.data.operationalPeriodStartSecs,
    configurationQuery.data.maximumOpenAnythingDuration
  ]);

  useEffect(() => {
    if (isVisible) {
      // Blueprint resets the display if you reopen the popup
      // So reset the underlying state as well
      setInterval(initialIntervalStartTimeMs, initialIntervalEndTimeMs);
    }
    // can't actually depend on setInterval or it loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  const workflow = useWorkflowQuery();
  const processingStageList: string[] =
    workflow?.data?.stages
      ?.filter(stage => stage.mode === WorkflowTypes.StageMode.INTERACTIVE)
      .map(stage => stage.name) ?? [];

  const stationGroupNamesQuery = useProcessingStationGroupNamesConfigurationQuery();

  const stationGroupsQuery = Queries.StationGroupQuery.useStationGroupQuery(
    stationGroupNamesQuery?.data?.stationGroupNames,
    initialIntervalEndTimeMs / MILLISECONDS_IN_SECOND
  );

  const stationGroupList = stationGroupsQuery.data?.map(stationGroup => stationGroup.name) ?? [];

  const [selectedProcessingStage, setProcessingStage] = useState(processingStageList[0]);

  const [selectedStationGroup, setStationGroup] = useState(
    ((workflow?.data?.stages?.filter(
      stage => stage.name === processingStageList[0]
    )[0] as unknown) as WorkflowTypes.InteractiveAnalysisStage).activities[0]?.stationGroup?.name ||
      undefined
  );

  const context = React.useContext(WorkflowContext);

  return (
    <ModalPrompt
      actionText="Open"
      actionCallback={() => {
        context.openAnythingConfirmationPrompt({
          timeRange: {
            startTimeSecs: intervalStartTimeMs / MILLISECONDS_IN_SECOND,
            endTimeSecs: intervalEndTimeMs / MILLISECONDS_IN_SECOND
          },
          stationGroup:
            stationGroupsQuery.data.find(
              stationGroup => stationGroup.name === selectedStationGroup
            ) || stationGroupsQuery.data[0],
          openIntervalName: selectedProcessingStage || processingStageList[0]
        });
        onOpen();
      }}
      cancelText="Cancel"
      cancelButtonCallback={onCancel}
      onCloseCallback={onCancel}
      isOpen={isVisible}
      title="Open Anything"
      actionTooltipText="Open"
      cancelTooltipText="Cancel"
      actionDisabled={openDisabled}
    >
      <div className="open-anything-contents">
        {/* eslint-disable-next-line no-nested-ternary */}
        {!isVisible ? undefined : stationGroupNamesQuery.isLoading ||
          stationGroupsQuery.isLoading ? (
          nonIdealStateWithSpinner('Loading', 'Station Group Configuration')
        ) : (
          <>
            <DateRangePicker
              maxSelectedRangeMs={
                configurationQuery.data.maximumOpenAnythingDuration
                  ? configurationQuery.data.maximumOpenAnythingDuration * MILLISECONDS_IN_SECOND
                  : undefined
              }
              startTimeMs={initialIntervalStartTimeMs}
              endTimeMs={initialIntervalEndTimeMs}
              minStartTimeMs={
                roundedNow.getTime() -
                operationalTimeQuery.data.operationalPeriodStartSecs * MILLISECONDS_IN_SECOND
              }
              maxEndTimeMs={
                roundedNow.getTime() -
                operationalTimeQuery.data.operationalPeriodEndSecs * MILLISECONDS_IN_SECOND
              }
              onNewInterval={setInterval}
            />
            <DropDown
              className={Classes.FILL}
              displayLabel
              label="Processing Stage"
              dropDownItems={processingStageList}
              value={selectedProcessingStage}
              title="Select processing stage"
              onMaybeValue={(value: any) => {
                setProcessingStage(value);
                setStationGroup(
                  ((workflow?.data?.stages?.filter(
                    stage => stage.name === value
                  )[0] as unknown) as WorkflowTypes.InteractiveAnalysisStage).activities[0]
                    .stationGroup.name
                );
              }}
            />
            <DropDown
              className={Classes.FILL}
              displayLabel
              label="Station Group"
              dropDownItems={stationGroupList}
              value={selectedStationGroup}
              title="Select station group"
              onMaybeValue={(value: any) => {
                setStationGroup(value);
              }}
            />
            <div className="open-anything-error">
              <Icon
                icon={openDisabled ? IconNames.ERROR : null}
                className="open-anything-error-icon"
                iconSize={16}
              />
              <div className="open-anything-error-text"> {errorMessage} </div>
            </div>
          </>
        )}
      </div>
    </ModalPrompt>
  );
};

export const OpenAnythingDialog = React.memo(OpenAnythingDialogComponent);
