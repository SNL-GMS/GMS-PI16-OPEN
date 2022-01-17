import React from 'react';

import { ActivityIntervalCell } from './activity-interval-cell';
import { ActivityColumnEntryProps } from './types';

/**
 * Row entry wrapper for ActivityInterval cells
 */
// eslint-disable-next-line react/display-name
export const ActivityColumnEntry: React.FunctionComponent<ActivityColumnEntryProps> = React.memo(
  (props: ActivityColumnEntryProps) => {
    const { activityInterval } = props;
    return <ActivityIntervalCell activityInterval={activityInterval} key={activityInterval.name} />;
  }
);
