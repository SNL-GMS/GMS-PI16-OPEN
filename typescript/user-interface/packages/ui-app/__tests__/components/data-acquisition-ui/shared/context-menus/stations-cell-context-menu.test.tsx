import { ContextMenu } from '@blueprintjs/core';
import React from 'react';

import {
  acknowledgeOnClick,
  DisabledStationSohContextMenu,
  getStationAcknowledgementMenuText,
  StationSohContextMenu,
  StationSohContextMenuItemProps,
  StationSohContextMenuProps
} from '../../../../../src/ts/components/data-acquisition-ui/shared/context-menus/stations-cell-context-menu';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

describe('Station cell context menu', () => {
  const stationSohContextMenuProps: StationSohContextMenuProps = {
    stationNames: ['test', 'test2'],
    acknowledgeCallback: jest.fn()
  };

  const stationSohContextMenu = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <StationSohContextMenu {...stationSohContextMenuProps} />
  );
  const disabledStationSohContextMenu = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DisabledStationSohContextMenu {...stationSohContextMenuProps} />
  );

  it('StationSohContextMenu can be created', () => {
    expect(stationSohContextMenu).toMatchSnapshot();
  });

  it('DisabledStationSohContextMenu can be created', () => {
    expect(disabledStationSohContextMenu).toMatchSnapshot();
  });
  it('getStationAcknowledgementMenuText to work as expected', () => {
    const stationNames = ['test', 'test1'];
    const withComment = false;
    const expectedResult = 'Acknowledge 2 stations';
    const result = getStationAcknowledgementMenuText(stationNames, withComment);
    expect(result).toEqual(expectedResult);
  });

  it('acknowledgeOnClick to work as expected', () => {
    const stationSohContextMenuItemProps: StationSohContextMenuItemProps = {
      ...stationSohContextMenuProps,
      disabled: false
    };
    const createSpy = jest
      .spyOn(ContextMenu, 'show')
      // eslint-disable-next-line no-console
      .mockImplementation(() => console.log('shown'));
    const mouseEvent: any = {
      preventDefault: jest.fn(),
      clientX: 5,
      clientY: 5
    };
    acknowledgeOnClick(mouseEvent, stationSohContextMenuItemProps);
    expect(createSpy).toHaveBeenCalled();
  });
});
