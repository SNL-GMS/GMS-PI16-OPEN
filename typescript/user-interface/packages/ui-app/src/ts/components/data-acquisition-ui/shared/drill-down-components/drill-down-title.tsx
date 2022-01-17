/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import * as React from 'react';

import { DrillDownTitleProps } from './types';

export const DrillDownTitle: React.FunctionComponent<DrillDownTitleProps> = props => (
  <div className="soh-drill-down-station-label display-title">
    {props.title}
    <div className="display-title__subtitle">
      {props.subtitle}
      {props.description ? ` (${props.description})` : ''}
    </div>
  </div>
);
