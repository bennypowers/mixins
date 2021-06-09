import { expect, defineCE, fixture } from '@open-wc/testing';

import { LitElement, html } from 'lit';

import { SelectMixin, SelectMixinElement } from '../select';

let element: SelectMixinElement;

async function updateComplete(): Promise<any> {
  return await element.updateComplete;
}

// Utility functions for tests
const getLocalName = x => x.localName;

async function selectNext() {
  element.selectNext();
  await element.updateComplete;
}

async function selectPrevious() {
  element.selectPrevious();
  await element.updateComplete;
}

async function focusNext() {
  element.focusNext();
  await element.updateComplete;
}

async function focusPrevious() {
  element.focusPrevious();
  await element.updateComplete;
}

/**
 * A Test item which fulfils the minimal criteria,
 * namely, emitting an  `item-selected` event
 */
customElements.define('test-item', class TestItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.shadowRoot.innerHTML = `<button></button>`;
    this.addEventListener('click', () => {
      if (this.hasAttribute('selected')) this.removeAttribute('selected');
      else this.setAttribute('selected', '');
    });
  }
});

// setup functions

async function setupTest() {
  const SelectElement = defineCE(
    /**
     * Test element which fulfils the minimal criteria for its internal DOM.
     * See `render` method for exemplary DOM.
     */
    class TestElement extends SelectMixin(LitElement) {
      // setup for tests which depend on items.
      static allowedChildren = ['test-item'];

      /**
       * Minimal required dom
       * @inheritdoc
       */
      render() {
        return html`<slot></slot>`;
      }
    }
  );

  element = await fixture<SelectMixinElement>(`<${SelectElement}></${SelectElement}>`);

  await element.updateComplete;

  return element;
}

function setupWithAllowedChildren(allowedChildren: string[]|RegExp) {
  return async function() {
    class SelectElement extends SelectMixin(LitElement) {
      static allowedChildren = allowedChildren;

      render() {
        return html`<slot></slot>`;
      }
    }
    const tag = defineCE(SelectElement);

    element = await fixture<SelectMixinElement>(`<${tag}></${tag}>`);
    await element.updateComplete;
  };
}

async function teardownFixture() {
  element = null;
}

async function setupAllowedItems() {
  element.innerHTML = `
    <test-item></test-item>
    <best-item></best-item>
    <hooli-phone></hooli-phone>
  `;
  await element.updateComplete;
}

async function setupThreeItems() {
  element.innerHTML = `
    <test-item></test-item>
    <test-item></test-item>
    <test-item></test-item>
  `;
  await element.updateComplete;
}

// actions

function selectIndex(index) {
  return function() {
    element.selectIndex(index);
  };
}

function focusIndex(index: number) {
  return function() {
    element.focusIndex(index);
  };
}

function clickItemAtIndex(index: number) {
  return async function clickItem() {
    element.items[index].click();
    await element.updateComplete;
  };
}

function dispatchKeydown(key: string) {
  return element.dispatchEvent(new KeyboardEvent('keydown', { key }));
}

function setupKeyEvent(key: string) {
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
    const K = class extends SelectMixin(LitElement) {};
    expect(() => new K()).to.not.throw;
  });

  describe('setting private _items property', function() {
    beforeEach(async function() {
      // @ts-expect-error
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
      // @ts-expect-error
      beforeEach(setupWithAllowedChildren({}));
      describe('with three children', function() {
        beforeEach(setupAllowedItems);
        it('allows all children in list', function() {
          expect(element.items.length).to.equal(3);
        });
      });
    });

    describe('as integer', function() {
      // @ts-expect-error
      beforeEach(setupWithAllowedChildren(1));
      describe('with three children', function() {
        beforeEach(setupAllowedItems);
        it('allows all children in list', function() {
          expect(element.items.length).to.equal(3);
        });
      });
    });

    describe('as NaN', function() {
      // @ts-expect-error
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
      // @ts-expect-error
      element.value = 'foo';
      expect(element.value).to.equal(expected);
    });

    it('has read-only items property', async function() {
      const { items: expected } = element;
      // @ts-expect-error
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
      // @ts-expect-error
      element.selectedItem = document.createElement('div');
      expect(element.selectedItem).to.equal(expected);
    });

    it('has read-only focusedIndex property', async function() {
      const { focusedIndex: expected } = element;
      // @ts-expect-error
      element.focusedIndex = 1;
      expect(element.focusedIndex).to.equal(expected);
    });

    it('has read-only focusedItem property', async function() {
      const { focusedItem: expected } = element;
      // @ts-expect-error
      element.focusedItem = document.createElement('div');
      expect(element.focusedItem).to.equal(expected);
    });
  });

  describe('with three items', function() {
    beforeEach(setupTest);
    beforeEach(setupThreeItems);
    describe('clicking on an item', function() {
      beforeEach(clickItemAtIndex(0));
      beforeEach(updateComplete);
      it('selects the first item', function() {
        expect(element.selectedItem).to.equal(element.items[0]);
      });
    });

    describe('when focused on the first item', function() {
      const INDEX = 0;
      beforeEach(focusIndex(INDEX));

      describe('calling focusPrevious()', function() {
        beforeEach(focusPrevious);
        it('wraps focus around to the last item', function() {
          expect(element.focusedItem).to.equal(element.items[element.items.length - 1]);
        });
      });

      describe('calling focusNext()', function() {
        beforeEach(focusNext);
        it('wraps focus around to the last item', function() {
          expect(element.focusedItem).to.equal(element.items[INDEX + 1]);
        });
      });
    });

    describe('when focused on item 2 of 3', function() {
      const INDEX = 1;
      beforeEach(focusIndex(INDEX));

      describe('calling focusPrevious()', function() {
        beforeEach(focusPrevious);
        it('focuses the previous item', function() {
          expect(element.focusedItem).to.equal(element.items[INDEX - 1]);
        });
      });

      describe('calling focusNext()', function() {
        beforeEach(focusNext);
        it('focuses the next item', function() {
          expect(element.focusedItem).to.equal(element.items[INDEX + 1]);
        });
      });

      describe('on ArrowUp', function() {
        beforeEach(setupKeyEvent('ArrowUp'));
        it('focuses the previous item', function() {
          expect(element.focusedItem).to.equal(element.items[INDEX - 1]);
        });
      });

      describe('on ArrowDown', function() {
        beforeEach(setupKeyEvent('ArrowDown'));
        it('focuses the next item', function() {
          expect(element.focusedItem).to.equal(element.items[INDEX + 1]);
        });
      });

      describe('on Enter', function() {
        beforeEach(setupKeyEvent('Enter'));
        it('selects the focused item', function() {
          expect(element.selectedItem).to.equal(element.items[INDEX]);
          expect(element.selectedIndex).to.equal(INDEX);
        });
      });

      describe('on Space', function() {
        beforeEach(setupKeyEvent(' '));
        it('selects the focused item', function() {
          expect(element.selectedItem).to.equal(element.items[INDEX]);
          expect(element.selectedIndex).to.equal(INDEX);
        });
      });
    });

    describe('when focused on the last item', function() {
      const INDEX = 2;
      beforeEach(focusIndex(INDEX));
      describe('calling focusNext()', function() {
        beforeEach(focusNext);
        it('wraps around to the first item', function() {
          expect(element.focusedIndex).to.equal(0);
        });
      });

      describe('calling focusPrevious()', function() {
        beforeEach(focusPrevious);
        it('focuses the previous item', function() {
          expect(element.focusedIndex).to.equal(INDEX - 1);
        });
      });
    });

    describe('with first item selected', function() {
      const INDEX = 0;
      beforeEach(selectIndex(INDEX));

      describe('calling selectNext()', function() {
        beforeEach(selectNext);
        it('selects the next item', function() {
          expect(element.selectedIndex).to.equal(INDEX + 1);
        });
      });

      describe('calling selectPrevious()', function() {
        beforeEach(selectPrevious);
        it('wraps back to select last item', function() {
          expect(element.selectedIndex).to.equal(2);
        });
      });

      describe('calling selectIndex(1)', function() {
        const INDEX = 1;
        beforeEach(() => element.selectIndex(INDEX));

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
        it('wraps around to select first item', function() {
          expect(element.selectedIndex).to.equal(0);
        });
      });

      describe('calling selectPrevious()', function() {
        beforeEach(selectPrevious);
        it('selects previous item', function() {
          expect(element.selectedIndex).to.equal(1);
        });
      });
    });
  });
});
