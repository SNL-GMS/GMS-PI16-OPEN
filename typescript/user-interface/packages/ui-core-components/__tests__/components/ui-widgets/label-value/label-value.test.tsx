/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import * as Enzyme from 'enzyme';
import * as React from 'react';

import { LabelValue } from '../../../../src/ts/components/ui-widgets/label-value';
import { LabelValueProps } from '../../../../src/ts/components/ui-widgets/label-value/types';

describe('label-value', () => {
  const props: LabelValueProps = {
    value: 'value',
    label: 'label',
    tooltip: 'tooltip',
    valueColor: 'blue',
    ianApp: false
  };
  it('to be defined', () => {
    expect(LabelValue).toBeDefined();
  });

  it('label-value renders with ian false', () => {
    const shallow = Enzyme.shallow(<LabelValue {...props} />);
    expect(shallow).toMatchSnapshot();
  });
  it('label-value renders with ian true', () => {
    props.ianApp = true;
    const shallow = Enzyme.shallow(<LabelValue {...props} />);
    expect(shallow).toMatchSnapshot();
  });
});
