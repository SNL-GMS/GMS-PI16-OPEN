import classNames from 'classnames';
import React from 'react';

import { WorkflowRowLabelProps } from './types';

export const WorkflowRowLabel: React.FunctionComponent<WorkflowRowLabelProps> = (
  props: WorkflowRowLabelProps
) => {
  const { label, isActivityRow } = props;
  return (
    <div
      key={label}
      className={classNames('workflow-table-label', {
        'workflow-table-label--activity': isActivityRow
      })}
    >
      <div>{label}</div>
    </div>
  );
};
