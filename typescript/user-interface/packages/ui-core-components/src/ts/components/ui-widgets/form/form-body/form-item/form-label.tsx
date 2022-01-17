/* eslint-disable react/destructuring-assignment */
/*
FormLabel renders the formitem's label
*/
import React from 'react';

/**
 * FormLabel Props
 */
export interface FormLabelProps {
  text: string;
  fontSizeEm: number;
  hideColon?: boolean;
  modified: boolean;
  widthEm: number;
}

/**
 * FormLabel component.
 */
export class FormLabel extends React.PureComponent<FormLabelProps> {
  /**
   * React component lifecycle.
   */
  public render(): JSX.Element {
    /*
     */
    const fontSizeEm = `${this.props.fontSizeEm.toString()}em`;
    const widthEm = `${this.props.widthEm.toString()}em`;
    return (
      <div className="form-label" style={{ fontSize: fontSizeEm, minWidth: widthEm }}>
        {/* eslint-disable-next-line no-nested-ternary */}
        {this.props.modified
          ? `${this.props.text}*`
          : this.props.hideColon
          ? this.props.text
          : `${this.props.text}:`}
      </div>
    );
  }
}
