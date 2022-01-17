/* eslint-disable import/no-extraneous-dependencies */
import { mount, render, shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import { GlobalWithFetchMock } from 'jest-fetch-mock';

const customGlobal: GlobalWithFetchMock = global as GlobalWithFetchMock;
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
customGlobal.fetch = require('jest-fetch-mock');

customGlobal.fetchMock = customGlobal.fetch;

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
require('jest-canvas-mock');

// TODO: Remove this `raf` polyfill once the below issue is sorted
// https://github.com/facebookincubator/create-react-app/issues/3199#issuecomment-332842582
// @see https://medium.com/@barvysta/warning-react-depends-on-requestanimationframe-f498edd404b3
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny: any = global;
// eslint-disable-next-line no-multi-assign
export const raf = (globalAny.requestAnimationFrame = cb => {
  setTimeout(cb, 0);
});

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Adapter = require('enzyme-adapter-react-16');

// React Enzyme adapter
Enzyme.configure({ adapter: new Adapter() });

// Make Enzyme functions available in all test files without importing
globalAny.shallow = shallow;
globalAny.render = render;
globalAny.mount = mount;
globalAny.toJson = toJson;
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
globalAny.fetch = require('jest-fetch-mock');
