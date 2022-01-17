/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import React from 'react';

import { LabelValueProps } from './types';

export const LabelValue: React.FunctionComponent<LabelValueProps> = props => {
  const containerClass = props.ianApp ? 'ian-label-value-container' : 'label-value-container';
  const labelClass = props.ianApp ? 'ian-label-value__label' : 'label-value__label';
  const valueClass = props.ianApp ? 'ian-label-value__value' : 'label-value__value';
  const customContainerClass = `${containerClass} ${
    props.containerClass ? props.containerClass : ''
  }`;
  return (
    <div className={props.containerClass ? customContainerClass : containerClass}>
      <div className={labelClass}>
        {props.label && props.label.length > 0 ? `${props.label}: ` : ''}
      </div>
      <div
        title={props.tooltip}
        className={valueClass}
        style={{
          color: props.valueColor ? props.valueColor : '',
          ...props.styleForValue
        }}
      >
        {props.value}
      </div>
    </div>
  );
};
