// combine scss of all components
// !THE ORDER OF IMPORTS MATTERS FOR OVERRIDING STYLES
/* eslint-disable import/order */
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@gms/weavess/src/scss/weavess.scss';
// core components styles need to override blueprint and weavess
import '@gms/ui-core-components/src/scss/ui-core-components.scss';
// eslint-disable-next-line import/no-unresolved
import 'cesium/Widgets/widgets.css';
import '../../../css/soh-app.scss';

import { AppState, createStore } from '@gms/ui-state';
import { isDarkMode, replaceFavIcon } from '@gms/ui-util';
import * as JQuery from 'jquery';
import React from 'react';
import ReactDom from 'react-dom';
import * as Redux from 'redux';

import { checkEnvConfiguration } from '../check-env-configuration';
import { checkUserAgent } from '../check-user-agent';
import { configureElectron } from '../configure-electron';
import { configureReactPerformanceDevTool } from '../configure-react-performance-dev-tool';
import { App } from './app';
/* eslint-enable import/order */

// required for golden-layout
(window as any).React = React;
(window as any).ReactDOM = ReactDom;
(window as any).$ = JQuery;

window.onload = () => {
  checkEnvConfiguration();
  checkUserAgent();
  configureReactPerformanceDevTool();

  // if the user is in dark mode, we replace the favicon with a lighter icon so it is visible
  if (isDarkMode()) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, global-require, import/no-unresolved
    const logo = require('~resources/favicon--dark-192.png');
    replaceFavIcon(logo);
  }

  const store: Redux.Store<AppState> = createStore();
  ReactDom.render(App({ store }), document.getElementById('app'));
};

configureElectron();
