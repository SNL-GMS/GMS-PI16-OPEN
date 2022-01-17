import { shallow } from 'enzyme';

import {
  nonIdealStateSelectAStation,
  nonIdealStateSelectChannelGroupRow,
  nonIdealStateTooManyStationsSelected
} from '../../../../../src/ts/components/analyst-ui/components/station-properties/station-properties-non-ideal-states';

describe('station-properties non ideal states', () => {
  test('can mount', () => {
    expect(nonIdealStateSelectAStation).toBeDefined();
    expect(nonIdealStateTooManyStationsSelected).toBeDefined();
    expect(nonIdealStateSelectChannelGroupRow).toBeDefined();
  });
  test('match snapshots for nonIdealStateSelectAStation', () => {
    const wrapper = shallow(nonIdealStateSelectAStation);
    expect(wrapper).toMatchSnapshot();
  });
  test('match snapshots for nonIdealStateTooManyStationsSelected', () => {
    const wrapper = shallow(nonIdealStateTooManyStationsSelected);
    expect(wrapper).toMatchSnapshot();
  });
  test('match snapshots for nonIdealStateSelectChannelGroupRow', () => {
    const wrapper = shallow(nonIdealStateSelectChannelGroupRow);
    expect(wrapper).toMatchSnapshot();
  });
});
