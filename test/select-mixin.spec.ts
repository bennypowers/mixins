import {
  expect,
  defineCE,
  assertInstantiation,
  assertProperties,
  element,
  getDefaultExport,
  setupTestWithInput,
} from '@pwrs/test-helpers';

import { LitElement, html } from 'lit-element';
import { propOr } from 'crocks';
import { log } from '../log';

import { SelectMixin } from '../src/select';

// Utility functions for tests
const getLocalName = propOr('', 'localName');

function selectNext() {
  element.selectNext();
}

function selectPrevious() {
  element.selectPrevious();
}

function focusNext() {
  element.focusNext();
}

function focusPrevious() {
  element.focusPrevious();
}

/**
 * A Test item which fulfils the minimal criteria,
 * namely, emitting an  `item-selected` event
 */
customElements.define('test-item', class TestItem extends HTMLElement {
  constructor() {
    super();
    this.onclick = this.dispatchEvent.bind(this, new CustomEvent('item-selected'));
  }
});

// setup functions

/** Testing element tag name */
let SelectElement;

async function setupFixture(tagName) {
  return setupTestWithInput({
    tagName,
    properties: await import(`../../test/select-mixin/${this.test.parent.title}/input.json`)
      .then(getDefaultExport)
      .catch(() => ({})),
    template: await import(`../../test/select-mixin/${this.test.parent.title}/template.html`)
      .then(getDefaultExport)
      .then(template => template.replace('select-element', tagName))
      .catch(() => undefined),
  });
}

async function setupTest() {
  SelectElement = defineCE(
    /**
     * Test element which fulfils the minimal criteria for its internal DOM.
     * See `render` method for exemplary DOM.
     * @mixes SelectMixin~mixin
     */
    class TestElement extends SelectMixin(LitElement) {
      // setup for tests which depend on items.
      static allowedChildren = ['test-item'];

      /**
       * Minimal required dom
       * @inheritdoc
       */
      render() {
        return html`<slot @slotchange="${this.onContentSlotchange}"></slot>`;
      }
    }
  );
  return await setupFixture.call(this, SelectElement);
}

function setupWithAllowedChildren(allowedChildren) {
  return async function() {
    SelectElement = defineCE(class extends SelectMixin(LitElement) {
      static allowedChildren = allowedChildren;

      render() {
        return html`<slot @slotchange="${this.onContentSlotchange}"></slot>`;
      }
    });
    return setupFixture.call(this, SelectElement);
  };
}

async function teardownFixture() {
  log.level = 'silent';
}

async function setupAllowedItems() {
  element.innerHTML = `
    <test-item></test-item>
    <best-item></best-item>
    <hooli-phone></hooli-phone>
  `;
  await element.updateComplete;
}

// actions

function selectIndex(index) {
  return function() {
    element.selectIndex(index);
  };
}

function focusIndex(index) {
  return function() {
    element.focusIndex(index);
  };
}

function clickItemAtIndex(index) {
  return function clickItem() {
    element.items[index].click();
  };
}

function dispatchKeydown(key) {
  return element.dispatchEvent(new KeyboardEvent('keydown', { key }));
}

function setupKeyEvent(key) {
  return async function() {
    dispatchKeydown(key);
    await element.updateComplete;
  };
}

describe('SelectMixin', function() {
  // assertions

  // TODO(bennyp): test for implementation of required DOM, add warning logs.

  beforeEach(setupTest);
  afterEach(teardownFixture);

  it('Instantiates without error', function() {
    // because of the many calls to defineCE, it's best to defer this
    // in a function
    assertInstantiation(SelectElement)();
  });

  describe('setting private _items property', function() {
    beforeEach(async function() {
      element._items = NaN;
      await element.updateComplete;
    });

    it('handles private manipulation shenanigans', async function() {
      expect(element.items).to.be.an.instanceof(Array);
    });
  });

  describe('when setting static allowedChildren', function() {
    describe('as array', function() {
      beforeEach(setupWithAllowedChildren(['test-item', 'best-item']));
      describe('with two allowed and one disallowed children', function() {
        beforeEach(setupAllowedItems);
        it('only includes allowed items in list', function() {
          expect(element.items.length).to.equal(2);
          expect(element.items.map(getLocalName).includes('hooli-phone')).to.be.false;
        });
      });
    });

    describe('as regexp', function() {
      beforeEach(setupWithAllowedChildren(/item/));
      describe('with two allowed and one disallowed children', function() {
        beforeEach(setupAllowedItems);
        it('only includes allowed items in list', function() {
          expect(element.items.length).to.equal(2);
          expect(element.items.map(getLocalName).includes('hooli-phone')).to.be.false;
        });
      });
    });

    describe('as empty object', function() {
      beforeEach(setupWithAllowedChildren({}));
      describe('with three children', function() {
        beforeEach(setupAllowedItems);
        it('allows all children in list', function() {
          expect(element.items.length).to.equal(3);
        });
      });
    });

    describe('as integer', function() {
      beforeEach(setupWithAllowedChildren(1));
      describe('with three children', function() {
        beforeEach(setupAllowedItems);
        it('allows all children in list', function() {
          expect(element.items.length).to.equal(3);
        });
      });
    });

    describe('as NaN', function() {
      beforeEach(setupWithAllowedChildren(NaN));
      describe('with three children', function() {
        beforeEach(setupAllowedItems);
        it('allows all children in list', function() {
          expect(element.items.length).to.equal(3);
        });
      });
    });
  });

  describe('read only properties', function() {
    it('has read-only value property', async function() {
      const { value: expected } = element;
      element.value = 'foo';
      expect(element.value).to.equal(expected);
    });

    it('has read-only items property', async function() {
      const { items: expected } = element;
      element.items = ['one', 'two'];
      expect(element.items).to.equal(expected);
    });

    it('has read-only selectedIndex property', async function() {
      const { selectedIndex: expected } = element;
      element.selectedIndex = 1000;
      expect(element.selectedIndex).to.equal(expected);
    });

    it('has read-only selectedItem property', async function() {
      const { selectedItem: expected } = element;
      element.selectedItem = document.createElement('div');
      expect(element.selectedItem).to.equal(expected);
    });

    it('has read-only focusedIndex property', async function() {
      const { focusedIndex: expected } = element;
      element.focusedIndex = 1;
      expect(element.focusedIndex).to.equal(expected);
    });

    it('has read-only focusedItem property', async function() {
      const { focusedItem: expected } = element;
      element.focusedItem = document.createElement('div');
      expect(element.focusedItem).to.equal(expected);
    });
  });

  describe('with three items', function() {
    beforeEach(setupTest);
    describe('clicking on an item', function() {
      beforeEach(clickItemAtIndex(0));
      it('selects the first item', function() {
        expect(element.selectedItem).to.equal(element.items[0]);
      });
    });

    describe('when focused on the first item', function() {
      const INDEX = 0;
      beforeEach(focusIndex(INDEX));

      describe('calling focusPrevious()', function() {
        beforeEach(focusPrevious);
        it('wraps focus around to the last item', assertProperties(() => ({
          focusedItem: element.items[element.items.length - 1],
        })));
      });

      describe('calling focusNext()', function() {
        beforeEach(focusNext);
        it('wraps focus around to the last item', assertProperties(() => ({
          focusedItem: element.items[INDEX + 1],
        })));
      });
    });

    describe('when focused on item 2 of 3', function() {
      const INDEX = 1;
      beforeEach(focusIndex(INDEX));

      describe('calling focusPrevious()', function() {
        beforeEach(focusPrevious);
        it('focuses the previous item', assertProperties(() => ({
          focusedItem: element.items[INDEX - 1],
        })));
      });

      describe('calling focusNext()', function() {
        beforeEach(focusNext);
        it('focuses the next item', assertProperties(() => ({
          focusedItem: element.items[INDEX + 1],
        })));
      });

      describe('on ArrowUp', function() {
        beforeEach(setupKeyEvent('ArrowUp'));
        it('focuses the previous item', assertProperties(() => ({
          focusedItem: element.items[INDEX - 1],
        })));
      });

      describe('on ArrowDown', function() {
        beforeEach(setupKeyEvent('ArrowDown'));
        it('focuses the next item', assertProperties(() => ({
          focusedItem: element.items[INDEX + 1],
        })));
      });

      describe('on Enter', function() {
        beforeEach(setupKeyEvent('Enter'));
        it('selects the focused item', assertProperties(() => ({
          selectedItem: element.items[INDEX],
          selectedIndex: INDEX,
        })));
      });

      describe('on Space', function() {
        beforeEach(setupKeyEvent(' '));
        it('selects the focused item', assertProperties(() => ({
          selectedItem: element.items[INDEX],
          selectedIndex: INDEX,
        })));
      });
    });

    describe('when focused on the last item', function() {
      const INDEX = 2;
      beforeEach(focusIndex(INDEX));
      describe('calling focusNext()', function() {
        beforeEach(focusNext);
        it('wraps around to the first item', assertProperties({ focusedIndex: 0 }));
      });

      describe('calling focusPrevious()', function() {
        beforeEach(focusPrevious);
        it('focuses the previous item', assertProperties({ focusedIndex: INDEX - 1 }));
      });
    });

    describe('with first item selected', function() {
      const INDEX = 0;
      beforeEach(selectIndex(INDEX));

      describe('calling selectNext()', function() {
        beforeEach(selectNext);
        it('selects the next item', assertProperties({ selectedIndex: INDEX + 1 }));
      });

      describe('calling selectPrevious()', function() {
        beforeEach(selectPrevious);
        it('wraps back to select last item', assertProperties({ selectedIndex: 2 }));
      });

      describe('clicking second item', function() {
        const INDEX = 1;
        beforeEach(clickItemAtIndex(INDEX));
        afterEach(clickItemAtIndex(0));

        it('sets selectedItem', async function() {
          expect(element.selectedItem).to.equal(element.items[INDEX]);
        });

        it('sets selectedIndex', async function() {
          expect(element.selectedIndex).to.equal(INDEX);
        });
      });
    });

    describe('with last item selected', function() {
      beforeEach(selectIndex(2));

      describe('calling selectNext()', function() {
        beforeEach(selectNext);
        it('wraps around to select first item', assertProperties({ selectedIndex: 0 }));
      });

      describe('selectPrevious()', function() {
        beforeEach(selectPrevious);
        it('selectes previous item', assertProperties({ selectedIndex: 1 }));
      });
    });
  });
});
