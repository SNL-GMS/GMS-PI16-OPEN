/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import * as Enzyme from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import { PieChart } from '../../../../src/ts/components/charts/pie-chart/pie-chart';
import * as PieChartTypes from '../../../../src/ts/components/charts/pie-chart/types';

const TIME_TO_WAIT_MS = 200;

/**
 * Fixes React warning that "An update to Component inside a test was not wrapped in act(...)."
 */
const waitForComponentToPaint = async (wrapper: any): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, TIME_TO_WAIT_MS));
    wrapper.update();
  });
};

const pieChartStyle: PieChartTypes.PieChartStyle = {
  diameterPx: 100,
  borderPx: 5
};

const props: PieChartTypes.PieChartProps = {
  style: pieChartStyle,
  percent: 40,
  className: 'string',
  pieSliceClass: 'string',
  status: 'string'
};

const wrapper = Enzyme.mount(<PieChart {...props} />);

describe('Pie Chart', () => {
  it('to be defined', () => {
    expect(PieChart).toBeDefined();
  });

  it('Pie Chart shallow renders', () => {
    const shallow = Enzyme.shallow(<PieChart {...props} />);
    expect(shallow).toMatchSnapshot();
  });

  it('Pie Chart renders', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('History List functions and clicks', async () => {
    const wrapper3 = Enzyme.mount(<PieChart {...props} />);

    wrapper3.setProps({ percent: 50 });
    await waitForComponentToPaint(wrapper3);
    expect(wrapper3.find('PieSlice')).toBeDefined();
  });
});
