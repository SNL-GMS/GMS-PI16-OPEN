/* eslint-disable react/destructuring-assignment */
import React from 'react';

// !FIX ESLINT CIRCULAR DEPENDENCY
// eslint-disable-next-line import/no-cycle
import { TextFormats } from '../../types';

/**
 * Props for form text display
 */
export interface FormDisplayTextProps {
  displayText: string;
  tooltip?: string;
  formatAs?: TextFormats;
  widthPx: number;
}
/**
 * Displays text for Form
 */
export class FormDisplayText extends React.PureComponent<FormDisplayTextProps, unknown> {
  /**
   * Renders the component
   */
  public render(): JSX.Element {
    const className =
      this.props.formatAs === TextFormats.Time
        ? 'form-value form-value--uneditable form-value--time'
        : 'form-value form-value--uneditable';
    return (
      <div
        className={className}
        style={{ width: `${this.props.widthPx}px` }}
        title={this.props.tooltip}
      >
        {this.props.displayText}
      </div>
    );
  }
}
