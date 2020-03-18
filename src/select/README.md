# SelectMixin

Provides methods and properties for a selecting element.

The element's shadow root must contain an anonymous slot for items.

If you define a static property `allowedChildren` (Array, String, or RegExp), the `items`
property will filter for those tag names based on their custom element class' static `is` property
or `localName`

To select items that live in your shadow root, e.g. SVG children, you can override the
getters and update method:

**Mixins:** FireMixin

## Examples

```html
<my-select>
 #shadow-root
   <slot></slot>
</my-select>
```

```js
class HasSelectableShadowChildren extends SelectMixin {
  // override SelectMixin updateItems
  updateItems() {
    const { items: oldItems } = this;
    const items = Array.from(this.shadowRoot.querySelectorAll('svg rect'));
    items.forEach((element, index) => {
      element.itemIndex = index;
      element.setAttribute('data-item-index', index.toString());
    });
    this._items = items;
    this.requestUpdate('items', oldItems);
    this.fire('items-changed', items);
  }

  // Override SelectMixin getter
  get selectedItem() { return this.shadowRoot.querySelector('rect.active'); }
  set selectedItem(_) {}
 }
```

## Properties

| Property               | Attribute                | Modifiers | Type                 | Default    | Description                                      |
|------------------------|--------------------------|-----------|----------------------|------------|--------------------------------------------------|
| `attributeForSelected` | `attribute-for-selected` |           | `string`             | "selected" | The boolean attribute on items which, when present, indicates that the item is selected. |
| `focusedIndex`         | `focusedIndex`           |           | `number`             |            | The index of the focused item                    |
| `focusedItem`          | `focusedItem`            |           | `Item`               |            | The focused item                                 |
| `hasActiveItem`        |                          | readonly  | `boolean`            |            | Whether one of the items is the active element (i.e. focused) |
| `items`                | `items`                  |           | `Item[]`             |            | The selectable items                             |
| `multi`                | `multi`                  |           | `boolean`            | false      | Whether multiple selections are allowed          |
| `selectedIndex`        | `selected-index`         |           | `number \| number[]` |            | The currently selected item's index              |
| `selectedItem`         | `selectedItem`           |           | `Item \| Item[]`     |            | The currently selected Item                      |
| `value`                | `value`                  |           | `unknown`            |            | Selected Item's Value                            |

## Methods

| Method           | Type                                             | Description                                      |
|------------------|--------------------------------------------------|--------------------------------------------------|
| `fire`           | `(type: string, detail: any, { bubbles, composed }?: EventInit \| undefined): boolean` | Fires a CustomEvent with an optional supplied detail.<br /><br />Fired events do not bubble and are not composed by default,<br />Pass an EventInit in the third argument to set `bubbles` or `composed`.<br /><br />**type**: CustomEvent type<br />**detail**: detail value<br />**options**: options initializer |
| `onItemsChanged` | `(event: CustomEvent<any>): void`                | Handles a change in the items.<br /><br />**event**: items-changed event |
| `onSelect`       | `(): void`                                       |                                                  |
| `selectIndex`    | `(selectedIndex: number): void`                  | Updates the read-only `selectedItem` and `selectedIndex` properties<br />Updates the `value` property<br /><br />**selectedIndex**: selectedIndex |
| `selectNext`     | `(): void`                                       | Selects the next item in the list.<br />Wraps around to first item from last. |
| `selectPrevious` | `(): void`                                       | Selects the previous item in the list.<br />Wraps around to last item from first. |

## Events

| Event    | Description              |
|----------|--------------------------|
| `select` | When an item is selected |
