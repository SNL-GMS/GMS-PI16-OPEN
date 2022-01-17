import { CommonTypes, UserProfileTypes } from '@gms/common-model';

import { GLMap } from '../golden-layout/types';

export interface ToolbarBaseProps {
  components: GLMap;
  logo: any;
  userName: string;
  isAboutDialogOpen: boolean;
  isSaveWorkspaceAsDialogOpen: boolean;
  openLayoutName: string;
  versionInfo: CommonTypes.VersionInfo;
  userProfile?: UserProfileTypes.UserProfile;
  saveDialog: JSX.Element;
  setLayout(newLayout: {
    variables: UserProfileTypes.SetLayoutMutationArgs;
  }): Promise<UserProfileTypes.UserProfile>;
  getOpenDisplays(): string[];
  clearLayout(): void;
  logout(): void;
  openDisplay(displayKey: string): void;
  openWorkspace(layout: UserProfileTypes.UserLayout): void;
  toggleSaveWorkspaceAsDialog(): void;
  showLogPopup(): void;
  showAboutDialog(): void;
  setOpenLayoutName(name: string);
}

export type ToolbarProps = ToolbarBaseProps;
