import { IconNames } from '@blueprintjs/icons';
import {
  MILLISECONDS_IN_DAY,
  MILLISECONDS_IN_SECOND,
  MILLISECONDS_IN_WEEK,
  secondsToString,
  splitMillisIntoTimeUnits,
  timeUnitsToString
} from '@gms/common-util';
import { Toolbar, ToolbarTypes } from '@gms/ui-core-components';
import { AppState } from '@gms/ui-state';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { useBaseDisplaySize } from '~common-ui/components/base-display/base-display-hooks';

import { OpenAnythingDialog } from './components/open-anything-dialog';
import { WorkflowToolbarProps } from './types';

const marginForToolbarPx = 40;

// eslint-disable-next-line react/display-name
export const WorkflowToolbar: React.FunctionComponent<WorkflowToolbarProps> = React.memo(
  (props: WorkflowToolbarProps) => {
    const { onPan } = props;

    const [widthPx] = useBaseDisplaySize();

    const timeRange = useSelector(
      (state: AppState) => state.analystWorkspaceState.workflowState.timeRange
    );
    const openIntervalName = useSelector(
      (state: AppState) => state.analystWorkspaceState.workflowState.openIntervalName
    );

    const [isOpenAnythingDialogVisible, setOpenAnythingDialogVisible] = useState(false);

    const showOpenAnythingDialog = () => {
      setOpenAnythingDialogVisible(true);
    };

    const onOpenAnythingDialog = () => {
      setOpenAnythingDialogVisible(false);
    };

    const onCancelAnythingDialog = () => {
      setOpenAnythingDialogVisible(false);
    };

    /*
     * Left toolbar items
     */
    const leftToolbarItemDefs: ToolbarTypes.ToolbarItem[] = [];

    const hasTimeRangeAndProcessingStage =
      timeRange?.startTimeSecs !== undefined &&
      timeRange?.startTimeSecs !== null &&
      timeRange?.endTimeSecs !== undefined &&
      timeRange?.endTimeSecs !== null &&
      openIntervalName !== undefined &&
      openIntervalName !== null;

    const timeRangeStr = hasTimeRangeAndProcessingStage
      ? `${secondsToString(timeRange.startTimeSecs)}  to  ${secondsToString(timeRange.endTimeSecs)}`
      : 'N/A';

    const openIntervalNameStr = hasTimeRangeAndProcessingStage ? openIntervalName : 'N/A';

    const openTimeRangeItem: ToolbarTypes.LabelValueItem = {
      rank: leftToolbarItemDefs.length,
      type: ToolbarTypes.ToolbarItemType.LabelValue,
      label: 'Open time range',
      tooltip: 'The opened time range',
      tooltipForIssue: undefined,
      hasIssue: false,
      widthPx: 400,
      style: { marginLeft: '1em' },
      value: timeRangeStr
    };
    leftToolbarItemDefs.push(openTimeRangeItem);

    const processingStageItem: ToolbarTypes.LabelValueItem = {
      rank: leftToolbarItemDefs.length,
      type: ToolbarTypes.ToolbarItemType.LabelValue,
      label: 'Processing stage',
      tooltip: 'The opened processing stage',
      tooltipForIssue: undefined,
      hasIssue: false,
      widthPx: 400,
      style: { marginLeft: '8em' },
      value: openIntervalNameStr
    };
    leftToolbarItemDefs.push(processingStageItem);

    /*
     * Right toolbar items
     */

    const rightToolbarItemDefs: ToolbarTypes.ToolbarItem[] = [];

    const doubleLeftArrowItem: ToolbarTypes.ButtonItem = {
      rank: rightToolbarItemDefs.length,
      type: ToolbarTypes.ToolbarItemType.Button,
      cyData: 'workflow-doubleLeftArrowItem',
      onlyShowIcon: true,
      icon: IconNames.DOUBLE_CHEVRON_LEFT,
      widthPx: 20,
      // TODO WORKFLOW  retrieve pan value from configuration
      tooltip: `Pan the workflow to the left by ${timeUnitsToString(
        splitMillisIntoTimeUnits(MILLISECONDS_IN_WEEK)
      )}`,
      onClick: () => onPan(-(MILLISECONDS_IN_WEEK / MILLISECONDS_IN_SECOND))
    };
    rightToolbarItemDefs.push(doubleLeftArrowItem);

    const singleLeftArrowItem: ToolbarTypes.ButtonItem = {
      rank: rightToolbarItemDefs.length,
      type: ToolbarTypes.ToolbarItemType.Button,
      cyData: 'workflow-singleLeftArrowItem',
      onlyShowIcon: true,
      icon: IconNames.CHEVRON_LEFT,
      widthPx: 20,
      // TODO WORKFLOW  retrieve pan value from configuration
      tooltip: `Pan the workflow to the left by ${timeUnitsToString(
        splitMillisIntoTimeUnits(MILLISECONDS_IN_DAY)
      )}`,
      onClick: () => onPan(-(MILLISECONDS_IN_DAY / MILLISECONDS_IN_SECOND))
    };
    rightToolbarItemDefs.push(singleLeftArrowItem);

    const singleRightArrowItem: ToolbarTypes.ButtonItem = {
      rank: rightToolbarItemDefs.length,
      type: ToolbarTypes.ToolbarItemType.Button,
      cyData: 'workflow-singleRightArrowItem',
      onlyShowIcon: true,
      icon: IconNames.CHEVRON_RIGHT,
      widthPx: 20,
      // TODO WORKFLOW  retrieve pan value from configuration
      tooltip: `Pan the workflow to the right by ${timeUnitsToString(
        splitMillisIntoTimeUnits(MILLISECONDS_IN_DAY)
      )}`,
      onClick: () => onPan(MILLISECONDS_IN_DAY / MILLISECONDS_IN_SECOND)
    };
    rightToolbarItemDefs.push(singleRightArrowItem);

    const doubleRightArrowItem: ToolbarTypes.ButtonItem = {
      rank: rightToolbarItemDefs.length,
      type: ToolbarTypes.ToolbarItemType.Button,
      cyData: 'workflow-doubleRightArrowItem',
      onlyShowIcon: true,
      icon: IconNames.DOUBLE_CHEVRON_RIGHT,
      widthPx: 20,
      // TODO WORKFLOW  retrieve pan value from configuration
      tooltip: `Pan the workflow to the right by ${timeUnitsToString(
        splitMillisIntoTimeUnits(MILLISECONDS_IN_WEEK)
      )}`,
      onClick: () => onPan(MILLISECONDS_IN_WEEK / MILLISECONDS_IN_SECOND)
    };
    rightToolbarItemDefs.push(doubleRightArrowItem);

    const openAnythingItem: ToolbarTypes.ButtonItem = {
      rank: rightToolbarItemDefs.length,
      type: ToolbarTypes.ToolbarItemType.Button,
      labelRight: 'Open anything...',
      cyData: 'workflow-openAnythingItem',
      onlyShowIcon: false,
      icon: IconNames.SEARCH_TEMPLATE,
      tooltip: 'Open anything',
      widthPx: 160,
      onClick: showOpenAnythingDialog
    };
    rightToolbarItemDefs.push(openAnythingItem);

    return (
      <>
        <Toolbar
          toolbarWidthPx={widthPx - marginForToolbarPx}
          items={rightToolbarItemDefs}
          minWhiteSpacePx={1}
          itemsLeft={leftToolbarItemDefs}
        />
        <OpenAnythingDialog
          isVisible={isOpenAnythingDialogVisible}
          onOpen={onOpenAnythingDialog}
          onCancel={onCancelAnythingDialog}
        />
      </>
    );
  }
);
