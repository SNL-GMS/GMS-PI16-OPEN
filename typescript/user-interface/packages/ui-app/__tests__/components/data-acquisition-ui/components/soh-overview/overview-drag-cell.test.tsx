import React from 'react';

import {
  SohOverviewContext,
  SohOverviewContextData
} from '../../../../../src/ts/components/data-acquisition-ui/components/soh-overview/soh-overview-context';
import {
  getSelectedIds,
  getSingleDragImage,
  OverviewDragCell,
  OverviewDragCellProps
} from '../../../../../src/ts/components/data-acquisition-ui/components/soh-overview/station-groups/overview-drag-cell';
import { testStationSoh } from '../../../../__data__/data-acquisition-ui/soh-overview-data';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

const glContainer: any = { isHidden: false };
const contextValues: SohOverviewContextData = {
  glContainer,
  stationGroupSoh: [],
  stationSoh: [testStationSoh],
  selectedStationIds: ['test', 'test2'],
  sohStationStaleTimeMS: 100,
  updateIntervalSecs: 5,
  quietTimerMs: 5,
  setSelectedStationIds: jest.fn(),
  acknowledgeSohStatus: jest.fn()
};
describe('Overview Drag Cell', () => {
  const dragCellProps: OverviewDragCellProps = {
    stationId: 'AAA'
  };

  // eslint-disable-next-line react/jsx-props-no-spreading
  const wrapper = Enzyme.mount(
    <SohOverviewContext.Provider value={contextValues}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <OverviewDragCell {...dragCellProps} />
    </SohOverviewContext.Provider>
  );

  it('is defined', () => {
    expect(wrapper).toBeDefined();
  });
  it('can render and match snapshot', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('can handle getSingleDragImage', () => {
    const element: any = {
      target: document.createElement('div')
    };
    const result = getSingleDragImage(element);
    expect(result).toBeNull();
  });

  it('can handle getSingleDragImage and return undefined', () => {
    const element: any = {
      target: 'notAnElement'
    };
    const result = getSingleDragImage(element);
    expect(result).toBeUndefined();
  });

  it('can handle getSelectedIds', () => {
    const result = getSelectedIds(contextValues)();
    expect(result).toEqual(['test', 'test2']);
  });
});
