/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import * as React from 'react';

export interface StationDeselectHandlerProps {
  className?: string;
  dataCy?: string;
  setSelectedStationIds(ids: string[]): void;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const keyDown = (
  e: React.KeyboardEvent<HTMLDivElement>,
  props: StationDeselectHandlerProps
) => {
  if (e.nativeEvent.code === 'Escape') {
    props.setSelectedStationIds([]);
  }
};

export const StationDeselectHandler: React.FunctionComponent<React.PropsWithChildren<
  StationDeselectHandlerProps
>> = props => (
  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
  <div
    className={`deselect-handler ${props.className ?? ''}`}
    onKeyDown={e => keyDown(e, props)}
    data-cy={props.dataCy}
  >
    {props.children}
  </div>
);
