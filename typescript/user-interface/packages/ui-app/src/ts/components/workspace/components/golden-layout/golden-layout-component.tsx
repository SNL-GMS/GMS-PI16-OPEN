import { Intent, NonIdealState, Spinner } from '@blueprintjs/core';
import { VERSION_INFO } from '@gms/common-util';
import { AppActions, CommonWorkspaceOperations, CommonWorkspaceTypes } from '@gms/ui-state';
import React from 'react';
import { useDispatch } from 'react-redux';

import { authenticator } from '~app/authentication';
import { Mutations, Queries } from '~components/client-interface';
import { CommandPaletteContext } from '~components/common-ui/components/command-palette/command-palette-context';
import { Command, CommandScope } from '~components/common-ui/components/command-palette/types';

import { GoldenLayoutPanel } from './golden-layout-panel';
import { GoldenLayoutComponentProps } from './types';

export const GoldenLayoutComponent: React.FunctionComponent<GoldenLayoutComponentProps> = ({
  logo,
  openLayoutName,
  setOpenLayoutName,
  userName,
  setAuthStatus
}: GoldenLayoutComponentProps) => {
  const context = React.useContext(CommandPaletteContext);

  const setLayout = Mutations.SetLayoutMutation.useSetLayoutMutation();
  const userProfileQuery = Queries.UserProfileQuery.useUserProfileQuery();
  const dispatch = useDispatch();
  const registerCommands = React.useCallback(
    (commandsToRegister: Command[], scope: CommandScope) =>
      context?.registerCommands && context.registerCommands(commandsToRegister, scope),
    [context]
  );

  const logout = React.useCallback(() => {
    dispatch(AppActions.resetAppState());
    authenticator.logout(setAuthStatus);
  }, [dispatch, setAuthStatus]);

  const setGlDisplayState = React.useCallback(
    (displayName: string, displayState: CommonWorkspaceTypes.GLDisplayState) => {
      dispatch(CommonWorkspaceOperations.setGlDisplayState(displayName, displayState));
    },
    [dispatch]
  );

  const maybeUserProfile = userProfileQuery?.data ?? undefined;
  return maybeUserProfile ? (
    <GoldenLayoutPanel
      logo={logo}
      openLayoutName={openLayoutName}
      setOpenLayoutName={setOpenLayoutName}
      setGlDisplayState={setGlDisplayState}
      userName={userName}
      userProfile={maybeUserProfile}
      versionInfo={VERSION_INFO}
      setLayout={setLayout}
      registerCommands={registerCommands}
      logout={logout}
    />
  ) : (
    <NonIdealState
      action={<Spinner intent={Intent.PRIMARY} />}
      title="Loading Default Layout"
      description="Retrieving default layout for user..."
    />
  );
};
