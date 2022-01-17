import { Displays, UserProfileTypes } from '@gms/common-model';
import GoldenLayout from '@gms/golden-layout';
import { AppState } from '@gms/ui-state';
import { isElectron } from '@gms/ui-util';
import * as Redux from 'redux';

import { withApolloProvider } from '~app/apollo-provider';
import { withReactQueryProvider } from '~app/react-query-provider';
import { withReduxProvider } from '~app/redux-provider';
import { CommonUIComponents } from '~components/common-ui';
import {
  SohEnvironment,
  SohEnvironmentHistory,
  SohLag,
  SohLagHistory,
  SohMap,
  SohMissing,
  SohMissingHistory,
  SohOverview,
  SohTimeliness,
  SohTimelinessHistory,
  StationStatistics
} from '~components/data-acquisition-ui/components';
import {
  GLComponentConfig,
  GLComponentConfigList,
  GLMap,
  GoldenLayoutContextData
} from '~components/workspace';
import { GLComponentValue } from '~components/workspace/components/golden-layout/types';

/**
 * Wraps the component for a golden layout panel.
 * Provides the required context providers to the component.
 *
 * @param Component the golden layout component
 * @param store the Redux store
 */
// eslint-disable-next-line
const wrap = (Component: any, store: Redux.Store<AppState>) =>
  withReduxProvider(withApolloProvider(withReactQueryProvider(Component), store), store);

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

const sohComponents: Map<string, GLComponentConfig> = new Map([
  [
    Displays.SohDisplays.SOH_OVERVIEW,
    {
      type: 'react-component',
      title: 'SOH Overview',
      component: Displays.SohDisplays.SOH_OVERVIEW
    }
  ],
  [
    Displays.SohDisplays.STATION_STATISTICS,
    {
      type: 'react-component',
      title: 'Station Statistics',
      component: Displays.SohDisplays.STATION_STATISTICS
    }
  ],
  [
    Displays.SohDisplays.SOH_LAG,
    {
      type: 'react-component',
      title: 'SOH Lag',
      component: Displays.SohDisplays.SOH_LAG
    }
  ],
  [
    Displays.SohDisplays.SOH_MISSING,
    {
      type: 'react-component',
      title: 'SOH Missing',
      component: Displays.SohDisplays.SOH_MISSING
    }
  ],
  [
    Displays.SohDisplays.SOH_ENVIRONMENT,
    {
      type: 'react-component',
      title: 'SOH Environment',
      component: Displays.SohDisplays.SOH_ENVIRONMENT
    }
  ],
  [
    Displays.SohDisplays.SOH_ENVIRONMENT_TRENDS,
    {
      type: 'react-component',
      title: 'SOH Environment Trends',
      component: Displays.SohDisplays.SOH_ENVIRONMENT_TRENDS
    }
  ],
  [
    Displays.SohDisplays.SOH_LAG_TRENDS,
    {
      type: 'react-component',
      title: 'SOH Lag Trends',
      component: Displays.SohDisplays.SOH_LAG_TRENDS
    }
  ],
  [
    Displays.SohDisplays.SOH_MISSING_TRENDS,
    {
      type: 'react-component',
      title: 'SOH Missing Trends',
      component: Displays.SohDisplays.SOH_MISSING_TRENDS
    }
  ],
  [
    Displays.SohDisplays.SOH_TIMELINESS_TRENDS,
    {
      type: 'react-component',
      title: 'SOH Timeliness Trends',
      component: Displays.SohDisplays.SOH_TIMELINESS_TRENDS
    }
  ],
  [
    Displays.SohDisplays.SOH_TIMELINESS,
    {
      type: 'react-component',
      title: 'SOH Timeliness',
      component: Displays.SohDisplays.SOH_TIMELINESS
    }
  ],
  [
    Displays.SohDisplays.SOH_MAP,
    {
      type: 'react-component',
      title: 'SOH Map',
      component: Displays.SohDisplays.SOH_MAP
    }
  ]
]);

// Adding all SOH components
const components: GLComponentConfigList = {};
[...sohComponents].forEach(([componentName, glComponent]) => {
  components[componentName] = glComponent;
});

// Add desired common UI Components here
components[Displays.CommonDisplays.SYSTEM_MESSAGES] = commonUIComponents.get(
  Displays.CommonDisplays.SYSTEM_MESSAGES
);

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
              ...sohComponents.get(Displays.SohDisplays.SOH_OVERVIEW),
              height: 30
            }
          ]
        },
        {
          type: 'column',
          content: [
            {
              ...sohComponents.get(Displays.SohDisplays.STATION_STATISTICS)
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
 * The Golden Layout context for the SOH UI.
 * Note: Defines the Application Menu structure.
 */
const glComponents = (store: Redux.Store<AppState>): GLMap =>
  new Map<string, GLComponentValue>([
    [
      Displays.CommonDisplays.SYSTEM_MESSAGES,
      {
        id: components[Displays.CommonDisplays.SYSTEM_MESSAGES],
        value: wrap(CommonUIComponents.SystemMessage, store)
      }
    ],
    [
      'SOH',
      new Map([
        [
          components[Displays.SohDisplays.SOH_OVERVIEW].component,
          {
            id: components[Displays.SohDisplays.SOH_OVERVIEW],
            value: wrap(SohOverview, store)
          }
        ],
        [
          components[Displays.SohDisplays.STATION_STATISTICS].component,
          {
            id: components[Displays.SohDisplays.STATION_STATISTICS],
            value: wrap(StationStatistics, store)
          }
        ],
        [
          components[Displays.SohDisplays.SOH_LAG].component,
          {
            id: components[Displays.SohDisplays.SOH_LAG],
            value: wrap(SohLag, store)
          }
        ],
        [
          components[Displays.SohDisplays.SOH_MISSING].component,
          {
            id: components[Displays.SohDisplays.SOH_MISSING],
            value: wrap(SohMissing, store)
          }
        ],
        [
          components[Displays.SohDisplays.SOH_ENVIRONMENT].component,
          {
            id: components[Displays.SohDisplays.SOH_ENVIRONMENT],
            value: wrap(SohEnvironment, store)
          }
        ],
        [
          components[Displays.SohDisplays.SOH_ENVIRONMENT_TRENDS].component,
          {
            id: components[Displays.SohDisplays.SOH_ENVIRONMENT_TRENDS],
            value: wrap(SohEnvironmentHistory, store)
          }
        ],
        [
          components[Displays.SohDisplays.SOH_LAG_TRENDS].component,
          {
            id: components[Displays.SohDisplays.SOH_LAG_TRENDS],
            value: wrap(SohLagHistory, store)
          }
        ],
        [
          components[Displays.SohDisplays.SOH_MISSING_TRENDS].component,
          {
            id: components[Displays.SohDisplays.SOH_MISSING_TRENDS],
            value: wrap(SohMissingHistory, store)
          }
        ],
        [
          components[Displays.SohDisplays.SOH_TIMELINESS_TRENDS].component,
          {
            id: components[Displays.SohDisplays.SOH_TIMELINESS_TRENDS],
            value: wrap(SohTimelinessHistory, store)
          }
        ],
        [
          components[Displays.SohDisplays.SOH_TIMELINESS].component,
          {
            id: components[Displays.SohDisplays.SOH_TIMELINESS],
            value: wrap(SohTimeliness, store)
          }
        ],
        [
          components[Displays.SohDisplays.SOH_MAP].component,
          {
            id: components[Displays.SohDisplays.SOH_MAP],
            value: wrap(SohMap, store)
          }
        ]
      ])
    ]
  ]);

/** The Golden Layout context for the SOH UI */
export const glContextData = (store: Redux.Store<AppState>): GoldenLayoutContextData => ({
  glComponents: glComponents(store),
  gl: undefined,
  glRef: undefined,
  config: {
    components,
    workspace: defaultGoldenLayoutConfig
  },
  supportedUserInterfaceMode: UserProfileTypes.UserMode.SOH
});
