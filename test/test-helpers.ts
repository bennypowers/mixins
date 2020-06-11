// @ts-nocheck
import { pathOr } from 'ramda';
import { expect, fixture, aTimeout, oneEvent } from '@open-wc/testing';
import { LitElement } from 'lit-element';
import { SelectMixinElement } from '../select';
export * from '@open-wc/testing';

const failure = Symbol('Property Does Not Exist');

/**
 * Test Fixture
 */
export let element: SelectMixinElement;

/**
 * If a promise needs to be cached in an action before a test,
 * cache it here.
 */
export let promise: Promise<unknown>;

/**
 * Gets the detail property
 */
const getDetail = <T = unknown>({ detail }: CustomEvent<T>): T => detail;

/**
 * Creates a Mocha callback which clicks a shadow root element
 */
export const clickChild = (selector: string): Function => function clickChild() {
  element.querySelector(selector).click();
};

/**
 * Assigns a property entry to the fixtured element
 */
function assignPropEntry([name, value]: [string, any]) {
  element[name] = value;
}

/**
 * Assigns an object-mapping of properties to the element.
 */
function performAssignProperties(properties: object) {
  Object.entries(properties)
    .forEach(assignPropEntry);
}

function setAttribute(entry) {
  element.setAttribute(...entry);
}

function validAttribute([name]) {
  return !!name;
}

/**
 * Sets an object-mapping of attributes on the element.
 * @param  {Object} attributes
 */
function performSetAttributes(attributes: object) {
  Object.entries(attributes)
    .filter(validAttribute)
    .forEach(setAttribute);
}

/**
 * Creates a Mocha callback that sets an
 * object mapping of attributes on the element
 * Then waits for the element to update.
 * @param  {Object} attributes
 * @return {Function} Mocha callback
 */
export function setAttributes(attributes: object): Function {
  return async function() {
    performSetAttributes(attributes);
    await element.updateComplete;
  };
}

/**
 * Creates a mocha callback that asserts that an element passes basic accessibility tests.
 * Does not replace serious a11y audits.
 */
export function assertA11y(options: AxeOptions) {
  return async function assertA11y() {
    await element.updateComplete;
    await expect(element).to.be.accessible(options);
  }
}

/**
 * Asserts that an element instantiates without error.
 */
export function assertInstantiation(...args): Function {
  return async function() {
    await setupElement(...args);
    expect(element.shadowRoot).to.be.ok;
  };
}

/**
 * Asserts the conventionally defined rendered DOM for a test case.
 * @param html Expected semantic DOM string that represents shadow DOM for an element's test case
 */
export async function assertRenderWithHTML(html: string, { shadow = true, chaiDomDiffOpts = { stripEmptyAttributes: ['class', 'id', 'style'] } } = {}) {
  await element.updateComplete;
  if (shadow) expect(element).shadowDom.to.equal(html, chaiDomDiffOpts);
  else expect(element).dom.to.equal(html, chaiDomDiffOpts);
}

/**
 * Creates a Mocha callback to assert an object mapping of properties.
 *
 * Can take either a statically defined object mapping,
 * or a function which returns such a mapping.
 */
/**
 * Creates a Mocha callback that asserts that a
 * value at a given deep path deeply
 * equals some given value.
 * @param  {Array<String|Number>} path  e.g. ['shadowInputs', 1, 'checked']
 * @param  {any}                  expected expected to check
 * @return {Function}             Mocha callback
 */
export function assertDeepProperty({ path, expected }: Array<string | number>): Function {
  const getDeep = pathOr(failure, path);
  return async function() {
    await element.updateComplete;
    const actual = getDeep(element);
    expect(actual).to.eql(expected);
  };
}

export function assertStyles(descriptors) {
  return async function() {
    await element.updateComplete;
    descriptors.forEach(({ selector, property, value }) => {
      const selected = element.shadowRoot.querySelector(selector);
      if (!selected) throw new Error('Selected element does not exist');
      expect(getComputedStyle(selected).getPropertyValue(property))
        .to.equal(value);
    });
  };
}

/**
 * Asserts a single attribute entry pair.
 *
 * Will wait for element to update before asserting.
 *
 * Boolean values will be checked with `hasAttribute`
 * Other values will be stringified first.
 * @param  {[String, any]} entry
 */
async function assertElementAttributeEntry([name, value]: [string, any]) {
  await element.updateComplete;
  if (value === true) expect(element).to.have.attribute(name);
  if (value === false) expect(element).to.not.have.attribute(name);
  expect(element.getAttribute(name)).to.eql(`${value}`);
}

/**
 * Creates a Mocha callback to assert an object mapping of attributes.
 *
 * Can take either a statically defined object mapping,
 * or a function which returns such a mapping.
 *
 * Boolean values will be checked with `hasAttribute`
 * Other values will be stringified first.
 * @param  {Object|Function} _attributes Object mapping or Function
 * @return {Function} Mocha Callback
 */
export function assertAttributes(_attributes: object | Function): Function {
  return async function() {
    await element.updateComplete;
    const attributes = typeof _attributes === 'function'
      ? _attributes()
      : _attributes;
    const entries = Object.entries(attributes || {});
    if (!attributes || !entries.length) throw new Error(`assertProperties: First argument must be a non-empty object mapping of attributes\nReceived: ${JSON.stringify(attributes, null, 2)}`);
    await element.updateComplete;
    entries.forEach(assertElementAttributeEntry);
  };
}


/**
 * Asserts that an event fires given some action
 *
 * @param  {Object}   args            assertion parameters
 * @param  {String}   args.name       Event name to test for
 * @param  {Function} args.action     Function which performs the predicated action on the element
 * @param  {any}      [args.expected] Expected value for the event. If a function, will be applied to `element` first
 * @param  {Function} [args.getter]   Function which accesses the expected property of the element. Defaults to `({ detail }) => detail`
 * @return {Function}                 Mocha callback
 *
 * @example it('fires `ping` event on click', assertEvent({ name: 'ping', action: clickElement }))
 * @example it('fires `send-document` event with input on click submit button', assertEvent({ name: 'send-document', action: clickSubmit, expected: 'https://cdn.forter.com/documents/C3UIGJKL7D' }))
 * @example it('fires `change` event with text on click', assertEvent({ name: 'change', action: clickElement, getter: ({ detail: { text } }) => text, expected: 'test input' }))
 */
export function assertEvent({
  action,
  expected = null,
  getter = getDetail,
  name,
}): Function {
  return async function() {
    if (!element) throw new Error('Could not prepare event: no element');
    setTimeout(() => action());
    const event = await oneEvent(element, name);
    expect(getter(event)).to.eql(typeof expected === 'function' ? expected(element) : expected);
  };
}

/**
 * Creates a Mocha callback that caches an event as
 * the `promise`.
 * @param  {String} type Event Name
 * @return {Function}    Mocha Callback
 */
export function cacheEventPromise(type: string): Function {
  return function() {
    promise = oneEvent(element, type);
  };
}

/**
 * Creates a Mocha callback that schedules an action
 * @param  {Function} fn      Action to perform
 * @param  {Number}   [timeout] Optional timeout
 * @return {Function} Mocha callback
 */
export function asyncAction(fn: Function, timeout: number): Function {
  return function() {
    setTimeout(() => fn(), timeout);
  };
}

/**
 * Creates an async Mocha callback to await
 * Promise-returning Mocha callbacks left-to-right.
 * @param  {Array<Function>} fns async mocha callbacks
 * @return {Function}     The mocha callback
 * @example
 * beforeEach(sequentially(clickButton, updateComplete, clickButton))
 */
export function sequentially(...fns: Array<Function>): Function {
  return async function() {
    await fns.reduce(
      (p, f) =>
        p.then(() => f.call(this)),
      Promise.resolve()
    );
  };
}

/**
 * Awaits the element's next update.
 * @return {Promise<any>}
 */
export async function updateComplete(): Promise<any> {
  return await element.updateComplete;
}

/**
 * Creates a Mocha callback that caches the return value of a mocha callback
 * as the promise
 * @param  {Function} fn mocha callback
 * @return {Function}    mocha callback
 */
export function cachePromise(fn: Function): Function {
  return function() {
    promise = fn();
  };
}

/**
 * Creates a Mocha callback that asserts that the promise
 * resolves as a given value
 * @param {Function} f mapping function
 * @param {any} as value to resolve as
 * @return {Function} Mocha callback
 */
export const mapResolveAs = (f: Function): Function => as => async function() {
  await element.updateComplete;
  expect(f(await promise)).to.eql(as);
};

/**
 * Creates a Mocha callback that asserts that the promise
 * resolves as a given value
 * @param {any} as value to resolve as
 * @return {Function} Mocha callback
 */
export const resolveAs = mapResolveAs(x => x);

export const resolvePathAs = (path, as) => {
  const resolve = mapResolveAs(pathOr(failure, path));
  return resolve(as);
};

/**
 * Creates a Mocha callback that sleeps for a given number of ms
 * @param  {Number} ms Milliseconds
 * @return {Function}   Mocha callback
 */
export const wait = (ms: number): Function => () => aTimeout(ms);

export const getDefaultExport = m => m.default;

/** Deletes the references to `element` and `promise` */
export function tearDownFixture() {
  element = undefined;
  promise = undefined;
}

afterEach(tearDownFixture);
