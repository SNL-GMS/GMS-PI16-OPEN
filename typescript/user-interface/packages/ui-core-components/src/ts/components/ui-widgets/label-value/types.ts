import React from 'react';

/**
 * app determines the default styling for the label-value toolbar item, defaults to soh
 */
export interface LabelValueProps {
  value: string;
  label: string;
  tooltip: string;
  valueColor?: string;
  ianApp?: boolean;
  styleForValue?: React.CSSProperties;
  containerClass?: string;
}
