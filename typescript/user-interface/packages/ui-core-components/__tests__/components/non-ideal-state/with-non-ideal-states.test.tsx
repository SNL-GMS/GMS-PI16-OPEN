/* eslint-disable react/jsx-props-no-spreading */

import { Card, H5 } from '@blueprintjs/core';
import { Container } from '@gms/golden-layout';
import * as Enzyme from 'enzyme';
import * as React from 'react';

import {
  NonIdealStateDefinition,
  nonIdealStateWithNoSpinner,
  nonIdealStateWithSpinner
} from '../../..';
import {
  // NonIdealStateDefinition,
  WithNonIdealStates
} from '../../../src/ts/components/non-ideal-state';

const testNonIdealStateDefinitions: NonIdealStateDefinition<{
  status: any;
}>[] = [
  {
    condition: props => !props.status,
    element: nonIdealStateWithSpinner('No Data', 'Test')
  },
  {
    condition: props => props.status && props.status.loading,
    element: nonIdealStateWithSpinner('Loading:', 'Test')
  },
  {
    condition: props => props.status.group === undefined,
    element: nonIdealStateWithSpinner('No Group Data:', 'Test')
  },
  {
    condition: props =>
      props.status.group.Groups.length === 0 || props.status.group.status.length === 0,
    element: nonIdealStateWithNoSpinner('No Data:', 'Configure Groups')
  }
];

/// /////////////

const glWidth = 1000;
const glHeight = 500;

const myGLContainer: Container = {
  // Container
  width: glWidth,
  height: glHeight,
  parent: undefined,
  tab: undefined,
  title: 'container-title',
  layoutManager: undefined,
  isHidden: false,
  setState: jest.fn(),
  extendState: jest.fn(),
  getState: jest.fn(),
  getElement: jest.fn(),
  hide: jest.fn(),
  show: jest.fn(),
  setSize: jest.fn(),
  setTitle: jest.fn(),
  close: jest.fn(),
  // EventEmitter
  on: jest.fn(),
  emit: jest.fn(),
  trigger: jest.fn(),
  unbind: jest.fn(),
  off: jest.fn()
};

interface TestProps {
  glContainer: Container;
  status: {
    loading: boolean;
    error: any;
  };
}

interface TestState {
  status: any;
}

class TestComponent extends React.PureComponent<TestProps, TestState> {
  public render(): JSX.Element {
    return (
      <Card interactive>
        <H5>Card heading</H5>
        <p>Card content</p>
      </Card>
    );
  }
}

/// //////////

const CardNonIdealState = WithNonIdealStates(
  [...testNonIdealStateDefinitions] as any[],
  TestComponent
);

const myProps: TestProps = {
  glContainer: myGLContainer,
  status: {
    loading: true,
    error: undefined
  }
};

const wrapper = Enzyme.mount(
  // eslint-disable-next-line react/jsx-props-no-spreading
  <CardNonIdealState {...myProps} />
);

const myProps2: TestProps = {
  glContainer: myGLContainer,
  status: {
    loading: undefined,
    error: undefined
  }
};
const wrapper2 = Enzyme.mount(
  // eslint-disable-next-line react/jsx-props-no-spreading
  <CardNonIdealState {...myProps2} />
);

describe('With Non Ideal States', () => {
  it('to be defined', () => {
    expect(WithNonIdealStates).toBeDefined();
  });

  it('shallow renders', () => {
    const shallow = Enzyme.shallow(<TestComponent {...myProps} />);
    expect(shallow).toMatchSnapshot();
  });

  it('renders', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('bad props shallow renders', () => {
    const shallow2 = Enzyme.shallow(<TestComponent {...myProps2} />);
    expect(shallow2).toMatchSnapshot();
  });

  it('bad props renders', () => {
    expect(wrapper2).toMatchSnapshot();
    const spinner = wrapper2.find('Spinner');
    expect(spinner).toBeTruthy();
  });
});
