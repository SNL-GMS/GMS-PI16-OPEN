/* eslint-disable react/jsx-props-no-spreading */
import * as Enzyme from 'enzyme';
import * as React from 'react';

import {
  RecordSectionLabels,
  RecordSectionLabelsProps
} from '../../../src/ts/components/record-section-display/labels';

const props: RecordSectionLabelsProps = {
  bottomVal: 1000,
  topVal: 2,
  phases: [
    {
      percentX: 4,
      percentY: 6,
      phase: 'phase 1'
    }
  ]
};

const wrapper = Enzyme.mount(<RecordSectionLabels {...props} />);

describe('Weavess Empty Renderer', () => {
  it('to be defined', () => {
    expect(RecordSectionLabels).toBeDefined();
  });

  it('shallow renders', () => {
    const shallow = Enzyme.shallow(<RecordSectionLabels {...props} />);
    expect(shallow).toMatchSnapshot();

    expect(Enzyme.shallow(<RecordSectionLabels {...props} />)).toMatchSnapshot();
  });

  it('renders', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('uses an interval of 5', () => {
    const p: RecordSectionLabelsProps = {
      ...props,
      bottomVal: 100,
      topVal: 80
    };
    const rsl = Enzyme.mount(<RecordSectionLabels {...p} />);
    expect(rsl).toMatchSnapshot();
  });

  it('uses an interval of 10', () => {
    const p: RecordSectionLabelsProps = {
      ...props,
      bottomVal: 100,
      topVal: 40
    };
    const rsl = Enzyme.mount(<RecordSectionLabels {...p} />);
    expect(rsl).toMatchSnapshot();
  });
});
