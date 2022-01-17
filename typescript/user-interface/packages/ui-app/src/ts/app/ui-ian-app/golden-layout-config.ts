import { Displays, UserProfileTypes } from '@gms/common-model';
import GoldenLayout from '@gms/golden-layout';
import { AppState } from '@gms/ui-state';
import { isElectron } from '@gms/ui-util';
import * as Redux from 'redux';

import { IANMap, StationPropertiesComponent } from '~analyst-ui/components';
import { withReactQueryProvider } from '~app/react-query-provider';
import { AnalystUiComponents } from '~components/analyst-ui';
import {
  GLComponentConfig,
  GLComponentConfigList,
  GLMap,
  GoldenLayoutContextData
} from '~components/workspace';
import { GLComponentValue } from '~components/workspace/components/golden-layout/types';

import { withReduxProvider } from '../redux-provider';

/**
 * Wraps the component for a golden layout panel.
 * Provides the required context providers to the component.
 *
 * @param Component the golden layout component
 * @param store the Redux store
 */
// eslint-disable-next-line
const wrap = (Component: any, store: Redux.Store<AppState>) =>
  withReduxProvider(withReactQueryProvider(Component), store);
// ! CAUTION: when changing the golden-layout component name
// The route paths must match the `golden-layout` component name for popout windows
// For example, the component name `signal-detections` must have the route path of `signal-detections`

const commonUIComponents: Map<string, GLComponentConfig> = new Map([
  [
    Displays.CommonDisplays.SYSTEM_MESSAGES,
    {
      type: 'react-component',
      title: 'System Messages',
      component: Displays.CommonDisplays.SYSTEM_MESSAGES
    }
  ]
]);

const ianComponents: Map<string, GLComponentConfig> = new Map([
  [
    Displays.IanDisplays.MAP,
    {
      type: 'react-component',
      title: 'IAN Map',
      component: Displays.IanDisplays.MAP
    }
  ],
  [
    Displays.IanDisplays.STATION_PROPERTIES,
    {
      type: 'react-component',
      title: 'Station Properties',
      component: Displays.IanDisplays.STATION_PROPERTIES
    }
  ],
  [
    Displays.IanDisplays.WORKFLOW,
    {
      type: 'react-component',
      title: 'Workflow',
      component: Displays.IanDisplays.WORKFLOW
    }
  ],
  [
    Displays.IanDisplays.WAVEFORM,
    {
      type: 'react-component',
      title: 'Waveforms',
      component: Displays.IanDisplays.WAVEFORM
    }
  ]
]);

// Adding all components
const components: GLComponentConfigList = {};
[...ianComponents, ...commonUIComponents].forEach(([componentName, glComponent]) => {
  components[componentName] = glComponent;
});

const defaultGoldenLayoutConfig: GoldenLayout.Config = {
  settings: {
    showPopoutIcon: Boolean(isElectron()),
    showMaximiseIcon: true,
    showCloseIcon: true
  },
  content: [
    {
      type: 'row',
      content: [
        {
          type: 'column',
          content: [
            {
              ...ianComponents.get(Displays.IanDisplays.WORKFLOW)
            }
          ]
        }
      ]
    },
    {
      type: 'row',
      content: [
        {
          type: 'column',
          content: [
            {
              ...ianComponents.get(Displays.IanDisplays.MAP)
            }
          ]
        }
      ]
    },
    {
      type: 'row',
      content: [
        {
          type: 'column',
          content: [
            {
              ...ianComponents.get(Displays.IanDisplays.STATION_PROPERTIES)
            }
          ]
        }
      ]
    },
    {
      type: 'column',
      content: [
        {
          ...ianComponents.get(Displays.IanDisplays.WAVEFORM),
          height: 70
        }
      ]
    }
  ],
  dimensions: {
    borderWidth: 2,
    minItemHeight: 30,
    minItemWidth: 30,
    headerHeight: 30
  }
};

/**
 * The Golden Layout context for the IAN UI.
 * Note: Defines the Application Menu structure.
 */
const glComponents = (store: Redux.Store<AppState>): GLMap =>
  new Map<string, GLComponentValue>([
    [
      'Analyst Displays',
      new Map([
        [
          components[Displays.IanDisplays.MAP].component,
          {
            id: components[Displays.IanDisplays.MAP],
            value: wrap(IANMap, store)
          }
        ],
        [
          components[Displays.IanDisplays.STATION_PROPERTIES].component,
          {
            id: components[Displays.IanDisplays.STATION_PROPERTIES],
            value: wrap(StationPropertiesComponent, store)
          }
        ],
        [
          components[Displays.IanDisplays.WAVEFORM].component,
          {
            id: components[Displays.IanDisplays.WAVEFORM],
            value: wrap(AnalystUiComponents.WaveformDisplay, store)
          }
        ],
        [
          components[Displays.IanDisplays.WORKFLOW].component,
          {
            id: components[Displays.IanDisplays.WORKFLOW],
            value: wrap(AnalystUiComponents.Workflow, store)
          }
        ]
      ])
    ]
  ]);

/** The Golden Layout context */
export const glContextData = (store: Redux.Store<AppState>): GoldenLayoutContextData => ({
  glComponents: glComponents(store),
  gl: undefined,
  glRef: undefined,
  config: {
    components,
    workspace: defaultGoldenLayoutConfig
  },
  supportedUserInterfaceMode: UserProfileTypes.UserMode.IAN
});
