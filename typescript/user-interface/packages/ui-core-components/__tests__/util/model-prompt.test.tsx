import * as React from 'react';

import { ModalPrompt } from '../../src/ts/components';
import { PromptProps } from '../../src/ts/components/dialog/types';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Adapter = require('enzyme-adapter-react-16');

const props: PromptProps = {
  title: 'Example Title',
  actionText: 'Accept',
  actionTooltipText: 'Accept the prompt',
  cancelText: 'Reject',
  cancelTooltipText: 'Reject the prompt',
  isOpen: true,
  actionCallback: jest.fn(),
  cancelButtonCallback: jest.fn(),
  onCloseCallback: jest.fn()
};

describe('modal prompt tests', () => {
  beforeEach(() => {
    Enzyme.configure({ adapter: new Adapter() });
  });

  // eslint-disable-next-line react/jsx-props-no-spreading
  const wrapper: any = Enzyme.mount(<ModalPrompt {...props} />);
  it('we pass in basic props', () => {
    const passedInProps = wrapper.props() as PromptProps;
    expect(passedInProps).toMatchSnapshot();
  });
  it('renders', () => {
    expect(wrapper.render()).toMatchSnapshot();
  });
  it('renders children', () => {
    const wrapperWithKids: any = Enzyme.mount(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <ModalPrompt {...props}>
        <div>Sample Children</div>
      </ModalPrompt>
    );
    expect(wrapperWithKids.render()).toMatchSnapshot();
  });
});
