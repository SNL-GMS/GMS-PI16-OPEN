import { SohTypes } from '@gms/common-model';
import { uuid } from '@gms/common-util';
import React from 'react';

import {
  SohOverviewContext,
  SohOverviewContextData
} from '../../../../../src/ts/components/data-acquisition-ui/components/soh-overview/soh-overview-context';
import {
  generateSohStationGroupMap,
  StationGroupsLayout
} from '../../../../../src/ts/components/data-acquisition-ui/components/soh-overview/station-groups/station-groups-layout';
import { stationAndStationGroupSohStatus } from '../../../../__data__/data-acquisition-ui/soh-overview-data';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

// eslint-disable-next-line import/no-deprecated
const lodash = jest.requireActual('lodash');
lodash.uniqueId = () => '1';

const contextValues: SohOverviewContextData = {
  stationSoh: stationAndStationGroupSohStatus.stationSoh,
  stationGroupSoh: stationAndStationGroupSohStatus.stationGroups,
  acknowledgeSohStatus: jest.fn(),
  glContainer: undefined,
  quietTimerMs: 5000,
  updateIntervalSecs: 5,
  selectedStationIds: [],
  setSelectedStationIds: jest.fn(),
  sohStationStaleTimeMS: 30000
};

const statusesToDisplay: SohTypes.SohStatusSummary[] = [
  SohTypes.SohStatusSummary.GOOD,
  SohTypes.SohStatusSummary.MARGINAL,
  SohTypes.SohStatusSummary.BAD
];

describe('Soh station groups layout', () => {
  let idCount = 0;
  // eslint-disable-next-line no-plusplus
  uuid.asString = jest.fn().mockImplementation(() => ++idCount);
  it('should be defined', () => {
    expect(StationGroupsLayout).toBeDefined();
  });
  const sohGrid = Enzyme.mount(
    <SohOverviewContext.Provider value={contextValues}>
      <StationGroupsLayout
        statusesToDisplay={statusesToDisplay}
        isHighlighted
        stationGroupsToDisplay={contextValues.stationGroupSoh.map(
          stationGroup => stationGroup.stationGroupName
        )}
      />
    </SohOverviewContext.Provider>
  );
  it('matches the snapshot when provided with a context', () => {
    expect(sohGrid).toMatchSnapshot();
  });

  it('can generate the SohStationGroupMap', () => {
    const stationGroupMap = generateSohStationGroupMap(
      true,
      contextValues.stationGroupSoh,
      contextValues.stationSoh,
      statusesToDisplay
    );
    expect(stationGroupMap).toBeDefined();
    expect(stationGroupMap).toMatchSnapshot();
  });

  const sohGridShowingNoGroups = Enzyme.mount(
    <SohOverviewContext.Provider value={contextValues}>
      <StationGroupsLayout
        statusesToDisplay={statusesToDisplay}
        isHighlighted
        stationGroupsToDisplay={[]}
      />
    </SohOverviewContext.Provider>
  );

  it('matches the snapshot when provided with no station groups to display', () => {
    expect(sohGridShowingNoGroups).toMatchSnapshot();
  });
});
