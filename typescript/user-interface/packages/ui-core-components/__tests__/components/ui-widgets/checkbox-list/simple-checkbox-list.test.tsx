import React from 'react';

import {
  SimpleCheckboxList,
  SimpleCheckboxListProps
} from '../../../../src/ts/components/ui-widgets/checkbox-list';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('SimpleCheckboxList', () => {
  it('is exported and renders with empty checkBoxListEntries', () => {
    const simpleCheckboxList: SimpleCheckboxListProps = {
      checkBoxListEntries: []
    };
    // eslint-disable-next-line react/jsx-props-no-spreading
    const mockSimpleCheckboxList = Enzyme.shallow(<SimpleCheckboxList {...simpleCheckboxList} />);
    expect(SimpleCheckboxList).toBeDefined();
    expect(mockSimpleCheckboxList).toMatchSnapshot();
  });
  it('renders with checkBoxListEntries', () => {
    const simpleCheckboxList: SimpleCheckboxListProps = {
      checkBoxListEntries: [
        { name: 'Station 0', isChecked: true },
        { name: 'Station 1', isChecked: false },
        { name: 'Station 2', isChecked: true }
      ]
    };
    // eslint-disable-next-line react/jsx-props-no-spreading
    const mockSimpleCheckboxList = Enzyme.shallow(<SimpleCheckboxList {...simpleCheckboxList} />);
    expect(mockSimpleCheckboxList).toMatchSnapshot();
  });
});
