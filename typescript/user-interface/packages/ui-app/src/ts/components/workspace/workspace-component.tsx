/* eslint-disable react/destructuring-assignment */
import { Classes, Intent, NonIdealState, Spinner } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { getReactKeyPressAction } from '@gms/ui-state';
import React from 'react';

import { GoldenLayout } from './components/golden-layout';
import { KeyContext, WorkspaceProps, WorkspaceState } from './types';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const logo = require('../../resources/gms-logo.png');

/**
 * Primary analyst workspace component. Uses golden-layout to create a configurable display of multiple
 * sub-components.
 */
export class Workspace extends React.Component<WorkspaceProps, WorkspaceState> {
  public constructor(props: WorkspaceProps) {
    super(props);
    this.state = {
      triggerAnimation: false
    };
  }

  /**
   * Create the analyst workspace
   */
  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        className={`${Classes.DARK} workspace-container`}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onKeyDown={this.handleWorkspaceHotkey}
        data-cy="workspace"
      >
        {this.props.userSessionState.connected ? (
          <KeyContext.Provider
            value={{
              shouldTriggerAnimation: this.state.triggerAnimation,
              resetAnimation: () => {
                this.setState({ triggerAnimation: false });
              }
            }}
          >
            <GoldenLayout
              logo={logo}
              userName={this.props.userSessionState.authorizationStatus.userName}
            />
          </KeyContext.Provider>
        ) : (
          <div className={`${Classes.DARK} workspace-invalid-state`}>
            <div className="gms-disconnected">
              <NonIdealState
                icon={IconNames.ERROR}
                action={<Spinner intent={Intent.DANGER} />}
                title="No connection to server"
                description="Attempting to connect..."
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  private readonly handleWorkspaceHotkey = (
    keyEvent: React.KeyboardEvent<HTMLDivElement>
  ): void => {
    if (!keyEvent.repeat) {
      const keyPressAction = getReactKeyPressAction(keyEvent);
      if (keyPressAction) {
        this.setState(
          {
            triggerAnimation: true
          },
          () => {
            this.setState({ triggerAnimation: false });
          }
        );
      }
    }
  };
}
