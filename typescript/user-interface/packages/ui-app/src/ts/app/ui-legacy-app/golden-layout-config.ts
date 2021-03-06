import { UserProfileTypes } from '@gms/common-model';
import GoldenLayout from '@gms/golden-layout';
import { AppState } from '@gms/ui-state';
import { isElectron } from '@gms/ui-util';
import * as Redux from 'redux';

import { AnalystUiComponents } from '~analyst-ui';
import { InteractionWrapper } from '~analyst-ui/interactions/interaction-wrapper';
import { withReduxProvider } from '~app/redux-provider';
import { CommonUIComponents } from '~common-ui';
import {
  GLComponentConfig,
  GLComponentConfigList,
  GLMap,
  GoldenLayoutContextData
} from '~components/workspace';
import { GLComponentValue } from '~components/workspace/components/golden-layout/types';
import { DataAcquisitionComponents } from '~data-acquisition-ui';

import { withApolloProvider } from '../apollo-provider';

/**
 * Wraps the component for a golden layout panel.
 * Provides the required context providers to the component.
 *
 * @param Component the golden layout component
 * @param store the Redux store
 */
const wrap = (Component: React.ComponentClass, store: Redux.Store<AppState>) =>
  withReduxProvider(withApolloProvider(InteractionWrapper(Component), store), store);

// ! CAUTION: when changing the golden-layout component name
// The route paths must match the `golden-layout` component name for popout windows
// For example, the component name `signal-detections` must have the route path of `signal-detections`

const commonUIComponents: Map<string, GLComponentConfig> = new Map([
  [
    'system-messages',
    {
      type: 'react-component',
      title: 'System Messages',
      component: 'system-messages'
    }
  ]
]);

const analystUIComponents: Map<string, GLComponentConfig> = new Map([
  [
    'events',
    {
      type: 'react-component',
      title: 'Events',
      component: 'events'
    }
  ],
  [
    'history',
    {
      type: 'react-component',
      title: 'Undo/Redo',
      component: 'history'
    }
  ],
  [
    'magnitude',
    {
      type: 'react-component',
      title: 'Magnitude',
      component: 'magnitude'
    }
  ],
  [
    'signal-detections',
    {
      type: 'react-component',
      title: 'Signal Detections',
      component: 'signal-detections'
    }
  ],
  [
    'map',
    {
      type: 'react-component',
      title: 'Map',
      component: 'map'
    }
  ],
  [
    'azimuth-slowness',
    {
      type: 'react-component',
      title: 'Azimuth Slowness',
      component: 'azimuth-slowness'
    }
  ],
  [
    'location',
    {
      type: 'react-component',
      title: 'Location',
      component: 'location'
    }
  ]
]);

const dataAcqComponents: Map<string, GLComponentConfig> = new Map([
  [
    'soh-overview',
    {
      type: 'react-component',
      title: 'SOH Overview',
      component: 'soh-overview'
    }
  ],
  [
    'station-statistics',
    {
      type: 'react-component',
      title: 'Station Statistics',
      component: 'station-statistics'
    }
  ]
]);

const components: GLComponentConfigList = {};
[...analystUIComponents, ...dataAcqComponents].forEach(([componentName, glComponent]) => {
  components[componentName] = glComponent;
});

// Add desired common UI Components here
components['system-messages'] = commonUIComponents.get('system-messages');

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
              ...analystUIComponents.get('map'),
              height: 30
            },
            {
              type: 'stack',
              content: [
                {
                  ...commonUIComponents.get('system-messages')
                },
                {
                  ...analystUIComponents.get('events')
                },
                {
                  ...analystUIComponents.get('signal-detections')
                },
                {
                  ...analystUIComponents.get('azimuth-slowness')
                },
                {
                  ...analystUIComponents.get('magnitude')
                },
                {
                  ...analystUIComponents.get('location')
                },
                {
                  ...analystUIComponents.get('map')
                },
                {
                  ...dataAcqComponents.get('soh-overview')
                },
                {
                  ...dataAcqComponents.get('station-statistics')
                }
              ]
            }
          ],
          width: 60
        },
        {
          type: 'column',
          content: [
            {
              ...analystUIComponents.get('waveform-display'),
              height: 70
            }
          ]
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
 * The Golden Layout context for the analyst UI.
 * Note: Defines the Application Menu structure.
 */
const glComponents = (store: Redux.Store<AppState>): GLMap =>
  new Map<string, GLComponentValue>([
    [
      'system-messages',
      {
        id: components['system-messages'],
        value: wrap(CommonUIComponents.SystemMessage, store)
      }
    ],
    [
      'Analyst',
      new Map([
        [
          // because of the dash need to use the string
          components['azimuth-slowness'].component,
          {
            id: components['azimuth-slowness'],
            value: wrap(AnalystUiComponents.AzimuthSlowness, store)
          }
        ],
        [
          components.events.component,
          {
            id: components.events,
            value: wrap(AnalystUiComponents.Events, store)
          }
        ],
        [
          components.history.component,
          {
            id: components.history,
            value: wrap(AnalystUiComponents.History, store)
          }
        ],
        [
          components.location.component,
          {
            id: components.location,
            value: wrap(AnalystUiComponents.Location, store)
          }
        ],
        [
          components.magnitude.component,
          {
            id: components.magnitude,
            value: wrap(AnalystUiComponents.Magnitude, store)
          }
        ],
        [
          components.map.component,
          {
            id: components.map,
            value: wrap(AnalystUiComponents.Map, store)
          }
        ],
        [
          components['signal-detections'].component,
          {
            id: components['signal-detections'],
            value: wrap(AnalystUiComponents.SignalDetections, store)
          }
        ]
      ])
    ],
    [
      'Data Acquisition',
      new Map([
        [
          components['soh-overview'].component,
          {
            id: components['soh-overview'],
            value: wrap(DataAcquisitionComponents.SohOverview, store)
          }
        ],
        [
          components['station-statistics'].component,
          {
            id: components['station-statistics'],
            value: wrap(DataAcquisitionComponents.StationStatistics, store)
          }
        ]
      ])
    ]
  ]);

/** The Golden Layout context for the analyst UI */
export const glContextData = (store: Redux.Store<AppState>): GoldenLayoutContextData => ({
  glComponents: glComponents(store),
  glRef: undefined,
  gl: undefined,
  config: {
    components,
    workspace: defaultGoldenLayoutConfig
  },
  supportedUserInterfaceMode: UserProfileTypes.UserMode.LEGACY
});
