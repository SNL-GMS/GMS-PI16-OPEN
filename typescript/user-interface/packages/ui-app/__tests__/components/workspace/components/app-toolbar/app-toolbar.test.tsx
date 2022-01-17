import { UserProfileTypes } from '@gms/common-model';
import React from 'react';

import * as Toolbar from '../../../../../src/ts/components/workspace/components/toolbar/toolbar-component';
import { ToolbarProps } from '../../../../../src/ts/components/workspace/components/toolbar/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('App Toolbar', () => {
  const testProps: ToolbarProps = {
    components: null,
    saveDialog: null,
    setLayout: null,
    logo: 'test_logo',
    userName: 'test_name',
    isAboutDialogOpen: false,
    isSaveWorkspaceAsDialogOpen: false,
    openLayoutName: 'default_layout_name',
    versionInfo: {
      versionNumber: 'string',
      commitSHA: 'string'
    },
    userProfile: {
      userId: 'userId',
      defaultAnalystLayoutName: 'default_layout_name',
      defaultSohLayoutName: 'default_soh_name',
      workspaceLayouts: [
        {
          name: 'default_layout_name',
          layoutConfiguration: 'asdf',
          supportedUserInterfaceModes: [UserProfileTypes.UserMode.IAN]
        }
      ],
      audibleNotifications: []
    },
    setOpenLayoutName: (): any => {
      jest.fn();
    },
    clearLayout: () => jest.fn(),
    getOpenDisplays: () => [],
    logout: () => jest.fn(),
    openDisplay: () => {
      jest.fn();
    },
    openWorkspace: () => {
      jest.fn();
    },
    showLogPopup: () => jest.fn(),
    showAboutDialog: () => jest.fn(),
    toggleSaveWorkspaceAsDialog: () => jest.fn()
  };
  // eslint-disable-next-line react/jsx-props-no-spreading
  const wrapper: any = Enzyme.mount(<Toolbar.Toolbar {...testProps} />);

  it('matches snapshot with basic props', () => {
    const props = wrapper.props() as ToolbarProps;
    expect(props).toMatchSnapshot();
  });

  it('renders a component', () => {
    expect(wrapper.render()).toMatchSnapshot();
  });

  it('can reset an animation', () => {
    const target = {
      current: {
        className: '',
        offsetWidth: -1
      }
    };
    Toolbar.triggerAnimation(target as React.MutableRefObject<HTMLSpanElement>);
    expect(target.current.className).toEqual('workspace-logo__label keypress-signifier');
  });
});
