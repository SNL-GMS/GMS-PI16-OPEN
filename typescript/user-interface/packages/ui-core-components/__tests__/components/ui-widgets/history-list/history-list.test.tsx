/* eslint-disable react/jsx-props-no-spreading */
import * as Enzyme from 'enzyme';
import * as React from 'react';

import { HistoryList } from '../../../../src/ts/components/ui-widgets/history-list';
import * as HistoryListTypes from '../../../../src/ts/components/ui-widgets/history-list/types';

const historyListItem: HistoryListTypes.HistoryListItem = {
  index: 0,
  label: 'item',
  id: '1'
};

const props: HistoryListTypes.HistoryListProps = {
  items: [historyListItem],
  preferredItems: [historyListItem],
  listLength: 1,
  onSelect: jest.fn()
};

const wrapper = Enzyme.mount(<HistoryList {...props} />);

const props2: HistoryListTypes.HistoryListProps = {
  items: [historyListItem],
  preferredItems: [historyListItem],
  listLength: 1,
  onSelect: jest.fn()
};
const wrapper2 = Enzyme.mount(<HistoryList {...props2} />);

describe('History List', () => {
  it('to be defined', () => {
    expect(HistoryList).toBeDefined();
  });

  it('History List shallow renders', () => {
    const shallow = Enzyme.shallow(<HistoryList {...props} />);
    expect(shallow).toMatchSnapshot();
  });

  it('History List renders', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('History List shallow renders with other props', () => {
    const shallow = Enzyme.shallow(<HistoryList {...props2} />);
    expect(shallow).toMatchSnapshot();
  });

  it('History List 2 renders', () => {
    expect(wrapper2).toMatchSnapshot();
  });

  it('History List functions and clicks', () => {
    const wrapper3 = Enzyme.mount(<HistoryList {...props} />);
    const instance: HistoryList = wrapper3.find(HistoryList).instance() as HistoryList;

    const spy = jest.spyOn(instance, 'componentDidMount');
    instance.componentDidMount();
    expect(spy).toHaveBeenCalled();

    const input = wrapper3.find('HistoryList');
    const spy3 = jest.spyOn(instance, 'render');
    input.simulate('click');
    instance.render();
    expect(spy3).toHaveBeenCalled();
  });
});
