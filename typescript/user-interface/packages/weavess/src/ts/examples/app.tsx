import '@blueprintjs/core/src/blueprint.scss';
import '@blueprintjs/datetime/src/blueprint-datetime.scss';
import '../../scss/weavess.scss';
import './style.scss';

import { Button, ButtonGroup, Classes, Colors } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Link, Route } from 'react-router-dom';

import { EventsExample } from './example-events';
import { WeavessFlatLineExample } from './example-flat-line';
import { WeavessLineChartExample } from './example-line-chart';
import { MultipleDisplaysExample } from './example-multiple-displays';
import { RecordSectionExample } from './example-record-section';
import { WeavessExample } from './example-weavess';
import { Home } from './home';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).React = React;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).ReactDOM = ReactDOM;

export const App = (): JSX.Element => (
  <div id="app-content">
    <HashRouter>
      <div
        className={Classes.DARK}
        style={{
          height: '100%',
          width: '100%',
          padding: '0.5rem',
          color: Colors.GRAY4
        }}
      >
        <ButtonGroup minimal>
          <Button icon={IconNames.HOME}>
            <Link to="/">Home</Link>
          </Button>
          <Button icon={IconNames.CHART}>
            <Link to="/WeavessExample"> Weavess Example</Link>
          </Button>
          <Button icon={IconNames.CHART}>
            <Link to="/WeavessFlatLineExample"> Weavess Flat Line Example</Link>
          </Button>
          <Button icon={IconNames.CHART}>
            <Link to="/WeavessLineChartExample"> Weavess Line Chart Example</Link>
          </Button>
          <Button icon={IconNames.MULTI_SELECT}>
            <Link to="/MultipleDisplaysExample"> Multiple Displays Example</Link>
          </Button>
          <Button icon={IconNames.TIMELINE_EVENTS}>
            <Link to="/EventsExample"> Events</Link>
          </Button>
          <Button icon={IconNames.RECORD}>
            <Link to="/RecordSectionExample"> Record Section Example</Link>
          </Button>
        </ButtonGroup>

        <hr />
        <Route exact path="/" component={Home} />
        <Route exact path="/WeavessExample" component={WeavessExample} />
        <Route exact path="/WeavessFlatLineExample" component={WeavessFlatLineExample} />
        <Route exact path="/WeavessLineChartExample" component={WeavessLineChartExample} />
        <Route exact path="/MultipleDisplaysExample" component={MultipleDisplaysExample} />
        <Route exact path="/EventsExample" component={EventsExample} />
        <Route exact path="/RecordSectionExample" component={RecordSectionExample} />
      </div>
    </HashRouter>
  </div>
);
