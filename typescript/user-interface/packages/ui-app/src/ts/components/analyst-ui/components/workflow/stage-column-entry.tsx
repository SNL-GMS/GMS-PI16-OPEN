import React from 'react';

import { SequenceIntervalCell } from './sequence-interval-cell';
import { StageColumnEntryProps } from './types';

/**
 * Row entry wrapper for Sequence cells
 */
// eslint-disable-next-line react/display-name
export const StageColumnEntry: React.FunctionComponent<StageColumnEntryProps> = React.memo(
  (props: StageColumnEntryProps) => {
    const { stageInterval } = props;
    return <SequenceIntervalCell stageInterval={stageInterval} key={stageInterval.name} />;
  }
);
