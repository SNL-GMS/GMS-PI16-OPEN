import { ContextMenu } from '@blueprintjs/core';
import { SohTypes } from '@gms/common-model';
import React from 'react';

import { Offset } from '~components/data-acquisition-ui/shared/types';

import { QuietAction } from '../../../../../src/ts/components/data-acquisition-ui/components/soh-environment/types';
import {
  CancelMenuItem,
  QuiteMenuItem,
  QuiteWithCommentDialog,
  QuiteWithCommentMenuItem,
  showQuietingContextMenu
} from '../../../../../src/ts/components/data-acquisition-ui/shared/context-menus/quieting-menu';
// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

describe('quieting menu', () => {
  const stationName = '';
  const channelPair: SohTypes.ChannelMonitorPair = {
    channelName: 'name',
    monitorType: SohTypes.SohMonitorType.MISSING
  };
  const quietChannelMonitorStatuses: (
    stationName: string,
    channelPairs: SohTypes.ChannelMonitorPair[],
    quietDurationMs: number
  ) => void = jest.fn();
  const position: Offset = {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    left: 10,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    top: 10
  };
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const quietingDurationSelections = [300000, 900000, 3600000, 86400000, 604800000];
  const quietUntilMs = undefined;
  const quietAction: QuietAction = {
    channelMonitorPairs: [channelPair],
    position,
    quietUntilMs,
    quietingDurationSelections,
    stationName,
    quietChannelMonitorStatuses
  };

  const quietWithCommentDialog = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <QuiteWithCommentDialog {...quietAction} />
  );

  const quietMenuItem = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <QuiteMenuItem {...quietAction} />
  );

  const quiteWithCommentMenuItem = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <QuiteWithCommentMenuItem {...quietAction} />
  );

  const cancelMenuItem = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <CancelMenuItem {...quietAction} />
  );
  it('should have the show quieting menu function', () => {
    expect(showQuietingContextMenu).toBeDefined();
  });

  it('QuiteWithCommentDialog can be created', () => {
    expect(quietWithCommentDialog).toMatchSnapshot();
  });
  it('QuiteMenuItem can be created', () => {
    expect(quietMenuItem).toMatchSnapshot();
  });

  it('QuiteWithCommentMenuItem can be created', () => {
    expect(quiteWithCommentMenuItem).toMatchSnapshot();
  });

  it('CancelMenuItem can be created', () => {
    expect(cancelMenuItem).toMatchSnapshot();
  });

  it('should call the contextmenu.show function with menu', () => {
    ContextMenu.show = jest.fn() as any;
    showQuietingContextMenu(quietAction);
    expect(ContextMenu.show).toHaveBeenCalledTimes(1);
    expect((ContextMenu.show as any).mock.calls[0]).toMatchSnapshot();
  });
});
