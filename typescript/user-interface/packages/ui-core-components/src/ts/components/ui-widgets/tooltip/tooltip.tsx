/* eslint-disable react/destructuring-assignment */
import { PopoverPosition, Tooltip } from '@blueprintjs/core';
import * as React from 'react';

import { TooltipProps } from './types';

export const WithTooltip: <T extends {
  position: PopoverPosition;
  wrapperTagName: JSX.IntrinsicElements;
  targetTagName: JSX.IntrinsicElements;
}>(
  TheComponent: React.FunctionComponent<T>,
  message: string
) => React.FunctionComponent<TooltipProps<T>> = (
  TheComponent: React.FunctionComponent,
  message: string
  // eslint-disable-next-line react/display-name
) => props => {
  // eslint-disable-next-line react/prop-types
  const { position, wrapperTagName, targetTagName, ...rest } = props;
  return (
    <Tooltip
      content={message}
      position={position || PopoverPosition.BOTTOM}
      wrapperTagName={wrapperTagName}
      targetTagName={targetTagName}
    >
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <TheComponent {...rest} />
    </Tooltip>
  );
};

export const TooltipWrapper = <T,>(
  props: React.PropsWithChildren<TooltipProps<T>>
): JSX.Element => (
  <Tooltip
    className={props.className || 'core-tooltip'}
    targetClassName={props.targetClassName || 'core-tooltip__target'}
    content={props.content}
    position={props.position || PopoverPosition.BOTTOM}
    wrapperTagName={props.wrapperTagName || 'div'}
    targetTagName={props.targetTagName || 'div'}
    hoverOpenDelay={300}
    boundary="window"
  >
    {props.children}
  </Tooltip>
);
