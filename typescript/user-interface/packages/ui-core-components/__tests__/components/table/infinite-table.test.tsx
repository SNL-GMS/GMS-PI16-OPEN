import React from 'react';

import { InfiniteTable, InfiniteTableProps } from '../../../src/ts/components/table/infinite-table';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('Infinite Table', () => {
  const infiniteTable: InfiniteTableProps<undefined, undefined> = {
    rowCount: 10,
    datasource: undefined
  };
  // eslint-disable-next-line react/jsx-props-no-spreading
  const mockInfiniteTable = Enzyme.shallow(<InfiniteTable {...infiniteTable} />);
  it('is exported', () => {
    expect(InfiniteTable).toBeDefined();
  });
  it('Renders', () => {
    expect(mockInfiniteTable).toMatchSnapshot();
  });
});
