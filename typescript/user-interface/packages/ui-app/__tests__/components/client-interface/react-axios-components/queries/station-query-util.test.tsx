import Enzyme from 'enzyme';
import * as React from 'react';

import { Queries } from '../../../../../src/ts/components/client-interface';
import { queryCache } from '../../../../../src/ts/components/client-interface/axios/queries/query-util';
import { getStationGroupsQueryConfig } from '../../../../../src/ts/components/client-interface/axios/queries/station-groups-definition-query';
import {
  useAllStationsQuery,
  useDefaultStationGroupStationQuery
} from '../../../../../src/ts/components/client-interface/axios/queries/station-query-util';
import { getStationsQueryConfig } from '../../../../../src/ts/components/client-interface/axios/queries/stations-definition-query';

jest.mock(
  '../../../../../src/ts/components/client-interface/axios/queries/station-groups-definition-query',
  () => {
    return {
      getStationGroupsQueryConfig: jest.fn()
    };
  }
);
jest.mock(
  '../../../../../src/ts/components/client-interface/axios/queries/stations-definition-query',
  () => {
    return {
      getStationsQueryConfig: jest.fn()
    };
  }
);
describe('station-query-util', () => {
  const defaultQueryCacheMock = {
    fetchQuery: jest.fn()
  };
  Object.assign(queryCache, defaultQueryCacheMock);
  it('is defined', () => {
    expect(Queries.StationQueryUtil).toBeDefined();
    expect(queryCache).toBeDefined();
  });
  it('has the useDefaultStationGroupStationQuery defined', () => {
    expect(Queries.StationQueryUtil.useDefaultStationGroupStationQuery).toBeDefined();
  });
  it('fetchDefaultStationGroupStations bails early if first query fails', async () => {
    defaultQueryCacheMock.fetchQuery.mockReturnValueOnce(null);
    const result = await Queries.StationQueryUtil.fetchDefaultStationGroupStations(0);
    expect(result).toEqual([]);
  });

  it('fetchDefaultStationGroupStations bails early if second query query fails', async () => {
    defaultQueryCacheMock.fetchQuery.mockReturnValueOnce({
      defaultInteractiveAnalysisStationGroup: 'ALL_2'
    });
    defaultQueryCacheMock.fetchQuery.mockReturnValueOnce(null);
    const result = await Queries.StationQueryUtil.fetchDefaultStationGroupStations(1);
    expect(getStationsQueryConfig).not.toBeCalled();
    expect(result).toEqual([]);
  });

  it('fetchDefaultStationGroupStations gets default station expected result', async () => {
    defaultQueryCacheMock.fetchQuery.mockReturnValueOnce({
      defaultInteractiveAnalysisStationGroup: 'ALL_2'
    });
    const mockStationGroup: unknown[] = [
      {
        description: 'description',
        effectiveAt: 'string',
        name: 'name1',
        stations: [{ name: 'name1' }, { name: 'name2' }]
      },
      {
        description: 'description',
        effectiveAt: 'string',
        name: 'name1',
        stations: [{ name: 'name3' }, { name: 'name2' }]
      }
    ];
    defaultQueryCacheMock.fetchQuery.mockReturnValueOnce(mockStationGroup);
    defaultQueryCacheMock.fetchQuery.mockReturnValueOnce([{ stations: [] }]);

    await Queries.StationQueryUtil.fetchDefaultStationGroupStations(2);
    expect(getStationsQueryConfig).toBeCalledWith(['name1', 'name2', 'name3'], 2);
    expect(getStationGroupsQueryConfig).toBeCalledWith(['ALL_2'], 2);
  });

  it('useDefaultStationGroupStationQuery is defined', () => {
    const TestComponent = () => {
      const result = useDefaultStationGroupStationQuery(0);
      return <div>{result ? 'defined' : 'undefined'}</div>;
    };
    const wrapper = Enzyme.mount(<TestComponent />);
    expect(wrapper).toBeDefined();
  });

  it('useAllStationsQuery is defined', () => {
    const TestComponent = () => {
      const result = useAllStationsQuery(0);
      return <div>{result ? 'defined' : 'undefined'}</div>;
    };
    const wrapper = Enzyme.mount(<TestComponent />);
    expect(wrapper).toBeDefined();
  });
});
