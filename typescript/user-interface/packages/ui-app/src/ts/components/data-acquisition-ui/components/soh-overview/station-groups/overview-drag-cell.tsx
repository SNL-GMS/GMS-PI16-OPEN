/* eslint-disable react/prop-types */
import * as React from 'react';

import { DragCell } from '~components/data-acquisition-ui/shared/table/drag-cell';

import { SohOverviewContext, SohOverviewContextData } from '../soh-overview-context';

const cellClass = 'soh-overview-cell';

export interface OverviewDragCellProps {
  stationId: string;
}

export const getSingleDragImage = (e: React.DragEvent): HTMLElement => {
  if (e.target instanceof Element) {
    return e.target.querySelector(`.${cellClass}`);
  }
  return undefined;
};

export const getSelectedIds = (context: SohOverviewContextData) => (): string[] =>
  context.selectedStationIds;

export const OverviewDragCell: React.FunctionComponent<React.PropsWithChildren<
  OverviewDragCellProps
>> = ({ stationId, children }) => {
  const context = React.useContext(SohOverviewContext);
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { setSelectedStationIds } = context;
  return (
    <DragCell
      getSelectedStationIds={getSelectedIds(context)}
      setSelectedStationIds={setSelectedStationIds}
      stationId={stationId}
      getSingleDragImage={getSingleDragImage}
    >
      {children}
    </DragCell>
  );
};
