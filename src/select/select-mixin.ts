import type { PropertyValues, LitElement } from 'lit-element';
import { dedupeMixin } from '@open-wc/dedupe-mixin'
import { property, query } from 'lit-element';

import propOr from 'crocks/helpers/propOr';
import compose from 'crocks/helpers/compose';
import not from 'crocks/logic/not';

import bound from 'bind-decorator';

import { FireMixin } from '../fire/fire-mixin';

import { matches, isFocusedOrActive } from '../lib/dom';
import type { Constructor } from '../lib/constructor';
import { elem } from '../lib/pointfree';

type SlotchangeEvent = Event & { target: HTMLSlotElement };

interface Item extends HTMLElement {
  itemIndex: number;
}

const isSlotchangeEvent = (event: unknown): event is SlotchangeEvent =>
  event instanceof Event &&
  event.type !== 'slotchange'

const isAllowedChild = (allowedChildren: string[]|RegExp) => (node: Node): node is Item =>
    !(node instanceof HTMLElement) ? false
  : Array.isArray(allowedChildren) ? allowedChildren.includes(node.tagName.toLowerCase())
  : allowedChildren instanceof RegExp ? !!node.tagName.toLowerCase().match(allowedChildren)
  : true;

const getValue = propOr(null, 'value');

const getIndex = (item: unknown, _index: number, array: unknown[]) =>
  array.indexOf(item);

const hasAttribute = (attr: string) => (element: Element) =>
  element.hasAttribute(attr);

const getItemIndex = propOr(-1, 'itemIndex');

/**
 * Provides methods and properties for a selecting element.
 *
 * The element's shadow root must contain an anonymous slot for items.
 *
 * If you define a static property `allowedChildren` (Array, String, or RegExp), the `items`
 * property will filter for those tag names based on their custom element class' static `is` property
 * or `localName`
 *
 * @example
 * ```html
<my-select>
  #shadow-root
    <slot></slot>
</my-select>
  ```
 */

export const SelectMixin = dedupeMixin(function SelectMixin<
   TBase extends Constructor<LitElement>
 >(superclass: TBase) {
  /**
   * @element
   * @fires select - When an item is selected
   * @extends LitElement
   */
  class SelectMixinElement extends FireMixin(superclass) {
    static allowedChildren: string[]|RegExp = /-/;

    /** @protected */
    itemsMutationObserver: MutationObserver;

    /** @protected */
    _focusedIndex: number;

    /** @protected */
    _focusedItem: Item;

    /** @protected */
    previousSelectedItem: Item | Item[];

    /** @protected */
    previousSelectedIndex: number | number[];

    /**
     * The selectable items
     * @readonly
     * @memberof SelectMixin#
     */
    @property({ type: Array })

    get items(): Item[] {
      return Array.isArray(this._items) ? this._items : [];
    }

    set items(_) {}

    /** @protected */
    _items: Item[] = [];

    /**
     * Whether multiple selections are allowed
     */
    @property({ type: Boolean }) multi: boolean = false;

    /**
     * The index of the focused item
     * @readonly
     */
    @property({ type: Number })

    get focusedIndex() {
      return this.items.indexOf(this.focusedItem);
    }

    set focusedIndex(_) {}

    /**
     * The focused item
     * @readonly
     */
    @property({ type: Object })

    get focusedItem() {
      const [focusedItem] = this.items.filter(matches(':focus, :focus-within'));
      return focusedItem;
    }

    set focusedItem(_) {}

    /**
     * The boolean attribute on items which, when present, indicates that the item is selected.
     */
    @property({ type: String, attribute: 'attribute-for-selected', })
    attributeForSelected: string = 'selected';

    /**
     * The currently selected item's index
     */
    @property({
      type: Number,
      converter: {
        fromAttribute(value, type) {
          return (value.includes(',')) ? value.split(',').map(x => parseInt(x))
          : parseInt(value);
        },
        toAttribute(value, type) {
          return Array.isArray(value) ? value.join(',') : value;
        },
      },
      attribute: 'selected-index',
    })

    get selectedIndex(): number | number[] {
      const { multi, attributeForSelected, items, selectedItem } = this;
      return (
          !multi ? items.indexOf(<Item>selectedItem)
        : items.filter(hasAttribute(attributeForSelected)).map(getIndex)
      );
    }

    set selectedIndex(value) {
        // not an array ? great, select,
        !Array.isArray(value) ? this.setSelectedIndex(value)
        // Array, but not multi, take the first value,
      : !this.multi ? this.setSelectedIndex(value[0])
        // Array and multi ? select all passed values.
      : this.selectMultiIndex(value);
    }

    /**
     * The currently selected Item
     * @readonly
     */
    @property({ type: Object })

    get selectedItem(): Item|Item[] {
      const { multi, attributeForSelected, items } = this;
      return (
          multi ? items.filter(hasAttribute(attributeForSelected))
        : this.querySelector(`[${attributeForSelected}]`) as Item
      );
    }

    set selectedItem(_) {}

    /**
     * Selected Item's Value
     * @readonly
     */
    @property({ type: Object })

    get value(): unknown|unknown[] {
      return (
          this.multi && Array.isArray(this.selectedItem) ? this.selectedItem.map(getValue)
        : getValue(this.selectedItem)
      );
    }

    set value(_) {}

    /**
     * Whether one of the items is the active element (i.e. focused)
     * @type  true when an item is active
     * @readonly
     */
    get hasActiveItem(): boolean {
      return !!(this.items?.some?.(isFocusedOrActive));
    }

    /**
     * The anonymous slot for list items
     * @protected
     */
    @query('slot:not([name])') contentSlot: HTMLSlotElement;

    // LIFECYCLE

    /**
     * Adds event listeners for things like click, select, keydown.
     * Initializes the mutation observer
     * @inheritdoc
     */
    connectedCallback(): void {
      super.connectedCallback();
      this.addEventListener('items-changed', this.onItemsChanged);
      this.addEventListener('keydown', this.onKeydown);
      this.addEventListener('select', this.onSelect);
      this.setAttribute('aria-haspopup', 'true');
      this.initMutationObserver();
    }

    /**
     * Clears event listeners to prevent memory leaks
     * @inheritdoc
     */
    disconnectedCallback(): void {
      super.disconnectedCallback();
      this.removeEventListener('items-changed', this.onItemsChanged);
      this.removeEventListener('keydown', this.onKeydown);
      this.removeEventListener('select', this.onSelect);
      this.itemsMutationObserver.disconnect();
    }

    /** @inheritdoc */
    firstUpdated(changed: PropertyValues): void {
      super.firstUpdated(changed);
      this.contentSlot?.addEventListener?.('slotchange', this.updateItems);
      // let's get this party started
      this.updateItems();
    }

    /** @inheritdoc */
    updated(changed: PropertyValues): void {
      super.updated && super.updated(changed);
      if (changed.has('attributeForSelected')) this.initMutationObserver();
      if (changed.has('selectedItem')) this.selectedItemChanged();
    }

    // PUBLIC METHODS

    /**
     * Updates the read-only `selectedItem` and `selectedIndex` properties
     * Updates the `value` property
     * @param  selectedIndex selectedIndex
     */
    selectIndex(selectedIndex: number): void {
      this.selectedIndex = selectedIndex;
    }

    /**
     * Selects the next item in the list.
     * Wraps around to first item from last.
     */
    selectNext(): void {
      if (this.multi) return;
      const { items: { length }, selectedIndex } = this;
      const lastItemIndex = length - 1;
      const nextIndex =
          selectedIndex === lastItemIndex ? 0
          : typeof selectedIndex === 'number' ? selectedIndex + 1
          // shouldn't get here
          : -1 ;
      this.selectIndex(nextIndex);
    }

    /**
     * Selects the previous item in the list.
     * Wraps around to last item from first.
     */
    selectPrevious(): void {
      if (this.multi) return;
      const { items: { length }, selectedIndex } = this;
      const lastItemIndex = length - 1;
      const previousIndex =
          selectedIndex === 0 ? lastItemIndex
        : typeof selectedIndex === 'number' ? selectedIndex - 1
        // shouldn't get here
        : -1 ;
      this.selectIndex(previousIndex);
    }

    // PRIVATE METHODS

    /**
     * Updates the read-only `focusedIndex` property
     * @param  focusedIndex focusedIndex
     * @protected
     */
    focusIndex(focusedIndex: number): void {
      // Find the item
      const focusedItem = this.items[focusedIndex];
      this.focusItem(focusedItem);
    }

    /**
     * Focuses the next item in the list.
     * Wraps around to first item from last.
     * @protected
     */
    focusNext(): void {
      const { focusedIndex, items: { length } } = this;
      const nextIndex =
          focusedIndex >= (length - 1) ? 0
        : focusedIndex + 1;
      this.focusIndex(nextIndex);
    }

    /**
     * Focuses the previous item in the list.
     * Wraps around to last item from first.
     * @protected
     */
    focusPrevious(): void {
      const { focusedIndex } = this;
      const previousIndex =
          focusedIndex === 0 ? (this.items.length - 1)
        : focusedIndex - 1;
      this.focusIndex(previousIndex);
    }

    /** @protected */
    @bound setItemIndex(element: Item, index: number) {
      element.itemIndex = index;
      element.setAttribute('data-item-index', index.toString());
    }

    /**
     * Manage state by observing which items have the attribute-for-selected,
     * and removing attribute for selected from previously selected items.
     *
     * Caches previous values so that we can call requestUpdate
     * @param  mutationRecords
     * @protected
     */
    @bound mutated(mutationRecords: (MutationRecord & { target: HTMLElement })[]): void {
      const { attributeForSelected, multi } = this;
      let { previousSelectedIndex, previousSelectedItem } = this;

      // if `multi`, the user manages all the state themselves
      if (!multi) {
        // get the item which was just now selected,
        // i.e. the first child which went from not having the attr to having it
        // if no such child exists, we're probably unselecting.
        const { target: selectedItem } = mutationRecords
          .find(({ oldValue, target }: MutationRecord & {target: Item}) =>
            oldValue === null &&
            target.hasAttribute(attributeForSelected)
          ) || {};

        // get the item which was just now unselected,
        // i.e. the first child which went from having the attr to not having it
        // if no such child exists, we're probably selecting - use the cached value
        const { target: previousSelectedItem } = mutationRecords
          .find(({ oldValue, target }: MutationRecord) =>
            oldValue === '' &&
            !(<Item>target).hasAttribute(attributeForSelected)
          ) || { target: <Item>this.previousSelectedItem };

        previousSelectedIndex = this.items.indexOf(<Item>previousSelectedItem);

        // Unselect previous item
        if (previousSelectedItem && previousSelectedItem !== selectedItem)
          previousSelectedItem.removeAttribute(attributeForSelected);
      }

      this.updateSelected({ previousSelectedItem, previousSelectedIndex });
    }

    /**
     * Manage state by observing which items have the attribute-for-selected
     * @protected
     */
    initMutationObserver(): void {
      if (this.itemsMutationObserver) this.itemsMutationObserver.disconnect();
      this.itemsMutationObserver = new MutationObserver(this.mutated);
      this.itemsMutationObserver.observe(this, {
        attributeFilter: [this.attributeForSelected],
        attributeOldValue: true,
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    /**
     * Determines which children are 'items' according to the static 'allowedItems' property
     * Updates the `items` read-only property
     * @fires items-changed
     * @param  maybeEvent slotchange event
     * @protected
     */
    @bound updateItems(maybeEvent?: SlotchangeEvent): void {
      const {
        items: oldItems,
      } = this;


      // get child elements
      const children =
          !isSlotchangeEvent(maybeEvent) ? Array.from(this.children as HTMLCollection)
        : maybeEvent.target.assignedElements()

      const allowedChildren =
        (<typeof SelectMixinElement>this.constructor).allowedChildren

      // filter children for legitimate items
      const items =
        children.filter(isAllowedChild(allowedChildren));

      // cache an `itemIndex` property on each item.
      items.forEach(setItemIndex);

      // Update the private `items` property
      this._items = items;

      this.requestUpdate('items', oldItems);

      // Tell the 🌎 just how you feel
      this.fire('items-changed', items);
    }

    /**
     * Update the read-only focusedIndex property
     * @param  focusedIndex the newly selected item's index
     * @protected
     */
    updateFocusedIndex(focusedIndex: number) {
      const { focusedIndex: oldValue } = this;
      this._focusedIndex = focusedIndex;
      this.requestUpdate('focusedIndex', oldValue);
    }

    /**
     * Update the read-only focusedItem property
     * @param  focusedItem the newly selected item
     * @protected
     */
    updateFocusedItem(focusedItem: Item) {
      const { focusedItem: oldValue } = this;
      this._focusedItem = focusedItem;
      this.requestUpdate('focusedItem', oldValue);
    }

    /**
     * @protected
     */
    updateSelected({ previousSelectedItem, previousSelectedIndex }: {
      previousSelectedItem: Item | Item[],
      previousSelectedIndex: number | number[]
    }) {
      this.previousSelectedItem = this.selectedItem;
      this.previousSelectedIndex = this.selectedIndex;
      this.requestUpdate('selectedItem', previousSelectedItem);
      this.requestUpdate('selectedIndex', previousSelectedIndex);
    }

    /**
     * Actually updates the selected index
     * @param  value index to select
     * @protected
     */
    @bound setSelectedIndex(value: number): void {
      const {
        attributeForSelected,
        items,
        multi,
        selectedIndex: oldIndex,
        selectedItem: oldItem,
      } = this;

      const index = typeof value === 'string' ? parseInt(value) : value;

      // short circuit if there's no change
      if (Number.isNaN(index) || oldIndex === index) return;

      const newItem = items[index];

      // manage state
      if (oldItem instanceof HTMLElement && !multi) oldItem.removeAttribute(attributeForSelected);
      if (newItem instanceof HTMLElement) newItem.setAttribute(attributeForSelected, '');
    }

    /**
     * Updates selected index when an array is passed
     * @param   indices indices of items to select
     * @protected
     */
    selectMultiIndex(indices: number[]): void {
      const isItemNotSelected = not(compose(elem(indices), getItemIndex));
      indices.map(this.setSelectedIndex);
      this.items.filter(isItemNotSelected)
        .forEach(item => item.removeAttribute(this.attributeForSelected));
    }

    /**
     * Handles keyboard events
     * Lets user select items with the arrow keys
     * @protected
     */
    @bound onKeydown(event: KeyboardEvent): void {
      if (event.defaultPrevented) return;
      const { key } = event;
      switch (key) {
        case 'ArrowUp': return this.focusPrevious();
        case 'ArrowDown': return this.focusNext();
        case 'Enter':
        case ' ': return this.toggleFocusedItem();
      }
    }

    /**
     * Handles a change in the items.
     * @param   event items-changed event
     * @abstract
     */
    onItemsChanged(event: CustomEvent) { }

    /**
     * @abstract
     */
    onSelect() {}

    /**
     * Focuses an item.
     * @param  focusedItem
     * @protected
     */
    @bound focusItem(focusedItem: Item): void {
      this.updateFocusedIndex(this.items.indexOf(focusedItem));
      this.updateFocusedItem(focusedItem);
      if (!focusedItem) return;
      focusedItem.focus();
    }

    /**
     * Unfocuses an item.
     * @protected
     */
    @bound unfocusItem(item: Item): void {
      /* istanbul ignore else */
      if (item) {
        item.blur();
        item.tabIndex = -1;
      }
    }

    /**
     * Toggles the selected state of the focused item.
     * @protected
     */
    toggleFocusedItem(): void {
      const { focusedItem, attributeForSelected } = this;
      if (!focusedItem) return;
      const isSelected = focusedItem.hasAttribute(attributeForSelected);
      if (isSelected) focusedItem.removeAttribute(attributeForSelected);
      else focusedItem.setAttribute(attributeForSelected, '');
    }

    /**
     * React to `selectedItem` or `selectedIndex` changing
     * @protected
     */
    selectedItemChanged(): void {
      if (this.selectedItem)
        this.fire('select', this.selectedItem);
    }
  };

  return SelectMixinElement
});
