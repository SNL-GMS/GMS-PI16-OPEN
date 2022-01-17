import { UserContext } from '../../src/ts/cache/types';

export const mutationVariables = {
  saveAsDefault: true,
  workspaceLayoutInput: {
    name: 'Unit Test',
    supportedUserInterfaceModes: ['SOH', 'ANALYST'],
    // eslint-disable-next-line max-len
    layoutConfiguration:
      '%7B%22settings%22:%7B%22hasHeaders%22:true,%22constrainDragToContainer%22:true,%22reorderEnabled%22:true,%22selectionEnabled%22:false,%22popoutWholeStack%22:false,%22blockedPopoutsThrowError%22:true,%22closePopoutsOnUnload%22:true,%22showPopoutIcon%22:false,%22showMaximiseIcon%22:true,%22showCloseIcon%22:true,%22responsiveMode%22:%22onload%22,%22tabOverlapAllowance%22:0,%22reorderOnTabMenuClick%22:true,%22tabControlOffset%22:10%7D,%22dimensions%22:%7B%22borderWidth%22:2,%22borderGrabWidth%22:15,%22minItemHeight%22:30,%22minItemWidth%22:30,%22headerHeight%22:30,%22dragProxyWidth%22:300,%22dragProxyHeight%22:200%7D,%22labels%22:%7B%22close%22:%22close%22,%22maximise%22:%22maximise%22,%22minimise%22:%22minimise%22,%22popout%22:%22open%20in%20new%20window%22,%22popin%22:%22pop%20in%22,%22tabDropdown%22:%22additional%20tabs%22%7D,%22content%22:%5B%7B%22type%22:%22row%22,%22isClosable%22:true,%22reorderEnabled%22:true,%22title%22:%22%22,%22content%22:%5B%7B%22type%22:%22stack%22,%22header%22:%7B%7D,%22isClosable%22:true,%22reorderEnabled%22:true,%22title%22:%22%22,%22activeItemIndex%22:0,%22width%22:17.298256310922202,%22content%22:%5B%7B%22type%22:%22component%22,%22title%22:%22Events%22,%22component%22:%22events%22,%22componentName%22:%22lm-react-component%22,%22isClosable%22:true,%22reorderEnabled%22:true%7D%5D%7D,%7B%22type%22:%22stack%22,%22header%22:%7B%7D,%22isClosable%22:true,%22reorderEnabled%22:true,%22title%22:%22%22,%22activeItemIndex%22:0,%22width%22:21.350871844538897,%22content%22:%5B%7B%22type%22:%22component%22,%22title%22:%22Location%22,%22component%22:%22location%22,%22componentName%22:%22lm-react-component%22,%22isClosable%22:true,%22reorderEnabled%22:true%7D%5D%7D,%7B%22type%22:%22stack%22,%22isClosable%22:true,%22reorderEnabled%22:true,%22title%22:%22%22,%22height%22:100,%22activeItemIndex%22:2,%22width%22:21.350871844538897,%22content%22:%5B%7B%22type%22:%22component%22,%22title%22:%22Signal%20Detections%22,%22component%22:%22signal-detections%22,%22componentName%22:%22lm-react-component%22,%22isClosable%22:true,%22reorderEnabled%22:true%7D,%7B%22type%22:%22component%22,%22title%22:%22Azimuth%20Slowness%22,%22component%22:%22azimuth-slowness%22,%22componentName%22:%22lm-react-component%22,%22isClosable%22:true,%22reorderEnabled%22:true%7D,%7B%22type%22:%22component%22,%22title%22:%22Magnitude%22,%22component%22:%22magnitude%22,%22componentName%22:%22lm-react-component%22,%22isClosable%22:true,%22reorderEnabled%22:true%7D,%7B%22type%22:%22component%22,%22title%22:%22Map%22,%22component%22:%22map%22,%22componentName%22:%22lm-react-component%22,%22isClosable%22:true,%22reorderEnabled%22:true%7D,%7B%22type%22:%22component%22,%22title%22:%22Station%20Information%22,%22component%22:%22station-information%22,%22componentName%22:%22lm-react-component%22,%22isClosable%22:true,%22reorderEnabled%22:true%7D,%7B%22type%22:%22component%22,%22title%22:%22Station%20Configuration%22,%22component%22:%22station-configuration%22,%22componentName%22:%22lm-react-component%22,%22isClosable%22:true,%22reorderEnabled%22:true%7D,%7B%22type%22:%22component%22,%22title%22:%22SOH%20Summary%22,%22component%22:%22soh-summary%22,%22componentName%22:%22lm-react-component%22,%22isClosable%22:true,%22reorderEnabled%22:true%7D,%7B%22type%22:%22component%22,%22title%22:%22Transfer%20Gaps%22,%22component%22:%22transfer-gaps%22,%22componentName%22:%22lm-react-component%22,%22isClosable%22:true,%22reorderEnabled%22:true%7D,%7B%22type%22:%22component%22,%22title%22:%22Configure%20Station%20Groups%22,%22component%22:%22configure-station-groups%22,%22componentName%22:%22lm-react-component%22,%22isClosable%22:true,%22reorderEnabled%22:true%7D%5D%7D,%7B%22type%22:%22column%22,%22isClosable%22:true,%22reorderEnabled%22:true,%22title%22:%22%22,%22width%22:40,%22content%22:%5B%7B%22type%22:%22stack%22,%22height%22:30,%22isClosable%22:true,%22reorderEnabled%22:true,%22title%22:%22%22,%22activeItemIndex%22:0,%22content%22:%5B%7B%22type%22:%22component%22,%22title%22:%22Workflow%22,%22component%22:%22workflow%22,%22componentName%22:%22lm-react-component%22,%22isClosable%22:true,%22reorderEnabled%22:true%7D%5D%7D,%7B%22type%22:%22stack%22,%22height%22:70,%22isClosable%22:true,%22reorderEnabled%22:true,%22title%22:%22%22,%22activeItemIndex%22:0,%22content%22:%5B%7B%22type%22:%22component%22,%22title%22:%22Waveforms%22,%22component%22:%22waveform-display%22,%22height%22:70,%22componentName%22:%22lm-react-component%22,%22isClosable%22:true,%22reorderEnabled%22:true%7D%5D%7D%5D%7D%5D%7D%5D,%22isClosable%22:true,%22reorderEnabled%22:true,%22title%22:%22%22,%22openPopouts%22:%5B%5D,%22maximisedItemId%22:null%7D'
  }
};

// default user context
export const userContext: UserContext = {
  sessionId: 'test',
  userName: 'Uncle Bob',
  userRole: 'DEFAULT'
};
