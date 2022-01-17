import '@blueprintjs/core/src/blueprint.scss';
import '@blueprintjs/datetime/src/blueprint-datetime.scss';
import '../../scss/ui-core-components.scss';
import './style.scss';

import { Button, ButtonGroup, Classes, Colors } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Link, Route } from 'react-router-dom';

import { DropDownExample } from './drop-down-example';
import { FilterableOptionListExample } from './filterable-option-list-example';
import { FormNoInputExample } from './form-no-input-example';
import { FormSubmittableExample } from './form-submittable-example';
import { Home } from './home';
import { IntervalPickerExample } from './interval-picker-example';
import { TableExample } from './table-example';
import { TimePickerExample } from './time-picker-example';
import { ToolbarExample } from './toolbar-example';

(window as any).React = React;
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
        </ButtonGroup>

        <hr />
        <Route exact path="/" component={Home} />
        <Route exact path="/Table" component={TableExample} />
        <Route exact path="/FormSubmittable" component={FormSubmittableExample} />
        <Route exact path="/FormNoInput" component={FormNoInputExample} />
        <Route exact path="/DropDownExample" component={DropDownExample} />
        <Route exact path="/IntervalPickerExample" component={IntervalPickerExample} />
        <Route exact path="/TimePickerExample" component={TimePickerExample} />
        <Route exact path="/ToolbarExample" component={ToolbarExample} />
        <Route exact path="/FilterableOptionListExample" component={FilterableOptionListExample} />
      </div>
    </HashRouter>
  </div>
);
